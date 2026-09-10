import {
  access,
  mkdir,
  readdir,
  readFile,
  realpath,
  rm,
  writeFile,
} from 'node:fs/promises';
import type { Dirent } from 'node:fs';
import {
  dirname,
  extname,
  isAbsolute,
  join,
  normalize,
  relative,
} from 'node:path';
import { createDomWindow, installDomGlobals } from '../lib/dom';
import { createDocsPageApp } from '../docs/app/app';
import {
  createDocCatalog,
  docCatalogs,
  localizeDocPath,
  normalizeDocBasePath,
  setDocBasePath,
  stripDocBasePath,
  validateDocCatalogParity,
  type DocLocale,
  type DocPage as ContentDocPage,
} from '../docs/app/content';
import { normalizeDocPath } from '../docs/app/content/types';

export interface DocsBuildOptions {
  outDir?: string;
  basePath?: string;
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
  basePath?: string;
}

const PACKAGE_ROOT = join(import.meta.dir, '..');
const DEFAULT_OUT_DIR = join(PACKAGE_ROOT, 'docs/dist');
const DOC_LOCALES = ['zh', 'en'] as const;
const STATIC_ASSETS_DIR = join(PACKAGE_ROOT, 'docs', 'static');

export function routeToOutputPath(
  route: string,
  outDir: string,
  basePath = ''
): string {
  const normalizedRoute = normalizeDocPath(
    stripDocBasePath(route, normalizeDocBasePath(basePath))
  );

  if (normalizedRoute === '/') {
    return join(outDir, 'index.html');
  }

  return join(outDir, normalizedRoute.slice(1, -1), 'index.html');
}

export async function buildDocs(
  options: DocsBuildOptions = {}
): Promise<DocsBuildResult> {
  const outDir = options.outDir ?? DEFAULT_OUT_DIR;
  const basePath = normalizeDocBasePath(options.basePath ?? '');

  validateBuildCatalogs();
  await rm(outDir, { recursive: true, force: true });
  await mkdir(join(outDir, 'assets'), { recursive: true });

  const assetsBuilt = [
    ...(await buildBrowserBundles(outDir)),
    ...(await copyStaticAssets(outDir)),
  ];
  let pagesBuilt = 0;

  for (const locale of DOC_LOCALES) {
    const catalog = docCatalogs[locale];

    for (const page of catalog.pages) {
      let publicPath: string;
      let html: string;

      // The base path is only needed during synchronous rendering. Restore it
      // right after so concurrent processes never observe a stale prefix.
      setDocBasePath(basePath);
      try {
        publicPath = localizeDocPath(locale, page.path);
        html = renderDocPage(locale, page, catalog.pages);
      } finally {
        setDocBasePath('');
      }

      const outputPath = routeToOutputPath(publicPath, outDir, basePath);
      await mkdir(dirname(outputPath), { recursive: true });
      await writeFile(outputPath, html);
      pagesBuilt += 1;
    }
  }

  return {
    outDir,
    pagesBuilt,
    assetsBuilt,
  };
}

function validateBuildCatalogs(): void {
  const zhCatalog = createDocCatalog('zh', docCatalogs.zh.pages);
  const enCatalog = createDocCatalog('en', docCatalogs.en.pages);
  validateDocCatalogParity(zhCatalog, enCatalog);
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
    basePath: readOption(args, '--base') ?? env.DOCS_BASE_PATH ?? '',
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

async function indexPathMatchesBase(
  indexPath: string,
  basePath: string | undefined
): Promise<boolean> {
  try {
    const html = await readFile(indexPath, 'utf8');
    const actual = html.match(/data-doc-base="([^"]*)"/)?.[1] ?? '';
    return actual === normalizeDocBasePath(basePath ?? '');
  } catch {
    return false;
  }
}

