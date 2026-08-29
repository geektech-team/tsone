import { execFileSync } from 'node:child_process';
import { createHash, randomUUID } from 'node:crypto';
import {
  closeSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  openSync,
  readFileSync,
  readdirSync,
  realpathSync,
  rmSync,
  statSync,
  symlinkSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { join, resolve, sep } from 'node:path';
import { pathToFileURL } from 'node:url';
import { describe, expect, it } from 'bun:test';

const repoRoot = resolve(import.meta.dir, '..', '..', '..');
const cliRoot = resolve(import.meta.dir, '..');
const frameworkRoot = resolve(cliRoot, '..', 'tsone');
const require = createRequire(import.meta.url);
const tscBin = require.resolve('typescript/bin/tsc');
const buildLockPath = join(
  tmpdir(),
  `tsone-package-build-${createHash('sha256')
    .update(realpathSync(repoRoot))
    .digest('hex')
    .slice(0, 16)}.lock`
);
const BUILD_LOCK_TIMEOUT_MS = 30_000;
const BUILD_LOCK_POLL_MS = 50;
const INVALID_LOCK_STALE_MS = 5_000;
type DevProcess = Bun.Subprocess<'ignore', 'pipe', 'inherit'>;

interface BuildLock {
  release: () => void;
}

interface BuildLockOptions {
  timeoutMs?: number;
  pollMs?: number;
  invalidOwnerStaleMs?: number;
}

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
      timeout: 30_000,
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

async function buildAndPackPackages(
  frameworkPackDirectory: string,
  cliPackDirectory: string,
  env: Record<string, string | undefined>
): Promise<{ frameworkTarball: string; cliTarball: string }> {
  const lock = await acquireBuildLock(buildLockPath);

  try {
    run('bun', ['run', 'build'], frameworkRoot, env);
    run('bun', ['run', 'build'], cliRoot, env);

    return {
      frameworkTarball: pack(frameworkRoot, frameworkPackDirectory, env),
      cliTarball: pack(cliRoot, cliPackDirectory, env),
    };
  } finally {
    lock.release();
  }
}

async function acquireBuildLock(
  lockPath: string,
  options: BuildLockOptions = {}
): Promise<BuildLock> {
  const timeoutMs = options.timeoutMs ?? BUILD_LOCK_TIMEOUT_MS;
  const pollMs = options.pollMs ?? BUILD_LOCK_POLL_MS;
  const invalidOwnerStaleMs =
    options.invalidOwnerStaleMs ?? INVALID_LOCK_STALE_MS;
  const deadline = Date.now() + timeoutMs;
  const token = `${process.pid}:${Date.now()}:${randomUUID()}`;

  while (Date.now() <= deadline) {
    const lock = tryCreateBuildLock(lockPath, token);
    if (lock) {
      return lock;
    }

    const owner = readLockOwner(lockPath);
    if (
      owner !== undefined &&
      isStaleLock(lockPath, owner, invalidOwnerStaleMs)
    ) {
      removeObservedLock(lockPath, owner);
      continue;
    }

    const remainingMs = deadline - Date.now();
    if (remainingMs <= 0) {
      break;
    }

    await delay(Math.min(pollMs, remainingMs));
  }

  throw new Error(`Timed out waiting for package build lock: ${lockPath}`);
}

function tryCreateBuildLock(
  lockPath: string,
  token: string
): BuildLock | undefined {
  let descriptor: number;

  try {
    descriptor = openSync(lockPath, 'wx', 0o600);
  } catch (error: unknown) {
    if (hasErrorCode(error, 'EEXIST')) {
      return undefined;
    }
    throw error;
  }

  try {
    writeFileSync(descriptor, token);
  } catch (error: unknown) {
    try {
      unlinkSync(lockPath);
    } catch (cleanupError: unknown) {
      if (!hasErrorCode(cleanupError, 'ENOENT')) {
        throw cleanupError;
      }
    }
    throw error;
  } finally {
    closeSync(descriptor);
  }

  let released = false;
  return {
    release: () => {
      if (released) {
        return;
      }
      released = true;

      const currentOwner = readLockOwner(lockPath);
      if (currentOwner === token) {
        unlinkSync(lockPath);
      }
    },
  };
}

function readLockOwner(lockPath: string): string | undefined {
  try {
    return readFileSync(lockPath, 'utf8');
  } catch (error: unknown) {
    if (hasErrorCode(error, 'ENOENT')) {
      return undefined;
    }
    throw error;
  }
}

function isStaleLock(
  lockPath: string,
  owner: string,
  invalidOwnerStaleMs: number
): boolean {
  const ownerPid = Number(owner.split(':', 1)[0]);
  if (Number.isSafeInteger(ownerPid) && ownerPid > 0) {
    try {
      process.kill(ownerPid, 0);
      return false;
    } catch (error: unknown) {
      return hasErrorCode(error, 'ESRCH');
    }
  }

  try {
    return Date.now() - statSync(lockPath).mtimeMs >= invalidOwnerStaleMs;
  } catch (error: unknown) {
    if (hasErrorCode(error, 'ENOENT')) {
      return false;
    }
    throw error;
  }
}

function removeObservedLock(lockPath: string, observedOwner: string): void {
  if (readLockOwner(lockPath) !== observedOwner) {
    return;
  }

  try {
    unlinkSync(lockPath);
  } catch (error: unknown) {
    if (!hasErrorCode(error, 'ENOENT')) {
      throw error;
    }
  }
}

function delay(milliseconds: number): Promise<void> {
  return new Promise((resolveDelay) => {
    setTimeout(resolveDelay, milliseconds);
  });
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
  const matches = new Set<string>();
  const visited = new Set<string>();
  const directories = [root];

  while (directories.length > 0) {
    const directory = directories.pop();
    if (!directory) {
      continue;
    }

    const canonicalDirectory = realpathSync(directory);
    if (visited.has(canonicalDirectory)) {
      continue;
    }
    visited.add(canonicalDirectory);

    for (const entry of readdirSync(canonicalDirectory, {
      withFileTypes: true,
    })) {
      if (!entry.isDirectory() && !entry.isSymbolicLink()) {
        continue;
      }
      const path = realpathSync(join(canonicalDirectory, entry.name));
      if (!statSync(path).isDirectory()) {
        continue;
      }
      if (
        entry.name === packageName &&
        existsSync(join(path, 'package.json'))
      ) {
        matches.add(path);
      }
      directories.push(path);
    }
  }

  return [...matches];
}

function hasErrorCode(error: unknown, code: string): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === code
  );
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

  let forceKillTimer: ReturnType<typeof setTimeout> | undefined;
  try {
    process.kill();
    const stopped = await Promise.race([
      process.exited.then(() => true),
      new Promise<false>((resolveTimeout) => {
        forceKillTimer = setTimeout(() => resolveTimeout(false), 3_000);
      }),
    ]);
    if (!stopped && process.exitCode === null) {
      process.kill(9);
      await process.exited;
    }
  } finally {
    if (forceKillTimer) {
      clearTimeout(forceKillTimer);
    }
  }
}

