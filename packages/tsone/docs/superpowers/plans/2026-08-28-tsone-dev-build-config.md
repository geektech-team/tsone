# TSone CLI Dev and Build Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 新增独立的 `@geektech/tsone-cli` 包，提供 `tsone.config.ts`、HTTP/HTTPS proxy、`tsone dev`、`tsone build` 和程序化 API。

**Architecture:** 工具链全部位于 `packages/tsone-cli`，按配置、隔离 DOM 入口、代理、开发服务、构建和 CLI 拆分。`@geektech/tsone` 继续只负责浏览器框架；CLI 包依赖它，并通过源码 fallback bin 同时支持 fresh workspace 和带 `dist` 的发布包。

**Tech Stack:** Bun 1.3、TypeScript strict、`bun:test`、`Bun.serve`、`Bun.build`、Happy DOM、Node 内置文件与 URL API

**Spec:** `packages/tsone/docs/superpowers/specs/2026-08-28-tsone-dev-build-config-design.md`

## Global Constraints

- 新包目录必须是 `packages/tsone-cli`，发布名必须是 `@geektech/tsone-cli`，bin 名必须是 `tsone`。
- `@geektech/tsone` 不新增 `./dev` export，也不引入 Happy DOM 或其他浏览器运行时依赖。
- 首版只加载普通对象默认导出的 `tsone.config.ts`，不支持 plugins、WebSocket、HMR、SSR 或函数式配置。
- proxy 只支持 HTTP/HTTPS，最长前缀优先，支持 string、`target`、`changeOrigin` 和同步 `rewrite`。
- build 只生成 Bun browser bundle 与 HTML，不复制 `public/`，不开放 minify 或 sourcemap 配置。
- 配置或入口错误必须在绑定端口、删除输出目录之前失败。
- `build.outDir` 必须是项目根目录内的子目录，不能是项目根目录或外部路径。
- CLI 包的发布产物必须内置 Happy DOM；安装 CLI 包不能要求消费者另装 Happy DOM。
- 当前 checkout 已有任务前修改；每次只暂存该任务列出的文件，并逐项检查重叠 diff。

## File Structure

- `packages/tsone-cli/package.json`：独立发布包 manifest、framework dependency、exports、bin 和脚本。
- `packages/tsone-cli/src/types.ts`：配置、resolved config、程序化 options 和结果类型。
- `packages/tsone-cli/src/config.ts`：`defineConfig()`、配置加载、默认值、路径和输入校验。
- `packages/tsone-cli/src/project.ts`：隔离 Happy DOM、入口导入、`app` 校验和 HTML 生成。
- `packages/tsone-cli/src/proxy.ts`：代理匹配、转发、header 过滤和 `502`。
- `packages/tsone-cli/src/server.ts`：开发 bundle 与 `Bun.serve()` 请求分发。
- `packages/tsone-cli/src/build.ts`：安全清理、生产 bundle、CSS/HTML 注入和 `BuildResult`。
- `packages/tsone-cli/src/cli.ts`：参数解析、命令分发、输出和退出行为。
- `packages/tsone-cli/src/index.ts`：程序化公开导出面。
- `packages/tsone-cli/bin/tsone.ts`：优先运行 `dist/cli.js`、本地缺失时运行 `src/cli.ts` 的 bin。
- `packages/tsone-cli/scripts/build.ts`：声明与 Bun 产物构建、CLI executable mode。
- `packages/tsone-cli/tests/`：配置、DOM、代理、dev、build、CLI 和 package smoke 测试。
- `playground/*/tsone.config.ts`：真实 workspace 消费者配置。

---

### Task 1: Scaffold the CLI Package and Typed Config Loader

**Files:**
- Create: `packages/tsone-cli/package.json`
- Create: `packages/tsone-cli/tsconfig.json`
- Create: `packages/tsone-cli/tsconfig.build.json`
- Create: `packages/tsone-cli/src/types.ts`
- Create: `packages/tsone-cli/src/config.ts`
- Create: `packages/tsone-cli/tests/config.test.ts`
- Create: `packages/tsone-cli/README.md`
- Create: `packages/tsone-cli/LICENSE`
- Modify: `tsconfig.json`

