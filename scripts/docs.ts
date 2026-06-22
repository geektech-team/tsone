import { mkdir, readdir, rm, writeFile } from 'node:fs/promises';
import { dirname, join, relative } from 'node:path';
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

function renderPage(page: DocPage, docs: DocPage[], markdown: string): string {
  const nav = docs
    .map(
      (doc) =>
        `<a href="${doc.route}"${doc.route === page.route ? ' aria-current="page"' : ''}>${escapeHtml(doc.title)}</a>`
    )
    .join('');

  return `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(page.title)} - TSone Docs</title>
  <style>
    body { margin: 0; font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; color: #1f2937; background: #f8fafc; }
    .layout { display: grid; grid-template-columns: 260px minmax(0, 1fr); min-height: 100vh; }
    nav { padding: 24px 18px; background: #ffffff; border-right: 1px solid #e5e7eb; overflow: auto; }
    nav strong { display: block; margin-bottom: 16px; font-size: 18px; }
    nav a { display: block; padding: 7px 8px; border-radius: 6px; color: #334155; text-decoration: none; }
    nav a[aria-current="page"], nav a:hover { background: #eef2ff; color: #3730a3; }
    main { max-width: 880px; padding: 44px 56px; }
    h1, h2, h3, h4 { color: #0f172a; }
    p, li { line-height: 1.75; }
    code { background: #e2e8f0; padding: 2px 5px; border-radius: 4px; }
    pre { overflow: auto; padding: 16px; border-radius: 8px; background: #0f172a; color: #e2e8f0; }
    pre code { background: transparent; padding: 0; }
    @media (max-width: 760px) { .layout { display: block; } nav { border-right: 0; border-bottom: 1px solid #e5e7eb; } main { padding: 28px 20px; } }
  </style>
</head>
<body>
  <div class="layout">
    <nav><strong>TSone</strong>${nav}</nav>
    <main>${renderMarkdownToHtml(markdown)}</main>
  </div>
</body>
</html>`;
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

function parsePort(): number {
  const portArg = Bun.argv.find((arg) => arg.startsWith('--port='));
  if (portArg) {
    return Number(portArg.split('=')[1]);
  }

  const index = Bun.argv.indexOf('--port');
  if (index >= 0 && Bun.argv[index + 1]) {
    return Number(Bun.argv[index + 1]);
  }

  return Number(process.env.PORT ?? 5173);
}

if (import.meta.main) {
  const rootDir = 'docs/src';
  const port = parsePort();

  Bun.serve({
    port,
    async fetch(request) {
      const url = new URL(request.url);
      const docs = await discoverDocs(rootDir);
      const page = resolveDocPath(url.pathname, docs);

      if (!page) {
        return new Response('Not found', { status: 404 });
      }

      const markdown = await Bun.file(page.filePath).text();
      return new Response(renderPage(page, docs, markdown), {
        headers: { 'content-type': 'text/html; charset=utf-8' },
      });
    },
  });

  console.log(`TSone docs: http://127.0.0.1:${port}/`);
}
