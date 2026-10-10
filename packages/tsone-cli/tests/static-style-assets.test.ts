import { expect, test } from 'bun:test';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  canExternalizeCss,
  externalizeDocumentStyles,
  writeStaticStyleAssets,
} from '../src/static-styles/assets';

const css = '.fixed {\ncolor: red;\n}\n';
const html = (value: string) =>
  '<!doctype html><html><head><meta name="a">' +
  `<style data-tsone-document-style>${value}</style><meta name="b"></head>` +
  '<body><style>.user{color:blue}</style><script>const s="<style>keep</style>"</script>&amp;</body></html>';

test('replaces only controlled head styles at their position and writes exact content', async () => {
  const result = await externalizeDocumentStyles(html(css));
  expect(result.assets).toHaveLength(1);
  const asset = result.assets[0];
  expect(asset.filename).toMatch(/^tsone-static-[a-f0-9]{64}\.css$/);
  expect(asset.cssText).toBe(css);
  expect(result.html).toContain(
    `<meta name="a"><link rel="stylesheet" href="./${asset.filename}"><meta name="b">`
  );
  expect(result.html).toContain('<style>.user{color:blue}</style>');
  expect(result.html).toContain('const s="<style>keep</style>"');
  expect(result.html).toContain('&amp;');
  const root = mkdtempSync(join(tmpdir(), 'tsone-css-'));
  try {
    const files = await writeStaticStyleAssets(
      join(root, 'nested/index.html'),
      [asset, asset]
    );
    expect(files).toHaveLength(1);
    expect(await Bun.file(files[0]).text()).toBe(css);
    await Bun.write(files[0], '.collision{}');
    await expect(
      writeStaticStyleAssets(join(root, 'nested/index.html'), [asset])
    ).rejects.toThrow();
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test.each([
  ['.a{background:url(./icon.svg)}', false],
  ['.a{filter:url(#filter)}', false],
  ['@import "theme.css";', false],
  ['.a{background:url(/icon.svg)}', true],
  ['.a{background:url(data:image/png;base64,AAAA)}', true],
  ['.a{background:URL("https://site.test/a.png")}', true],
  ['/* url(./ignored) */ .a{content:"@import url(relative)"}', true],
  ['.a{background:url/**/(relative.png)}', false],
  ['.a{background:image-set("relative.png" 1x)}', false],
  ['.a{background:u\\72l(relative.png)}', false],
])('CSS address policy: %s', (value, expected) => {
  expect(canExternalizeCss(String(value))).toBe(expected);
});

test('route content changes hash while identical and empty styles deduplicate', async () => {
  const red = await externalizeDocumentStyles(html(css));
  const blue = await externalizeDocumentStyles(
    html(css.replace('red', 'blue'))
  );
  expect(red.assets[0].filename).not.toBe(blue.assets[0].filename);
  const repeated = await externalizeDocumentStyles(
    html(css).replace(
      '<meta name="b">',
      `<style data-tsone-document-style>${css}</style>`
    )
  );
  expect(repeated.assets).toHaveLength(1);
  expect((await externalizeDocumentStyles(html(''))).assets).toHaveLength(0);
});

test.each([
  '<main><style>.a{color:red}</style></main>',
  html(css).replace('<head>', '<head><base href="/assets/">'),
  html('.a{filter:url(#fragment)}'),
])('retains unextractable documents byte-for-byte (%#)', async (raw) => {
  expect(await externalizeDocumentStyles(raw)).toEqual({
    html: raw,
    assets: [],
  });
});
