import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'bun:test';
import { build } from '../src/build';
import { resolveConfig } from '../src/config';
import { startDevServer } from '../src/index';
import type { UserConfig } from '../src/types';

const roots: string[] = [];
const servers: Array<ReturnType<typeof Bun.serve>> = [];
const restorers: Array<() => void> = [];

function projectEntry(title: string): string {
  return `
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

function makeRoot(
  pages: Record<string, string>,
  extraEntries: Record<string, string> = {}
): string {
  const root = mkdtempSync(join(tmpdir(), 'tsone-cli-multipage-'));
  roots.push(root);
  mkdirSync(join(root, 'src'));
  writeFileSync(join(root, 'src/main.ts'), projectEntry('Home Page'));
  writeFileSync(
    join(root, 'tsone.config.ts'),
    `export default ${JSON.stringify({ pages })};`
  );
  for (const [file, source] of Object.entries(extraEntries)) {
    writeFileSync(join(root, 'src', file), source);
  }
  for (const entry of Object.values(pages)) {
    writeFileSync(join(root, entry), projectEntry(entryTitle(entry)));
  }
  return root;
}

function entryTitle(entry: string): string {
  const base = entry.split('/').pop()?.replace(/\.ts$/, '') ?? 'Page';
  return base.charAt(0).toUpperCase() + base.slice(1);
}

function serverUrl(server: ReturnType<typeof Bun.serve>): string {
  return `http://127.0.0.1:${server.port}`;
}

afterEach(() => {
  restorers
    .splice(0)
    .reverse()
    .forEach((restore) => restore());
  servers.splice(0).forEach((server) => server.stop(true));
  roots
    .splice(0)
    .forEach((root) => rmSync(root, { recursive: true, force: true }));
});

