import {
  access,
  mkdir,
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
const DEFAULT_OUT_DIR = join(PACKAGE_ROOT, 'docs/dist');
const CLIENT_ASSET_NAME = 'one-docs-client.js';

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
  const outDir = options.outDir ?? DEFAULT_OUT_DIR;
  await rm(outDir, { recursive: true, force: true });
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

export async function startOneDocsServer(
  options: OneDocsServerOptions = resolveOneDocsServerOptions()
): Promise<ReturnType<typeof Bun.serve>> {
  if (!(await fileExists(join(options.outDir, 'index.html')))) {
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

  const outputPath = join(outDir, 'assets', CLIENT_ASSET_NAME);
  await writeFile(outputPath, await result.outputs[0].text());
  return [outputPath];
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
