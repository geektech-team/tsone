import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'bun:test';

const repoRoot = join(import.meta.dir, '../../..');

describe('One UI workspace integration', () => {
  it('exposes root build and docs commands', () => {
    const rootPackage = JSON.parse(
      readFileSync(join(repoRoot, 'package.json'), 'utf8')
    ) as { scripts: Record<string, string>; workspaces: string[] };

    expect(rootPackage.workspaces).toContain('packages/*');
    expect(rootPackage.scripts['build:one']).toBe(
      'bun run --cwd packages/one build'
    );
    expect(rootPackage.scripts['docs:one']).toBe(
      'bun run --cwd packages/one docs'
    );
    expect(rootPackage.scripts['docs:one:build']).toBe(
      'bun run --cwd packages/one docs:build'
    );
    expect(rootPackage.scripts.build).toBe(
      'bun run --cwd packages/tsone build && bun run --cwd packages/one build && bun run --cwd packages/tsone-cli build'
    );
  });

  it('maps the public source package for strict workspace typechecking', () => {
    const config = JSON.parse(
      readFileSync(join(repoRoot, 'tsconfig.json'), 'utf8')
    ) as {
      compilerOptions: { paths: Record<string, string[]> };
      include: string[];
    };

    expect(config.compilerOptions.paths['@geektech/one']).toEqual([
      'packages/one/lib/index.ts',
    ]);
    expect(config.include).toContain('packages/one/lib');
    expect(config.include).toContain('packages/one/docs/app');
    expect(config.include).toContain('packages/one/scripts');
  });
});
