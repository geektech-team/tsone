import { readFileSync } from 'node:fs';
import { access, rename, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'bun:test';
import { ONE_NAME, ONE_VERSION } from '../lib';
import { normalizeOneSize, oneStylesToSheet } from '../lib/styles/shared';

const packageRoot = join(import.meta.dir, '..');
const repositoryRoot = join(packageRoot, '..', '..');
const tsoneDist = join(repositoryRoot, 'packages', 'tsone', 'dist');
const tsoneDistBackup = `${tsoneDist}.one-package-contract-backup`;

async function exists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

describe('One UI package contract', () => {
  it('uses the approved package identity and peer range', () => {
    const manifest = JSON.parse(
      readFileSync(join(packageRoot, 'package.json'), 'utf8')
    ) as {
      name: string;
      version: string;
      peerDependencies: Record<string, string>;
      dependencies?: Record<string, string>;
    };

    expect(manifest.name).toBe('@geektech/one');
    expect(manifest.version).toBe('0.5.0');
    expect(manifest.peerDependencies['@geektech/tsone']).toBe('>=0.4.0 <0.5.0');
    expect(manifest.dependencies ?? {}).toEqual({});
    expect(ONE_NAME).toBe(manifest.name);
    expect(ONE_VERSION).toBe(manifest.version);
  });

  it('normalizes component sizes to md at runtime', () => {
    expect(normalizeOneSize('sm')).toBe('sm');
    expect(normalizeOneSize('lg')).toBe('lg');
    expect(normalizeOneSize('unexpected')).toBe('md');
  });

  it('converts component styles for static document rendering', () => {
    expect(
      oneStylesToSheet([
        {
          name: 'sample',
          selector: '.one-sample',
          properties: { color: 'red' },
          hover: { color: 'blue' },
        },
      ])
    ).toEqual([
      { selector: '.one-sample', properties: { color: 'red' } },
      { selector: '.one-sample:hover', properties: { color: 'blue' } },
    ]);
  });

  it('prepares peer declarations when they are not already built', async () => {
    expect(await exists(tsoneDistBackup)).toBe(false);

    const hadTsoneDist = await exists(tsoneDist);
    if (hadTsoneDist) {
      await rename(tsoneDist, tsoneDistBackup);
    }

    try {
      const proc = Bun.spawn(['bun', 'run', 'build'], {
        cwd: packageRoot,
        stdout: 'pipe',
        stderr: 'pipe',
      });

      expect(await proc.exited).toBe(0);
      expect(await exists(join(tsoneDist, 'index.d.ts'))).toBe(true);
      expect(await exists(join(tsoneDist, 'style', 'index.d.ts'))).toBe(true);
    } finally {
      if (hadTsoneDist) {
        await rm(tsoneDist, { recursive: true, force: true });
        await rename(tsoneDistBackup, tsoneDist);
      }
    }
  }, 60000);
});
