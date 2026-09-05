import { access, lstat, mkdir, readFile, readdir, realpath, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, extname, isAbsolute, join, normalize, parse, relative, resolve, sep } from 'node:path';
import { Window } from 'happy-dom';
import { createCliDocsPageApp } from '../docs/app/app';
import {
  normalizeCliDocBasePath,
  setCliDocBasePath,
  stripCliDocBasePath,
  withCliDocBasePath,
} from '../docs/app/base';
import {
  CLI_DOC_DEFAULT_LOCALE,
  CLI_DOC_LOCALES,
  cliDocPages,
  normalizeCliDocPath,
  type CliDocLocale,
} from '../docs/app/content';

export interface CliDocsBuildOptions {
  outDir?: string;
  basePath?: string;
}

export interface CliDocsBuildResult {
  outDir: string;
  pagesBuilt: number;
  assetsBuilt: string[];
}

export interface CliDocsServerOptions {
  hostname: string;
  port: number;
  outDir: string;
  basePath?: string;
}

const PACKAGE_ROOT = resolve(import.meta.dir, '..');
const REPOSITORY_ROOT = resolve(PACKAGE_ROOT, '..', '..');
const DEFAULT_OUT_DIR = join(PACKAGE_ROOT, 'docs/dist');
const CLIENT_ASSET_NAME = 'cli-docs-client.js';
const CLI_DOCS_BUILD_MARKER = '.cli-docs-build';
const CLI_DOCS_BUILD_MARKER_CONTENT = '@geektech/tsone-cli docs build output\n';
const UNSAFE_OUTPUT_DIRECTORY_MESSAGE =
  'Unsafe TSone CLI docs output directory';
const TRUSTED_SYMLINK_ANCESTORS = [resolve(tmpdir())];

let clientBundlePromise: Promise<string> | undefined;

export function routeToCliDocsOutputPath(
  route: string,
  locale: CliDocLocale,
  outDir: string,
  basePath = ''
): string {
  const normalizedRoute = normalizeCliDocPath(
    stripCliDocBasePath(route, normalizeCliDocBasePath(basePath))
  );
  if (normalizedRoute === '/') {
    return join(outDir, locale, 'index.html');
  }

  return join(outDir, locale, normalizedRoute.slice(1, -1), 'index.html');
}

export async function buildCliDocs(
  options: CliDocsBuildOptions = {}
): Promise<CliDocsBuildResult> {
  const outDir = await assertSafeCliDocsOutputDirectory(
    options.outDir ?? DEFAULT_OUT_DIR
  );
  const basePath = normalizeCliDocBasePath(options.basePath ?? '');
  await rm(outDir, { recursive: true, force: true });
  await mkdir(outDir, { recursive: true });
  await writeFile(
    join(outDir, CLI_DOCS_BUILD_MARKER),
    CLI_DOCS_BUILD_MARKER_CONTENT
  );
  await mkdir(join(outDir, 'assets'), { recursive: true });

  const assetsBuilt = await buildClientAsset(outDir);

  for (const locale of CLI_DOC_LOCALES) {
    for (const page of cliDocPages) {
      let html: string;

      // The base path is only needed during synchronous rendering. Restore it
      // right after so concurrent processes never observe a stale prefix.
      setCliDocBasePath(basePath);
      try {
        installBuildDom(localeHref(page.path, locale));
        html = createCliDocsPageApp(
          page,
          cliDocPages,
          locale
        ).renderHtmlDocument();
      } finally {
        setCliDocBasePath('');
      }

      const outputPath = routeToCliDocsOutputPath(
        page.path,
        locale,
        outDir,
        basePath
      );
      await mkdir(dirname(outputPath), { recursive: true });
      await writeFile(outputPath, html);
    }
  }

  await writeFile(
    join(outDir, 'index.html'),
    renderRootRedirect(CLI_DOC_DEFAULT_LOCALE, basePath)
  );

  return {
    outDir,
    pagesBuilt: cliDocPages.length * CLI_DOC_LOCALES.length,
    assetsBuilt,
  };
}

