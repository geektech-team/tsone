import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { afterEach, describe, expect, it } from 'bun:test';
import { startDevServer } from '../src/index';

const LIVE_RELOAD_PATH = '/__tsone/reload';
const roots: string[] = [];
const servers: Array<ReturnType<typeof Bun.serve>> = [];
const restorers: Array<() => void> = [];

function makeRoot(title: string): string {
  const root = mkdtempSync(join(tmpdir(), 'tsone-cli-watch-'));
  roots.push(root);
  mkdirSync(join(root, 'src'));
  writeFileSync(join(root, 'src/main.ts'), projectEntry(title));
  return root;
}

function projectEntry(title: string, imports = ''): string {
  return `
      ${imports}
      export const app = {
        renderHtmlDocument(options = {}) {
          const head = (options.head ?? []).map((element) =>
            '<' + element.tag + ' ' + Object.entries(element.attributes)
              .map(([key, value]) => key + '="' + value + '"')
              .join(' ') + '>'
          ).join('');
          const scripts = (options.scripts ?? []).map((script) =>
            '<script type="' + script.type + '" src="' + script.src + '"></script>'
          ).join('');
          return '<!doctype html><html><head><title>${title}</title>' + head +
            '</head><body><div id="app"></div>' + scripts + '</body></html>';
        },
      };
    `;
}

function serverUrl(server: ReturnType<typeof Bun.serve>): string {
  return `http://127.0.0.1:${server.port}`;
}

async function pageBundleUrl(
  server: ReturnType<typeof Bun.serve>,
  route = '/'
): Promise<string> {
  const response = await fetch(`${serverUrl(server)}${route}`);
  expect(response.status).toBe(200);
  const html = await response.text();
  const url = html.match(/<script type="module" src="([^"]+)"><\/script>/)?.[1];
  if (!url) {
    throw new Error('Expected a development bundle URL');
  }
  return url;
}

function generationDirectory(root: string, bundleUrl: string): string {
  return dirname(join(root, 'dist/dev/h5', bundleUrl.slice('/dev/'.length)));
}

function captureConsoleErrors(): unknown[][] {
  const originalError = console.error;
  const calls: unknown[][] = [];
  console.error = (...values: unknown[]) => {
    calls.push(values);
  };
  restorers.push(() => {
    console.error = originalError;
  });
  return calls;
}

function waitFor(
  predicate: () => boolean | Promise<boolean>,
  message: string,
  timeoutMs = 8_000
): Promise<void> {
  return new Promise((resolvePromise, rejectPromise) => {
    const startedAt = Date.now();
    const timer = setInterval(async () => {
      let satisfied = false;
      try {
        satisfied = await predicate();
      } catch {
        satisfied = false;
      }
      if (satisfied) {
        clearInterval(timer);
        resolvePromise();
        return;
      }
      if (Date.now() - startedAt >= timeoutMs) {
        clearInterval(timer);
        rejectPromise(new Error(message));
      }
    }, 50);
  });
}

async function waitForReloadEvent(
  reader: ReadableStreamDefaultReader<Uint8Array>,
  timeoutMs = 8_000
): Promise<void> {
  const decoder = new TextDecoder();
  let buffer = '';
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    const read = await Promise.race([
      reader.read(),
      new Promise<{ done: true; value: undefined }>((resolveTimeout) =>
        setTimeout(() => resolveTimeout({ done: true, value: undefined }), 500)
      ),
    ]);
    if (read.done) {
      continue;
    }
    buffer += decoder.decode(read.value, { stream: true });
    if (buffer.includes('event: reload')) {
      return;
    }
  }
  throw new Error('Timed out waiting for the reload event');
}

async function assertNoReloadEvent(
  reader: ReadableStreamDefaultReader<Uint8Array>,
  windowMs = 800
): Promise<void> {
  const decoder = new TextDecoder();
  let buffer = '';
  const startedAt = Date.now();
  while (Date.now() - startedAt < windowMs) {
    const read = await Promise.race([
      reader.read(),
      new Promise<{ done: true; value: undefined }>((resolveTimeout) =>
        setTimeout(() => resolveTimeout({ done: true, value: undefined }), 200)
      ),
    ]);
    if (read.done) {
      continue;
    }
    buffer += decoder.decode(read.value, { stream: true });
    if (buffer.includes('event: reload')) {
      throw new Error('Unexpected reload event after a failed rebuild');
    }
  }
}

