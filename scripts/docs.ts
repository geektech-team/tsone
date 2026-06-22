import {
  access,
  mkdir,
  readdir,
  readFile,
  realpath,
  rm,
  writeFile,
} from 'node:fs/promises';
import {
  dirname,
  extname,
  isAbsolute,
  join,
  normalize,
  relative,
} from 'node:path';
import { Window } from 'happy-dom';
import { DocsPage } from '../docs/app/components/DocsPage';
import { docPages, type DocPage as ContentDocPage } from '../docs/app/content';
import { normalizeDocPath } from '../docs/app/content/types';
import { docsCss } from '../docs/app/styles';

export interface DocPage {
  route: string;
  filePath: string;
  title: string;
}

export interface DocsBuildOptions {
  outDir?: string;
}

export interface DocsBuildResult {
  outDir: string;
  pagesBuilt: number;
  assetsBuilt: string[];
}

export interface DocsServerOptions {
  hostname: string;
  port: number;
  outDir: string;
}

const DEFAULT_OUT_DIR = 'docs/dist';

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function renderInline(markdown: string): string {
  const escaped = escapeHtml(markdown);

  return escaped
    .replace(
      /\[([^\]]+)\]\((https?:\/\/[^)\s]+|\/[^)\s]*)\)/g,
      '<a href="$2">$1</a>'
    )
    .replace(/`([^`]+)`/g, '<code>$1</code>');
}

function routeFromFile(rootDir: string, filePath: string): string {
  const normalized = relative(rootDir, filePath).replace(/\\/g, '/');
  const withoutExtension = normalized.replace(/\.md$/, '');

  if (withoutExtension === 'index') {
    return '/';
  }

  return `/${withoutExtension}`;
}

function titleFromMarkdown(markdown: string, fallback: string): string {
  const title = markdown
    .split('\n')
    .find((line) => line.startsWith('# '))
    ?.replace(/^#\s+/, '')
    .trim();

  return title || fallback;
}

export async function discoverDocs(rootDir = 'docs/src'): Promise<DocPage[]> {
  const pages: DocPage[] = [];

  async function walk(directory: string): Promise<void> {
    const entries = await readdir(directory, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.name.startsWith('.')) {
        continue;
      }

      const filePath = join(directory, entry.name);

      if (entry.isDirectory()) {
        await walk(filePath);
        continue;
      }

      if (!entry.name.endsWith('.md')) {
        continue;
      }

      const markdown = await Bun.file(filePath).text();
      pages.push({
        route: routeFromFile(rootDir, filePath),
        filePath,
        title: titleFromMarkdown(markdown, entry.name.replace(/\.md$/, '')),
      });
    }
  }

  await walk(rootDir);
  return pages.sort((a, b) => a.route.localeCompare(b.route));
}

export function resolveDocPath(
  route: string,
  docs: DocPage[]
): DocPage | undefined {
  const normalizedRoute =
    route === '/' ? '/' : `/${route.replace(/^\/+|\/+$/g, '')}`;

  return docs.find((doc) => doc.route === normalizedRoute);
}

export function routeToOutputPath(route: string, outDir: string): string {
  const normalizedRoute = normalizeDocPath(route);

  if (normalizedRoute === '/') {
    return join(outDir, 'index.html');
  }

  return join(outDir, normalizedRoute.slice(1, -1), 'index.html');
}

export async function buildDocs(
  options: DocsBuildOptions = {}
): Promise<DocsBuildResult> {
  const outDir = options.outDir ?? DEFAULT_OUT_DIR;

  await rm(outDir, { recursive: true, force: true });
  await mkdir(join(outDir, 'assets'), { recursive: true });

  const assetsBuilt = await buildClientBundle(outDir);

  for (const page of docPages) {
    const html = renderDocPage(page, docPages);
    const outputPath = routeToOutputPath(page.path, outDir);
    await mkdir(dirname(outputPath), { recursive: true });
    await writeFile(outputPath, html);
  }

  return {
    outDir,
    pagesBuilt: docPages.length,
    assetsBuilt,
  };
}

function readOption(args: string[], name: string): string | undefined {
  const inlinePrefix = `${name}=`;
  const inline = args.find((arg) => arg.startsWith(inlinePrefix));
  if (inline) {
    return inline.slice(inlinePrefix.length);
  }

  const index = args.indexOf(name);
  const value = index >= 0 ? args[index + 1] : undefined;
  return value && !value.startsWith('--') ? value : undefined;
}

function resolveDocsOutDir(
  args: string[],
  env: Record<string, string | undefined>
): string {
  return readOption(args, '--out-dir') ?? env.DOCS_OUT_DIR ?? DEFAULT_OUT_DIR;
}

function parsePort(value: string): number {
  const port = Number(value);
  if (!Number.isInteger(port) || port < 0 || port > 65535) {
    throw new Error(`Invalid docs server port: ${value}`);
  }

  return port;
}

export function resolveDocsServerOptions(
  argv: string[] = Bun.argv,
  env: Record<string, string | undefined> = process.env
): DocsServerOptions {
  const args = argv.slice(2);

  return {
    hostname: readOption(args, '--host') ?? env.HOST ?? '127.0.0.1',
    port: parsePort(readOption(args, '--port') ?? env.PORT ?? '5173'),
    outDir: resolveDocsOutDir(args, env),
  };
}

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

export async function startDocsServer(
  options = resolveDocsServerOptions()
): Promise<ReturnType<typeof Bun.serve>> {
  const indexPath = join(options.outDir, 'index.html');
  if (!(await fileExists(indexPath))) {
    await buildDocs({ outDir: options.outDir });
  }

  const realOutDir = await realpath(options.outDir);
  const server = Bun.serve({
    hostname: options.hostname,
    port: options.port,
    fetch: (request) => serveDocsFile(request, options.outDir, realOutDir),
  });

  console.log(`TSone docs: http://${options.hostname}:${server.port}/`);
  return server;
}

