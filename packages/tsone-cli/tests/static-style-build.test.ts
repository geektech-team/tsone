import { afterEach, expect, test } from 'bun:test';
import { mkdtempSync, realpathSync, mkdirSync, writeFileSync, rmSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, join } from 'node:path';
import { build } from '../src/build';
import { frameworkSource } from './style-fixture';

const roots: string[] = [];
const originalBuild = Bun.build;
afterEach(() => { Bun.build = originalBuild; for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true }); });
function fixture(styles = true): { root: string; entry: string } {
  const root = realpathSync(mkdtempSync(join(tmpdir(), 'tsone-static-build-')));
  roots.push(root);
  mkdirSync(join(root, 'src'));
  const entry = join(root, 'src/main.ts');
  writeFileSync(entry, `import {Component,createApp} from ${JSON.stringify(frameworkSource)};
    export class Widget extends Component {
      initState(){return {}} render(){return {tag:'div'}}
      initStyles(){this.styleManager.addStyle('fixed',{selector:'.component-fixed',properties:{color:'red'}})}
    }
    export const app=createApp({root:Widget,document:{title:'Static',
      ${styles ? "styles:[{selector:'.document-fixed',properties:{color:'blue'}}]" : ''}}});`);
  return { root, entry };
}

test('build emits component and document CSS without activating component assets globally', async () => {
  const { root, entry } = fixture();
  const originalSource = readFileSync(entry, 'utf8');
  const built = await build({ root });
  const styles = built.assetsBuilt.filter(path => /tsone-static-.*\.css$/.test(path));
  expect(styles).toHaveLength(2);
  const componentCss = styles.find(path => readFileSync(path, 'utf8').includes('.component-fixed'))!;
  expect(readFileSync(componentCss, 'utf8')).toBe('.component-fixed {\ncolor: red;\n}\n');
  const html = readFileSync(join(built.outDir, 'index.html'), 'utf8');
  expect(html).not.toContain(basename(componentCss));
  expect(html).not.toContain('data-tsone-document-style');
  expect(html).toContain('tsone-static-');
  expect(readFileSync(join(built.outDir, 'main.js'), 'utf8')).toContain(basename(componentCss));
  expect(readFileSync(entry, 'utf8')).toBe(originalSource);
});

test.each([false, true])('shared entries copy resources next to nested HTML (directoryPages=%s)', async directoryPages => {
  const { root } = fixture();
  writeFileSync(join(root, 'tsone.config.ts'), `export default {basePath:'/deployed',
    pages:{'/nested/detail':'src/main.ts'},build:{directoryPages:${directoryPages}}};`);
  const built = await build({ root });
  const page = join(built.outDir, directoryPages ? 'nested/detail/index.html' : 'nested/detail.html');
  const html = readFileSync(page, 'utf8');
  const href = html.match(/href="(\.\/tsone-static-[a-f0-9]+\.css)"/)![1];
  expect(readFileSync(join(page, '..', href), 'utf8')).toContain('.document-fixed');
  expect(new Set(built.assetsBuilt).size).toBe(built.assetsBuilt.length);
  expect(built.assetsBuilt.filter(path => /tsone-static-.*\.css$/.test(path))).toHaveLength(4);
});

test('source changes after discovery discard all stale component candidates', async () => {
  const { root, entry } = fixture(false);
  let changed = false;
  Bun.build = (async options => {
    const result = await originalBuild(options);
    if (!options.outdir && !changed) {
      changed = true;
      writeFileSync(entry, readFileSync(entry, 'utf8').replace("color:'red'", 'color:this.props.color'));
    }
    return result;
  }) as typeof Bun.build;
  const built = await build({ root });
  expect(built.assetsBuilt.filter(path => /tsone-static-.*\.css$/.test(path))).toHaveLength(0);
});

test('discovery failures preserve existing output', async () => {
  const { root } = fixture(false);
  const output = join(root, 'dist/build/h5');
  mkdirSync(output, { recursive: true });
  const sentinel = join(output, 'old.txt');
  writeFileSync(sentinel, 'old build');
  Bun.build = (async () => ({ success: false, outputs: [], logs: [] })) as typeof Bun.build;
  await expect(build({ root })).rejects.toThrow('Failed to build TSone application');
  expect(readFileSync(sentinel, 'utf8')).toBe('old build');
});

test('URL-dependent component rules stay inline and emit no component asset', async () => {
  const { root, entry } = fixture(false);
  writeFileSync(entry, readFileSync(entry, 'utf8').replace("color:'red'", "background:'url(./icon.svg)'"));
  const built = await build({ root });
  expect(built.assetsBuilt.filter(path => /tsone-static-.*\.css$/.test(path))).toHaveLength(0);
});
