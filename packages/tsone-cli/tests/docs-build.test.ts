import {
  existsSync,
  mkdtempSync,
  readFileSync,
  rmSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'bun:test';
import {
  assertSafeCliDocsOutputDirectory,
  buildCliDocs,
  routeToCliDocsOutputPath,
} from '../scripts/docs';

const packageRoot = join(import.meta.dir, '..');
const repositoryRoot = join(packageRoot, '..', '..');

describe('TSone CLI docs build', () => {
  it('maps documentation routes to directory-style HTML paths', () => {
    const outDir = '/tmp/cli-docs-routes';

    expect(routeToCliDocsOutputPath('/', 'zh', outDir)).toBe(
      join(outDir, 'zh', 'index.html')
    );
    expect(routeToCliDocsOutputPath('/commands/', 'en', outDir)).toBe(
      join(outDir, 'en', 'commands', 'index.html')
    );
    expect(
      routeToCliDocsOutputPath(
        '/getting-started/',
        'zh',
        outDir,
        '/tsone/cli'
      )
    ).toBe(join(outDir, 'zh', 'getting-started', 'index.html'));
  });

  it('builds all twelve pages and the interactive client asset', async () => {
    const outDir = mkdtempSync(join(tmpdir(), 'cli-docs-build-'));

    try {
      const result = await buildCliDocs({ outDir });

      expect(result.pagesBuilt).toBe(12);
      expect(result.assetsBuilt).toEqual([
        join(outDir, 'assets/cli-docs-client.js'),
      ]);
      expect(existsSync(join(outDir, 'index.html'))).toBe(true);
      expect(existsSync(join(outDir, 'zh/index.html'))).toBe(true);
      expect(existsSync(join(outDir, 'en/index.html'))).toBe(true);
      expect(existsSync(join(outDir, 'zh/commands/index.html'))).toBe(true);
      expect(existsSync(join(outDir, 'en/api/index.html'))).toBe(true);
      expect(existsSync(join(outDir, 'assets/cli-docs-client.js'))).toBe(true);

      const homeHtml = readFileSync(join(outDir, 'index.html'), 'utf8');
      const commandsHtml = readFileSync(
        join(outDir, 'zh/commands/index.html'),
        'utf8'
      );
      expect(homeHtml).toContain('<!doctype html>');
      expect(homeHtml).toContain('TSone CLI');
      expect(homeHtml).toContain('/zh/');
      expect(commandsHtml).toContain('tsone create');
      expect(commandsHtml).toContain('tsone dev');
      expect(commandsHtml).toContain('tsone build');
      expect(commandsHtml).toContain('class="cli-docs-topbar"');
      expect(commandsHtml).toContain('class="cli-docs-sidebar"');
      expect(commandsHtml).toContain('class="cli-docs-main"');
      expect(commandsHtml).toContain('class="cli-docs-toc"');
      expect(commandsHtml).toContain('/assets/cli-docs-client.js');
      expect(commandsHtml).toContain('/zh/commands/');
    } finally {
      rmSync(outDir, { recursive: true, force: true });
    }
  });

  it('builds pages with a base path prefix when configured', async () => {
    const outDir = mkdtempSync(join(tmpdir(), 'cli-docs-base-'));

    try {
      const result = await buildCliDocs({ outDir, basePath: '/tsone/cli' });

      expect(result.pagesBuilt).toBe(12);

      const homeHtml = readFileSync(join(outDir, 'index.html'), 'utf8');
      expect(homeHtml).toContain('/tsone/cli/zh/');

      const zhHome = readFileSync(join(outDir, 'zh/index.html'), 'utf8');
      expect(zhHome).toContain('data-doc-base="/tsone/cli"');
      expect(zhHome).toContain('href="/tsone/cli/zh/');
      expect(zhHome).toContain(
        'src="/tsone/cli/assets/cli-docs-client.js"'
      );

      const enHome = readFileSync(join(outDir, 'en/index.html'), 'utf8');
      expect(enHome).toContain('href="/tsone/cli/en/');

      const commandsHtml = readFileSync(
        join(outDir, 'zh/commands/index.html'),
        'utf8'
      );
      expect(commandsHtml).toContain('href="/tsone/cli/zh/commands/"');

      // The file layout stays under the output directory root (base is a URL
      // prefix, not a directory).
      expect(existsSync(join(outDir, 'tsone'))).toBe(false);
    } finally {
      rmSync(outDir, { recursive: true, force: true });
    }
  });

  it('rejects the filesystem root, package root and repository root', async () => {
    await expect(
      assertSafeCliDocsOutputDirectory('/')
    ).rejects.toThrow('Unsafe TSone CLI docs output directory');
    await expect(
      assertSafeCliDocsOutputDirectory(packageRoot)
    ).rejects.toThrow('Unsafe TSone CLI docs output directory');
    await expect(
      assertSafeCliDocsOutputDirectory(repositoryRoot)
    ).rejects.toThrow('Unsafe TSone CLI docs output directory');
  });
});
