import { basename, isAbsolute } from 'node:path';
import { isEntryJavaScriptOutput, isStylesheetOutput } from './build-output';
import { resolveConfig } from './config';
import { renderProjectHtml } from './project';
import { createProxyHandler } from './proxy';
import type { ResolveConfigOptions, ResolvedConfig } from './types';

export type StartDevServerOptions = ResolveConfigOptions;

export async function startDevServer(
  options: StartDevServerOptions = {}
): Promise<ReturnType<typeof Bun.serve>> {
  const config = await resolveConfig(options);
  await renderProjectHtml(config, {});
  const proxy = createProxyHandler(config.server.proxy);
  const buildProject = createDevelopmentBuilder(config);
  const state: DevelopmentServerState = {};

  return Bun.serve({
    hostname: config.server.host,
    port: config.server.port,
    fetch: async (request) =>
      (await proxy(request)) ??
      serveProjectRequest(request, config, buildProject, state),
  });
}

async function serveProjectRequest(
  request: Request,
  config: ResolvedConfig,
  buildProject: () => Promise<DevelopmentBundle | Response>,
  state: DevelopmentServerState
): Promise<Response> {
  const pathname = new URL(request.url).pathname;
  const isDocument = pathname === '/' || pathname === '/index.html';
  let bundle: DevelopmentBundle | Response;

  if (pathname === '/') {
    bundle = await buildProject();
    if (!(bundle instanceof Response)) {
      state.bundle = bundle;
      state.bundleAliasFromDocument = true;
    }
  } else if (pathname === '/bundle.js') {
    if (state.bundle && state.bundleAliasFromDocument) {
      bundle = state.bundle;
      state.bundleAliasFromDocument = false;
    } else {
      bundle = await buildProject();
      if (!(bundle instanceof Response)) {
        state.bundle = bundle;
      }
    }
  } else if (state.bundle) {
    bundle = state.bundle;
  } else {
    bundle = await buildProject();
    if (!(bundle instanceof Response)) {
      state.bundle = bundle;
    }
  }

  if (bundle instanceof Response) {
    return bundle;
  }

  if (isDocument) {
    const html = await renderProjectHtml(config, {
      head: bundle.stylesheets.map(({ pathname: href }) => ({
        tag: 'link',
        attributes: { rel: 'stylesheet', href },
      })),
      scripts: [{ type: 'module', src: '/bundle.js' }],
    });
    return new Response(html, {
      headers: {
        'content-type': 'text/html; charset=utf-8',
        'cache-control': 'no-store',
      },
    });
  }

  const asset =
    pathname === '/bundle.js'
      ? bundle.entry
      : bundle.outputs.find((output) => output.pathname === pathname);

  if (asset) {
    return new Response(asset.output, {
      headers: {
        'content-type': asset.output.type,
        'cache-control': 'no-store',
      },
    });
  }

  return new Response('Not found', {
    status: 404,
    headers: { 'cache-control': 'no-store' },
  });
}

interface DevelopmentOutput {
  output: Awaited<ReturnType<typeof Bun.build>>['outputs'][number];
  pathname: string;
}

interface DevelopmentBundle {
  entry: DevelopmentOutput;
  outputs: DevelopmentOutput[];
  stylesheets: DevelopmentOutput[];
}

interface DevelopmentServerState {
  bundle?: DevelopmentBundle;
  bundleAliasFromDocument?: boolean;
}

function createDevelopmentBuilder(
  config: ResolvedConfig
): () => Promise<DevelopmentBundle | Response> {
  let queue = Promise.resolve();

  return () => {
    const result = queue.then(() => buildProjectBundle(config));
    queue = result.then(
      () => undefined,
      () => undefined
    );
    return result;
  };
}

async function buildProjectBundle(
  config: ResolvedConfig
): Promise<DevelopmentBundle | Response> {
  const buildOptions = {
    entrypoints: [config.entry],
    target: 'browser' as const,
    format: 'esm' as const,
    sourcemap: 'inline' as const,
    write: false,
    throw: false,
  };
  try {
    const result = await Bun.build(buildOptions);
    const entryOutput = result.outputs.find(isEntryJavaScriptOutput);
    if (!result.success || !entryOutput) {
      result.logs.forEach((log) => console.error(log));
      if (!entryOutput) {
        console.error('Failed to build project bundle: no JavaScript output');
      }
      return buildFailureResponse();
    }

    const outputs = result.outputs.map((output) => ({
      output,
      pathname: toDevelopmentAssetPath(output.path),
    }));
    const entry = outputs.find(({ output }) => output === entryOutput);
    if (!entry) {
      console.error('Failed to build project bundle: no JavaScript output');
      return buildFailureResponse();
    }

    return {
      entry,
      outputs,
      stylesheets: outputs.filter(({ output }) => isStylesheetOutput(output)),
    };
  } catch (error: unknown) {
    console.error(error);
    return buildFailureResponse();
  }
}

function buildFailureResponse(): Response {
  return new Response('Failed to build project bundle', {
    status: 500,
    headers: { 'cache-control': 'no-store' },
  });
}

function toDevelopmentAssetPath(path: string): string {
  const normalizedPath = path.split('\\').join('/');
  if (normalizedPath.startsWith('./')) {
    return `/${normalizedPath.slice(2)}`;
  }
  if (isAbsolute(path)) {
    return `/${basename(path)}`;
  }
  return `/${normalizedPath.replace(/^\/+/, '')}`;
}