function localeHref(path: string, locale: CliDocLocale): string {
  return withCliDocBasePath(`/${locale}${path}`);
}

function renderRootRedirect(
  locale: CliDocLocale,
  basePath = ''
): string {
  const target = withCliDocBasePath(
    `/${locale}/`,
    normalizeCliDocBasePath(basePath)
  );

  return `<!doctype html>
<html lang="${locale === 'en' ? 'en' : 'zh-CN'}">
  <head>
    <meta charset="utf-8" />
    <meta http-equiv="refresh" content="0; url=${target}" />
    <title>TSone CLI</title>
  </head>
  <body>
    <a href="${target}">TSone CLI</a>
  </body>
</html>
`;
}

export async function assertSafeCliDocsOutputDirectory(
  outDir: string
): Promise<string> {
  try {
    if (!outDir || outDir.includes('\0')) {
      throw new Error(UNSAFE_OUTPUT_DIRECTORY_MESSAGE);
    }

    const resolvedOutDir = resolve(outDir);
    if (resolvedOutDir === parse(resolvedOutDir).root) {
      throw new Error(UNSAFE_OUTPUT_DIRECTORY_MESSAGE);
    }

    await assertNoUnexpectedSymlinkComponents(resolvedOutDir);
    const outputStat = await lstatIfExists(resolvedOutDir);
    if (outputStat?.isSymbolicLink()) {
      throw new Error(UNSAFE_OUTPUT_DIRECTORY_MESSAGE);
    }

    const existingAncestor = await findExistingAncestor(resolvedOutDir);
    const ancestorStat = await lstat(existingAncestor);
    if (!ancestorStat.isDirectory() || ancestorStat.isSymbolicLink()) {
      throw new Error(UNSAFE_OUTPUT_DIRECTORY_MESSAGE);
    }

    const canonicalAncestor = await realpath(existingAncestor);
    const canonicalOutDir = resolve(
      canonicalAncestor,
      relative(existingAncestor, resolvedOutDir)
    );
    const canonicalPackageRoot = await realpath(PACKAGE_ROOT);
    const canonicalRepositoryRoot = await realpath(REPOSITORY_ROOT);

    if (
      isSameOrAncestor(resolvedOutDir, PACKAGE_ROOT) ||
      isSameOrAncestor(resolvedOutDir, REPOSITORY_ROOT) ||
      isSameOrAncestor(canonicalOutDir, canonicalPackageRoot) ||
      isSameOrAncestor(canonicalOutDir, canonicalRepositoryRoot)
    ) {
      throw new Error(UNSAFE_OUTPUT_DIRECTORY_MESSAGE);
    }

    if (
      isPathInsideOrSame(REPOSITORY_ROOT, resolvedOutDir) &&
      !isPathInsideOrSame(canonicalRepositoryRoot, canonicalOutDir)
    ) {
      throw new Error(UNSAFE_OUTPUT_DIRECTORY_MESSAGE);
    }

    if (outputStat) {
      if (!outputStat.isDirectory()) {
        throw new Error(UNSAFE_OUTPUT_DIRECTORY_MESSAGE);
      }

      const entries = await readdir(resolvedOutDir);
      if (
        resolvedOutDir !== resolve(DEFAULT_OUT_DIR) &&
        entries.length > 0 &&
        !(await hasCliDocsBuildMarker(resolvedOutDir))
      ) {
        throw new Error(UNSAFE_OUTPUT_DIRECTORY_MESSAGE);
      }
    }

    return resolvedOutDir;
  } catch {
    throw new Error(UNSAFE_OUTPUT_DIRECTORY_MESSAGE);
  }
}

