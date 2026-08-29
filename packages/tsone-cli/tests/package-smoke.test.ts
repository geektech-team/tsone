import { execFileSync } from 'node:child_process';
import {
  copyFileSync,
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  realpathSync,
  rmSync,
  statSync,
  symlinkSync,
  type Dirent,
  writeFileSync,
} from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { join, relative, resolve, sep } from 'node:path';
import { pathToFileURL } from 'node:url';
import { describe, expect, it } from 'bun:test';

const repoRoot = resolve(import.meta.dir, '..', '..', '..');
const cliRoot = resolve(import.meta.dir, '..');
const frameworkRoot = resolve(cliRoot, '..', 'tsone');
const require = createRequire(import.meta.url);
const tscBin = require.resolve('typescript/bin/tsc');
const COPY_EXCLUDED_SEGMENTS = new Set([
  '.git',
  '.DS_Store',
  'coverage',
  'dist',
  'node_modules',
]);
type DevProcess = Bun.Subprocess<'ignore', 'pipe', 'inherit'>;

interface PackedPackages {
  workspaceRoot: string;
  frameworkPackageRoot: string;
  cliPackageRoot: string;
  frameworkTarball: string;
  cliTarball: string;
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

function buildAndPackPackages(
  tempRoot: string,
  frameworkPackDirectory: string,
  cliPackDirectory: string,
  env: Record<string, string | undefined>
): PackedPackages {
  const workspaceRoot = join(tempRoot, 'workspace');
  const frameworkPackageRoot = join(workspaceRoot, 'packages', 'tsone');
  const cliPackageRoot = join(workspaceRoot, 'packages', 'tsone-cli');

  createIsolatedWorkspace(workspaceRoot, frameworkPackageRoot, cliPackageRoot);
  if (
    existsSync(join(frameworkPackageRoot, 'dist')) ||
    existsSync(join(cliPackageRoot, 'dist'))
  ) {
    throw new Error('Isolated package copies must not include source dist');
  }

  run('bun', ['run', 'build'], frameworkPackageRoot, env);
  run('bun', ['run', 'build'], cliPackageRoot, env);

  return {
    workspaceRoot,
    frameworkPackageRoot,
    cliPackageRoot,
    frameworkTarball: pack(frameworkPackageRoot, frameworkPackDirectory, env),
    cliTarball: pack(cliPackageRoot, cliPackDirectory, env),
  };
}

function createIsolatedWorkspace(
  workspaceRoot: string,
  frameworkPackageRoot: string,
  cliPackageRoot: string
): void {
  mkdirSync(join(workspaceRoot, 'packages'), { recursive: true });
  copyPackage(frameworkRoot, frameworkPackageRoot);
  copyPackage(cliRoot, cliPackageRoot);
  copyFileSync(
    join(repoRoot, 'tsconfig.json'),
    join(workspaceRoot, 'tsconfig.json')
  );
  copyFileSync(join(repoRoot, 'bun.lock'), join(workspaceRoot, 'bun.lock'));
  writeFileSync(
    join(workspaceRoot, 'package.json'),
    JSON.stringify(
      {
        name: 'tsone-package-smoke-workspace',
        private: true,
        type: 'module',
        workspaces: ['packages/*'],
      },
      null,
      2
    )
  );

  symlinkSync(
    join(repoRoot, 'node_modules'),
    join(workspaceRoot, 'node_modules'),
    'dir'
  );
  const cliNodeModules = join(cliPackageRoot, 'node_modules');
  mkdirSync(join(cliNodeModules, '@geektech'), { recursive: true });
  symlinkSync(
    frameworkPackageRoot,
    join(cliNodeModules, '@geektech', 'tsone'),
    'dir'
  );
  symlinkSync(
    realpathSync(join(repoRoot, 'node_modules', 'happy-dom')),
    join(cliNodeModules, 'happy-dom'),
    'dir'
  );
}

function copyPackage(sourceRoot: string, destinationRoot: string): void {
  cpSync(sourceRoot, destinationRoot, {
    recursive: true,
    preserveTimestamps: true,
    filter: (sourcePath) => {
      const path = relative(sourceRoot, sourcePath);
      return (
        path === '' ||
        !path.split(sep).some((segment) => COPY_EXCLUDED_SEGMENTS.has(segment))
      );
    },
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

    const canonicalDirectory = resolveDirectory(directory);
    if (!canonicalDirectory) {
      continue;
    }
    if (visited.has(canonicalDirectory)) {
      continue;
    }
    visited.add(canonicalDirectory);

    let entries: Dirent[];
    try {
      entries = readdirSync(canonicalDirectory, { withFileTypes: true });
    } catch (error: unknown) {
      if (hasErrorCode(error, 'ENOENT') || hasErrorCode(error, 'ELOOP')) {
        continue;
      }
      throw error;
    }

    for (const entry of entries) {
      if (!entry.isDirectory() && !entry.isSymbolicLink()) {
        continue;
      }
      const path = resolveDirectory(join(canonicalDirectory, entry.name));
      if (!path) {
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

function resolveDirectory(path: string): string | undefined {
  try {
    const canonicalPath = realpathSync(path);
    return statSync(canonicalPath).isDirectory() ? canonicalPath : undefined;
  } catch (error: unknown) {
    if (hasErrorCode(error, 'ENOENT') || hasErrorCode(error, 'ELOOP')) {
      return undefined;
    }
    throw error;
  }
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

describe('installed package inspection', () => {
  it('finds symlinked packages while skipping cycles and broken links', () => {
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
      symlinkSync(
        join(root, 'missing-package'),
        join(nodeModules, 'dangling'),
        'dir'
      );

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
      const {
        workspaceRoot,
        frameworkPackageRoot,
        cliPackageRoot,
        frameworkTarball,
        cliTarball,
      } = buildAndPackPackages(
        tempRoot,
        frameworkPackDirectory,
        cliPackDirectory,
        env
      );
      const cliFiles = listTarball(cliTarball, env);

      const canonicalWorkspaceRoot = realpathSync(workspaceRoot);
      expect(realpathSync(frameworkPackageRoot)).toStartWith(
        `${canonicalWorkspaceRoot}${sep}`
      );
      expect(realpathSync(cliPackageRoot)).toStartWith(
        `${canonicalWorkspaceRoot}${sep}`
      );
      expect(realpathSync(cliPackageRoot)).not.toBe(realpathSync(cliRoot));
      expect(realpathSync(join(cliPackageRoot, 'dist'))).toStartWith(
        `${canonicalWorkspaceRoot}${sep}`
      );
      if (existsSync(join(cliRoot, 'dist'))) {
        expect(realpathSync(join(cliPackageRoot, 'dist'))).not.toBe(
          realpathSync(join(cliRoot, 'dist'))
        );
      }
      expect(realpathSync(frameworkTarball)).toStartWith(
        `${realpathSync(tempRoot)}${sep}`
      );
      expect(realpathSync(cliTarball)).toStartWith(
        `${realpathSync(tempRoot)}${sep}`
      );

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
      expect(
        statSync(join(cliPackageRoot, 'dist', 'cli.js')).mode & 0o111
      ).not.toBe(0);

      run(
        'tar',
        ['-xzf', cliTarball, '--directory', extractedCliDirectory],
        repoRoot,
        env
      );
      const extractedPackageRoot = join(extractedCliDirectory, 'package');
      const extractedManifest = JSON.parse(
        readFileSync(join(extractedPackageRoot, 'package.json'), 'utf8')
      ) as {
        bin?: Record<string, string>;
        dependencies?: Record<string, string>;
      };
      expect(extractedManifest.dependencies).toEqual({
        '@geektech/tsone': '0.0.2',
      });
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