export async function startDocsServer(
  options = resolveDocsServerOptions()
): Promise<ReturnType<typeof Bun.serve>> {
  const indexPath = join(options.outDir, 'index.html');
  if (
    !(await fileExists(indexPath)) ||
    !(await indexPathMatchesBase(indexPath, options.basePath))
  ) {
    // 产物不存在，或用其他 basePath 构建过（残留的 /tsone 前缀会让
    // dev 根路径下的客户端脚本 404）。始终按当前 base 重建，保证
    // serve 的 HTML 与脚本路径一致。
    await buildDocs({ outDir: options.outDir, basePath: options.basePath });
  }

  const realOutDir = await realpath(options.outDir);
  const server = Bun.serve({
    hostname: options.hostname,
    port: options.port,
    fetch: (request) =>
      serveDocsFile(request, options.outDir, realOutDir, options.basePath),
  });

  console.log(`TSone docs: http://${options.hostname}:${server.port}/`);
  return server;
}

export function renderDocPage(
  locale: DocLocale,
  page: ContentDocPage,
  pages: ContentDocPage[]
): string {
  installBuildDom(localizeDocPath(locale, page.path));

  return createDocsPageApp(locale, page, pages).renderHtmlDocument();
}

/**
 * 把 docs/static 下的静态资源复制到构建产物的 assets 目录，
 * 供文档中的 figure 块等按 /assets/<name> 引用。
 */
async function copyStaticAssets(outDir: string): Promise<string[]> {
  let entries: Dirent[];

  try {
    entries = await readdir(STATIC_ASSETS_DIR, { withFileTypes: true });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return [];
    }
    throw error;
  }

  const copied: string[] = [];

  for (const entry of entries) {
    if (!entry.isFile()) {
      continue;
    }

    const target = join(outDir, 'assets', entry.name);
    await writeFile(
      target,
      await readFile(join(STATIC_ASSETS_DIR, entry.name))
    );
    copied.push(target);
  }

  return copied;
}

async function buildBrowserBundles(outDir: string): Promise<string[]> {
  const bundles = [
    {
      entrypoint: 'docs/app/client.ts',
      fileName: 'docs-client.js',
      format: 'esm' as const,
    },
    {
      entrypoint: 'docs/app/locale-bootstrap-entry.ts',
      fileName: 'docs-locale.js',
      format: 'iife' as const,
    },
  ];
  const outputPaths: string[] = [];

  for (const bundle of bundles) {
    const result = await Bun.build({
      entrypoints: [join(PACKAGE_ROOT, bundle.entrypoint)],
      target: 'browser',
      format: bundle.format,
    });

    if (!result.success || result.outputs.length === 0) {
      const messages = result.logs.map((log) => log.message).join('\n');
      throw new Error(`Failed to build ${bundle.fileName}: ${messages}`);
    }

    const outputPath = join(outDir, 'assets', bundle.fileName);
    await writeFile(outputPath, await result.outputs[0].text());
    outputPaths.push(outputPath);
  }

  return outputPaths;
}

function installBuildDom(route: string): void {
  const windowRef = createDomWindow({
    url: `http://127.0.0.1${normalizeDocPath(route)}`,
  });
  Object.assign(windowRef, {
    Error,
    EvalError,
    RangeError,
    ReferenceError,
    SyntaxError,
    TypeError,
    URIError,
  });
  installDomGlobals(windowRef);
}

async function serveDocsFile(
  request: Request,
  outDir: string,
  realOutDir: string,
  basePath = ''
): Promise<Response> {
  const url = new URL(request.url);
  const base = normalizeDocBasePath(basePath);

  let pathname: string;
  try {
    pathname = stripDocBasePath(decodeURIComponent(url.pathname), base);
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
  return (
    relativePath !== '' &&
    !relativePath.startsWith('..') &&
    !isAbsolute(relativePath)
  );
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
  if (filePath.endsWith('.svg')) {
    return 'image/svg+xml; charset=utf-8';
  }
  return 'text/plain; charset=utf-8';
}

if (import.meta.main) {
  const args = Bun.argv.slice(2);

  if (args.includes('--build')) {
    const outDir = resolveDocsOutDir(args, process.env);
    const basePath =
      readOption(args, '--base') ?? process.env.DOCS_BASE_PATH ?? '';
    await buildDocs({ outDir, basePath });
    console.log(`TSone docs built at ${outDir}`);
  } else {
    const options = resolveDocsServerOptions();
    await startDocsServer(options);
  }
}