async function assertNoUnexpectedSymlinkComponents(
  path: string
): Promise<void> {
  const { root } = parse(path);
  const components = path.slice(root.length).split(sep).filter(Boolean);
  let candidate = root;

  for (const component of components) {
    candidate = join(candidate, component);
    const stat = await lstatIfExists(candidate);
    if (!stat) {
      return;
    }
    if (
      stat.isSymbolicLink() &&
      !TRUSTED_SYMLINK_ANCESTORS.some((trustedPath) =>
        isPathInsideOrSame(candidate, trustedPath)
      )
    ) {
      throw new Error(UNSAFE_OUTPUT_DIRECTORY_MESSAGE);
    }
  }
}

async function findExistingAncestor(path: string): Promise<string> {
  let candidate = path;
  while (true) {
    const candidateStat = await lstatIfExists(candidate);
    if (candidateStat) {
      return candidate;
    }

    const parent = parse(candidate).dir;
    if (parent === candidate) {
      throw new Error(UNSAFE_OUTPUT_DIRECTORY_MESSAGE);
    }
    candidate = parent;
  }
}

async function lstatIfExists(
  path: string
): Promise<Awaited<ReturnType<typeof lstat>> | undefined> {
  try {
    return await lstat(path);
  } catch (error: unknown) {
    if (isMissingPathError(error)) {
      return undefined;
    }
    throw error;
  }
}

function isMissingPathError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === 'ENOENT'
  );
}

function isSameOrAncestor(candidate: string, protectedPath: string): boolean {
  return isPathInsideOrSame(candidate, protectedPath);
}

function isPathInsideOrSame(rootPath: string, candidatePath: string): boolean {
  const relativePath = relative(rootPath, candidatePath);
  return (
    relativePath === '' ||
    (relativePath !== '..' &&
      !relativePath.startsWith(`..${sep}`) &&
      !isAbsolute(relativePath))
  );
}

async function hasCliDocsBuildMarker(outDir: string): Promise<boolean> {
  const markerPath = join(outDir, CLI_DOCS_BUILD_MARKER);
  const markerStat = await lstatIfExists(markerPath);
  if (!markerStat?.isFile() || markerStat.isSymbolicLink()) {
    return false;
  }

  return (await readFile(markerPath, 'utf8')) === CLI_DOCS_BUILD_MARKER_CONTENT;
}

export async function startCliDocsServer(
  options: CliDocsServerOptions = resolveCliDocsServerOptions()
): Promise<ReturnType<typeof Bun.serve>> {
  const hasIndex = await fileExists(join(options.outDir, 'index.html'));
  const isManagedBuild = await hasCliDocsBuildMarker(options.outDir);
  if (!hasIndex || isManagedBuild) {
    await buildCliDocs({
      outDir: options.outDir,
      basePath: options.basePath,
    });
  }

  const realOutDir = await realpath(options.outDir);
  const server = Bun.serve({
    hostname: options.hostname,
    port: options.port,
    fetch: (request) =>
      serveCliDocsFile(request, options.outDir, realOutDir, options.basePath),
  });

  console.log(`TSone CLI docs: http://${options.hostname}:${server.port}/`);
  return server;
}

async function buildClientAsset(outDir: string): Promise<string[]> {
  const clientBundle = await getClientBundle();
  const outputPath = join(outDir, 'assets', CLIENT_ASSET_NAME);
  await writeFile(outputPath, clientBundle);
  return [outputPath];
}

function getClientBundle(): Promise<string> {
  clientBundlePromise ??= createClientBundle().catch((error: unknown) => {
    clientBundlePromise = undefined;
    throw error;
  });
  return clientBundlePromise;
}

async function createClientBundle(): Promise<string> {
  const buildOptions: Bun.BuildConfig & { write: false } = {
    entrypoints: [join(PACKAGE_ROOT, 'docs/app/client.ts')],
    target: 'browser',
    format: 'esm',
    write: false,
  };
  const result = await Bun.build(buildOptions);

  if (!result.success || result.outputs.length === 0) {
    const messages = result.logs.map((log) => log.message).join('\n');
    throw new Error(`Failed to build ${CLIENT_ASSET_NAME}: ${messages}`);
  }

  return result.outputs[0].text();
}

