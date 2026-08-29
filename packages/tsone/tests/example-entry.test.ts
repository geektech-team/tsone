import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { beforeEach, describe, expect, it } from 'bun:test';
import { resetRouter } from '../lib/router/instance';
import { packagePath, repoPath } from './paths';

interface PlaygroundManifest {
  scripts?: Record<string, string>;
}

interface PlaygroundEntryModule {
  app: {
    renderHtmlDocument: () => string;
  };
}

async function importPlaygroundEntry(
  project: string
): Promise<PlaygroundEntryModule> {
  const entryUrl = pathToFileURL(
    repoPath('playground', project, 'src', 'main.ts')
  );
  return (await import(
    `${entryUrl.href}?run=${Date.now()}`
  )) as PlaygroundEntryModule;
}

function readPlaygroundManifest(project: string): PlaygroundManifest {
  return JSON.parse(
    readFileSync(repoPath('playground', project, 'package.json'), 'utf8')
  ) as PlaygroundManifest;
}

describe('playground entries', () => {
  beforeEach(() => {
    resetRouter();
    document.body.innerHTML = '<div id="app"></div>';
    window.history.replaceState({}, '', '/');
  });

  it('renders the official site playground on startup', async () => {
    const entry = await importPlaygroundEntry('official-site');

    const app = document.querySelector('#app');
    const html = entry.app.renderHtmlDocument();

    expect(typeof entry.app.renderHtmlDocument).toBe('function');
    expect(html).toContain('<title>TSone Playground 官网</title>');
    expect(app?.textContent).toContain('TSone');
    expect(app?.textContent).toContain('纯 TypeScript 前端框架');
    expect(app?.textContent).toContain('查看后台演练');
  });

  it('renders the admin dashboard playground on startup', async () => {
    const entry = await importPlaygroundEntry('admin-dashboard');

    const app = document.querySelector('#app');
    const html = entry.app.renderHtmlDocument();

    expect(typeof entry.app.renderHtmlDocument).toBe('function');
    expect(html).toContain('<title>TSone Playground 后台</title>');
    expect(app?.textContent).toContain('TSone 控制台');
    expect(app?.textContent).toContain('活跃项目');
    expect(app?.textContent).toContain('部署队列');
  });

  it('keeps playground examples outside the publishable package', () => {
    expect(existsSync(packagePath('examples'))).toBe(false);
    expect(existsSync(repoPath('playground', 'official-site'))).toBe(true);
    expect(existsSync(repoPath('playground', 'admin-dashboard'))).toBe(true);
    expect(
      existsSync(repoPath('playground', 'official-site', 'index.html'))
    ).toBe(false);
    expect(
      existsSync(repoPath('playground', 'admin-dashboard', 'index.html'))
    ).toBe(false);
  });

  it('uses the workspace TSone CLI contract in every playground', () => {
    for (const project of ['official-site', 'admin-dashboard']) {
      const manifest = readPlaygroundManifest(project);

      expect(manifest.scripts?.dev).toBe('tsone dev');
      expect(manifest.scripts?.build).toBe('tsone build');
      expect(
        existsSync(repoPath('playground', project, 'tsone.config.ts'))
      ).toBe(true);
    }
  });

  it('uses element shortcut helpers for supported tags in playground apps', () => {
    const playgroundEntries = [
      'playground/official-site/src/main.ts',
      'playground/admin-dashboard/src/main.ts',
    ];

    const rawSupportedTags = playgroundEntries.flatMap((file) => {
      const text = readFileSync(join(repoPath(), file), 'utf8');
      const matches = text.matchAll(
        /tag:\s*['"](div|span|p|button|input)['"]/g
      );

      return [...matches].map((match) => `${file}: ${match[0]}`);
    });

    expect(rawSupportedTags).toEqual([]);
  });

  it('generates static HTML for playground builds from TypeScript app entries', async () => {
    const projects = [
      {
        name: 'official-site',
        title: 'TSone Playground 官网',
        bundle: './main.js',
        bundleText: '纯 TypeScript 前端框架',
      },
      {
        name: 'admin-dashboard',
        title: 'TSone Playground 后台',
        bundle: './main.js',
        bundleText: 'TSone 控制台',
      },
    ];

    for (const project of projects) {
      const root = repoPath('playground', project.name);
      const outDir = mkdtempSync(join(root, '.tsone-build-smoke-'));

      try {
        const build = Bun.spawnSync({
          cmd: ['bun', 'run', 'tsone', 'build', '--out-dir', outDir],
          cwd: root,
          env: {
            ...process.env,
            BUN_INSTALL_CACHE_DIR:
              process.env.BUN_INSTALL_CACHE_DIR ??
              '/private/tmp/tsone-bun-cache',
            TMPDIR: process.env.TMPDIR ?? '/private/tmp/tsone-bun-tmp',
          },
          stdout: 'pipe',
          stderr: 'pipe',
        });

        expect(build.exitCode).toBe(0);

        const html = readFileSync(join(outDir, 'index.html'), 'utf8');
        expect(html).toContain(`<title>${project.title}</title>`);
        expect(html).toContain('<div id="app"></div>');
        expect(html).toContain(
          `<script type="module" src="${project.bundle}"></script>`
        );

        const mainBundle = join(outDir, 'main.js');
        expect(existsSync(mainBundle)).toBe(true);
        expect(readFileSync(mainBundle, 'utf8')).toContain(project.bundleText);
      } finally {
        rmSync(outDir, { recursive: true, force: true });
      }
    }
  });
});