export function renderMarkdownToHtml(markdown: string): string {
  const lines = markdown.replace(/^---\n[\s\S]*?\n---\n?/, '').split('\n');
  const html: string[] = [];
  let listOpen = false;
  let codeFence: { language: string; lines: string[] } | null = null;

  const closeList = (): void => {
    if (listOpen) {
      html.push('</ul>');
      listOpen = false;
    }
  };

  for (const line of lines) {
    const fence = line.match(/^```(\w*)/);
    if (fence) {
      if (codeFence) {
        html.push(
          `<pre><code class="language-${escapeHtml(codeFence.language)}">${escapeHtml(
            codeFence.lines.join('\n')
          )}</code></pre>`
        );
        codeFence = null;
      } else {
        closeList();
        codeFence = { language: fence[1] ?? '', lines: [] };
      }
      continue;
    }

    if (codeFence) {
      codeFence.lines.push(line);
      continue;
    }

    if (!line.trim()) {
      closeList();
      continue;
    }

    const heading = line.match(/^(#{1,4})\s+(.+)$/);
    if (heading) {
      closeList();
      const level = heading[1].length;
      html.push(`<h${level}>${renderInline(heading[2])}</h${level}>`);
      continue;
    }

    const listItem = line.match(/^-\s+(.+)$/);
    if (listItem) {
      if (!listOpen) {
        html.push('<ul>');
        listOpen = true;
      }
      html.push(`<li>${renderInline(listItem[1])}</li>`);
      continue;
    }

    closeList();
    html.push(`<p>${renderInline(line.trim())}</p>`);
  }

  if (codeFence) {
    html.push(
      `<pre><code class="language-${escapeHtml(codeFence.language)}">${escapeHtml(
        codeFence.lines.join('\n')
      )}</code></pre>`
    );
  }

  closeList();
  return html.join('\n');
}

export function renderDocPage(
  page: ContentDocPage,
  pages: ContentDocPage[]
): string {
  installBuildDom(page.path);

  const mountRoot = document.createElement('div');
  mountRoot.id = 'app';
  document.body.appendChild(mountRoot);

  new DocsPage({ page, pages }).mount(mountRoot);

  return [
    '<!doctype html>',
    '<html lang="zh-CN">',
    '<head>',
    '  <meta charset="utf-8">',
    '  <meta name="viewport" content="width=device-width, initial-scale=1">',
    `  <title>${escapeHtml(page.title)} - TSone Docs</title>`,
    `  <meta name="description" content="${escapeHtml(page.description)}">`,
    `  <style>${docsCss}</style>`,
    '</head>',
    '<body>',
    mountRoot.innerHTML,
    '  <script type="module" src="/assets/docs-client.js"></script>',
    '</body>',
    '</html>',
  ].join('\n');
}

async function buildClientBundle(outDir: string): Promise<string[]> {
  const result = await Bun.build({
    entrypoints: ['./docs/app/client.ts'],
    target: 'browser',
    format: 'esm',
    sourcemap: 'inline',
    write: false,
  });

  if (!result.success || result.outputs.length === 0) {
    const messages = result.logs.map((log) => log.message).join('\n');
    throw new Error(`Failed to build docs client bundle: ${messages}`);
  }

  const outputPath = join(outDir, 'assets', 'docs-client.js');
  await writeFile(outputPath, await result.outputs[0].text());
  return [outputPath];
}

function installBuildDom(route: string): void {
  const window = new Window({
    url: `http://127.0.0.1${normalizeDocPath(route)}`,
  });
  Object.assign(window, {
    Error,
    EvalError,
    RangeError,
    ReferenceError,
    SyntaxError,
    TypeError,
    URIError,
  });
  const keys = [
    'window',
    'document',
    'Node',
    'Text',
    'Comment',
    'Element',
    'HTMLElement',
    'HTMLInputElement',
    'HTMLTextAreaElement',
    'HTMLSelectElement',
    'HTMLButtonElement',
    'DocumentFragment',
    'Event',
    'MouseEvent',
    'KeyboardEvent',
    'CustomEvent',
    'EventTarget',
    'history',
    'location',
    'navigator',
    'localStorage',
  ] as const;

  const windowRecord = window as unknown as Record<string, unknown>;

  keys.forEach((key) => {
    Object.defineProperty(globalThis, key, {
      configurable: true,
      writable: true,
      value: windowRecord[key],
    });
  });
}

