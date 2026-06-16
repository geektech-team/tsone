import { afterEach, describe, expect, it } from 'bun:test';

let devProcess: ReturnType<typeof Bun.spawn> | undefined;

function getAvailablePort(): number {
  const server = Bun.serve({
    port: 0,
    fetch: () => new Response('ok'),
  });
  const port = server.port;
  server.stop(true);
  return port;
}

async function waitForServer(url: string): Promise<Response> {
  const deadline = Date.now() + 5000;

  while (Date.now() < deadline) {
    if (devProcess?.exitCode !== null) {
      const stderr = devProcess.stderr
        ? await new Response(devProcess.stderr).text()
        : '';
      throw new Error(`dev server exited early: ${stderr.trim()}`);
    }

    try {
      const response = await fetch(url);
      if (response.ok) {
        return response;
      }
    } catch {
      // The process may need a moment to bind the port.
    }

    await Bun.sleep(50);
  }

  throw new Error(`dev server did not respond at ${url}`);
}

afterEach(() => {
  devProcess?.kill();
  devProcess = undefined;
});

describe('Bun example dev server', () => {
  it('binds to an explicit host and port and serves the bundled example', async () => {
    const port = getAvailablePort();
    devProcess = Bun.spawn({
      cmd: [
        'bun',
        'scripts/dev.ts',
        '--host',
        '127.0.0.1',
        '--port',
        String(port),
      ],
      cwd: process.cwd(),
      env: {
        ...process.env,
        BUN_INSTALL_CACHE_DIR:
          process.env.BUN_INSTALL_CACHE_DIR ?? '/private/tmp/tsone-bun-cache',
        TMPDIR: process.env.TMPDIR ?? '/private/tmp/tsone-bun-tmp',
      },
      stdout: 'pipe',
      stderr: 'pipe',
    });

    const html = await waitForServer(`http://127.0.0.1:${port}/`);
    expect(await html.text()).toContain(
      '<script type="module" src="/bundle.js"></script>'
    );

    const bundle = await fetch(`http://127.0.0.1:${port}/bundle.js`);
    expect(bundle.ok).toBe(true);
    expect(bundle.headers.get('content-type')).toContain('text/javascript');
  });
});
