import { afterEach, expect, test } from 'bun:test';
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  realpathSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, dirname, join } from 'node:path';
import { startDevServer } from '../src/server';
import { makeStaticStyleAsset } from '../src/static-styles/assets';
import { frameworkSource } from './style-fixture';

const roots: string[] = [];
const servers: Array<ReturnType<typeof Bun.serve>> = [];
const originalBuild = Bun.build;
const originalError = console.error;
afterEach(() => {
  Bun.build = originalBuild;
  console.error = originalError;
  servers.splice(0).forEach((server) => server.stop(true));
  roots.splice(0).forEach((root) => rmSync(root, { recursive: true }));
});

function source(color = 'red', documentColor = 'blue'): string {
  return `import {Component,createApp} from ${JSON.stringify(frameworkSource)};
    class Fixed extends Component {
      initState(){return {}} render(){return {tag:'div',props:{className:'fixed'},children:['fixed']}}
      initStyles(){this.styleManager.addStyle('fixed',{selector:'.fixed',properties:{color:${JSON.stringify(color)},width:'123px'}})}
    }
    export class Dynamic extends Component {
      initState(){return {}} render(){return {tag:'div'}}
      initStyles(){this.styleManager.addStyle('dynamic',{selector:'.dynamic',properties:{color:this.props.color}})}
    }
    export const app=createApp({root:Fixed,document:{title:'Static dev',styles:[{
      selector:'.document-fixed',properties:{color:location.pathname.includes('nested')?'green':${JSON.stringify(documentColor)}}
    }]}});
    if(document.querySelector('#app'))app.mount('#app');`;
}

function fixture(entryName = 'main.ts'): { root: string; entry: string } {
  const root = realpathSync(mkdtempSync(join(tmpdir(), 'tsone-static-dev-')));
  roots.push(root);
  mkdirSync(join(root, 'src'));
  const entry = join(root, 'src', entryName);
  writeFileSync(entry, source());
  return { root, entry };
}

async function start(root: string, watch = false, entry = 'src/main.ts') {
  const server = await startDevServer({
    root,
    port: 0,
    watch,
    config: { entry, pages: { '/nested/detail': entry } },
  });
  servers.push(server);
  return server;
}

function url(server: ReturnType<typeof Bun.serve>): string {
  return `http://127.0.0.1:${server.port}`;
}

async function page(server: ReturnType<typeof Bun.serve>, route = '/') {
  const response = await fetch(url(server) + route);
  expect(response.status).toBe(200);
  const html = await response.text();
  const scriptUrl = html.match(/<script type="module" src="([^"]+)">/)?.[1];
  if (!scriptUrl) throw new Error('Missing development script');
  const scriptResponse = await fetch(url(server) + scriptUrl);
  expect(scriptResponse.status).toBe(200);
  const script = await scriptResponse.text();
  const componentCss = script.match(
    /"(\/dev\/[^"\s]+\/tsone-static-[a-f0-9]+\.css)"/
  )?.[1];
  const documentCss = html.match(
    /href="([^"\s]+tsone-static-[a-f0-9]+\.css)"/
  )?.[1];
  return { html, script, scriptUrl, componentCss, documentCss };
}

async function css(server: ReturnType<typeof Bun.serve>, href: string) {
  const response = await fetch(new URL(href, url(server)));
  expect(response.status).toBe(200);
  expect(response.headers.get('content-type')).toContain('text/css');
  expect(response.headers.get('cache-control')).toBe('no-store');
  return response.text();
}

test('dev serves fixed component and per-route document CSS as exact generation assets', async () => {
  const { root, entry } = fixture('.main.ts');
  const original = readFileSync(entry, 'utf8');
  const server = await start(root, true, 'src/.main.ts');
  const home = await page(server);
  const nested = await page(server, '/nested/detail/index.html');
  expect(home.componentCss).toBeDefined();
  expect(home.documentCss).toBeDefined();
  expect(nested.documentCss).toBeDefined();
  if (
    !home.componentCss ||
    !home.documentCss ||
    !nested.documentCss ||
    !nested.componentCss
  )
    throw new Error('Missing static CSS URLs');
  expect(home.scriptUrl).toBe(nested.scriptUrl);
  expect(home.componentCss).toBe(nested.componentCss);
  expect(home.html).not.toContain(home.componentCss);
  expect(home.html).not.toContain('data-tsone-document-style');
  expect(await css(server, home.componentCss)).toBe(
    '.fixed {\ncolor: red;\nwidth: 123px;\n}\n'
  );
  expect(await css(server, home.documentCss)).toContain('color: blue');
  expect(await css(server, nested.documentCss)).toContain('color: green');
  expect(home.documentCss).not.toBe(nested.documentCss);
  const diskFile = join(
    root,
    'dist/dev/h5',
    home.componentCss.slice('/dev/'.length)
  );
  expect(readFileSync(diskFile, 'utf8')).toContain('.fixed');
  expect(readFileSync(entry, 'utf8')).toBe(original);
});

