import { resolveConfig } from './config';
import { renderProjectHtml } from './project';
import { createProxyHandler } from './proxy';
import type { ResolveConfigOptions, ResolvedConfig } from './types';

export type StartDevServerOptions = ResolveConfigOptions;

export async function startDevServer(
  options: StartDevServerOptions = {}
): Promise<ReturnType<typeof Bun.serve>> {
  const config = await resolveConfig(options);
  const html = await renderProjectHtml(config, {
    scripts: [{ type: 'module', src: '/bundle.js' }],
  });
  const proxy = createProxyHandler(config.server.proxy);

  return Bun.serve({
    hostname: config.server.host,
    port: config.server.port,
    fetch: async (request) =>
      (await proxy(request)) ?? serveProjectRequest(request, config, html),
  });
}

async function serveProjectRequest(
  request: Request,
  config: ResolvedConfig,
  html: string
): Promise<Response> {
  const pathname = new URL(request.url).pathname;

  if (pathname === '/bundle.js') {
    return buildProjectBundle(config);
  }

  if (pathname === '/' || pathname === '/index.html') {
    return new Response(html, {
      headers: {
        'content-type': 'text/html; charset=utf-8',
        'cache-control': 'no-store',
      },
    });
  }

  return new Response('Not found', { status: 404 });
}

async function buildProjectBundle(config: ResolvedConfig): Promise<Response> {
  const buildOptions = {
    entrypoints: [config.entry],
    target: 'browser' as const,
    format: 'esm' as const,
    sourcemap: 'inline' as const,
    write: false,
  };
  const result = await Bun.build(buildOptions);

  const output = result.outputs.find(isJavaScriptOutput);
  if (!result.success || !output) {
    result.logs.forEach((log) => console.error(log));
    if (!output) {
      console.error('Failed to build project bundle: no JavaScript output');
    }
    return new Response('Failed to build project bundle', {
      status: 500,
      headers: { 'cache-control': 'no-store' },
    });
  }

  return new Response(await output.text(), {
    headers: {
      'content-type': 'text/javascript; charset=utf-8',
      'cache-control': 'no-store',
    },
  });
}

function isJavaScriptOutput(output: { path: string }): boolean {
  return /\.(?:[cm]?js)$/i.test(output.path);
}
