import {
  existsSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'bun:test';
import { buildDocs, routeToOutputPath } from '../scripts/docs';

function collectHtmlFiles(dir: string): string[] {
  const entries = readdirSync(dir, { withFileTypes: true });

  return entries.flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      return collectHtmlFiles(path);
    }

    return entry.name.endsWith('.html') ? [path] : [];
  });
}

describe('docs static build', () => {
  it('maps MPA routes to directory-style HTML output paths', () => {
    expect(routeToOutputPath('/', '/tmp/docs')).toBe('/tmp/docs/index.html');
    expect(routeToOutputPath('/api/component/', '/tmp/docs')).toBe(
      '/tmp/docs/api/component/index.html'
    );
  });

  it('builds static HTML pages and a client bundle', async () => {
    const outDir = mkdtempSync(join(tmpdir(), 'tsone-docs-'));

    try {
      const result = await buildDocs({ outDir });

      expect(result.pagesBuilt).toBe(14);
      expect(collectHtmlFiles(outDir)).toHaveLength(14);
      expect(existsSync(join(outDir, 'index.html'))).toBe(true);
      expect(existsSync(join(outDir, 'api/component/index.html'))).toBe(true);
      expect(existsSync(join(outDir, 'assets/docs-client.js'))).toBe(true);

      const clientBundle = readFileSync(
        join(outDir, 'assets/docs-client.js'),
        'utf8'
      );
      expect(clientBundle).toContain('mountDocsClient');
      expect(clientBundle).toContain('data-doc-search-root');
      expect(clientBundle).toContain('data-doc-theme-root');
      expect(clientBundle).not.toContain('sourceMappingURL');

      const home = readFileSync(join(outDir, 'index.html'), 'utf8');
      expect(home).toContain('<!doctype html>');
      expect(home).toContain('data-tsone-docs-page');
      expect(home).toContain('TSone');
      expect(home).toContain('/assets/docs-client.js');

      const componentApi = readFileSync(
        join(outDir, 'api/component/index.html'),
        'utf8'
      );
      expect(componentApi).toContain('Component API');
      expect(componentApi).toContain('protected render(): VNode');
      expect(componentApi).toContain('data-doc-search-root');
      expect(componentApi).toContain('data-doc-theme-root');
    } finally {
      rmSync(outDir, { recursive: true, force: true });
    }
  });
});