**Interfaces:**
- Consumes: Bun TypeScript loader, Node path/URL APIs.
- Produces: `UserConfig`, `ProxyOptions`, `ServerConfig`, `BuildConfig`, `ResolvedConfig`, `ResolveConfigOptions`, `defineConfig()`, `resolveConfig()`.

- [ ] **Step 1: Add the package manifest and TypeScript boundaries**

Create a Bun-only public package at version `0.0.1`:

```json
{
  "name": "@geektech/tsone-cli",
  "version": "0.0.1",
  "description": "Bun-native development and build CLI for TSone applications",
  "type": "module",
  "exports": {
    ".": {
      "import": "./dist/index.js",
      "types": "./dist/index.d.ts"
    }
  },
  "bin": {
    "tsone": "./bin/tsone.ts"
  },
  "scripts": {
    "build": "bun scripts/build.ts",
    "build:types": "bunx tsc --project tsconfig.build.json",
    "lint": "eslint . --ext .ts",
    "test": "bun test"
  },
  "dependencies": {
    "@geektech/tsone": "workspace:*"
  },
  "devDependencies": {
    "happy-dom": "^20.9.0"
  },
  "files": ["bin", "dist", "README.md", "LICENSE"],
  "publishConfig": { "access": "public", "registry": "https://registry.npmjs.org/" },
  "engines": { "bun": ">=1.3.0" }
}
```

The package `tsconfig.json` extends `../../tsconfig.json`, includes `src` and `tests`, and stays `noEmit`. `tsconfig.build.json` uses `rootDir: "src"`, `outDir`/`declarationDir: "dist"`, `emitDeclarationOnly: true`, and excludes tests. Add root path mapping `"@geektech/tsone-cli": ["packages/tsone-cli/src/index.ts"]` and include the new package source/tests. Copy the repository MIT license and add a concise README that names `tsone dev`, `tsone build`, and Bun `>=1.3.0` without documenting unsupported options.

- [ ] **Step 2: Write failing config tests**

```ts
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'bun:test';
import { defineConfig, resolveConfig } from '../src/config';

const roots: string[] = [];
function makeRoot(): string {
  const root = mkdtempSync(join(tmpdir(), 'tsone-cli-config-'));
  roots.push(root);
  mkdirSync(join(root, 'src'));
  writeFileSync(join(root, 'src/main.ts'), 'export const app = {};');
  return root;
}

afterEach(() => roots.splice(0).forEach((root) =>
  rmSync(root, { recursive: true, force: true })
));

describe('TSone CLI config', () => {
  it('resolves documented defaults', async () => {
    const root = makeRoot();
    expect(await resolveConfig({ root })).toMatchObject({
      root,
      entry: join(root, 'src/main.ts'),
      server: { host: '127.0.0.1', port: 52211, proxy: {} },
      build: { outDir: join(root, 'dist') },
    });
  });

  it('loads tsone.config.ts and applies inline overrides last', async () => {
    const root = makeRoot();
    writeFileSync(join(root, 'tsone.config.ts'), `
      export default {
        server: { host: '0.0.0.0', port: 4300 },
        build: { outDir: 'output' }
      };
    `);
    const result = await resolveConfig({ root, host: '127.0.0.1', port: 0 });
    expect(result.server.host).toBe('127.0.0.1');
    expect(result.server.port).toBe(0);
    expect(result.build.outDir).toBe(join(root, 'output'));
  });

  it('rejects invalid proxy keys and protocols', async () => {
    const root = makeRoot();
    await expect(resolveConfig({
      root,
      config: { server: { proxy: { api: 'http://localhost:3000' } } },
    })).rejects.toThrow('Proxy prefix must start with "/": api');
    await expect(resolveConfig({
      root,
      config: { server: { proxy: { '/api': 'ftp://localhost' } } },
    })).rejects.toThrow('Proxy target must use http or https');
  });

  it('defineConfig preserves its input', () => {
    expect(defineConfig({ server: { port: 4000 } }))
      .toEqual({ server: { port: 4000 } });
  });
});
```

- [ ] **Step 3: Run the config test and verify RED**

Run: `bun test packages/tsone-cli/tests/config.test.ts`

Expected: FAIL because `src/config.ts` does not exist.

- [ ] **Step 4: Add exact public types and minimal config resolution**

Define:

```ts
export interface ProxyOptions {
  target: string;
  changeOrigin?: boolean;
  rewrite?: (path: string) => string;
}
export interface ServerConfig {
  host?: string;
  port?: number;
  proxy?: Record<string, string | ProxyOptions>;
}
export interface BuildConfig { outDir?: string }
export interface UserConfig {
  entry?: string;
  server?: ServerConfig;
  build?: BuildConfig;
}
export interface ResolveConfigOptions {
  root?: string;
  config?: UserConfig;
  host?: string;
  port?: number;
  outDir?: string;
}
export interface ResolvedConfig {
  root: string;
  configFile?: string;
  entry: string;
  server: { host: string; port: number; proxy: Record<string, string | ProxyOptions> };
  build: { outDir: string };
}
```

`defineConfig()` returns its input. `resolveConfig()` resolves root, imports `tsone.config.ts` through `pathToFileURL()` with a cache-busting query unless `options.config` is present, merges defaults then file config then inline overrides, resolves entry/outDir against root, and validates object shape, entry existence, integer port `0..65535`, proxy prefix, and target protocol.

- [ ] **Step 5: Run focused tests and typecheck**

Run: `bun test packages/tsone-cli/tests/config.test.ts`

Expected: PASS.

Run: `bunx tsc --noEmit`

Expected: exit 0 with no error from either workspace package.

- [ ] **Step 6: Commit the package/config foundation**

```bash
git add packages/tsone-cli/package.json packages/tsone-cli/tsconfig.json packages/tsone-cli/tsconfig.build.json packages/tsone-cli/src/types.ts packages/tsone-cli/src/config.ts packages/tsone-cli/tests/config.test.ts packages/tsone-cli/README.md packages/tsone-cli/LICENSE tsconfig.json
git commit -m "feat(cli): add typed TSone CLI config"
```

### Task 2: Isolated DOM Project Rendering

**Files:**
- Create: `packages/tsone-cli/src/project.ts`
- Create: `packages/tsone-cli/tests/project.test.ts`

**Interfaces:**
- Consumes: `ResolvedConfig`, Happy DOM `Window`, `OneApp` document API from `@geektech/tsone`.
- Produces: `renderProjectHtml(config, options): Promise<string>`.

- [ ] **Step 1: Write failing project rendering tests**

Create a temp `src/main.ts` that imports the workspace framework source through an absolute file URL, exports `app`, and sets document title `External App`. Assert:

```ts
const originalDocument = globalThis.document;
const html = await renderProjectHtml(await resolveConfig({ root }), {
  scripts: [{ type: 'module', src: '/bundle.js' }],
});
expect(html).toContain('<title>External App</title>');
expect(html).toContain('<div id="app"></div>');
expect(html).toContain('src="/bundle.js"');
expect(globalThis.document).toBe(originalDocument);
```

Add an entry containing only `export const value = 1` and expect `must export an app with renderHtmlDocument()`.

- [ ] **Step 2: Run the project test and verify RED**

Run: `bun test packages/tsone-cli/tests/project.test.ts`

Expected: FAIL because `src/project.ts` does not exist.

- [ ] **Step 3: Implement isolated DOM lifecycle and entry validation**

Use the same DOM globals currently installed by `packages/tsone/scripts/playground.ts`. Record each prior property descriptor, create a Happy DOM `Window`, install globals, import `${pathToFileURL(config.entry).href}?tsone_entry=${Date.now()}`, validate `module.app.renderHtmlDocument`, render with the supplied `AppDocumentRenderOptions`, close the window, and restore/delete every changed global in `finally`.

Core boundary:

```ts
export async function renderProjectHtml(
  config: ResolvedConfig,
  options: AppDocumentRenderOptions
): Promise<string> {
  return withProjectDom(async () => {
    const module = await importProjectEntry(config.entry);
    const app = module.app as Partial<OneApp> | undefined;
    if (!app || typeof app.renderHtmlDocument !== 'function') {
      throw new Error(
        `TSone entry ${config.entry} must export an app with renderHtmlDocument()`
      );
    }
    return app.renderHtmlDocument(options);
  });
}
```

- [ ] **Step 4: Run project and framework document tests**

