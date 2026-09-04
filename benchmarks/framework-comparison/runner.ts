/**
 * 三框架对比实验运行器：
 * 1. 用相同的 Bun.build 生产配置构建 tsone / vue / react 三个应用
 * 2. 统计每个应用的 JS 产物体积（原始 / gzip / brotli）
 * 3. 用系统 Chrome（headless）分多轮测量挂载耗时与更新耗时，取中位数
 * 4. 汇总写入 results.json 并打印对比表
 */
import { brotliCompressSync, gzipSync } from 'node:zlib';
import { readFile, rm, writeFile, mkdir } from 'node:fs/promises';
import { existsSync, readFileSync } from 'node:fs';
import { extname, join, resolve } from 'node:path';
import { chromium, type Browser, type Page } from 'playwright-core';

const ROOT = import.meta.dir;
const DIST = join(ROOT, 'dist');
const CHROME_PATH =
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const PORT = 18899;
const ROUNDS = 3;
const OP_ITERATIONS = 5;

interface AppBuild {
  name: string;
  entry: string;
  define?: Record<string, string>;
}

const APPS: AppBuild[] = [
  { name: 'tsone', entry: join(ROOT, 'tsone/src/main.ts') },
  { name: 'vue', entry: join(ROOT, 'vue/src/main.ts') },
  {
    name: 'react',
    entry: join(ROOT, 'react/src/main.ts'),
    define: { 'process.env.NODE_ENV': '"production"' },
  },
];

async function buildApps(): Promise<void> {
  await mkdir(DIST, { recursive: true });
  const [shell, driver] = await Promise.all([
    readFile(join(ROOT, 'shell.html'), 'utf8'),
    readFile(join(ROOT, 'bench-driver.js'), 'utf8'),
  ]);

  for (const app of APPS) {
    const outdir = join(DIST, app.name);
    await rm(outdir, { recursive: true, force: true });
    await mkdir(outdir, { recursive: true });

    const result = await Bun.build({
      entrypoints: [app.entry],
      outdir,
      target: 'browser',
      format: 'esm',
      minify: true,
      define: app.define,
      naming: { entry: '[name].[ext]' },
      throw: false,
    });

    if (!result.success) {
      console.error(`[build:${app.name}] failed`);
      console.error(result.logs);
      throw new Error(`Build failed for ${app.name}`);
    }

    const html = shell.replace(
      'data-framework=""',
      `data-framework="${app.name}"`
    );
    await writeFile(join(outdir, 'index.html'), html);
    await writeFile(join(outdir, 'bench-driver.js'), driver);
    console.log(`[build:${app.name}] ok`);
  }
}

interface SizeReport {
  raw: number;
  gzip: number;
  brotli: number;
  file: string;
}

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
}

async function measureSizes(): Promise<Record<string, SizeReport>> {
  const reports: Record<string, SizeReport> = {};
  for (const app of APPS) {
    const jsPath = join(DIST, app.name, 'main.js');
    const raw = await readFile(jsPath);
    reports[app.name] = {
      raw: raw.byteLength,
      gzip: gzipSync(raw, { level: 9 }).byteLength,
      brotli: brotliCompressSync(raw).byteLength,
      file: jsPath,
    };
  }
  return reports;
}

function startServer(): Server {
  const server = Bun.serve({
    port: PORT,
    hostname: '127.0.0.1',
    async fetch(request) {
      const url = new URL(request.url);
      let pathname = decodeURIComponent(url.pathname);
      if (pathname === '/') pathname = '/tsone/';
      const filePath = resolve(
        DIST,
        pathname.endsWith('/')
          ? `${pathname.slice(1)}index.html`
          : pathname.slice(1)
      );
      if (!filePath.startsWith(DIST) || !existsSync(filePath)) {
        return new Response('Not found', { status: 404 });
      }
      const body = await readFile(filePath);
      const ext = extname(filePath);
      const type =
        ext === '.html'
          ? 'text/html; charset=utf-8'
          : ext === '.js'
            ? 'text/javascript; charset=utf-8'
            : ext === '.css'
              ? 'text/css; charset=utf-8'
              : 'application/octet-stream';
      return new Response(body, { headers: { 'content-type': type } });
    },
  });
  console.log(`[server] http://127.0.0.1:${PORT}`);
  return server;
}

interface RoundResult {
  mountMs: number;
  add1000: number[];
  toggle1000: number[];
  remove1000: number[];
  toggleEach1000: number[];
  nodesAfter: number;
}

interface BenchSummary {
  framework: string;
  mountMs: number;
  add1000: number;
  toggle1000: number;
  remove1000: number;
  toggleEach1000: number;
  nodesAfter: number;
}

