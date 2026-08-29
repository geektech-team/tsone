import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'bun:test';
import { buildOneDocs, startOneDocsServer } from '../scripts/docs';

describe('One UI docs server', () => {
  it('serves built pages and assets with explicit content types', async () => {
    const outDir = mkdtempSync(join(tmpdir(), 'one-docs-server-'));
    await buildOneDocs({ outDir });
    const server = await startOneDocsServer({
      hostname: '127.0.0.1',
      port: 0,
      outDir,
    });
    const origin = `http://127.0.0.1:${server.port}`;

    try {
      const home = await fetch(`${origin}/`);
      expect(home.status).toBe(200);
      expect(home.headers.get('content-type')).toContain('text/html');
      expect(await home.text()).toContain('One UI');

      const button = await fetch(`${origin}/components/button/`);
      expect(button.status).toBe(200);
      expect(await button.text()).toContain(
        '<title>OneButton - One UI</title>'
      );

      const client = await fetch(`${origin}/assets/one-docs-client.js`);
      expect(client.status).toBe(200);
      expect(client.headers.get('content-type')).toContain('text/javascript');
      expect(await client.text()).toContain('mountOneDocsClient');

      expect((await fetch(`${origin}/missing/`)).status).toBe(404);
    } finally {
      server.stop(true);
      rmSync(outDir, { recursive: true, force: true });
    }
  });

  it('rejects encoded traversal and malformed URL paths', async () => {
    const outDir = mkdtempSync(join(tmpdir(), 'one-docs-server-'));
    await buildOneDocs({ outDir });
    const server = await startOneDocsServer({
      hostname: '127.0.0.1',
      port: 0,
      outDir,
    });
    const origin = `http://127.0.0.1:${server.port}`;

    try {
      const traversal = await fetch(`${origin}/..%2Fpackage.json`);
      expect(traversal.status).toBe(404);

      const malformed = await fetch(`${origin}/%E0%A4%A`);
      expect(malformed.status).toBe(404);
    } finally {
      server.stop(true);
      rmSync(outDir, { recursive: true, force: true });
    }
  });
});