Run: `bun test packages/tsone-cli/tests/project.test.ts packages/tsone/lib/core/__tests__/document.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit project rendering**

```bash
git add packages/tsone-cli/src/project.ts packages/tsone-cli/tests/project.test.ts
git commit -m "feat(cli): render TSone app documents"
```

### Task 3: HTTP Proxy

**Files:**
- Create: `packages/tsone-cli/src/proxy.ts`
- Create: `packages/tsone-cli/tests/proxy.test.ts`

**Interfaces:**
- Consumes: `ServerConfig['proxy']`, Fetch API.
- Produces: `createProxyHandler(proxy): (request) => Promise<Response | undefined>`.

- [ ] **Step 1: Write failing integration tests with a real upstream server**

Start a `Bun.serve({ port: 0 })` upstream that returns request method, path/query, body and host as JSON. Configure both `/api` and the longer `/api/admin`, with the longer rule using `changeOrigin: true` and rewrite to `/v1`. POST `/api/admin/users?active=1` and assert literal output:

```ts
expect(await response?.json()).toEqual({
  method: 'POST',
  url: '/v1/users?active=1',
  body: 'payload',
  host: `127.0.0.1:${upstream.port}`,
});
```

Add tests that unmatched paths return `undefined`, `changeOrigin: false` preserves the incoming Host header, upstream response status/header/body pass through, and an unreachable target returns exactly status `502` with `Bad Gateway`.

- [ ] **Step 2: Run the proxy test and verify RED**

Run: `bun test packages/tsone-cli/tests/proxy.test.ts`

Expected: FAIL because `src/proxy.ts` does not exist.

- [ ] **Step 3: Implement proxy matching and forwarding**

Normalize string rules to `{ target }`, sort by prefix length descending, and return `undefined` before calling fetch when no rule matches. Filter these hop-by-hop headers in both directions:

```ts
const HOP_BY_HOP_HEADERS = new Set([
  'connection', 'keep-alive', 'proxy-authenticate', 'proxy-authorization',
  'te', 'trailer', 'transfer-encoding', 'upgrade',
]);
```

Join target base pathname with rewritten or original pathname, preserve query, omit body for GET/HEAD, forward the abort signal, and set Host to either target host (`changeOrigin: true`) or incoming Host (`false`). Catch upstream fetch errors and return the fixed `502` response without stack text.

- [ ] **Step 4: Run proxy tests**

Run: `bun test packages/tsone-cli/tests/proxy.test.ts`

Expected: PASS with all real upstream servers stopped in `afterEach`.

- [ ] **Step 5: Commit proxy support**

```bash
git add packages/tsone-cli/src/proxy.ts packages/tsone-cli/tests/proxy.test.ts
git commit -m "feat(cli): add HTTP development proxy"
```

### Task 4: Programmatic Development Server

**Files:**
- Create: `packages/tsone-cli/src/server.ts`
- Create: `packages/tsone-cli/src/index.ts`
- Create: `packages/tsone-cli/tests/server.test.ts`

**Interfaces:**
- Consumes: `resolveConfig`, `renderProjectHtml`, `createProxyHandler`, `Bun.build`, `Bun.serve`.
- Produces: `startDevServer(options): Promise<Server>`, public config/dev exports.

- [ ] **Step 1: Write failing external-project server tests**

Build a temp project entry with a title-bearing exported app. Start on port `0` and assert `/` returns the configured title and mount node, `/bundle.js` is JavaScript containing the app title, and `/missing` returns `404`. Add a real upstream proxy rule for `/bundle.js` and assert its response wins over the framework bundle route.

- [ ] **Step 2: Run the server test and verify RED**

Run: `bun test packages/tsone-cli/tests/server.test.ts`

Expected: FAIL because `startDevServer` is unavailable.

- [ ] **Step 3: Implement server startup after all validation**

```ts
export type StartDevServerOptions = ResolveConfigOptions;

export async function startDevServer(
  options: StartDevServerOptions = {}
): Promise<ReturnType<typeof Bun.serve>> {
  const config = await resolveConfig(options);
  const html = await renderProjectHtml(config, {
    scripts: [{ type: 'module', src: '/bundle.js' }],
  });
  const proxy = createProxyHandler(config.server.proxy);
  return Bun.serve({
    hostname: config.server.host,
    port: config.server.port,
    fetch: async (request) =>
      (await proxy(request)) ?? serveProjectRequest(request, config, html),
  });
}
```

`serveProjectRequest()` serves cached generated HTML for `/` and `/index.html`; builds `/bundle.js` with browser target, ESM, inline sourcemap and `write: false`; returns `500` with server-side Bun diagnostics on build failure; and returns `404` otherwise. Add `cache-control: no-store` to HTML and JS.

Export all public types, `defineConfig`, `resolveConfig`, and `startDevServer` from `src/index.ts`.

- [ ] **Step 4: Run dev-stack tests**

Run: `bun test packages/tsone-cli/tests/config.test.ts packages/tsone-cli/tests/project.test.ts packages/tsone-cli/tests/proxy.test.ts packages/tsone-cli/tests/server.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit the dev server**

