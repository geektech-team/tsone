import {
  mkdtempSync,
  existsSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'bun:test';
import {
  buildDocs,
  resolveDocsServerOptions,
  startDocsServer,
} from '../scripts/docs';
import { packageRoot } from './paths';

let server: ReturnType<typeof Bun.serve> | undefined;

function getAvailablePort(): number {
  const probe = Bun.serve({
    port: 0,
    fetch: () => new Response('ok'),
  });
  const port = probe.port;
  probe.stop(true);
  return port;
}

afterEach(() => {
  server?.stop(true);
  server = undefined;
});

describe('TSone docs preview server', () => {
  it('resolves host, port, base path, and output directory from args', () => {
    expect(
      resolveDocsServerOptions([
        'bun',
        'scripts/docs.ts',
        '--host',
        '127.0.0.1',
        '--port',
        '51234',
        '--out-dir',
        '/tmp/docs',
        '--base',
        '/tsone/',
      ])
    ).toEqual({
      hostname: '127.0.0.1',
      port: 51234,
      outDir: '/tmp/docs',
      basePath: '/tsone/',
    });

    expect(
      resolveDocsServerOptions(
        ['bun', 'scripts/docs.ts'],
        { DOCS_BASE_PATH: '/tsone' },
      )
    ).toEqual({
      hostname: '127.0.0.1',
      port: 5173,
      outDir: join(packageRoot, 'docs/dist'),
      basePath: '/tsone',
    });
  });

  it('builds before validating server port arguments', async () => {
    const outDir = mkdtempSync(join(tmpdir(), 'tsone-docs-build-'));

    try {
      const proc = Bun.spawn({
        cmd: ['bun', 'scripts/docs.ts', '--build', '--port', 'invalid'],
        cwd: packageRoot,
        env: {
          ...process.env,
          DOCS_OUT_DIR: outDir,
        },
        stdout: 'pipe',
        stderr: 'pipe',
      });
      const exitCode = await proc.exited;
      const stderr = proc.stderr ? await new Response(proc.stderr).text() : '';

      expect(exitCode).toBe(0);
      expect(stderr).not.toContain('Invalid docs server port');
      expect(existsSync(join(outDir, 'index.html'))).toBe(true);
    } finally {
      rmSync(outDir, { recursive: true, force: true });
    }
  });

  it('serves prebuilt static docs output', async () => {
    const outDir = mkdtempSync(join(tmpdir(), 'tsone-docs-server-'));
    writeFileSync(join(outDir, 'index.html'), '<h1>Docs Home</h1>');
    writeFileSync(join(outDir, 'asset.txt'), 'asset');
    const port = getAvailablePort();

    try {
      server = await startDocsServer({
        hostname: '127.0.0.1',
        port,
        outDir,
      });

      const home = await fetch(`http://127.0.0.1:${port}/`);
      expect(home.ok).toBe(true);
      expect(await home.text()).toContain('Docs Home');

      const asset = await fetch(`http://127.0.0.1:${port}/asset.txt`);
      expect(asset.ok).toBe(true);
      expect(asset.headers.get('content-type')).toContain('text/plain');
      expect(await asset.text()).toBe('asset');
    } finally {
      rmSync(outDir, { recursive: true, force: true });
    }
  });

  it('serves English documentation routes from the localized build', async () => {
    const outDir = mkdtempSync(join(tmpdir(), 'tsone-docs-server-'));
    const port = getAvailablePort();

    try {
      await buildDocs({ outDir });
      server = await startDocsServer({
        hostname: '127.0.0.1',
        port,
        outDir,
      });

      const home = await fetch(`http://127.0.0.1:${port}/en/`);
      expect(home.status).toBe(200);
      expect(await home.text()).toContain('<title>TSone - TSone Docs</title>');

      const gettingStarted = await fetch(
        `http://127.0.0.1:${port}/en/guide/getting-started/`
      );
      expect(gettingStarted.status).toBe(200);
      expect(await gettingStarted.text()).toContain(
        '<title>Getting Started - TSone Docs</title>'
      );
    } finally {
      rmSync(outDir, { recursive: true, force: true });
    }
  });

  it('serves documentation routes under a configured base path', async () => {
    const outDir = mkdtempSync(join(tmpdir(), 'tsone-docs-server-'));
    const port = getAvailablePort();

    try {
      await buildDocs({ outDir, basePath: '/tsone' });
      server = await startDocsServer({
        hostname: '127.0.0.1',
        port,
        outDir,
        basePath: '/tsone',
      });

      const home = await fetch(`http://127.0.0.1:${port}/tsone/`);
      expect(home.status).toBe(200);
      expect(await home.text()).toContain('data-doc-base="/tsone"');

      const gettingStarted = await fetch(
        `http://127.0.0.1:${port}/tsone/guide/getting-started/`
      );
      expect(gettingStarted.status).toBe(200);

      const clientAsset = await fetch(
        `http://127.0.0.1:${port}/tsone/assets/docs-client.js`
      );
      expect(clientAsset.status).toBe(200);
    } finally {
      rmSync(outDir, { recursive: true, force: true });
    }
  });

  it('rebuilds when the built output uses a different base path', async () => {
    const outDir = mkdtempSync(join(tmpdir(), 'tsone-docs-server-'));
    const port = getAvailablePort();

    try {
      // 用带前缀的 base 构建产物，然后不带 base 启动 serve：
      // 残留的 /tsone 前缀会让 dev 根路径下的客户端脚本 404，必须自动重建。
      await buildDocs({ outDir, basePath: '/tsone' });
      server = await startDocsServer({
        hostname: '127.0.0.1',
        port,
        outDir,
      });

      const home = await fetch(`http://127.0.0.1:${port}/en/`);
      expect(home.status).toBe(200);
      const homeHtml = await home.text();
      expect(homeHtml).not.toContain('data-doc-base="/tsone"');
      expect(homeHtml).toContain('src="/assets/docs-client.js"');

      const clientAsset = await fetch(
        `http://127.0.0.1:${port}/assets/docs-client.js`
      );
      expect(clientAsset.status).toBe(200);
    } finally {
      rmSync(outDir, { recursive: true, force: true });
    }
  });

  it('rejects symlink escapes outside the output directory', async () => {
    const outDir = mkdtempSync(join(tmpdir(), 'tsone-docs-server-'));
    const secretDir = mkdtempSync(join(tmpdir(), 'tsone-docs-secret-'));
    const secretPath = join(secretDir, 'secret.txt');
    const linkedPath = join(outDir, 'secret.txt');
    writeFileSync(join(outDir, 'index.html'), '<h1>Docs Home</h1>');
    writeFileSync(secretPath, 'top secret');
    symlinkSync(secretPath, linkedPath);
    const port = getAvailablePort();

    try {
      server = await startDocsServer({
        hostname: '127.0.0.1',
        port,
        outDir,
      });

      const response = await fetch(`http://127.0.0.1:${port}/secret.txt`);
      expect(response.status).toBe(404);
      expect(await response.text()).not.toContain('top secret');
    } finally {
      rmSync(outDir, { recursive: true, force: true });
      rmSync(secretDir, { recursive: true, force: true });
    }
  });
});