async function runBrowserBench(
  browser: Browser
): Promise<Record<string, BenchSummary>> {
  const collected: Record<string, RoundResult[]> = {};
  for (const app of APPS) {
    collected[app.name] = [];
  }

  for (let round = 0; round < ROUNDS; round++) {
    for (const app of APPS) {
      const page: Page = await browser.newPage();
      try {
        await page.goto(`http://127.0.0.1:${PORT}/${app.name}/`, {
          waitUntil: 'load',
        });
        await page.waitForFunction(
          () =>
            (window as unknown as { __benchRun?: unknown }).__benchRun !==
            undefined,
          undefined,
          { timeout: 60_000 }
        );
        await page.evaluate(() => {
          (window as unknown as { __benchRun: () => void }).__benchRun();
        });
        await page.waitForFunction(
          () =>
            (window as unknown as { __benchResults?: unknown }).__benchResults,
          undefined,
          { timeout: 300_000 }
        );
        const results = await page.evaluate(() => {
          const w = window as unknown as { __benchResults: RoundResult };
          return w.__benchResults;
        });
        collected[app.name].push(results);
        console.log(
          `[bench:${app.name}] round ${round + 1}: mount=${results.mountMs.toFixed(1)}ms ` +
            `add1000=${median(results.add1000).toFixed(1)}ms ` +
            `toggle1000=${median(results.toggle1000).toFixed(1)}ms ` +
            `remove1000=${median(results.remove1000).toFixed(1)}ms ` +
            `toggleEach1000=${median(results.toggleEach1000).toFixed(1)}ms`
        );
      } finally {
        await page.close();
      }
    }
  }

  const summary: Record<string, BenchSummary> = {};
  for (const app of APPS) {
    const rounds = collected[app.name];
    summary[app.name] = {
      framework: app.name,
      mountMs: median(rounds.map((r) => r.mountMs)),
      add1000: median(rounds.map((r) => median(r.add1000))),
      toggle1000: median(rounds.map((r) => median(r.toggle1000))),
      remove1000: median(rounds.map((r) => median(r.remove1000))),
      toggleEach1000: median(rounds.map((r) => median(r.toggleEach1000))),
      nodesAfter: rounds[rounds.length - 1].nodesAfter,
    };
  }
  return summary;
}

function readFrameworkVersions(): Record<string, string> {
  const read = (pkg: string): string => {
    try {
      const json = JSON.parse(
        readFileSync(join(ROOT, 'node_modules', pkg, 'package.json'), 'utf8')
      );
      return json.version as string;
    } catch {
      return 'unknown';
    }
  };
  return {
    vue: read('vue'),
    react: read('react'),
    'react-dom': read('react-dom'),
    'playwright-core': read('playwright-core'),
  };
}

async function main(): Promise<void> {
  const buildOnly = process.argv.includes('--build-only');
  await buildApps();
  const sizes = await measureSizes();

  let bench: Record<string, BenchSummary> | null = null;
  let chromeVersion = 'unknown';
  if (!buildOnly) {
    const server = startServer();
    const browser = await chromium.launch({
      executablePath: CHROME_PATH,
      headless: true,
      args: ['--no-sandbox', '--disable-dev-shm-usage'],
    });
    try {
      chromeVersion = browser.version();
      bench = await runBrowserBench(browser);
    } finally {
      await browser.close();
    }
    server.stop(true);
  }

  const output = {
    generatedAt: new Date().toISOString(),
    environment: {
      bun: Bun.version,
      chrome: chromeVersion,
      frameworks: readFrameworkVersions(),
      rounds: ROUNDS,
      opIterations: OP_ITERATIONS,
      initialItems: 1000,
    },
    sizes,
    bench,
  };
  await writeFile(join(ROOT, 'results.json'), JSON.stringify(output, null, 2));

  console.log('\n=== 产物体积（main.js）===');
  for (const app of APPS) {
    const s = sizes[app.name];
    console.log(
      `${app.name.padEnd(6)} raw=${s.raw}B gzip=${s.gzip}B brotli=${s.brotli}B`
    );
  }

  if (bench) {
    console.log('\n=== 渲染性能（中位数，ms）===');
    console.log(
      ['framework', 'mount', 'add1000', 'toggle1000', 'remove1000', 'toggleEach1000'].join('\t')
    );
    for (const app of APPS) {
      const r = bench[app.name];
      console.log(
        [
          app.name,
          r.mountMs.toFixed(1),
          r.add1000.toFixed(1),
          r.toggle1000.toFixed(1),
          r.remove1000.toFixed(1),
          r.toggleEach1000.toFixed(1),
        ].join('\t')
      );
    }
  }

  console.log(`\n[ok] results.json written to ${join(ROOT, 'results.json')}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