```bash
git add packages/tsone-cli/src/server.ts packages/tsone-cli/src/index.ts packages/tsone-cli/tests/server.test.ts
git commit -m "feat(cli): expose TSone dev server"
```

### Task 5: Programmatic Production Build

**Files:**
- Create: `packages/tsone-cli/src/build.ts`
- Create: `packages/tsone-cli/tests/build.test.ts`
- Modify: `packages/tsone-cli/src/types.ts`
- Modify: `packages/tsone-cli/src/index.ts`

**Interfaces:**
- Consumes: resolved config, project renderer, Bun outputs.
- Produces: `BuildOptions`, `BuildResult`, `build(options)`.

- [ ] **Step 1: Write failing output and safety tests**

Create a temp entry importing `site.css`, exporting an app titled `Built TSone App`, and create `dist/stale.txt`. Assert build removes stale output, emits `index.html`, JS and CSS, injects `./main.js` and a stylesheet link, and returns all paths. Separately call `build({ root, outDir: root })`, expect `Build output must be a subdirectory of the project root`, and prove `src/main.ts` remains.

- [ ] **Step 2: Run build tests and verify RED**

Run: `bun test packages/tsone-cli/tests/build.test.ts`

Expected: FAIL because `build` is unavailable.

- [ ] **Step 3: Add result types and safe build implementation**

```ts
export interface BuildOptions extends ResolveConfigOptions {}
export interface BuildResult {
  root: string;
  outDir: string;
  assetsBuilt: string[];
}
```

Resolve and render the entry before cleaning. Reject root/outside/symlink escapes, then clean and create outDir. Run:

```ts
await Bun.build({
  entrypoints: [config.entry],
  outdir: config.build.outDir,
  target: 'browser',
  format: 'esm',
  naming: { entry: '[name].[ext]', chunk: '[name]-[hash].[ext]' },
});
```

Reject unsuccessful/empty output with joined Bun log messages. Convert emitted JS/CSS paths into `./` URLs, render HTML with module script and link head elements, write `index.html`, and return absolute generated paths.

- [ ] **Step 4: Run build and project tests**

Run: `bun test packages/tsone-cli/tests/build.test.ts packages/tsone-cli/tests/project.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit build API**

```bash
git add packages/tsone-cli/src/build.ts packages/tsone-cli/src/types.ts packages/tsone-cli/src/index.ts packages/tsone-cli/tests/build.test.ts
git commit -m "feat(cli): add TSone application build"
```

### Task 6: CLI Parser and Fresh-Workspace Bin

**Files:**
- Create: `packages/tsone-cli/src/cli.ts`
- Create: `packages/tsone-cli/bin/tsone.ts`
- Create: `packages/tsone-cli/tests/cli.test.ts`

**Interfaces:**
- Consumes: `startDevServer`, `build`.
- Produces: `parseCliArgs(argv)`, `runCli(argv)`, workspace/package bin `tsone`.

- [ ] **Step 1: Write failing parser and bin fallback tests**

```ts
expect(parseCliArgs(['dev', '--host', '0.0.0.0', '--port', '4300']))
  .toEqual({ command: 'dev', host: '0.0.0.0', port: 4300 });
expect(parseCliArgs(['build', '--out-dir=output']))
  .toEqual({ command: 'build', outDir: 'output' });