describe('TSone CLI multi-page', () => {
  it('resolves normalized page routes to absolute entries', async () => {
    const root = makeRoot({ '/about/': 'src/about.ts' });

    const config = await resolveConfig({ root });

    expect(config.entry).toBe(join(root, 'src/main.ts'));
    expect(config.pages).toEqual({
      '/': join(root, 'src/main.ts'),
      '/about': join(root, 'src/about.ts'),
    });
  });

  it('rejects page routes without a leading slash', async () => {
    const root = makeRoot({});
    await expect(
      resolveConfig({
        root,
        config: { pages: { about: 'src/about.ts' } } as unknown as UserConfig,
      })
    ).rejects.toThrow('Page route must start with "/": about');
  });

  it('rejects a pages entry that redefines the root page', async () => {
    const root = makeRoot({});
    await expect(
      resolveConfig({ root, config: { pages: { '/': 'src/about.ts' } } })
    ).rejects.toThrow('must not redefine the root page "/"');
  });

  it('rejects a page whose entry file is missing', async () => {
    const root = makeRoot({});
    await expect(
      resolveConfig({
        root,
        config: { pages: { '/missing': 'src/missing.ts' } },
      })
    ).rejects.toThrow(
      `Page entry file does not exist for "/missing": ${join(root, 'src/missing.ts')}`
    );
  });

  it('serves each configured page at its own route', async () => {
    const root = makeRoot({ '/about': 'src/about.ts' });
    const server = await startDevServer({ root, port: 0 });
    servers.push(server);
    const base = serverUrl(server);

    const home = await (await fetch(`${base}/`)).text();
    const index = await (await fetch(`${base}/index.html`)).text();
    const about = await (await fetch(`${base}/about`)).text();
    const aboutSlash = await (await fetch(`${base}/about/`)).text();
    const aboutIndex = await (await fetch(`${base}/about/index.html`)).text();
    const missing = await fetch(`${base}/missing`);

    expect(home).toContain('<title>Home Page</title>');
    expect(index).toContain('<title>Home Page</title>');
    expect(about).toContain('<title>About</title>');
    expect(aboutSlash).toContain('<title>About</title>');
    expect(aboutIndex).toContain('<title>About</title>');
    expect(missing.status).toBe(404);

    const homeScript = home.match(
      /<script type="module" src="([^"]+)"><\/script>/
    )?.[1];
    const aboutScript = about.match(
      /<script type="module" src="([^"]+)"><\/script>/
    )?.[1];
    expect(homeScript).not.toBe(aboutScript);
  });

  it('rebuilds and broadcasts across pages after a source change', async () => {
    const root = makeRoot({ '/about': 'src/about.ts' });
    const server = await startDevServer({ root, port: 0, watch: true });
    servers.push(server);
    const base = serverUrl(server);

    expect(await (await fetch(`${base}/about`)).text()).toContain(
      '<title>About</title>'
    );
    writeFileSync(join(root, 'src/about.ts'), projectEntry('Updated About'));
    await waitFor(async () =>
      (await (await fetch(`${base}/about`)).text()).includes(
        '<title>Updated About</title>'
      )
    );
  });

  it('builds an HTML document per page with page-relative assets', async () => {
    const root = makeRoot(
      { '/about': 'src/about.ts', '/docs/guide': 'src/guide.ts' },
      { 'guide.ts': projectEntry('Guide') }
    );

    const result = await build({ root });
    const indexHtml = readFileSync(join(root, 'dist', 'index.html'), 'utf8');
    const aboutHtml = readFileSync(join(root, 'dist', 'about.html'), 'utf8');
    const guideHtml = readFileSync(
      join(root, 'dist', 'docs', 'guide.html'),
      'utf8'
    );

    expect(existsSync(join(root, 'dist', 'index.html'))).toBe(true);
    expect(existsSync(join(root, 'dist', 'about.html'))).toBe(true);
    expect(existsSync(join(root, 'dist', 'docs', 'guide.html'))).toBe(true);
    expect(indexHtml).toContain('<title>Home Page</title>');
    expect(indexHtml).toContain('<script type="module" src="./main.js">');
    expect(aboutHtml).toContain('<title>About</title>');
    expect(aboutHtml).toContain('<script type="module" src="./about.js">');
    expect(guideHtml).toContain('<title>Guide</title>');
    expect(guideHtml).toContain('<script type="module" src="./../guide.js">');
    expect(result.assetsBuilt).toEqual(
      expect.arrayContaining([
        join(root, 'dist', 'index.html'),
        join(root, 'dist', 'about.html'),
        join(root, 'dist', 'docs', 'guide.html'),
        join(root, 'dist', 'main.js'),
        join(root, 'dist', 'about.js'),
      ])
    );
  });

  it('builds directory pages and deduplicates a shared entry into one bundle', async () => {
    const root = mkdtempSync(join(tmpdir(), 'tsone-cli-directory-'));
    roots.push(root);
    mkdirSync(join(root, 'src'));
    writeFileSync(join(root, 'src/main.ts'), projectEntry('Home Page'));
    writeFileSync(join(root, 'src/shared.ts'), projectEntry('Shared Page'));
    writeFileSync(
      join(root, 'tsone.config.ts'),
      `export default { pages: { '/about': 'src/shared.ts', '/docs/guide': 'src/shared.ts' }, build: { directoryPages: true } };`
    );
    let buildCalls = 0;
    const originalBuild = Bun.build;
    Bun.build = (async () => {
      buildCalls += 1;
      const entryPath = join(root, 'dist', 'shared.js');
      mkdirSync(join(root, 'dist'), { recursive: true });
      writeFileSync(entryPath, 'export const shared = true;');
      return {
        success: true,
        logs: [],
        outputs: [
          Object.assign(
            new Blob(['export const shared = true;'], {
              type: 'text/javascript;charset=utf-8',
            }),
            {
              path: entryPath,
              kind: 'entry-point',
              hash: 'shared',
              sourcemap: null,
            }
          ),
        ],
      };
    }) as unknown as typeof Bun.build;
    restorers.push(() => {
      Bun.build = originalBuild;
    });

    const result = await build({ root });

    expect(buildCalls).toBe(2);
    expect(existsSync(join(root, 'dist', 'index.html'))).toBe(true);
    expect(existsSync(join(root, 'dist', 'about', 'index.html'))).toBe(true);
    expect(existsSync(join(root, 'dist', 'docs', 'guide', 'index.html'))).toBe(
      true
    );
    expect(result.assetsBuilt).toEqual(
      expect.arrayContaining([
        join(root, 'dist', 'about', 'index.html'),
        join(root, 'dist', 'docs', 'guide', 'index.html'),
      ])
    );
  });

  it('injects the page route and base path into the SSR document URL', async () => {
    const root = mkdtempSync(join(tmpdir(), 'tsone-cli-route-'));
    roots.push(root);
    mkdirSync(join(root, 'src'));
    writeFileSync(
      join(root, 'src/main.ts'),
      `
        export const app = {
          renderHtmlDocument() {
            return '<!doctype html><html><body>' +
              window.location.pathname + '</body></html>';
          },
        };
      `
    );
    writeFileSync(
      join(root, 'tsone.config.ts'),
      `
        export default {
          pages: { '/zh/guide': 'src/main.ts' },
          build: { basePath: '/tsone/one', directoryPages: true },
        };
      `
    );

    await build({ root });

    const rootHtml = readFileSync(join(root, 'dist', 'index.html'), 'utf8');
    const guideHtml = readFileSync(
      join(root, 'dist', 'zh', 'guide', 'index.html'),
      'utf8'
    );
    expect(rootHtml).toContain('/tsone/one/');
    expect(guideHtml).toContain('/tsone/one/zh/guide');
  });
});

function waitFor(
  predicate: () => boolean | Promise<boolean>,
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
        rejectPromise(new Error('Timed out waiting for the multipage update'));
      }
    }, 50);
  });
}
