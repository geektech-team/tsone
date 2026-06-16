import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'bun:test';
import { name } from '../lib';

const root = process.cwd();
const oldDisplayName = ['Free', '-JS'].join('');
const oldPackageName = ['free', '-js'].join('');
const oldDottedName = ['Free', '.js'].join('');
const oldFrameworkName = ['Free', ' Framework'].join('');

function trackedTextFiles(): string[] {
  return execFileSync('git', ['ls-files'], {
    cwd: root,
    encoding: 'utf8',
  })
    .split('\n')
    .filter(Boolean)
    .filter((file) => {
      if (file === 'tests/brand-consistency.test.ts') {
        return false;
      }
      return /\.(json|md|ts|tsx|js|html|toml|yml|yaml|gitignore|npmignore)$/.test(
        file
      );
    });
}

describe('brand consistency', () => {
  it('uses TSone as the public brand and tsone as the package name', () => {
    const packageJson = JSON.parse(
      readFileSync(join(root, 'package.json'), 'utf8')
    );
    const readme = readFileSync(join(root, 'README.md'), 'utf8');

    expect(packageJson.name).toBe('tsone');
    expect(packageJson.description).toContain('TSone');
    expect(readme).toContain('# TSone');
    expect(readme).toContain('bun add tsone');
    expect(name).toBe('tsone');
  });

  it('does not leave old project names in tracked text files', () => {
    const forbidden = [
      oldDisplayName,
      oldPackageName,
      oldDottedName,
      oldFrameworkName,
    ];
    const offenders = trackedTextFiles().flatMap((file) => {
      const text = readFileSync(join(root, file), 'utf8');
      return forbidden
        .filter((term) => text.includes(term))
        .map((term) => `${file}: ${term}`);
    });

    expect(offenders).toEqual([]);
  });
});
