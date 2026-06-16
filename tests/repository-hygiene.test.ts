import { execFileSync } from 'node:child_process';
import { describe, expect, it } from 'bun:test';

function trackedFiles(): string[] {
  return execFileSync('git', ['ls-files'], {
    cwd: process.cwd(),
    encoding: 'utf8',
  })
    .split('\n')
    .filter(Boolean);
}

function gitIgnoreMatches(path: string): boolean {
  try {
    execFileSync('git', ['check-ignore', '-q', path], {
      cwd: process.cwd(),
      stdio: 'ignore',
    });
    return true;
  } catch {
    return false;
  }
}

describe('repository hygiene', () => {
  it('does not track generated, vendored, or machine-local artifacts', () => {
    const files = trackedFiles();
    const forbiddenPatterns = [
      /^\.DS_Store$/,
      /^coverage\//,
      /(^|\/)node_modules\//,
      /(^|\/)\.vite\//,
      /(^|\/)\.pnpm-store\//,
      /^dist\//,
    ];

    const forbiddenFiles = files.filter((file) =>
      forbiddenPatterns.some((pattern) => pattern.test(file))
    );

    expect(forbiddenFiles).toEqual([]);
  });

  it('ignores recurring local and generated artifacts', () => {
    expect(gitIgnoreMatches('.DS_Store')).toBe(true);
    expect(gitIgnoreMatches('coverage/lcov.info')).toBe(true);
    expect(gitIgnoreMatches('docs/node_modules/.modules.yaml')).toBe(true);
    expect(gitIgnoreMatches('docs/src/.vitepress/cache/index.html')).toBe(true);
    expect(gitIgnoreMatches('.worktrees/open-source-priority')).toBe(true);
  });
});