describe('package build lock', () => {
  it('recovers a lock owned by a dead process and releases it', async () => {
    const root = mkdtempSync(join(tmpdir(), 'tsone-build-lock-'));
    const lockPath = join(root, 'build.lock');

    try {
      writeFileSync(lockPath, '2147483647:stale');
      const lock = await acquireBuildLock(lockPath, {
        timeoutMs: 200,
        pollMs: 5,
      });

      expect(readFileSync(lockPath, 'utf8')).toStartWith(`${process.pid}:`);
      lock.release();
      expect(existsSync(lockPath)).toBe(false);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('waits only to a bounded deadline while a live owner holds it', async () => {
    const root = mkdtempSync(join(tmpdir(), 'tsone-build-lock-'));
    const lockPath = join(root, 'build.lock');
    const lock = await acquireBuildLock(lockPath);

    try {
      await expect(
        acquireBuildLock(lockPath, { timeoutMs: 30, pollMs: 5 })
      ).rejects.toThrow('Timed out waiting for package build lock');
    } finally {
      lock.release();
      rmSync(root, { recursive: true, force: true });
    }
  });
});

describe('installed package inspection', () => {
  it('finds packages behind symlinks without following directory cycles', () => {
    const root = mkdtempSync(join(tmpdir(), 'tsone-package-inspection-'));
    const nodeModules = join(root, 'node_modules');
    const packageRoot = join(root, 'store', 'happy-dom');

    try {
      mkdirSync(nodeModules, { recursive: true });
      mkdirSync(packageRoot, { recursive: true });
      writeFileSync(
        join(packageRoot, 'package.json'),
        JSON.stringify({ name: 'happy-dom' })
      );
      symlinkSync(packageRoot, join(nodeModules, 'happy-dom'), 'dir');
      symlinkSync(nodeModules, join(packageRoot, 'cycle'), 'dir');

      expect(findInstalledPackage(nodeModules, 'happy-dom')).toEqual([
        realpathSync(packageRoot),
      ]);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});

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
      const { frameworkTarball, cliTarball } = await buildAndPackPackages(
        frameworkPackDirectory,
        cliPackDirectory,
        env
      );
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
      const extractedPackageRoot = join(extractedCliDirectory, 'package');
      const extractedManifest = JSON.parse(
        readFileSync(join(extractedPackageRoot, 'package.json'), 'utf8')
      ) as { bin?: Record<string, string> };
      const binTarget = extractedManifest.bin?.tsone;
      expect(binTarget).toBeTruthy();
      if (!binTarget) {
        throw new Error('Packed CLI manifest does not declare the tsone bin');
      }
      expect(
        statSync(resolve(extractedPackageRoot, binTarget)).mode & 0o111
      ).not.toBe(0);
      expect(
        statSync(join(extractedPackageRoot, 'dist', 'cli.js')).mode & 0o111
      ).not.toBe(0);

      writeFileSync(
        join(consumerRoot, 'package.json'),
        JSON.stringify(
          {
            private: true,
            type: 'module',
            dependencies: {
              '@geektech/tsone': pathToFileURL(frameworkTarball).href,
              '@geektech/tsone-cli': pathToFileURL(cliTarball).href,
            },
            overrides: {
              '@geektech/tsone': pathToFileURL(frameworkTarball).href,
            },
          },
          null,
          2
        )
      );
      run(
        'bun',
        ['install', '--offline', '--production', '--ignore-scripts'],
        consumerRoot,
        env
      );

      const consumerManifest = JSON.parse(
        readFileSync(join(consumerRoot, 'package.json'), 'utf8')
      ) as {
        dependencies?: Record<string, string>;
        overrides?: Record<string, string>;
      };
      expect(consumerManifest.dependencies).toEqual({
        '@geektech/tsone': pathToFileURL(frameworkTarball).href,
        '@geektech/tsone-cli': pathToFileURL(cliTarball).href,
      });
      expect(consumerManifest.overrides).toEqual({
        '@geektech/tsone': pathToFileURL(frameworkTarball).href,
      });
      const consumerNodeModules = realpathSync(
        join(consumerRoot, 'node_modules')
      );
      const installedFrameworkRoot = realpathSync(
        join(consumerNodeModules, '@geektech', 'tsone')
      );
      const installedCliRoot = realpathSync(
        join(consumerNodeModules, '@geektech', 'tsone-cli')
      );
      const installedFrameworkManifest = JSON.parse(
        readFileSync(join(installedFrameworkRoot, 'package.json'), 'utf8')
      ) as { version?: string };
      const installedCliManifest = JSON.parse(
        readFileSync(join(installedCliRoot, 'package.json'), 'utf8')
      ) as { version?: string };
      expect(installedFrameworkRoot).toStartWith(
        `${consumerNodeModules}${sep}`
      );
      expect(installedCliRoot).toStartWith(`${consumerNodeModules}${sep}`);
      expect(installedFrameworkManifest.version).toBe('0.0.2');
      expect(installedCliManifest.version).toBe('0.0.1');

      expect(
        findInstalledPackage(join(consumerRoot, 'node_modules'), 'happy-dom')
      ).toEqual([]);
      const consumerRequire = createRequire(join(consumerRoot, 'package.json'));
      let resolveError: unknown;
      try {
        consumerRequire.resolve('happy-dom/package.json');
      } catch (error: unknown) {
        resolveError = error;
      }
      expect(hasErrorCode(resolveError, 'MODULE_NOT_FOUND')).toBe(true);

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
        fetch(new URL('/', url), { signal: AbortSignal.timeout(5_000) }),
        fetch(new URL('/bundle.js', url), {
          signal: AbortSignal.timeout(5_000),
        }),
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