function installBuildDom(route: string): void {
  const window = new Window({
    url: `http://127.0.0.1${normalizeCliDocPath(route)}`,
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

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function serveCliDocsFile(
  request: Request,
  outDir: string,
  realOutDir: string,
  basePath = ''
): Promise<Response> {
  const base = normalizeCliDocBasePath(basePath);

  let pathname: string;
  try {
    pathname = stripCliDocBasePath(
      decodeURIComponent(new URL(request.url).pathname),
      base
    );
  } catch {
    return notFound();
  }

  const filePath = resolveStaticFile(outDir, pathname);
  if (!filePath) {
    return notFound();
  }

  try {
    const realFilePath = await realpath(filePath);
    if (!isPathInside(realOutDir, realFilePath)) {
      return notFound();
    }

    return new Response(await readFile(realFilePath), {
      headers: { 'content-type': contentType(realFilePath) },
    });
  } catch {
    return notFound();
  }
}

function resolveStaticFile(outDir: string, pathname: string): string | null {
  if (pathname.includes('..') || pathname.includes('\0')) {
    return null;
  }

  const localeAwarePath = toDefaultLocalePath(pathname);
  const requestedPath = localeAwarePath === '/' ? '/index.html' : localeAwarePath;
  const candidate = normalize(
    extname(requestedPath) === ''
      ? join(outDir, requestedPath, 'index.html')
      : join(outDir, requestedPath)
  );
  const relativePath = relative(normalize(outDir), candidate);

  if (
    relativePath === '' ||
    relativePath.startsWith('..') ||
    isAbsolute(relativePath)
  ) {
    return null;
  }

  return candidate;
}

function toDefaultLocalePath(pathname: string): string {
  if (
    pathname === '/' ||
    /^\/(zh|en)(?:\/|$)/.test(pathname) ||
    pathname.startsWith('/assets/')
  ) {
    return pathname;
  }

  return `/zh${pathname}`;
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
  return 'text/plain; charset=utf-8';
}

function notFound(): Response {
  return new Response('Not found', { status: 404 });
}

function readOption(args: string[], name: string): string | undefined {
  const inlinePrefix = `${name}=`;
  const inline = args.find((argument) => argument.startsWith(inlinePrefix));
  if (inline) {
    return inline.slice(inlinePrefix.length);
  }

  const index = args.indexOf(name);
  const value = index >= 0 ? args[index + 1] : undefined;
  return value && !value.startsWith('--') ? value : undefined;
}

function parsePort(value: string): number {
  const port = Number(value);
  if (!Number.isInteger(port) || port < 0 || port > 65535) {
    throw new Error(`Invalid TSone CLI docs server port: ${value}`);
  }
  return port;
}

function resolveCliDocsServerOptions(
  argv: string[] = Bun.argv,
  env: Record<string, string | undefined> = process.env
): CliDocsServerOptions {
  const args = argv.slice(2);
  return {
    hostname: readOption(args, '--host') ?? env.HOST ?? '127.0.0.1',
    port: parsePort(readOption(args, '--port') ?? env.PORT ?? '5173'),
    outDir:
      readOption(args, '--out-dir') ?? env.DOCS_OUT_DIR ?? DEFAULT_OUT_DIR,
    basePath: readOption(args, '--base') ?? env.DOCS_BASE_PATH ?? '',
  };
}

if (import.meta.main) {
  const args = Bun.argv.slice(2);
  if (args.includes('--build')) {
    const outDir =
      readOption(args, '--out-dir') ??
      process.env.DOCS_OUT_DIR ??
      DEFAULT_OUT_DIR;
    const basePath =
      readOption(args, '--base') ?? process.env.DOCS_BASE_PATH ?? '';
    const result = await buildCliDocs({ outDir, basePath });
    console.log(`TSone CLI docs built at ${result.outDir}`);
  } else {
    await startCliDocsServer(resolveCliDocsServerOptions());
  }
}
