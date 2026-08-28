import { execFileSync } from 'node:child_process';
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'bun:test';

const repoRoot = resolve(import.meta.dir, '..', '..', '..');
const cliRoot = resolve(import.meta.dir, '..');
const frameworkRoot = resolve(cliRoot, '..', 'tsone');
const require = createRequire(import.meta.url);
const tscBin = require.resolve('typescript/bin/tsc');
type DevProcess = Bun.Subprocess<'ignore', 'pipe', 'inherit'>;

function run(
  command: string,
  args: string[],
  cwd: string,
  env: Record<string, string | undefined>
): string {
  try {
    return execFileSync(command, args, {
      cwd,
      env: { ...process.env, ...env },
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
  } catch (error: unknown) {
    const output = error as {
      stdout?: Buffer | string;
      stderr?: Buffer | string;
      message?: string;
    };
    throw new Error(
      [output.message, output.stdout?.toString(), output.stderr?.toString()]
        .filter(Boolean)
        .join('\n')
    );
  }
}

function pack(
  packageRoot: string,
  destination: string,
  env: Record<string, string | undefined>
): string {
  mkdirSync(destination, { recursive: true });
  run(
    'bun',
    ['pm', 'pack', '--destination', destination, '--ignore-scripts', '--quiet'],
    packageRoot,
    env
  );
  const tarball = readdirSync(destination).find((file) =>
    file.endsWith('.tgz')
  );
  if (!tarball) {
    throw new Error(`Bun did not create a tarball in ${destination}`);
  }

  return join(destination, tarball);
}

function listTarball(
  tarball: string,
  env: Record<string, string | undefined>
): string[] {
  return run('tar', ['-tzf', tarball], repoRoot, env)
    .split('\n')
    .filter(Boolean)
    .map((file) => file.replace(/^package\//, ''));
}

function findInstalledPackage(root: string, packageName: string): string[] {
  const matches: string[] = [];
  const directories = [root];

  while (directories.length > 0) {
    const directory = directories.pop();
    if (!directory) {
      continue;
    }

    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      if (!entry.isDirectory()) {
        continue;
      }
      const path = join(directory, entry.name);
      if (
        entry.name === packageName &&
        existsSync(join(path, 'package.json'))
      ) {
        matches.push(path);
      }
      directories.push(path);
    }
  }

  return matches;
}

async function waitForServerUrl(process: DevProcess): Promise<string> {
  return new Promise((resolveUrl, rejectUrl) => {
    const reader = process.stdout.getReader();
    const decoder = new TextDecoder();
    let output = '';
    const timer = setTimeout(() => {
      rejectUrl(new Error(`Timed out waiting for dev URL:\n${output}`));
    }, 10_000);

    void (async () => {
      try {
        let serverUrl: string | undefined;
        while (!serverUrl) {
          const { done, value } = await reader.read();
          if (done) {
            throw new Error(
              `Dev server exited without printing a URL:\n${output}`
            );
          }

          output += decoder.decode(value, { stream: true });
          const match = output.match(/http:\/\/[^\s]+/);
          if (match) {
            serverUrl = match[0];
          }
        }
        clearTimeout(timer);
        reader.releaseLock();
        resolveUrl(serverUrl);
      } catch (error: unknown) {
        clearTimeout(timer);
        rejectUrl(error);
      }
    })();
  });
}

async function stopProcess(process: DevProcess): Promise<void> {
  if (process.exitCode !== null) {
    return;
  }

  process.kill();
  const stopped = await Promise.race([
    process.exited.then(() => true),
    new Promise<false>((resolveTimeout) => {
      setTimeout(() => resolveTimeout(false), 3_000);
    }),
  ]);
  if (!stopped && process.exitCode === null) {
    process.kill(9);
    await process.exited;
  }
}

describe('CLI package smoke', () => {
  it('packs and runs build and dev without installing Happy DOM', async () => {
    const tempRoot = mkdtempSync(join(tmpdir(), 'tsone-cli-package-'));
    const tempDirectory = join(tempRoot, 'tmp');
    const bunCache = join(tempRoot, 'bun-cache');
    const frameworkPackDirectory = join(tempRoot, 'framework-pack');
    const cliPackDirectory = join(tempRoot, 'cli-pack');
    const extractedCliDirectory = join(tempRoot, 'extracted-cli');
    const consumerRoot = join(tempRoot, 'consumer');
    const env = {
      TMPDIR: tempDirectory,
      BUN_INSTALL_CACHE_DIR: bunCache,
    };
    let devProcess: DevProcess | undefined;

    mkdirSync(tempDirectory, { recursive: true });
    mkdirSync(bunCache, { recursive: true });
    mkdirSync(extractedCliDirectory, { recursive: true });
    mkdirSync(join(consumerRoot, 'src'), { recursive: true });

    try {
      run('bun', ['run', 'build'], frameworkRoot, env);
      run('bun', ['run', 'build'], cliRoot, env);

      const frameworkTarball = pack(frameworkRoot, frameworkPackDirectory, env);
      const cliTarball = pack(cliRoot, cliPackDirectory, env);
      const cliFiles = listTarball(cliTarball, env);

      expect(cliFiles).toEqual(
        expect.arrayContaining([
          'bin/tsone.ts',
          'dist/index.js',
          'dist/index.d.ts',
          'dist/cli.js',
          'README.md',
          'LICENSE',
          'package.json',
        ])
      );
      expect(statSync(join(cliRoot, 'dist', 'cli.js')).mode & 0o111).not.toBe(
        0
      );

      run(
        'tar',
        ['-xzf', cliTarball, '--directory', extractedCliDirectory],
        repoRoot,
        env
      );
      expect(
        statSync(join(extractedCliDirectory, 'package', 'dist', 'cli.js'))
          .mode & 0o111
      ).not.toBe(0);

      writeFileSync(
        join(consumerRoot, 'package.json'),
        JSON.stringify({ private: true, type: 'module' }, null, 2)
      );
      run(
        'bun',
        ['add', '--ignore-scripts', frameworkTarball, cliTarball],
        consumerRoot,
        env
      );

      expect(
        findInstalledPackage(join(consumerRoot, 'node_modules'), 'happy-dom')
      ).toEqual([]);

      writeFileSync(
        join(consumerRoot, 'tsone.config.ts'),
        [
          "import { build, defineConfig, startDevServer, type UserConfig } from '@geektech/tsone-cli';",
          '',
          'const config: UserConfig = {',
          "  entry: 'src/main.ts',",
          "  server: { host: '127.0.0.1', port: 0 },",
          "  build: { outDir: 'dist' },",
          '};',
          '',
          'void build;',
          'void startDevServer;',
          'export default defineConfig(config);',
        ].join('\n')
      );
      writeFileSync(
        join(consumerRoot, 'src', 'main.ts'),
        [
          "import { createApp } from '@geektech/tsone';",
          '',
          'export const app = createApp({',
          "  document: { title: 'Installed TSone App' },",
          '});',
        ].join('\n')
      );
      writeFileSync(
        join(consumerRoot, 'tsconfig.json'),
        JSON.stringify(
          {
            compilerOptions: {
              target: 'ES2020',
              module: 'ESNext',
              moduleResolution: 'Bundler',
              lib: ['ES2020', 'DOM'],
              strict: true,
              skipLibCheck: true,
              noEmit: true,
              types: ['bun'],
              typeRoots: [join(repoRoot, 'node_modules', '@types')],
            },
            include: ['tsone.config.ts'],
          },
          null,
          2
        )
      );

      run(
        process.execPath,
        [tscBin, '--project', 'tsconfig.json'],
        consumerRoot,
        env
      );
      run('bun', ['run', 'tsone', 'build'], consumerRoot, env);
      expect(existsSync(join(consumerRoot, 'dist', 'index.html'))).toBe(true);
      expect(existsSync(join(consumerRoot, 'dist', 'main.js'))).toBe(true);

      devProcess = Bun.spawn(
        [
          join(consumerRoot, 'node_modules', '.bin', 'tsone'),
          'dev',
          '--port',
          '0',
        ],
        {
          cwd: consumerRoot,
          env: { ...process.env, ...env },
          stdout: 'pipe',
          stderr: 'inherit',
        }
      );
      const url = await waitForServerUrl(devProcess);
      const [page, bundle] = await Promise.all([
        fetch(new URL('/', url)),
        fetch(new URL('/bundle.js', url)),
      ]);

      expect(page.status).toBe(200);
      expect(bundle.status).toBe(200);
      expect(await page.text()).toContain('Installed TSone App');
      expect(await bundle.text()).toContain('Installed TSone App');
    } finally {
      if (devProcess) {
        await stopProcess(devProcess);
      }
      rmSync(tempRoot, { recursive: true, force: true });
    }
  }, 120_000);
});
