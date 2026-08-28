import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'bun:test';
import { startDevServer } from '../src/index';

const roots: string[] = [];
const servers: Array<ReturnType<typeof Bun.serve>> = [];
const restorers: Array<() => void> = [];
type BuildResult = Awaited<ReturnType<typeof Bun.build>>;
type BuildOutput = BuildResult['outputs'][number];

function makeRoot(title: string): string {
  const root = mkdtempSync(join(tmpdir(), 'tsone-cli-server-'));
  roots.push(root);
  mkdirSync(join(root, 'src'));
  writeFileSync(
    join(root, 'src/main.ts'),
    `
      export const app = {
        renderHtmlDocument() {
          return '<!doctype html><html><head><title>${title}</title></head>' +
            '<body><div id="app"></div></body></html>';
        },
      };
    `
  );
  return root;
}

function serverUrl(server: ReturnType<typeof Bun.serve>): string {
  return `http://127.0.0.1:${server.port}`;
}

function createBuildOutput(path: string, contents: string): BuildOutput {
  return Object.assign(new Blob([contents]), {
    path,
  }) as unknown as BuildOutput;
}

function mockBuild(result: BuildResult): void {
  const originalBuild = Bun.build;
  Bun.build = (async () => result) as typeof Bun.build;
  restorers.push(() => {
    Bun.build = originalBuild;
  });
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

describe('TSone development server', () => {
  it('serves the rendered project document and browser bundle', async () => {
    const root = makeRoot('Development Server App');
    const server = await startDevServer({ root, port: 0 });
    servers.push(server);

    const html = await fetch(`${serverUrl(server)}/`);
    const indexHtml = await fetch(`${serverUrl(server)}/index.html`);
    const bundle = await fetch(`${serverUrl(server)}/bundle.js`);

    expect(html.status).toBe(200);
    expect(await html.text()).toContain(
      '<title>Development Server App</title>'
    );
    expect(await indexHtml.text()).toContain('<div id="app"></div>');
    expect(bundle.status).toBe(200);
    expect(bundle.headers.get('content-type')).toContain('javascript');
    expect(await bundle.text()).toContain('Development Server App');
  });

  it('prevents browser caching of generated HTML and bundle responses', async () => {
    const server = await startDevServer({
      root: makeRoot('No Store App'),
      port: 0,
    });
    servers.push(server);

    const html = await fetch(`${serverUrl(server)}/`);
    const bundle = await fetch(`${serverUrl(server)}/bundle.js`);

    expect(html.headers.get('cache-control')).toBe('no-store');
    expect(bundle.headers.get('cache-control')).toBe('no-store');
  });

  it('builds the browser bundle for every request', async () => {
    const root = makeRoot('First Bundle Title');
    const server = await startDevServer({ root, port: 0 });
    servers.push(server);

    expect(
      await (await fetch(`${serverUrl(server)}/bundle.js`)).text()
    ).toContain('First Bundle Title');
    writeFileSync(
      join(root, 'src/main.ts'),
      `
        export const app = {
          renderHtmlDocument() {
            return '<title>Second Bundle Title</title>';
          },
        };
      `
    );

    expect(
      await (await fetch(`${serverUrl(server)}/bundle.js`)).text()
    ).toContain('Second Bundle Title');
  });

  it('returns 404 for project paths it does not serve', async () => {
    const server = await startDevServer({
      root: makeRoot('Missing Path App'),
      port: 0,
    });
    servers.push(server);

    const response = await fetch(`${serverUrl(server)}/missing`);

    expect(response.status).toBe(404);
  });

  it('gives a matching proxy rule priority over the framework bundle', async () => {
    const upstream = Bun.serve({
      hostname: '127.0.0.1',
      port: 0,
      fetch: () => new Response('proxied bundle response'),
    });
    servers.push(upstream);
    const server = await startDevServer({
      root: makeRoot('Proxy Priority App'),
      port: 0,
      config: {
        server: {
          proxy: {
            '/bundle.js': `http://127.0.0.1:${upstream.port}`,
          },
        },
      },
    });
    servers.push(server);

    const response = await fetch(`${serverUrl(server)}/bundle.js`);

    expect(response.status).toBe(200);
    expect(await response.text()).toBe('proxied bundle response');
  });

  it('selects the JavaScript bundle when Bun returns a stylesheet first', async () => {
    const server = await startDevServer({
      root: makeRoot('Multiple Build Outputs'),
      port: 0,
    });
    servers.push(server);
    mockBuild({
      success: true,
      logs: [],
      outputs: [
        createBuildOutput('/virtual/styles.css', 'body { color: red; }'),
        createBuildOutput(
          '/virtual/app.js',
          'export const bundleTitle = "JavaScript bundle";'
        ),
      ],
    } as unknown as BuildResult);

    const response = await fetch(`${serverUrl(server)}/bundle.js`);

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('javascript');
    expect(await response.text()).toBe(
      'export const bundleTitle = "JavaScript bundle";'
    );
  });

  it('returns a generic 500 and logs an error when Bun emits no JavaScript bundle', async () => {
    const server = await startDevServer({
      root: makeRoot('No JavaScript Output'),
      port: 0,
    });
    servers.push(server);
    const errorCalls = captureConsoleErrors();
    mockBuild({
      success: true,
      logs: [],
      outputs: [
        createBuildOutput('/virtual/styles.css', 'body { color: red; }'),
      ],
    } as unknown as BuildResult);

    const response = await fetch(`${serverUrl(server)}/bundle.js`);

    expect(response.status).toBe(500);
    expect(await response.text()).toBe('Failed to build project bundle');
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(
      errorCalls.some((values) =>
        values.join(' ').includes('no JavaScript output')
      )
    ).toBe(true);
  });
});
