import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'bun:test';
import { defineConfig, resolveConfig } from '../src/config';
import type { UserConfig } from '../src/types';

const roots: string[] = [];

function makeRoot(): string {
  const root = mkdtempSync(join(tmpdir(), 'tsone-cli-config-'));
  roots.push(root);
  mkdirSync(join(root, 'src'));
  writeFileSync(join(root, 'src/main.ts'), 'export const app = {};');
  return root;
}

afterEach(() =>
  roots
    .splice(0)
    .forEach((root) => rmSync(root, { recursive: true, force: true }))
);

describe('TSone CLI config', () => {
  it('resolves documented defaults', async () => {
    const root = makeRoot();
    expect(await resolveConfig({ root })).toMatchObject({
      root,
      entry: join(root, 'src/main.ts'),
      server: { host: '127.0.0.1', port: 52211, proxy: {} },
      build: { outDir: join(root, 'dist') },
    });
  });

  it('loads tsone.config.ts and applies inline overrides last', async () => {
    const root = makeRoot();
    writeFileSync(
      join(root, 'tsone.config.ts'),
      `
        export default {
          server: { host: '0.0.0.0', port: 4300 },
          build: { outDir: 'output' }
        };
      `
    );
    const result = await resolveConfig({ root, host: '127.0.0.1', port: 0 });
    expect(result.server.host).toBe('127.0.0.1');
    expect(result.server.port).toBe(0);
    expect(result.build.outDir).toBe(join(root, 'output'));
  });

  it('rejects invalid proxy keys and protocols', async () => {
    const root = makeRoot();
    await expect(
      resolveConfig({
        root,
        config: { server: { proxy: { api: 'http://localhost:3000' } } },
      })
    ).rejects.toThrow('Proxy prefix must start with "/": api');
    await expect(
      resolveConfig({
        root,
        config: { server: { proxy: { '/api': 'ftp://localhost' } } },
      })
    ).rejects.toThrow('Proxy target must use http or https');
  });

  it('rejects invalid config shapes before applying defaults', async () => {
    const root = makeRoot();
    await expect(
      resolveConfig({
        root,
        config: { server: 'invalid' } as unknown as UserConfig,
      })
    ).rejects.toThrow('Config server must be an object');
  });

  it('rejects a missing entry and invalid port', async () => {
    const root = makeRoot();
    await expect(
      resolveConfig({ root, config: { entry: 'src/missing.ts' } })
    ).rejects.toThrow(
      `Entry file does not exist: ${join(root, 'src/missing.ts')}`
    );
    await expect(
      resolveConfig({ root, config: { server: { port: 65536 } } })
    ).rejects.toThrow(
      'Config server.port must be an integer between 0 and 65535'
    );
  });

  it('defineConfig preserves its input', () => {
    expect(defineConfig({ server: { port: 4000 } })).toEqual({
      server: { port: 4000 },
    });
  });
});