test('non-watch dev retains independently addressable static CSS generations', async () => {
  const { root, entry } = fixture();
  const server = await start(root);
  const previous = await page(server);
  writeFileSync(entry, source('purple', 'orange'));
  const current = await page(server, '/nested/detail/');
  if (!previous.componentCss || !current.componentCss)
    throw new Error('Missing static CSS URLs');
  expect(previous.componentCss).not.toBe(current.componentCss);
  expect(await css(server, previous.componentCss)).toContain('color: red');
  expect(await css(server, current.componentCss)).toContain('color: purple');
});

async function reload(
  reader: ReadableStreamDefaultReader<Uint8Array>
): Promise<void> {
  const decoder = new TextDecoder();
  let text = '';
  const timeout = setTimeout(() => void reader.cancel(), 8_000);
  try {
    while (!text.includes('event: reload')) {
      const result = await reader.read();
      if (result.done) throw new Error('Missing successful reload event');
      text += decoder.decode(result.value);
    }
  } finally {
    clearTimeout(timeout);
  }
}

test('watch replaces static CSS before reload and preserves it after a failed rebuild', async () => {
  const { root, entry } = fixture();
  const server = await start(root, true);
  const previous = await page(server);
  const response = await fetch(url(server) + '/__tsone/reload');
  const reader = response.body?.getReader();
  if (!reader) throw new Error('Missing reload stream');
  try {
    writeFileSync(entry, source('purple', 'orange'));
    await reload(reader);
    const current = await page(server);
    if (!previous.componentCss || !current.componentCss || !current.documentCss)
      throw new Error('Missing static CSS URLs');
    expect((await fetch(url(server) + previous.componentCss)).status).toBe(404);
    expect(await css(server, current.componentCss)).toContain('color: purple');
    expect(await css(server, current.documentCss)).toContain('color: orange');
    const oldDirectory = dirname(
      join(root, 'dist/dev/h5', previous.componentCss.slice('/dev/'.length))
    );
    expect(existsSync(oldDirectory)).toBe(false);
    let failed: (() => void) | undefined;
    const failure = new Promise<void>((resolve) => {
      failed = resolve;
    });
    console.error = () => {};
    Bun.build = (async (options: Bun.BuildConfig) => {
      const result = await originalBuild(options);
      if (!result.success) failed?.();
      return result;
    }) as typeof Bun.build;
    let timeout: ReturnType<typeof setTimeout> | undefined;
    writeFileSync(entry, 'export const app = {');
    try {
      await Promise.race([
        failure,
        new Promise((_, reject) => {
          timeout = setTimeout(
            () => reject(new Error('Missing failed rebuild')),
            8_000
          );
        }),
      ]);
    } finally {
      clearTimeout(timeout);
    }
    expect(await css(server, current.componentCss)).toContain('color: purple');
    expect(await css(server, current.documentCss)).toContain('color: orange');
  } finally {
    await reader.cancel();
  }
}, 20_000);

test('dev discards stale static candidates when source changes after discovery', async () => {
  const { root, entry } = fixture();
  let changed = false;
  Bun.build = (async (options: Bun.BuildConfig) => {
    const result = await originalBuild(options);
    if (!options.outdir && !changed) {
      changed = true;
      writeFileSync(
        entry,
        source().replace('color:"red"', 'color:this.props.color')
      );
    }
    return result;
  }) as typeof Bun.build;
  const server = await start(root);
  const document = await page(server);
  expect(changed).toBe(true);
  expect(document.componentCss).toBeUndefined();
  expect(document.documentCss).toBeDefined();
});