expect(() => parseCliArgs(['preview'])).toThrow('Unknown command: preview');
expect(() => parseCliArgs(['dev', '--open'])).toThrow('Unknown option: --open');
```

Spawn `bun packages/tsone-cli/bin/tsone.ts build --out-dir output` in a temp project while `packages/tsone-cli/dist` is absent, and assert it reaches source CLI logic and creates `output/index.html`.

- [ ] **Step 2: Run CLI tests and verify RED**

Run: `bun test packages/tsone-cli/tests/cli.test.ts`

Expected: FAIL because parser and bin do not exist.

- [ ] **Step 3: Implement exact command parsing and dispatch**

Only accept:

```text
tsone dev [--host <host>] [--port <port>]
tsone build [--out-dir <path>]
```

Support separated and `=` forms, reject missing values/unknown options/ports outside `0..65535`, and append both usage lines to thrown parse errors. `runCli()` calls the public functions and logs `server.hostname`, actual `server.port`, output directory and asset count.

- [ ] **Step 4: Add the source/dist-selecting bin**

```ts
#!/usr/bin/env bun
import { existsSync } from 'node:fs';

const builtCli = new URL('../dist/cli.js', import.meta.url);
const sourceCli = new URL('../src/cli.ts', import.meta.url);
const cli = (await import(existsSync(builtCli) ? builtCli.href : sourceCli.href))
  as { runCli: () => Promise<void> };
await cli.runCli();
```

Keep command execution out of `src/index.ts`; importing programmatic API must not start a process or server.

- [ ] **Step 5: Run CLI and build tests**

Run: `bun test packages/tsone-cli/tests/cli.test.ts packages/tsone-cli/tests/build.test.ts packages/tsone-cli/tests/server.test.ts`

Expected: PASS.

- [ ] **Step 6: Commit CLI/bin**

```bash
git add packages/tsone-cli/src/cli.ts packages/tsone-cli/bin/tsone.ts packages/tsone-cli/tests/cli.test.ts
git commit -m "feat(cli): add TSone command line interface"
```

### Task 7: Build and Package the CLI Independently

**Files:**
- Create: `packages/tsone-cli/scripts/build.ts`
- Create: `packages/tsone-cli/tests/package-smoke.test.ts`
- Modify: `package.json`
- Modify: `bun.lock`

**Interfaces:**
- Consumes: CLI source, framework package tarball, Bun pack/install.
- Produces: `dist/index.js`, `dist/cli.js`, declarations, installable `@geektech/tsone-cli` tarball.

- [ ] **Step 1: Write failing package smoke test**

The test must:

1. Build and pack `packages/tsone` and `packages/tsone-cli` into a temp directory.
2. Assert the CLI tarball contains `bin/tsone.ts`, `dist/index.js`, `dist/index.d.ts`, `dist/cli.js`, README, LICENSE and manifest.
3. Install both local tarballs into a temp project.
4. Type-check a config importing `defineConfig`, `UserConfig`, `startDevServer`, and `build` from `@geektech/tsone-cli`.
5. Create `src/main.ts` importing installed `@geektech/tsone`, export `app`, run installed `tsone build`, and assert `dist/index.html`/`main.js`.
6. Start the installed `tsone dev --port 0`, wait for its printed URL, request `/` and `/bundle.js`, assert `200`, then stop it.
7. Assert consumer `node_modules` does not install `happy-dom` as a transitive package.

- [ ] **Step 2: Run package smoke and verify RED**

Run: `bun test packages/tsone-cli/tests/package-smoke.test.ts`

Expected: FAIL because CLI build script and dist do not exist.

- [ ] **Step 3: Implement independent declaration and Bun builds**

`scripts/build.ts` removes only `packages/tsone-cli/dist`, runs `bunx tsc --project tsconfig.build.json`, then bundles `src/index.ts` and `src/cli.ts` with Bun target, ESM, linked sourcemaps, splitting, and output root `src`. Do not externalize Happy DOM. Fail with all Bun log messages and `chmod(dist/cli.js, 0o755)` after success.

- [ ] **Step 4: Make root build/type/lint scripts cover both public packages**

Preserve current command names and change them to run framework then CLI package, for example:

```json
{
  "build": "bun run --cwd packages/tsone build && bun run --cwd packages/tsone-cli build",
  "build:types": "bun run --cwd packages/tsone build:types && bun run --cwd packages/tsone-cli build:types",
  "lint": "bun run --cwd packages/tsone lint && bun run --cwd packages/tsone-cli lint"
}
```

Run `bun install` to register the workspace dependency and bin; inspect `bun.lock` so only expected workspace metadata is staged.

- [ ] **Step 5: Run build and installed-package smoke**

Run: `bun run --cwd packages/tsone-cli build`

Expected: exit 0 with both JS entries and declarations.

Run: `bun test packages/tsone-cli/tests/package-smoke.test.ts`

Expected: PASS.

- [ ] **Step 6: Commit package build/publishing**

```bash
git add packages/tsone-cli/scripts/build.ts packages/tsone-cli/tests/package-smoke.test.ts package.json bun.lock
git commit -m "build(cli): package TSone CLI for Bun"
```

### Task 8: Migrate the Playgrounds to TSone CLI

**Files:**
- Create: `playground/official-site/tsone.config.ts`
- Create: `playground/admin-dashboard/tsone.config.ts`
- Modify: `playground/official-site/package.json`
- Modify: `playground/admin-dashboard/package.json`
- Modify: `packages/tsone/tests/example-entry.test.ts`
- Modify: `packages/tsone/tests/dev-server.test.ts`
- Delete: `packages/tsone/scripts/dev.ts`
- Delete: `packages/tsone/scripts/playground.ts`
- Delete: `packages/tsone/scripts/playground-build.ts`
- Modify: `packages/tsone/package.json`
- Modify: `tsconfig.json`
- Modify: `bun.lock`

**Interfaces:**
- Consumes: workspace `@geektech/tsone-cli` and `tsone` bin.
- Produces: two real config consumers and removal of fixed-app tooling.

- [ ] **Step 1: Write failing migration assertions**

Extend `example-entry.test.ts` to parse both manifests and assert `dev: 'tsone dev'`, `build: 'tsone build'`, both config files exist, and both app entries still export/render their existing titles. Keep the behavioral loop that runs each real package build and validates generated title, mount node and `./main.js`.

Rewrite `dev-server.test.ts` to spawn the workspace `tsone dev` command from each playground root on an available port. Reuse its existing wait/cleanup helpers, and retain the current assertions for each title, mount node, JavaScript content type and app-specific bundle text.

- [ ] **Step 2: Run the playground test and verify RED**

Run: `bun test packages/tsone/tests/example-entry.test.ts`

Expected: FAIL because scripts/configs still use fixed-app tooling.

- [ ] **Step 3: Add config and dependency to each playground**

```ts
import { defineConfig } from '@geektech/tsone-cli';

