import {
  existsSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'bun:test';
import { buildCliDocs, startCliDocsServer } from '../scripts/docs';

describe('TSone CLI docs server', () => {
  it('rebuilds managed output before serving so pages are current', async () => {
    const outDir = mkdtempSync(join(tmpdir(), 'cli-docs-server-refresh-'));
    await buildCliDocs({ outDir });
    const commandsPage = join(outDir, 'zh', 'commands', 'index.html');
    writeFileSync(commandsPage, '<!doctype html><p>stale commands page</p>');

    const server = await startCliDocsServer({
      hostname: '127.0.0.1',
      port: 0,
      outDir,
    });

    try {
      const response = await fetch(
        `http://127.0.0.1:${server.port}/zh/commands/`
      );
      const html = await response.text();
      expect(response.status).toBe(200);
      expect(html).toContain('tsone create');
      expect(html).not.toContain('stale commands page');
    } finally {
      server.stop(true);
      rmSync(outDir, { recursive: true, force: true });
    }
  });

  it('serves built pages and assets with explicit content types', async () => {
    const outDir = mkdtempSync(join(tmpdir(), 'cli-docs-server-'));
    await buildCliDocs({ outDir });
    const server = await startCliDocsServer({
      hostname: '127.0.0.1',
      port: 0,
      outDir,
    });
    const origin = `http://127.0.0.1:${server.port}`;

    try {
      const home = await fetch(`${origin}/`);
      expect(home.status).toBe(200);
      expect(home.headers.get('content-type')).toContain('text/html');
      expect(await home.text()).toContain('TSone CLI');

      const commands = await fetch(`${origin}/zh/commands/`);
      expect(commands.status).toBe(200);
      expect(await commands.text()).toContain(
        '<title>命令参考 - TSone CLI</title>'
      );

      const client = await fetch(`${origin}/assets/cli-docs-client.js`);
      expect(client.status).toBe(200);
      expect(client.headers.get('content-type')).toContain('text/javascript');
      expect(await client.text()).toContain('mountCliDocsClient');

      expect((await fetch(`${origin}/missing/`)).status).toBe(404);
    } finally {
      server.stop(true);
      rmSync(outDir, { recursive: true, force: true });
    }
  });

  it('serves documentation under a configured base path', async () => {
    const outDir = mkdtempSync(join(tmpdir(), 'cli-docs-server-base-'));
    await buildCliDocs({ outDir, basePath: '/tsone/cli' });
    const server = await startCliDocsServer({
      hostname: '127.0.0.1',
      port: 0,
      outDir,
      basePath: '/tsone/cli',
    });
    const origin = `http://127.0.0.1:${server.port}`;

    try {
      const home = await fetch(`${origin}/tsone/cli/`);
      expect(home.status).toBe(200);
      expect(await home.text()).toContain('/tsone/cli/zh/');

      const commands = await fetch(`${origin}/tsone/cli/zh/commands/`);
      expect(commands.status).toBe(200);
      expect(await commands.text()).toContain('data-doc-base="/tsone/cli"');

      const client = await fetch(
        `${origin}/tsone/cli/assets/cli-docs-client.js`
      );
      expect(client.status).toBe(200);
      expect(client.headers.get('content-type')).toContain('text/javascript');
    } finally {
      server.stop(true);
      rmSync(outDir, { recursive: true, force: true });
    }
  });

  it('rebuilds when the built output uses a different base path', async () => {
    const outDir = mkdtempSync(
      join(tmpdir(), 'cli-docs-server-base-mismatch-')
    );
    // 用带前缀的 base 构建产物，然后不带 base 启动 serve：
    // 残留的 /tsone/cli 前缀会让 dev 根路径下的脚本 404，必须自动重建。
    await buildCliDocs({ outDir, basePath: '/tsone/cli' });

    const server = await startCliDocsServer({
      hostname: '127.0.0.1',
      port: 0,
      outDir,
    });
    const origin = `http://127.0.0.1:${server.port}`;

    try {
      const home = await fetch(`${origin}/`);
      expect(home.status).toBe(200);
      const homeHtml = await home.text();
      expect(homeHtml).toContain('/zh/');
      expect(homeHtml).not.toContain('/tsone/cli/zh/');

      const commands = await fetch(`${origin}/zh/commands/`);
      expect(commands.status).toBe(200);
      const commandsHtml = await commands.text();
      expect(commandsHtml).not.toContain('data-doc-base="/tsone/cli"');

      const client = await fetch(`${origin}/assets/cli-docs-client.js`);
      expect(client.status).toBe(200);
    } finally {
      server.stop(true);
      rmSync(outDir, { recursive: true, force: true });
    }
  });

  it('falls back locale-agnostic doc routes to the default zh locale', async () => {
    const outDir = mkdtempSync(join(tmpdir(), 'cli-docs-server-locale-'));
    await buildCliDocs({ outDir });
    const server = await startCliDocsServer({
      hostname: '127.0.0.1',
      port: 0,
      outDir,
    });
    const origin = `http://127.0.0.1:${server.port}`;

    try {
      const response = await fetch(`${origin}/commands/`);
      expect(response.status).toBe(200);
      expect(await response.text()).toContain('tsone create');
    } finally {
      server.stop(true);
      rmSync(outDir, { recursive: true, force: true });
    }
  });

  it('serves the marker so managed output is recognized', async () => {
    const outDir = mkdtempSync(join(tmpdir(), 'cli-docs-marker-'));
    await buildCliDocs({ outDir });

    expect(
      existsSync(join(outDir, '.cli-docs-build'))
    ).toBe(true);
    expect(
      readFileSync(join(outDir, '.cli-docs-build'), 'utf8')
    ).toContain('@geektech/tsone-cli docs build output');

    rmSync(outDir, { recursive: true, force: true });
  });
});
