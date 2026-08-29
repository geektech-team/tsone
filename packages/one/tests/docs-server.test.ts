import {
  existsSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
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

      const nul = await fetch(`${origin}/asset%00.js`);
      expect(nul.status).toBe(404);

      const doubleEncodedTraversal = await fetch(
        `${origin}/%252e%252e%252fpackage.json`
      );
      expect(doubleEncodedTraversal.status).toBe(404);
    } finally {
      server.stop(true);
      rmSync(outDir, { recursive: true, force: true });
    }
  });

  it('rejects symlink escapes outside the output directory', async () => {
    const outDir = mkdtempSync(join(tmpdir(), 'one-docs-server-'));
    const secretDir = mkdtempSync(join(tmpdir(), 'one-docs-secret-'));
    const secretPath = join(secretDir, 'secret.txt');
    writeFileSync(join(outDir, 'index.html'), '<h1>Docs Home</h1>');
    writeFileSync(secretPath, 'top secret');
    symlinkSync(secretPath, join(outDir, 'secret.txt'));
    const server = await startOneDocsServer({
      hostname: '127.0.0.1',
      port: 0,
      outDir,
    });

    try {
      const response = await fetch(
        `http://127.0.0.1:${server.port}/secret.txt`
      );
      expect(response.status).toBe(404);
      expect(await response.text()).not.toContain('top secret');
    } finally {
      server.stop(true);
      rmSync(outDir, { recursive: true, force: true });
      rmSync(secretDir, { recursive: true, force: true });
    }
  });

  it('refuses an unsafe automatic build without deleting external data', async () => {
    const outDir = mkdtempSync(join(tmpdir(), 'one-docs-server-unsafe-'));
    const sentinel = join(outDir, 'KEEP_ME');
    writeFileSync(sentinel, 'external data');

    try {
      await expect(
        startOneDocsServer({
          hostname: '127.0.0.1',
          port: 0,
          outDir,
        })
      ).rejects.toThrow('Unsafe One UI docs output directory');
      expect(readFileSync(sentinel, 'utf8')).toBe('external data');
      expect(existsSync(join(outDir, 'index.html'))).toBe(false);
    } finally {
      rmSync(outDir, { recursive: true, force: true });
    }
  });
});
