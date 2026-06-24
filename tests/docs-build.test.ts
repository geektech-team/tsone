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
import { docsStyles } from '../docs/app/styles';
import { renderStyleSheet } from '../lib';
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

function cssRule(css: string, selector: string): string {
  const marker = `${selector} {\n`;
  const start = css.indexOf(marker);
  expect(start).toBeGreaterThanOrEqual(0);

  const end = css.indexOf('\n}', start);
  expect(end).toBeGreaterThan(start);

  return css.slice(start, end + 2);
}

describe('docs static build', () => {
  it('renders documentation styles from typed style objects', () => {
    expect(Array.isArray(docsStyles)).toBe(true);
    expect(docsStyles.length).toBeGreaterThan(0);
    expect(docsStyles.some((entry) => 'selector' in entry)).toBe(true);

    const css = renderStyleSheet(docsStyles);

    expect(css).toContain(':root {');
    expect(css).toContain('--docs-bg: #ffffff;');
    expect(css.match(/--docs-accent: rgb\(95 217 86\);/g) ?? []).toHaveLength(
      2
    );
    expect(css).not.toContain('--docs-accent: #1565c0;');
    expect(css).not.toContain('--docs-accent: #73b7ff;');
    expect(css).toContain('.docs-layout {');
    expect(css).toContain('min-height: calc(100vh - 57px);');
    expect(css).toContain('@media (max-width: 820px) {');
  });

  it('keeps the docs header fixed above the document content', () => {
    const css = renderStyleSheet(docsStyles);
    const topbarRule = cssRule(css, '.docs-topbar');
    const layoutRule = cssRule(css, '.docs-layout');

    expect(topbarRule).toContain('position: fixed;');
    expect(topbarRule).toContain('top: 0;');
    expect(topbarRule).toContain('left: 0;');
    expect(topbarRule).toContain('right: 0;');
    expect(topbarRule).toContain('background: var(--docs-bg);');
    expect(topbarRule).toContain('z-index: 10;');
    expect(layoutRule).toContain('padding-top: 57px;');
  });

  it('keeps the desktop docs sidebar fixed with independent scrolling', () => {
    const css = renderStyleSheet(docsStyles);

    expect(css).toContain('.docs-sidebar {');
    expect(css).toContain('position: fixed;');
    expect(css).toContain('top: 57px;');
    expect(css).toContain('bottom: 0;');
    expect(css).toContain('overflow-y: auto;');
    expect(css).toContain('margin-left: 280px;');
    expect(css).toContain('position: static;');
    expect(css).toContain('overflow-y: visible;');
    expect(css).toContain('margin-left: 0;');
  });

  it('maps MPA routes to directory-style HTML output paths', () => {
    expect(routeToOutputPath('/', '/tmp/docs')).toBe('/tmp/docs/index.html');
    expect(routeToOutputPath('/api/component/', '/tmp/docs')).toBe(
      '/tmp/docs/api/component/index.html'
    );
  });

  it('delegates base HTML document rendering to the TSone framework', () => {
    const docsScript = readFileSync(join(process.cwd(), 'scripts/docs.ts'), {
      encoding: 'utf8',
    });

    expect(docsScript).toContain('renderHtmlDocument');
    expect(docsScript).not.toContain("'<!doctype html>'");
    expect(docsScript).not.toContain("'<html");
    expect(docsScript).not.toContain('mountRoot.innerHTML');
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
      expect(home).toContain('.docs-shell {');
      expect(home).toContain('--docs-bg: #ffffff;');
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