test('dev retries without static activation when source changes during the final build', async () => {
  const { root, entry } = fixture();
  let changed = false;
  Bun.build = (async (options: Bun.BuildConfig) => {
    if (options.outdir && !changed) {
      const mutate: Bun.BunPlugin = {
        name: 'change-source-during-final-load',
        setup(builder) {
          builder.onLoad({ filter: /main\.ts$/ }, () => {
            changed = true;
            writeFileSync(
              entry,
              source().replace('color:"red"', 'color:this.props.color')
            );
          });
        },
      };
      return originalBuild({
        ...options,
        plugins: [mutate, ...(options.plugins ?? [])],
      });
    }
    return originalBuild(options);
  }) as typeof Bun.build;
  const server = await start(root);
  const document = await page(server);
  expect(changed).toBe(true);
  expect(document.componentCss).toBeUndefined();
  expect(document.documentCss).toBeDefined();
});

test('dev rejects a static CSS write collision without publishing its generation', async () => {
  const { root } = fixture();
  let rejectedUrl: string | undefined;
  let rejectedDirectory: string | undefined;
  console.error = () => {};
  Bun.build = (async (options: Bun.BuildConfig) => {
    const result = await originalBuild(options);
    if (options.outdir) {
      const output = result.outputs.find(
        (output) =>
          output.kind === 'entry-point' && output.type.includes('javascript')
      );
      const script = await output?.text();
      rejectedUrl = script?.match(
        /"(\/dev\/[^"\s]+\/tsone-static-[a-f0-9]+\.css)"/
      )?.[1];
      if (!rejectedUrl) throw new Error('Missing candidate CSS URL');
      rejectedDirectory = options.outdir;
      writeFileSync(join(options.outdir, basename(rejectedUrl)), 'collision');
    }
    return result;
  }) as typeof Bun.build;
  const server = await start(root);
  expect((await fetch(url(server) + '/')).status).toBe(500);
  if (!rejectedUrl || !rejectedDirectory)
    throw new Error('Missing rejected generation');
  expect((await fetch(url(server) + rejectedUrl)).status).toBe(404);
  expect(existsSync(rejectedDirectory)).toBe(false);
});

for (const watch of [false, true]) {
  test(`dev cleans up failed document CSS and recovers with watch=${watch}`, async () => {
    // 只验证 watch 缓存；隐藏入口避免原生监听延迟送达的创建事件触发重建。
    const { root } = fixture('.main.ts');
    const asset = makeStaticStyleAsset('.document-fixed {\n  color: blue;\n}');
    let rejectedDirectory: string | undefined;
    console.error = () => {};
    Bun.build = (async (options: Bun.BuildConfig) => {
      const result = await originalBuild(options);
      if (options.outdir && !rejectedDirectory) {
        rejectedDirectory = options.outdir;
        writeFileSync(join(options.outdir, asset.filename), 'collision');
      }
      return result;
    }) as typeof Bun.build;
    const server = await start(root, watch, 'src/.main.ts');
    expect((await fetch(url(server) + '/')).status).toBe(500);
    if (!rejectedDirectory) throw new Error('Missing rejected generation');
    expect(existsSync(rejectedDirectory)).toBe(false);
    const recovered = await page(server);
    if (!recovered.documentCss) throw new Error('Missing document CSS');
    expect(await css(server, recovered.documentCss)).toContain('color: blue');
    expect((await fetch(url(server) + '/bundle.js')).status).toBe(200);
  });
}

test('dev preserves a published bundle when another route fails to write document CSS', async () => {
  const { root } = fixture('.main.ts');
  const asset = makeStaticStyleAsset('.document-fixed {\n  color: green;\n}');
  let collisionFile: string | undefined;
  console.error = () => {};
  Bun.build = (async (options: Bun.BuildConfig) => {
    const result = await originalBuild(options);
    if (options.outdir) {
      collisionFile = join(options.outdir, asset.filename);
      writeFileSync(collisionFile, 'collision');
    }
    return result;
  }) as typeof Bun.build;
  const server = await start(root, true, 'src/.main.ts');
  const home = await page(server);
  expect((await fetch(url(server) + '/nested/detail')).status).toBe(500);
  expect((await fetch(url(server) + home.scriptUrl)).status).toBe(200);
  if (!home.componentCss || !home.documentCss || !collisionFile)
    throw new Error('Missing published generation');
  expect(await css(server, home.componentCss)).toContain('color: red');
  expect(await css(server, home.documentCss)).toContain('color: blue');
  rmSync(collisionFile);
  const nested = await page(server, '/nested/detail');
  expect(nested.scriptUrl).toBe(home.scriptUrl);
  if (!nested.documentCss) throw new Error('Missing nested document CSS');
  expect(await css(server, nested.documentCss)).toContain('color: green');
});
