import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { afterEach, describe, expect, it } from 'bun:test';
import { resolveConfig } from '../src/config';
import { renderProjectHtml } from '../src/project';

const roots: string[] = [];
const frameworkEntryUrl = pathToFileURL(
  join(import.meta.dir, '..', '..', 'tsone', 'lib', 'index.ts')
).href;

function makeRoot(entrySource: string): string {
  const root = mkdtempSync(join(tmpdir(), 'tsone-cli-project-'));
  roots.push(root);
  mkdirSync(join(root, 'src'));
  writeFileSync(join(root, 'src/main.ts'), entrySource);
  return root;
}

afterEach(() =>
  roots
    .splice(0)
    .forEach((root) => rmSync(root, { recursive: true, force: true }))
);

describe('TSone project rendering', () => {
  it('renders an app document without replacing the caller DOM', async () => {
    const root = makeRoot(`
      import { createApp } from '${frameworkEntryUrl}';

      export const app = createApp({
        document: { title: 'External App' },
      });
    `);
    const originalDocument = globalThis.document;

    const html = await renderProjectHtml(await resolveConfig({ root }), {
      scripts: [{ type: 'module', src: '/bundle.js' }],
    });

    expect(html).toContain('<title>External App</title>');
    expect(html).toContain('<div id="app"></div>');
    expect(html).toContain('src="/bundle.js"');
    expect(globalThis.document).toBe(originalDocument);
  });

  it('rejects an entry that does not export an app document renderer', async () => {
    const root = makeRoot('export const value = 1;');

    await expect(
      renderProjectHtml(await resolveConfig({ root }), {})
    ).rejects.toThrow('must export an app with renderHtmlDocument()');
  });
});
