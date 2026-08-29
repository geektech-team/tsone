import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'bun:test';
import { buildOneDocs, routeToOneDocsOutputPath } from '../scripts/docs';

const temporaryDirectories: string[] = [];

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

  it('builds all seven pages and the interactive client asset', async () => {
    const outDir = mkdtempSync(join(tmpdir(), 'one-docs-build-'));
    temporaryDirectories.push(outDir);

    const result = await buildOneDocs({ outDir });

    expect(result.pagesBuilt).toBe(7);
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
});
