export interface DevServerOptions {
  hostname: string;
  port: number;
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

function parsePort(value: string): number {
  const port = Number(value);
  if (!Number.isInteger(port) || port < 0 || port > 65535) {
    throw new Error(`Invalid dev server port: ${value}`);
  }

  return port;
}

export function resolveDevServerOptions(
  argv: string[] = Bun.argv,
  env: Record<string, string | undefined> = process.env
): DevServerOptions {
  const args = argv.slice(2);
  const portValue =
    readOption(args, '--port') ??
    args.find((arg) => /^\d+$/.test(arg)) ??
    env.PORT ??
    '52211';

  return {
    hostname: readOption(args, '--host') ?? env.HOST ?? '127.0.0.1',
    port: parsePort(portValue),
  };
}

async function buildExampleBundle(): Promise<Response> {
  const result = await Bun.build({
    entrypoints: ['./examples/index.ts'],
    target: 'browser',
    format: 'esm',
    sourcemap: 'inline',
    write: false,
  });

  if (!result.success || !result.outputs[0]) {
    return new Response('Failed to build example bundle', { status: 500 });
  }

  return new Response(await result.outputs[0].text(), {
    headers: {
      'content-type': 'text/javascript; charset=utf-8',
      'cache-control': 'no-store',
    },
  });
}

async function serveExample(request: Request): Promise<Response> {
  const url = new URL(request.url);

  if (url.pathname === '/bundle.js') {
    return buildExampleBundle();
  }

  if (url.pathname !== '/' && url.pathname !== '/index.html') {
    return new Response('Not found', { status: 404 });
  }

  const html = await Bun.file('examples/index.html').text();
  return new Response(
    html.replace(
      '<script type="module" src="./index.ts"></script>',
      '<script type="module" src="/bundle.js"></script>'
    ),
    { headers: { 'content-type': 'text/html; charset=utf-8' } }
  );
}

export function startDevServer(options = resolveDevServerOptions()) {
  const server = Bun.serve({
    hostname: options.hostname,
    port: options.port,
    fetch: serveExample,
  });

  console.log(
    `TSone example server: http://${options.hostname}:${server.port}/`
  );
  return server;
}

if (import.meta.main) {
  startDevServer();
}
