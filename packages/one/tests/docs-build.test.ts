import {
  existsSync,
  lstatSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  realpathSync,
  renameSync,
  rmSync,
  symlinkSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join, parse } from 'node:path';
import { afterEach, describe, expect, it } from 'bun:test';
import {
  assertSafeOneDocsOutputDirectory,
  buildOneDocs,
  routeToOneDocsOutputPath,
} from '../scripts/docs';

const temporaryDirectories: string[] = [];
const packageRoot = join(import.meta.dir, '..');
const repositoryRoot = join(packageRoot, '..', '..');

function makeTemporaryDirectory(prefix: string): string {
  const directory = mkdtempSync(join(tmpdir(), prefix));
  temporaryDirectories.push(directory);
  return directory;
}

function lstatIfExistsSync(
  path: string
): ReturnType<typeof lstatSync> | undefined {
  try {
    return lstatSync(path);
  } catch (error: unknown) {
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === 'ENOENT'
    ) {
      return undefined;
    }
    throw error;
  }
}

afterEach(() => {
  temporaryDirectories.splice(0).forEach((directory) => {
    rmSync(directory, { recursive: true, force: true });
  });
});

describe('One UI docs build', () => {
  it('maps documentation routes to directory-style HTML paths', () => {
    const outDir = '/tmp/one-docs-output';

    expect(routeToOneDocsOutputPath('/', outDir)).toBe(
      join(outDir, 'index.html')
    );
    expect(routeToOneDocsOutputPath('/components/button/', outDir)).toBe(
      join(outDir, 'components/button/index.html')
    );
  });

  it('builds all twelve pages and the interactive client asset', async () => {
    const outDir = makeTemporaryDirectory('one-docs-build-');

    const result = await buildOneDocs({ outDir });

    expect(result.pagesBuilt).toBe(12);
    expect(result.assetsBuilt).toEqual([
      join(outDir, 'assets/one-docs-client.js'),
    ]);
    expect(existsSync(join(outDir, 'index.html'))).toBe(true);
    expect(existsSync(join(outDir, 'components/button/index.html'))).toBe(true);
    expect(existsSync(join(outDir, 'assets/one-docs-client.js'))).toBe(true);

    const homeHtml = readFileSync(join(outDir, 'index.html'), 'utf8');
    const buttonHtml = readFileSync(
      join(outDir, 'components/button/index.html'),
      'utf8'
    );
    expect(homeHtml).toContain('<!doctype html>');
    expect(homeHtml).toContain('One UI');
    expect(buttonHtml).toContain('.one-button {');
    expect(buttonHtml).toContain('.one-input {');
    expect(buttonHtml).toContain('.one-card {');
    expect(buttonHtml).toContain('class="one-docs-topbar"');
    expect(buttonHtml).toContain('class="one-docs-sidebar"');
    expect(buttonHtml).toContain('class="one-docs-main"');
    expect(buttonHtml).toContain('class="one-docs-toc"');
    expect(buttonHtml).toContain('/assets/one-docs-client.js');
  });

  it('allows new and empty custom directories and marks them as One-owned', async () => {
    const parentDir = makeTemporaryDirectory('one-docs-new-output-');
    const newOutDir = join(parentDir, 'new');

    await buildOneDocs({ outDir: newOutDir });

    expect(existsSync(join(newOutDir, 'index.html'))).toBe(true);
    expect(readFileSync(join(newOutDir, '.one-docs-build'), 'utf8')).toBe(
      '@geektech/one docs build output\n'
    );

    const emptyOutDir = makeTemporaryDirectory('one-docs-empty-output-');
    await buildOneDocs({ outDir: emptyOutDir });
    expect(existsSync(join(emptyOutDir, 'index.html'))).toBe(true);
  });

  it('rebuilds a marked custom directory and removes stale owned output', async () => {
    const outDir = makeTemporaryDirectory('one-docs-owned-output-');
    await buildOneDocs({ outDir });
    const stalePath = join(outDir, 'stale.txt');
    writeFileSync(stalePath, 'stale');

    await buildOneDocs({ outDir });

    expect(existsSync(stalePath)).toBe(false);
    expect(existsSync(join(outDir, '.one-docs-build'))).toBe(true);
  });

  it('rejects the filesystem root before attempting deletion', async () => {
    await expect(
      assertSafeOneDocsOutputDirectory(parse(packageRoot).root)
    ).rejects.toThrow('Unsafe One UI docs output directory');
  });

  it('rejects the package root without deleting its sentinel', async () => {
    const sentinel = join(packageRoot, '.one-docs-package-root-sentinel');
    writeFileSync(sentinel, 'package root');

    try {
      await expect(buildOneDocs({ outDir: packageRoot })).rejects.toThrow(
        'Unsafe One UI docs output directory'
      );
      expect(readFileSync(sentinel, 'utf8')).toBe('package root');
    } finally {
      rmSync(sentinel, { force: true });
    }
  });

  it('rejects the repository root without deleting its sentinel', async () => {
    const sentinel = join(repositoryRoot, '.one-docs-repository-root-sentinel');
    writeFileSync(sentinel, 'repository root');

    try {
      await expect(buildOneDocs({ outDir: repositoryRoot })).rejects.toThrow(
        'Unsafe One UI docs output directory'
      );
      expect(readFileSync(sentinel, 'utf8')).toBe('repository root');
    } finally {
      rmSync(sentinel, { force: true });
    }
  });

  it('rejects an unmarked non-empty custom directory without deleting it', async () => {
    const outDir = makeTemporaryDirectory('one-docs-external-output-');
    const sentinel = join(outDir, 'KEEP_ME');
    writeFileSync(sentinel, 'external data');

    await expect(buildOneDocs({ outDir })).rejects.toThrow(
      'Unsafe One UI docs output directory'
    );

    expect(readFileSync(sentinel, 'utf8')).toBe('external data');
    expect(existsSync(join(outDir, 'assets'))).toBe(false);
  });

  it('does not trust a custom directory through a symlinked default output', async () => {
    const targetDir = realpathSync(
      makeTemporaryDirectory('one-docs-default-target-')
    );
    const sentinel = join(targetDir, 'KEEP_ME');
    const defaultOutDir = join(packageRoot, 'docs', 'dist');
    const originalDefaultStat = lstatIfExistsSync(defaultOutDir);
    const backupRoot = mkdtempSync(
      join(packageRoot, 'docs', '.one-docs-default-backup-')
    );
    const backupOutDir = join(backupRoot, 'dist');
    let movedDefaultOutDir = false;
    let createdDefaultSymlink = false;
    writeFileSync(sentinel, 'external data');

    try {
      if (lstatIfExistsSync(defaultOutDir)) {
        renameSync(defaultOutDir, backupOutDir);
        movedDefaultOutDir = true;
      }
      symlinkSync(targetDir, defaultOutDir, 'dir');
      createdDefaultSymlink = true;

      await expect(buildOneDocs({ outDir: targetDir })).rejects.toThrow(
        'Unsafe One UI docs output directory'
      );
      expect(readFileSync(sentinel, 'utf8')).toBe('external data');
    } finally {
      let restoredDefaultOutDir = !movedDefaultOutDir;
      try {
        const defaultStat = lstatIfExistsSync(defaultOutDir);
        if (createdDefaultSymlink && defaultStat) {
          if (!defaultStat.isSymbolicLink()) {
            throw new Error('One docs default output changed during the test');
          }
          unlinkSync(defaultOutDir);
        }
        if (movedDefaultOutDir) {
          renameSync(backupOutDir, defaultOutDir);
          restoredDefaultOutDir = true;
        }
      } finally {
        if (restoredDefaultOutDir) {
          rmSync(backupRoot, { recursive: true, force: true });
        }
      }
    }

    expect(lstatIfExistsSync(defaultOutDir)?.ino).toBe(
      originalDefaultStat?.ino
    );
  });

  it('rejects an output-directory symlink without deleting its target', async () => {
    const parentDir = makeTemporaryDirectory('one-docs-symlink-parent-');
    const targetDir = makeTemporaryDirectory('one-docs-symlink-target-');
    const sentinel = join(targetDir, 'KEEP_ME');
    const outDir = join(parentDir, 'linked-output');
    writeFileSync(sentinel, 'symlink target');
    symlinkSync(targetDir, outDir, 'dir');

    await expect(buildOneDocs({ outDir })).rejects.toThrow(
      'Unsafe One UI docs output directory'
    );

    expect(readFileSync(sentinel, 'utf8')).toBe('symlink target');
  });

  it('rejects a parent symlink escape without deleting external data', async () => {
    const parentDir = makeTemporaryDirectory('one-docs-parent-link-');
    const targetDir = makeTemporaryDirectory('one-docs-parent-target-');
    const linkedParent = join(parentDir, 'linked-parent');
    const outDir = join(linkedParent, 'docs');
    const sentinel = join(targetDir, 'docs', 'KEEP_ME');
    symlinkSync(targetDir, linkedParent, 'dir');
    mkdirSync(join(targetDir, 'docs'));
    writeFileSync(join(targetDir, 'KEEP_PARENT'), 'parent target');
    writeFileSync(
      join(targetDir, 'docs', '.one-docs-build'),
      '@geektech/one docs build output\n'
    );
    writeFileSync(sentinel, 'nested target', { flag: 'wx' });

    await expect(buildOneDocs({ outDir })).rejects.toThrow(
      'Unsafe One UI docs output directory'
    );

    expect(readFileSync(sentinel, 'utf8')).toBe('nested target');
  });

  it('rejects NUL in an output path without touching its existing ancestor', async () => {
    const parentDir = makeTemporaryDirectory('one-docs-nul-output-');
    const sentinel = join(parentDir, 'KEEP_ME');
    writeFileSync(sentinel, 'nul ancestor');

    await expect(
      buildOneDocs({ outDir: `${parentDir}\0escaped` })
    ).rejects.toThrow('Unsafe One UI docs output directory');

    expect(readFileSync(sentinel, 'utf8')).toBe('nul ancestor');
  });
});