async function serveDocsFile(
  request: Request,
  outDir: string,
  realOutDir: string
): Promise<Response> {
  const url = new URL(request.url);

  let pathname: string;
  try {
    pathname = decodeURIComponent(url.pathname);
  } catch {
    return new Response('Not found', { status: 404 });
  }

  const filePath = resolveStaticFile(outDir, pathname);
  if (!filePath) {
    return new Response('Not found', { status: 404 });
  }

  try {
    const realFilePath = await realpath(filePath);
    if (!isPathInside(realOutDir, realFilePath)) {
      return new Response('Not found', { status: 404 });
    }

    const body = await readFile(realFilePath);
    return new Response(body, {
      headers: { 'content-type': contentType(realFilePath) },
    });
  } catch {
    return new Response('Not found', { status: 404 });
  }
}

function resolveStaticFile(outDir: string, pathname: string): string | null {
  if (pathname.includes('..') || pathname.includes('\0')) {
    return null;
  }

  const normalizedPath = pathname === '/' ? '/index.html' : pathname;
  const normalizedOutDir = normalize(outDir);
  const normalizedCandidate = normalize(
    extname(normalizedPath) === ''
      ? join(outDir, normalizedPath, 'index.html')
      : join(outDir, normalizedPath)
  );
  const relativePath = relative(normalizedOutDir, normalizedCandidate);

  if (relativePath.startsWith('..') || relativePath === '') {
    return null;
  }

  return normalizedCandidate;
}

function isPathInside(rootPath: string, candidatePath: string): boolean {
  const relativePath = relative(rootPath, candidatePath);
  return relativePath !== '' && !relativePath.startsWith('..') && !isAbsolute(relativePath);
}

function contentType(filePath: string): string {
  if (filePath.endsWith('.html')) {
    return 'text/html; charset=utf-8';
  }
  if (filePath.endsWith('.js')) {
    return 'text/javascript; charset=utf-8';
  }
  if (filePath.endsWith('.css')) {
    return 'text/css; charset=utf-8';
  }
  if (filePath.endsWith('.json')) {
    return 'application/json; charset=utf-8';
  }
  return 'text/plain; charset=utf-8';
}

if (import.meta.main) {
  const args = Bun.argv.slice(2);

  if (args.includes('--build')) {
    const outDir = resolveDocsOutDir(args, process.env);
    await buildDocs({ outDir });
    console.log(`TSone docs built at ${outDir}`);
  } else {
    const options = resolveDocsServerOptions();
    await startDocsServer(options);
  }
}
