import {
  mkdtempSync,
  rmSync,
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
});
