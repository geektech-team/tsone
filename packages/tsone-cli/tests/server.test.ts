import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
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

function createBuildOutput(
  path: string,
  contents: string,
  kind: BuildOutput['kind'],
  type: string
): BuildOutput {
  return Object.assign(new Blob([contents], { type }), {
    path,
    kind,
    hash: 'test-output-hash',
    sourcemap: null,
  }) as unknown as BuildOutput;
}

function mockBuild(result: BuildResult): void {
  const originalBuild = Bun.build;
  Bun.build = (async () => result) as typeof Bun.build;
  restorers.push(() => {
    Bun.build = originalBuild;
  });
}

function mockBuildImplementation(implementation: typeof Bun.build): void {
  const originalBuild = Bun.build;
  Bun.build = implementation;
  restorers.push(() => {
    Bun.build = originalBuild;
  });
}

function mockRejectedBuild(error: Error): void {
  const originalBuild = Bun.build;
  Bun.build = (async () => {
    throw error;
  }) as typeof Bun.build;
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
    expect(response.headers.get('cache-control')).toBe('no-store');
  });

  it('serves real CSS and file-loader outputs from their emitted URLs', async () => {
    const root = makeRoot('Development Assets App');
    writeFileSync(
      join(root, 'src/main.ts'),
      projectEntry(
        'Development Assets App',
        `import './site.css';
         import assetUrl from './test.png' with { type: 'file' };
         export const developmentAssetUrl = assetUrl;`
      )
    );
    writeFileSync(join(root, 'src/site.css'), 'body { color: rebeccapurple; }');
    writeFileSync(join(root, 'src/test.png'), 'test-file-asset');
    const server = await startDevServer({ root, port: 0 });
    servers.push(server);

    const documentResponse = await fetch(`${serverUrl(server)}/`);
    const documentHtml = await documentResponse.text();
    const scriptSource = documentHtml.match(
      /<script type="module" src="([^"]+)"><\/script>/
    )?.[1];
    const stylesheetHref = documentHtml.match(
      /<link rel="stylesheet" href="([^"]+)">/
    )?.[1];

    expect(documentResponse.status).toBe(200);
    expect(documentResponse.headers.get('cache-control')).toBe('no-store');
    expect(existsSync(join(root, '.tsone', 'dev'))).toBe(true);
    expect(scriptSource).toMatch(/^\/.*\.js$/);
    expect(stylesheetHref).toMatch(/^\/.*\.css$/);
    if (!scriptSource || !stylesheetHref) {
      throw new Error('Expected development document assets');
    }

    const scriptResponse = await fetch(
      new URL(scriptSource, serverUrl(server))
    );
    const script = await scriptResponse.text();
    const stylesheetResponse = await fetch(
      new URL(stylesheetHref, serverUrl(server))
    );
    const fileAssetHref = script.match(/["']([^"']+\.png)["']/)?.[1];

    expect(scriptResponse.status).toBe(200);
    expect(scriptResponse.headers.get('cache-control')).toBe('no-store');
    expect(stylesheetResponse.status).toBe(200);
    expect(stylesheetResponse.headers.get('cache-control')).toBe('no-store');
    expect(fileAssetHref).toBeDefined();
    if (!fileAssetHref) {
      throw new Error('Expected emitted file asset URL in development bundle');
    }

    const fileAssetResponse = await fetch(
      new URL(fileAssetHref, scriptResponse.url)
    );
    expect(fileAssetResponse.status).toBe(200);
    expect(fileAssetResponse.headers.get('cache-control')).toBe('no-store');
    expect(await fileAssetResponse.text()).toBe('test-file-asset');
  });

  it('builds an independent exact generation for / and /index.html', async () => {
    const root = makeRoot('Document Generation A');
    const server = await startDevServer({ root, port: 0 });
    servers.push(server);

    const firstDocument = await fetch(`${serverUrl(server)}/`);
    const firstHtml = await firstDocument.text();
    writeFileSync(
      join(root, 'src/main.ts'),
      projectEntry('Document Generation B')
    );
    const secondDocument = await fetch(`${serverUrl(server)}/index.html`);
    const secondHtml = await secondDocument.text();
    const firstScript = firstHtml.match(
      /<script type="module" src="([^"]+)"><\/script>/
    )?.[1];
    const secondScript = secondHtml.match(
      /<script type="module" src="([^"]+)"><\/script>/
    )?.[1];

    expect(firstScript).toMatch(/^\/dev\/[^/]+\/[^/]+\/.*\.js$/);
    expect(secondScript).toMatch(/^\/dev\/[^/]+\/[^/]+\/.*\.js$/);
    expect(secondScript).not.toBe(firstScript);
    if (!firstScript || !secondScript) {
      throw new Error('Expected exact development generation scripts');
    }

    expect(
      await (await fetch(new URL(firstScript, serverUrl(server)))).text()
    ).toContain('Document Generation A');
    expect(
      await (await fetch(new URL(secondScript, serverUrl(server)))).text()
    ).toContain('Document Generation B');
  });

  it('keeps concurrent document generations independently addressable', async () => {
    const root = makeRoot('Concurrent Documents');
    const labels = ['generation-a', 'generation-b'];
    mockBuildImplementation((async (options) => {
      const label = labels.shift();
      if (!label) {
        throw new Error('Unexpected extra development build');
      }
      const outDir =
        'outdir' in options && typeof options.outdir === 'string'
          ? options.outdir
          : join(root, 'virtual', label);
      mkdirSync(outDir, { recursive: true });
      const entryPath = join(outDir, `main-${label}.js`);
      writeFileSync(entryPath, `export const label = '${label}';`);
      return {
        success: true,
        logs: [],
        outputs: [
          createBuildOutput(
            entryPath,
            `export const label = '${label}';`,
            'entry-point',
            'text/javascript;charset=utf-8'
          ),
        ],
      } as BuildResult;
    }) as typeof Bun.build);

    const server = await startDevServer({ root, port: 0 });
    servers.push(server);
    const [rootResponse, indexResponse] = await Promise.all([
      fetch(`${serverUrl(server)}/`),
      fetch(`${serverUrl(server)}/index.html`),
    ]);
    const documents = await Promise.all([
      rootResponse.text(),
      indexResponse.text(),
    ]);
    const scripts = documents.map(
      (html) =>
        html.match(/<script type="module" src="([^"]+)"><\/script>/)?.[1]
    );
    const [firstScript, secondScript] = scripts;

    expect(firstScript).toMatch(/^\/dev\/[^/]+\/[^/]+\/.*\.js$/);
    expect(secondScript).toMatch(/^\/dev\/[^/]+\/[^/]+\/.*\.js$/);
    expect(firstScript).not.toBe(secondScript);
    if (!firstScript || !secondScript) {
      throw new Error('Expected concurrent development scripts');
    }

    const scriptBodies = await Promise.all(
      [firstScript, secondScript].map(async (script) =>
        (await fetch(new URL(script, serverUrl(server)))).text()
      )
    );
    expect(new Set(scriptBodies)).toEqual(
      new Set([
        "export const label = 'generation-a';",
        "export const label = 'generation-b';",
      ])
    );
  });

  it('preserves nested emitted paths with duplicate asset basenames', async () => {
    const root = makeRoot('Nested Development Assets');
    mockBuildImplementation((async (options) => {
      const outDir =
        'outdir' in options && typeof options.outdir === 'string'
          ? options.outdir
          : join(root, 'virtual');
      const entryPath = join(outDir, 'main-hash.js');
      const firstLogo = join(outDir, 'a', 'logo.png');
      const secondLogo = join(outDir, 'b', 'logo.png');
      mkdirSync(join(outDir, 'a'), { recursive: true });
      mkdirSync(join(outDir, 'b'), { recursive: true });
      writeFileSync(
        entryPath,
        'export const logos = ["./a/logo.png", "./b/logo.png"];'
      );
      writeFileSync(firstLogo, 'logo-a');
      writeFileSync(secondLogo, 'logo-b');
      return {
        success: true,
        logs: [],
        outputs: [
          createBuildOutput(
            entryPath,
            'export const logos = ["./a/logo.png", "./b/logo.png"];',
            'entry-point',
            'text/javascript;charset=utf-8'
          ),
          createBuildOutput(firstLogo, 'logo-a', 'asset', 'image/png'),
          createBuildOutput(secondLogo, 'logo-b', 'asset', 'image/png'),
        ],
      } as BuildResult;
    }) as typeof Bun.build);

    const server = await startDevServer({ root, port: 0 });
    servers.push(server);
    const html = await (await fetch(`${serverUrl(server)}/`)).text();
    const scriptSource = html.match(
      /<script type="module" src="([^"]+)"><\/script>/
    )?.[1];
    if (!scriptSource) {
      throw new Error('Expected nested-asset entry script');
    }

    const firstLogo = await fetch(
      new URL('./a/logo.png', new URL(scriptSource, serverUrl(server)))
    );
    const secondLogo = await fetch(
      new URL('./b/logo.png', new URL(scriptSource, serverUrl(server)))
    );

    expect(firstLogo.status).toBe(200);
    expect(await firstLogo.text()).toBe('logo-a');
    expect(secondLogo.status).toBe(200);
    expect(await secondLogo.text()).toBe('logo-b');
  });

  it('rejects emitted output paths that escape the generation directory', async () => {
    const root = makeRoot('Escaping Development Output');
    const errorCalls = captureConsoleErrors();
    mockBuildImplementation((async (options) => {
      const outDir =
        'outdir' in options && typeof options.outdir === 'string'
          ? options.outdir
          : join(root, 'virtual');
      const entryPath = join(outDir, 'main-hash.js');
      const escapedPath = join(outDir, '..', 'escaped.js');
      mkdirSync(outDir, { recursive: true });
      writeFileSync(entryPath, 'export const entry = true;');
      writeFileSync(escapedPath, 'export const escaped = true;');
      return {
        success: true,
        logs: [],
        outputs: [
          createBuildOutput(
            entryPath,
            'export const entry = true;',
            'entry-point',
            'text/javascript;charset=utf-8'
          ),
          createBuildOutput(
            escapedPath,
            'export const escaped = true;',
            'asset',
            'text/javascript;charset=utf-8'
          ),
        ],
      } as BuildResult;
    }) as typeof Bun.build);

    const server = await startDevServer({ root, port: 0 });
    servers.push(server);
    const response = await fetch(`${serverUrl(server)}/`);

    expect(response.status).toBe(500);
    expect(await response.text()).toBe('Failed to build project bundle');
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(
      errorCalls.some((values) => values.join(' ').includes('outside'))
    ).toBe(true);
  });

  it('returns an unknown route without starting a development build', async () => {
    const server = await startDevServer({
      root: makeRoot('Unknown Route'),
      port: 0,
    });
    servers.push(server);
    const errorCalls = captureConsoleErrors();
    mockRejectedBuild(new Error('unknown route must not build'));

    const response = await fetch(`${serverUrl(server)}/missing`);

    expect(response.status).toBe(404);
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(errorCalls).toEqual([]);
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
    mockBuildImplementation((async (options) => {
      if (!('outdir' in options) || typeof options.outdir !== 'string') {
        throw new Error('Expected development output directory');
      }
      mkdirSync(options.outdir, { recursive: true });
      const stylesheet = join(options.outdir, 'styles.css');
      const entry = join(options.outdir, 'app.js');
      writeFileSync(stylesheet, 'body { color: red; }');
      writeFileSync(entry, 'export const bundleTitle = "JavaScript bundle";');
      return {
        success: true,
        logs: [],
        outputs: [
          createBuildOutput(
            stylesheet,
            'body { color: red; }',
            'asset',
            'text/css;charset=utf-8'
          ),
          createBuildOutput(
            entry,
            'export const bundleTitle = "JavaScript bundle";',
            'entry-point',
            'text/javascript;charset=utf-8'
          ),
        ],
      } as BuildResult;
    }) as typeof Bun.build);

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
        createBuildOutput(
          '/virtual/styles.css',
          'body { color: red; }',
          'asset',
          'text/css;charset=utf-8'
        ),
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

  it('normalizes rejected Bun builds to a generic 500 with diagnostics', async () => {
    const server = await startDevServer({
      root: makeRoot('Rejected Build'),
      port: 0,
    });
    servers.push(server);
    const errorCalls = captureConsoleErrors();
    mockRejectedBuild(new Error('private compiler diagnostic'));

    const response = await fetch(`${serverUrl(server)}/bundle.js`);

    expect(response.status).toBe(500);
    expect(await response.text()).toBe('Failed to build project bundle');
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(
      errorCalls.some((values) =>
        values.join(' ').includes('private compiler diagnostic')
      )
    ).toBe(true);
  });
});
