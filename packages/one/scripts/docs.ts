import {
  access,
  lstat,
  mkdir,
  readFile,
  readdir,
  realpath,
  rm,
  writeFile,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import {
  dirname,
  extname,
  isAbsolute,
  join,
  normalize,
  parse,
  relative,
  resolve,
  sep,
} from 'node:path';
import { Window } from 'happy-dom';
import { createOneDocsPageApp } from '../docs/app/app';
import { normalizeOneDocPath, oneDocPages } from '../docs/app/content';

export interface OneDocsBuildOptions {
  outDir?: string;
}

export interface OneDocsBuildResult {
  outDir: string;
  pagesBuilt: number;
  assetsBuilt: string[];
}

export interface OneDocsServerOptions {
  hostname: string;
  port: number;
  outDir: string;
}

const PACKAGE_ROOT = join(import.meta.dir, '..');
const REPOSITORY_ROOT = resolve(PACKAGE_ROOT, '../..');
const DEFAULT_OUT_DIR = join(PACKAGE_ROOT, 'docs/dist');
const CLIENT_ASSET_NAME = 'one-docs-client.js';
const ONE_DOCS_BUILD_MARKER = '.one-docs-build';
const ONE_DOCS_BUILD_MARKER_CONTENT = '@geektech/one docs build output\n';
const UNSAFE_OUTPUT_DIRECTORY_MESSAGE = 'Unsafe One UI docs output directory';
const TRUSTED_SYMLINK_ANCESTORS = [resolve(tmpdir())];
let clientBundlePromise: Promise<string> | undefined;

export function routeToOneDocsOutputPath(
  route: string,
  outDir: string
): string {
  const normalizedRoute = normalizeOneDocPath(route);
  if (normalizedRoute === '/') {
    return join(outDir, 'index.html');
  }

  return join(outDir, normalizedRoute.slice(1, -1), 'index.html');
}

export async function buildOneDocs(
  options: OneDocsBuildOptions = {}
): Promise<OneDocsBuildResult> {
  const outDir = await assertSafeOneDocsOutputDirectory(
    options.outDir ?? DEFAULT_OUT_DIR
  );
  await rm(outDir, { recursive: true, force: true });
  await mkdir(outDir, { recursive: true });
  await writeFile(
    join(outDir, ONE_DOCS_BUILD_MARKER),
    ONE_DOCS_BUILD_MARKER_CONTENT
  );
  await mkdir(join(outDir, 'assets'), { recursive: true });

  const assetsBuilt = await buildClientAsset(outDir);

  for (const page of oneDocPages) {
    installBuildDom(page.path);
    const html = createOneDocsPageApp(page, oneDocPages).renderHtmlDocument();
    const outputPath = routeToOneDocsOutputPath(page.path, outDir);
    await mkdir(dirname(outputPath), { recursive: true });
    await writeFile(outputPath, html);
  }

  return {
    outDir,
    pagesBuilt: oneDocPages.length,
    assetsBuilt,
  };
}

export async function assertSafeOneDocsOutputDirectory(
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
        !(await hasOneDocsBuildMarker(resolvedOutDir))
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
    try {
      await lstat(candidate);
      return candidate;
    } catch (error: unknown) {
      if (!isMissingPathError(error)) {
        throw error;
      }
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

async function hasOneDocsBuildMarker(outDir: string): Promise<boolean> {
  const markerPath = join(outDir, ONE_DOCS_BUILD_MARKER);
  const markerStat = await lstatIfExists(markerPath);
  if (!markerStat?.isFile() || markerStat.isSymbolicLink()) {
    return false;
  }

  return (await readFile(markerPath, 'utf8')) === ONE_DOCS_BUILD_MARKER_CONTENT;
}

export async function startOneDocsServer(
  options: OneDocsServerOptions = resolveOneDocsServerOptions()
): Promise<ReturnType<typeof Bun.serve>> {
  const hasIndex = await fileExists(join(options.outDir, 'index.html'));
  const isManagedBuild = await hasOneDocsBuildMarker(options.outDir);
  if (!hasIndex || isManagedBuild) {
    await buildOneDocs({ outDir: options.outDir });
  }

  const realOutDir = await realpath(options.outDir);
  const server = Bun.serve({
    hostname: options.hostname,
    port: options.port,
    fetch: (request) => serveOneDocsFile(request, options.outDir, realOutDir),
  });

  console.log(`One UI docs: http://${options.hostname}:${server.port}/`);
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
    url: `http://127.0.0.1${normalizeOneDocPath(route)}`,
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

async function serveOneDocsFile(
  request: Request,
  outDir: string,
  realOutDir: string
): Promise<Response> {
  let pathname: string;
  try {
    pathname = decodeURIComponent(new URL(request.url).pathname);
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

  const requestedPath = pathname === '/' ? '/index.html' : pathname;
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
    throw new Error(`Invalid One UI docs server port: ${value}`);
  }
  return port;
}

function resolveOneDocsServerOptions(
  argv: string[] = Bun.argv,
  env: Record<string, string | undefined> = process.env
): OneDocsServerOptions {
  const args = argv.slice(2);
  return {
    hostname: readOption(args, '--host') ?? env.HOST ?? '127.0.0.1',
    port: parsePort(readOption(args, '--port') ?? env.PORT ?? '5173'),
    outDir:
      readOption(args, '--out-dir') ?? env.DOCS_OUT_DIR ?? DEFAULT_OUT_DIR,
  };
}

if (import.meta.main) {
  const args = Bun.argv.slice(2);
  if (args.includes('--build')) {
    const outDir =
      readOption(args, '--out-dir') ??
      process.env.DOCS_OUT_DIR ??
      DEFAULT_OUT_DIR;
    const result = await buildOneDocs({ outDir });
    console.log(`One UI docs built at ${result.outDir}`);
  } else {
    await startOneDocsServer(resolveOneDocsServerOptions());
  }
}