afterEach(() => {
  servers.splice(0).forEach((server) => server.stop(true));
  restorers
    .splice(0)
    .reverse()
    .forEach((restore) => restore());
  roots
    .splice(0)
    .forEach((root) => rmSync(root, { recursive: true, force: true }));
});

describe('TSone development server watch mode', () => {
  it('injects a live-reload client and serves the reload stream', async () => {
    const server = await startDevServer({
      root: makeRoot('Watch Document'),
      port: 0,
      watch: true,
    });
    servers.push(server);

    const html = await (await fetch(`${serverUrl(server)}/`)).text();
    const reload = await fetch(`${serverUrl(server)}${LIVE_RELOAD_PATH}`);

    expect(html).toContain(LIVE_RELOAD_PATH);
    expect(html).toContain('EventSource');
    expect(reload.status).toBe(200);
    expect(reload.headers.get('content-type')).toContain('text/event-stream');
  });

  it('rebuilds and broadcasts a reload event after a source change', async () => {
    const root = makeRoot('First Watch Title');
    const server = await startDevServer({
      root,
      port: 0,
      watch: true,
    });
    servers.push(server);
    const reload = await fetch(`${serverUrl(server)}${LIVE_RELOAD_PATH}`);
    const reader = reload.body?.getReader();
    if (!reader) {
      throw new Error('Expected a readable reload stream');
    }
    expect(await (await fetch(`${serverUrl(server)}/`)).text()).toContain(
      'First Watch Title'
    );

    writeFileSync(
      join(root, 'src/main.ts'),
      projectEntry('Second Watch Title')
    );

    await waitForReloadEvent(reader);
    reader.releaseLock();

    await waitFor(
      async () =>
        (await (await fetch(`${serverUrl(server)}/`)).text()).includes(
          'Second Watch Title'
        ),
      'Expected the rebuilt page to be served after the reload event'
    );
  }, 20_000);

  it('serves the cached bundle between requests without rebuilding', async () => {
    const root = makeRoot('Cached Watch App');
    let buildCount = 0;
    const originalBuild = Bun.build;
    Bun.build = (async (options: Bun.BuildConfig) => {
      buildCount += 1;
      if (!options.outdir) return { success: true, logs: [], outputs: [] };
      const outDir =
        'outdir' in options && typeof options.outdir === 'string'
          ? options.outdir
          : join(root, 'virtual');
      mkdirSync(outDir, { recursive: true });
      const entryPath = join(outDir, 'main-cached.js');
      writeFileSync(entryPath, 'export const cached = true;');
      return {
        success: true,
        logs: [],
        outputs: [
          Object.assign(
            new Blob(['export const cached = true;'], {
              type: 'text/javascript;charset=utf-8',
            }),
            {
              path: entryPath,
              kind: 'entry-point',
              hash: 'cached-hash',
              sourcemap: null,
            }
          ),
        ],
      };
    }) as unknown as typeof Bun.build;
    restorers.push(() => {
      Bun.build = originalBuild;
    });
    const server = await startDevServer({
      root,
      port: 0,
      watch: true,
    });
    servers.push(server);

    await fetch(`${serverUrl(server)}/`);
    await fetch(`${serverUrl(server)}/index.html`);
    await fetch(`${serverUrl(server)}/bundle.js`);

    expect(buildCount).toBe(2);
  });

  it('removes replaced JavaScript, CSS and file assets before broadcasting reload', async () => {
    const root = makeRoot('First Generation');
    const imports = `import './site.css';
        import logo from './logo.png' with { type: 'file' };
        export const logoUrl = logo;`;
    writeFileSync(
      join(root, 'src/main.ts'),
      projectEntry('First Generation', imports)
    );
    writeFileSync(join(root, 'src/site.css'), 'body { color: purple; }');
    writeFileSync(join(root, 'src/logo.png'), 'logo-content');
    const server = await startDevServer({ root, port: 0, watch: true });
    servers.push(server);
    let bundleUrl = await pageBundleUrl(server);
    const reload = await fetch(`${serverUrl(server)}${LIVE_RELOAD_PATH}`);
    const reader = reload.body?.getReader();
    if (!reader) {
      throw new Error('Expected a readable reload stream');
    }

    for (const title of ['Second Generation', 'Third Generation']) {
      const previousDirectory = generationDirectory(root, bundleUrl);
      const previousOutputs = readdirSync(previousDirectory, {
        recursive: true,
      }).filter((path) => /\.(js|css|png)$/.test(String(path)));
      expect(previousOutputs.some((path) => String(path).endsWith('.js'))).toBe(
        true
      );
      expect(
        previousOutputs.some((path) => String(path).endsWith('.css'))
      ).toBe(true);
      expect(
        previousOutputs.some((path) => String(path).endsWith('.png'))
      ).toBe(true);
      const previousUrls = previousOutputs.map(
        (path) => `${dirname(bundleUrl)}/${path}`
      );
      for (const url of previousUrls) {
        expect((await fetch(`${serverUrl(server)}${url}`)).status).toBe(200);
      }

      writeFileSync(join(root, 'src/main.ts'), projectEntry(title, imports));
      await waitForReloadEvent(reader);

      expect(existsSync(previousDirectory)).toBe(false);
      for (const url of previousUrls) {
        expect((await fetch(`${serverUrl(server)}${url}`)).status).toBe(404);
      }
      bundleUrl = await pageBundleUrl(server);
      const currentDirectory = generationDirectory(root, bundleUrl);
      expect(readdirSync(dirname(currentDirectory))).toHaveLength(1);
      expect(
        await (await fetch(`${serverUrl(server)}${bundleUrl}`)).text()
      ).toContain(title);
      for (const path of readdirSync(currentDirectory, { recursive: true })) {
        if (/\.(js|css|png)$/.test(String(path))) {
          expect(
            (await fetch(`${serverUrl(server)}${dirname(bundleUrl)}/${path}`))
              .status
          ).toBe(200);
        }
      }
    }
    reader.releaseLock();
  }, 20_000);

  it('shares one generation between concurrent watch requests', async () => {
    const root = makeRoot('Concurrent Watch App');
    const server = await startDevServer({ root, port: 0, watch: true });
    servers.push(server);

    const bundleUrls = await Promise.all([
      pageBundleUrl(server),
      pageBundleUrl(server, '/index.html'),
      pageBundleUrl(server),
    ]);

    expect(new Set(bundleUrls).size).toBe(1);
    const directory = generationDirectory(root, bundleUrls[0]);
    expect(readdirSync(dirname(directory))).toHaveLength(1);
  });

  it.each(['bundle', 'document'])(
    'retains all current pages when a later entry fails to rebuild its %s',
    async (failure) => {
      const root = makeRoot('Original Home');
      writeFileSync(join(root, 'src/about.ts'), projectEntry('Original About'));
      const server = await startDevServer({
        root,
        port: 0,
        watch: true,
        config: {
          pages: { '/about': 'src/about.ts', '/shared': 'src/about.ts' },
        },
      });
      servers.push(server);
      const previousUrls = [
        await pageBundleUrl(server),
        await pageBundleUrl(server, '/about'),
      ];
      const previousDirectories = previousUrls.map((url) =>
        generationDirectory(root, url)
      );
      expect(await pageBundleUrl(server, '/shared')).toBe(previousUrls[1]);
      const errorCalls = captureConsoleErrors();
      const reload = await fetch(`${serverUrl(server)}${LIVE_RELOAD_PATH}`);
      const reader = reload.body?.getReader();
      if (!reader) {
        throw new Error('Expected a readable reload stream');
      }

      writeFileSync(join(root, 'src/main.ts'), projectEntry('Updated Home'));
      writeFileSync(
        join(root, 'src/about.ts'),
        failure === 'bundle'
          ? 'export const app = {'
          : projectEntry('Broken About').replace(
              'const head =',
              "throw new Error('document render failed'); const head ="
            )
      );
      await waitFor(
        () =>
          errorCalls.some((values) =>
            values.join(' ').includes('TSone rebuild failed')
          ),
        'Expected the failed multi-page rebuild to be logged'
      );

      for (const [index, url] of previousUrls.entries()) {
        expect(existsSync(previousDirectories[index])).toBe(true);
        expect((await fetch(`${serverUrl(server)}${url}`)).status).toBe(200);
      }
      expect(readdirSync(dirname(previousDirectories[0]))).toHaveLength(2);
      await reader.cancel();

      const recovery = await fetch(`${serverUrl(server)}${LIVE_RELOAD_PATH}`);
      const recoveryReader = recovery.body?.getReader();
      if (!recoveryReader) {
        throw new Error('Expected a readable recovery stream');
      }
      writeFileSync(join(root, 'src/about.ts'), projectEntry('Updated About'));
      await waitForReloadEvent(recoveryReader);
      recoveryReader.releaseLock();

      for (const directory of previousDirectories) {
        expect(existsSync(directory)).toBe(false);
      }
      const homeUrl = await pageBundleUrl(server);
      const aboutUrl = await pageBundleUrl(server, '/about');
      expect(await pageBundleUrl(server, '/shared')).toBe(aboutUrl);
      expect(
        readdirSync(dirname(generationDirectory(root, homeUrl)))
      ).toHaveLength(2);
      expect(
        await (await fetch(`${serverUrl(server)}${homeUrl}`)).text()
      ).toContain('Updated Home');
      expect(
        await (await fetch(`${serverUrl(server)}${aboutUrl}`)).text()
      ).toContain('Updated About');
    },
    20_000
  );

  it('does not reload the page when a rebuild fails', async () => {
    const root = makeRoot('Failing Watch App');
    const server = await startDevServer({
      root,
      port: 0,
      watch: true,
    });
    servers.push(server);
    const errorCalls = captureConsoleErrors();
    const reload = await fetch(`${serverUrl(server)}${LIVE_RELOAD_PATH}`);
    const reader = reload.body?.getReader();
    if (!reader) {
      throw new Error('Expected a readable reload stream');
    }

    writeFileSync(
      join(root, 'src/main.ts'),
      'export const app = { renderHtmlDocument() { return ; }'
    );

    await waitFor(
      () =>
        errorCalls.some((values) =>
          values.join(' ').includes('TSone rebuild failed')
        ),
      'Expected the failed rebuild to be logged'
    );
    await assertNoReloadEvent(reader);
    reader.releaseLock();
  }, 20_000);

  it('restarts the server with a fresh config when tsone.config.ts changes', async () => {
    const root = mkdtempSync(join(tmpdir(), 'tsone-cli-watch-config-'));
    roots.push(root);
    mkdirSync(join(root, 'src'));
    writeFileSync(join(root, 'src/main.ts'), projectEntry('Configured Entry'));
    writeFileSync(
      join(root, 'src/other.ts'),
      projectEntry('Reconfigured Entry')
    );
    writeFileSync(
      join(root, 'tsone.config.ts'),
      "export default { entry: 'src/main.ts', server: { port: 0 } };"
    );
    const server = await startDevServer({
      root,
      port: 0,
      watch: true,
    });
    servers.push(server);
    const originalPort = server.port;
    const originalBundleUrl = await pageBundleUrl(server);
    const originalSessionDirectory = dirname(
      generationDirectory(root, originalBundleUrl)
    );
    expect(await (await fetch(`${serverUrl(server)}/`)).text()).toContain(
      'Configured Entry'
    );

    writeFileSync(
      join(root, 'tsone.config.ts'),
      "export default { entry: 'src/other.ts', server: { port: 0 } };"
    );

    await waitFor(
      () => server.port !== originalPort,
      'Expected the dev server to restart after the config change'
    );
    await waitFor(
      async () =>
        (await (await fetch(`${serverUrl(server)}/`)).text()).includes(
          'Reconfigured Entry'
        ),
      'Expected the restarted server to serve the reconfigured entry'
    );
    expect(existsSync(originalSessionDirectory)).toBe(false);
  }, 20_000);
});
