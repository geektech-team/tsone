import {
  mkdirSync,
  mkdtempSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
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

function projectEntry(title: string): string {
  return `
      export const app = {
        renderHtmlDocument() {
          return '<!doctype html><html><head><title>${title}</title></head>' +
            '<body><div id="app"></div></body></html>';
        },
      };
    `;
}

function serverUrl(server: ReturnType<typeof Bun.serve>): string {
  return `http://127.0.0.1:${server.port}`;
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

  it(
    'rebuilds and broadcasts a reload event after a source change',
    async () => {
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
      expect(
        await (await fetch(`${serverUrl(server)}/`)).text()
      ).toContain('First Watch Title');

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
    },
    20_000
  );

  it('serves the cached bundle between requests without rebuilding', async () => {
    const root = makeRoot('Cached Watch App');
    let buildCount = 0;
    const originalBuild = Bun.build;
    Bun.build = (async (options: Bun.BuildConfig) => {
      buildCount += 1;
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

    expect(buildCount).toBe(1);
  });

  it(
    'does not reload the page when a rebuild fails',
    async () => {
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
    },
    20_000
  );

  it(
    'restarts the server with a fresh config when tsone.config.ts changes',
    async () => {
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
      expect(
        await (await fetch(`${serverUrl(server)}/`)).text()
      ).toContain('Configured Entry');

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
    },
    20_000
  );
});