export default defineConfig({
  entry: 'src/main.ts',
});
```

Each package keeps `@geektech/tsone` in dependencies, adds `@geektech/tsone-cli: "workspace:*"` to devDependencies, and uses `tsone dev`/`tsone build`. Include `playground/*/tsone.config.ts` in root TypeScript inputs.

- [ ] **Step 4: Remove fixed-app scripts only after reference audit**

Run: `rg -n "scripts/dev|playground-build|PLAYGROUND_APPS|--app" package.json packages playground`

Delete the three old package scripts and remove obsolete `dev` script metadata from `packages/tsone/package.json` only after every remaining reference is migrated. Preserve unrelated docs and framework scripts.

- [ ] **Step 5: Run both playground builds and dev smoke**

Run: `bun test packages/tsone/tests/example-entry.test.ts`

Expected: PASS.

Run: `bun run --cwd playground/official-site typecheck && bun run --cwd playground/admin-dashboard typecheck`

Expected: both exit 0.

Start each workspace `tsone dev` on port `0`, read its actual printed port, assert `/` and `/bundle.js` return `200`, then terminate it.

- [ ] **Step 6: Commit migration**

```bash
git add playground/official-site/tsone.config.ts playground/admin-dashboard/tsone.config.ts playground/official-site/package.json playground/admin-dashboard/package.json packages/tsone/tests/example-entry.test.ts packages/tsone/tests/dev-server.test.ts packages/tsone/scripts/dev.ts packages/tsone/scripts/playground.ts packages/tsone/scripts/playground-build.ts packages/tsone/package.json tsconfig.json bun.lock
git commit -m "refactor(cli): migrate playgrounds to TSone CLI"
```

### Task 9: Documentation and Project Guide

**Files:**
- Modify: `AGENTS.md`
- Modify: `packages/tsone-cli/README.md`
- Modify: `packages/tsone/README.md`
- Modify: `packages/tsone/README-zh.md`
- Modify: `packages/tsone/docs/app/content/guide.ts`
- Modify: `packages/tsone/docs/app/content/api.ts`
- Modify: `packages/tsone/docs/app/content/contributing.ts`
- Modify: `packages/tsone/tests/public-api-docs.test.ts`
- Modify: `packages/tsone/tests/docs-content.test.ts`

**Interfaces:**
- Consumes: final package/import/CLI contracts.
- Produces: accurate contributor and consumer documentation for both packages.

- [ ] **Step 1: Add failing docs discoverability tests**

Import the CLI source API as `import * as cliApi from '../../tsone-cli/src'` in `public-api-docs.test.ts`, combine README, `/guide/getting-started/` and `/api/app/` text, and assert that `cliApi` exports `defineConfig`, `startDevServer`, and `build`, while the combined text contains those names plus `@geektech/tsone-cli`, `tsone.config.ts`, `server.proxy`, `tsone dev`, and `tsone build`. Add the lowercase config/CLI terms to the existing searchable typed docs term array.

- [ ] **Step 2: Run docs tests and verify RED**

Run: `bun test packages/tsone/tests/public-api-docs.test.ts packages/tsone/tests/docs-content.test.ts`

Expected: FAIL because the new package and commands are not documented.

- [ ] **Step 3: Document exact supported usage**

Document installation of both packages, required `app` export, defaults, proxy string/object syntax, CLI overrides, programmatic API, HTTP-only limitation, and excluded plugins/HMR/public copying. Use this config in English, Chinese and typed docs:

```ts
import { defineConfig } from '@geektech/tsone-cli';

export default defineConfig({
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
  build: { outDir: 'dist' },
});
```

Update `AGENTS.md` from “only publish package” to the two-package map, adding CLI commands/tests without changing existing framework constraints.

- [ ] **Step 4: Run docs and render verification**

Run: `bun test packages/tsone/tests/public-api-docs.test.ts packages/tsone/tests/docs-content.test.ts packages/tsone/tests/docs-app.test.ts`

Expected: PASS.

Run: `bun run docs:build`

Expected: exit 0 with generated docs ignored.

- [ ] **Step 5: Commit docs**

```bash
git add AGENTS.md packages/tsone-cli/README.md packages/tsone/README.md packages/tsone/README-zh.md packages/tsone/docs/app/content/guide.ts packages/tsone/docs/app/content/api.ts packages/tsone/docs/app/content/contributing.ts packages/tsone/tests/public-api-docs.test.ts packages/tsone/tests/docs-content.test.ts
git commit -m "docs(cli): document TSone development tooling"
```

### Task 10: Full Verification and Scope Audit

**Files:**
- Review only: Tasks 1–9 plus pre-existing worktree changes.

**Interfaces:**
- Consumes: complete two-package implementation.
- Produces: fresh evidence for behavior, types, builds, packaging and scope.

- [ ] **Step 1: Run all tests and static checks**

Run: `bun test`

Expected: all tests pass.

Run: `bunx tsc --noEmit`

Expected: exit 0.

Run: `bun run lint`

Expected: exit 0 without new warnings/errors.

Run: `git diff --check`

Expected: no whitespace errors.

- [ ] **Step 2: Build both packages from root**

Run: `bun run build`

Expected: framework browser artifacts and CLI Bun artifacts both build successfully.

- [ ] **Step 3: Verify both package tarballs**

Run: `bun pm pack --cwd packages/tsone --dry-run`

Expected: framework package still contains only its intended browser/runtime surface and no CLI/Happy DOM source.

Run: `bun pm pack --cwd packages/tsone-cli --dry-run`

Expected: CLI tarball contains bin, dist, declarations, README, LICENSE and manifest, without playground or local generated files.

- [ ] **Step 4: Verify real playground commands**

Run both playground `build` and `typecheck` scripts. Start both `dev` scripts on available ports and request `/`, `/bundle.js`, and a missing route; expected statuses are `200`, `200`, `404`.

- [ ] **Step 5: Audit task commits and dirty worktree preservation**

Run: `git status --short`

Run: `git log --oneline --max-count=12`

Run: `git diff --stat HEAD~9..HEAD`

Expected: nine implementation commits contain only their task files; unrelated pre-task changes remain preserved. Inspect staged/unstaged hunks in overlapping files such as `AGENTS.md`, `bun.lock`, root/package manifests, README files and playground scripts.

- [ ] **Step 6: Report only evidence-backed completion**

List changed packages, public API, CLI commands, configs, exact verification commands and exit results. Call out any skipped check or exact failing test; do not claim completion if installed-package, proxy, build, type or playground verification is missing.
