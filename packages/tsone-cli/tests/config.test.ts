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
      build: {
        outDir: join(root, 'dist', 'build', 'h5'),
        basePath: '',
        directoryPages: false,
      },
    });
  });

  it('normalizes build.basePath and applies build.directoryPages', async () => {
    const root = makeRoot();
    const result = await resolveConfig({
      root,
      config: {
        build: { basePath: 'tsone/one/', directoryPages: true },
      },
    });
    expect(result.build.basePath).toBe('/tsone/one');
    expect(result.build.directoryPages).toBe(true);
  });

  it('rejects invalid build.basePath and build.directoryPages', async () => {
    const root = makeRoot();
    await expect(
      resolveConfig({
        root,
        config: { build: { basePath: 1 } } as unknown as UserConfig,
      })
    ).rejects.toThrow('Config build.basePath must be a string');
    await expect(
      resolveConfig({
        root,
        config: {
          build: { directoryPages: 'yes' },
        } as unknown as UserConfig,
      })
    ).rejects.toThrow('Config build.directoryPages must be a boolean');
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

  it('rejects a disk config with a null default export', async () => {
    const root = makeRoot();
    writeFileSync(join(root, 'tsone.config.ts'), 'export default null;');

    await expect(resolveConfig({ root })).rejects.toThrow(
      'Config must be an object'
    );
  });

  it('rejects a disk config with an undefined default export', async () => {
    const root = makeRoot();
    writeFileSync(join(root, 'tsone.config.ts'), 'export default undefined;');

    await expect(resolveConfig({ root })).rejects.toThrow(
      'Config must be an object'
    );
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

  it('overrides build.basePath from the base option', async () => {
    const root = makeRoot();
    const result = await resolveConfig({ root, base: '/tsone/one/' });
    expect(result.build.basePath).toBe('/tsone/one');
  });

  it('resolves library config with defaults', async () => {
    const root = makeRoot();
    const result = await resolveConfig({
      root,
      config: {
        library: { entry: 'lib/index.ts', external: ['@geektech/tsone'] },
      },
    });
    expect(result.library).toEqual({
      entry: join(root, 'lib/index.ts'),
      outDir: join(root, 'dist'),
      external: ['@geektech/tsone'],
      tsconfigs: [join(root, 'tsconfig.build.json')],
      dts: true,
      splitting: true,
      sourcemap: true,
      minify: undefined,
    });
  });

  it('rejects invalid library config', async () => {
    const root = makeRoot();
    await expect(
      resolveConfig({
        root,
        config: { library: { entry: 1 } } as unknown as UserConfig,
      })
    ).rejects.toThrow('Config library.entry must be a string');
    await expect(
      resolveConfig({
        root,
        config: { library: { external: 'x' } } as unknown as UserConfig,
      })
    ).rejects.toThrow('Config library.external must be an array of strings');
    await expect(
      resolveConfig({
        root,
        config: { library: { dts: 'yes' } } as unknown as UserConfig,
      })
    ).rejects.toThrow('Config library.dts must be a boolean');
  });

  it('defineConfig preserves its input', () => {
    expect(defineConfig({ server: { port: 4000 } })).toEqual({
      server: { port: 4000 },
    });
  });

  it('resolves mp config with defaults', async () => {
    const root = makeRoot();
    expect((await resolveConfig({ root })).mp).toBeUndefined();

    const withMp = await resolveConfig({
      root,
      config: { mp: { appId: 'wx123' } },
    });
    expect(withMp.mp).toEqual({
      appId: 'wx123',
      outDir: join(root, 'dist', 'build', 'mp-wx'),
      navigationBarTitleText: 'TSone',
      pages: { '/': join(root, 'src/main.ts') },
      lengthUnit: 'px',
      publicDir: join(root, 'public'),
    });
  });

  it('mp outDir is overridden by --out-dir and mp.pages by pages', async () => {
    const root = makeRoot();
    writeFileSync(join(root, 'src/second.ts'), 'export const app = {};');
    const result = await resolveConfig({
      root,
      outDir: 'custom-mp',
      config: {
        mp: { pages: { '/': 'src/main.ts', '/second': 'src/second.ts' } },
      },
    });
    expect(result.mp?.outDir).toBe(join(root, 'custom-mp'));
    expect(result.mp?.pages).toEqual({
      '/': join(root, 'src/main.ts'),
      '/second': join(root, 'src/second.ts'),
    });
  });

  it('rejects invalid mp config', async () => {
    const root = makeRoot();
    await expect(
      resolveConfig({
        root,
        config: { mp: { appId: 1 } } as unknown as UserConfig,
      })
    ).rejects.toThrow('Config mp.appId must be a string');
    await expect(
      resolveConfig({
        root,
        config: { mp: { outDir: 1 } } as unknown as UserConfig,
      })
    ).rejects.toThrow('Config mp.outDir must be a string');
    await expect(
      resolveConfig({
        root,
        config: { mp: { pages: 'x' } } as unknown as UserConfig,
      })
    ).rejects.toThrow('Config mp.pages must be an object');
  });
});
