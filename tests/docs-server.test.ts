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
  resolveDocsServerOptions,
  startDocsServer,
} from '../scripts/docs';

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
  it('resolves host, port, and output directory from args', () => {
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
      ])
    ).toEqual({
      hostname: '127.0.0.1',
      port: 51234,
      outDir: '/tmp/docs',
    });
  });

  it('builds before validating server port arguments', async () => {
    const outDir = mkdtempSync(join(tmpdir(), 'tsone-docs-build-'));

    try {
      const proc = Bun.spawn({
        cmd: [
          'bun',
          'scripts/docs.ts',
          '--build',
          '--port',
          'invalid',
        ],
        cwd: process.cwd(),
        env: {
          ...process.env,
          DOCS_OUT_DIR: outDir,
        },
        stdout: 'pipe',
        stderr: 'pipe',
      });
      const exitCode = await proc.exited;
      const stderr = proc.stderr
        ? await new Response(proc.stderr).text()
        : '';

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
