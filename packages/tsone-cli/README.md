# TSone CLI

`@geektech/tsone-cli` is the Bun-native development and build CLI for TSone
applications. It requires Bun `>=1.3.0`.

**Documentation:** <https://geektech-team.github.io/tsone/cli/>

## Installation

Install the framework and its development tooling together:

```bash
bun add @geektech/tsone @geektech/tsone-cli
```

## Application Entry

The default entry is `src/main.ts`. It must export a named `app` whose value
provides `renderHtmlDocument()`; a TSone application created by `createApp`
satisfies that contract:

```typescript
import { Component, VNode, createApp } from '@geektech/tsone';

class App extends Component<object, object> {
  protected initState(): object {
    return {};
  }

  protected initStyles(): void {}

  protected render(): VNode {
    return { tag: 'main', children: ['Hello TSone'] };
  }
}

export const app = createApp({
  root: App,
  document: { title: 'TSone App' },
});

app.mount();
```

The export must be written as `export const app`; a default export or another
name is not used by the CLI. `entry` is the root page (served at `/` and built
to `index.html`).

## Configuration

Create an optional `tsone.config.ts` in the project root. The config file
supports only a plain-object default export; functional or function-valued
config is not supported. `defineConfig()` supplies type checking without
changing the object.

```typescript
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
  build: { outDir: 'dist/build/h5' },
});
```

A proxy can also use the string shorthand when no other options are needed:

```typescript
export default defineConfig({
  server: {
    proxy: {
      '/backend': 'http://localhost:4000',
    },
  },
});
```

Defaults:

- `entry`: `src/main.ts`
- `pages`: `{}` (no additional pages)
- `server.host`: `127.0.0.1`
- `server.port`: `52211`
- `server.proxy`: `{}`
- `build.outDir`: `dist/build/h5`
- `build.basePath`: `''`
- `build.directoryPages`: `false`
- `mp`: absent by default; enabled by the `mp` block or by `tsone build
  --mp-weixin` (see [Mini Program Builds](#mini-program-builds))

`build.outDir` must resolve to a child directory inside the project root. The
project root itself, an outside path, and a path that escapes through a symlink
are rejected before the output directory is removed.

## Multi-Page Applications

Configure additional pages with the `pages` option, mapping each route to a
page entry. Every page entry must satisfy the same `app` contract as `entry`:

```typescript
import { defineConfig } from '@geektech/tsone-cli';

export default defineConfig({
  entry: 'src/main.ts',
  pages: {
    '/about': 'src/about.ts',
    '/docs/guide': 'src/guide.ts',
  },
});
```

Route keys must start with `/` and may nest; trailing slashes are normalized
(`'/about/'` is served the same as `'/about'`). The root route `/` cannot be
redefined in `pages` — use `entry` for it. Each route maps to its own entry,
so every page bundles and renders independently.

During development each configured page is served at its route: `/about/`
and `/about/index.html` also resolve to `/about`, and every page receives its
own live-reload injection. `tsone build` emits one HTML document per page,
using the page route for the filename (`index.html` for `/`, `about.html` for
`/about`, `docs/guide.html` for `/docs/guide`) with asset URLs relative to that
document.

Set `build.directoryPages` to emit every page as a directory with an
`index.html` (`docs/guide/index.html`) instead of a flat `docs/guide.html`.
Directory-style output suits static hosts that map URLs to folders, and is what
you want when the same entry drives many data-driven pages.

`build.basePath` prepends a URL prefix to every rendered document URL. It is
intended for deploying the whole site under a sub-path (for example
`/tsone/one` on GitHub Pages). The app receives the base path and page route
through `window.location` during SSR, so base-path-aware links and the
`data-doc-base`-style document attribute come out with the prefix, while thefile layout on disk stays under `outDir`.

## Library Builds

`tsone build` defaults to a site build (one browser bundle per entry plus HTML
documents). Pass `--library` to build an npm library instead: it reads the
`library` block of `tsone.config.ts`, emits a publishable ESM bundle plus
`.d.ts` declarations, and does not touch the site output.

```typescript
import { defineConfig } from '@geektech/tsone-cli';

export default defineConfig({
  entry: 'src/main.ts', // site build entry, unrelated to the library
  build: { outDir: 'dist-site' },
  library: {
    entry: 'lib/index.ts',
    outDir: 'dist',
    external: ['@geektech/tsone', '@geektech/tsone/style'],
    tsconfigs: ['../framework/tsconfig.build.json', 'tsconfig.build.json'],
  },
});
```

Library options:

- `entry`: bundle entry, default `src/index.ts`.
- `outDir`: output directory, default `dist`.
- `external`: package names kept as external imports instead of inlined.
- `tsconfigs`: tsconfig files run in order with `tsc --project` to emit
  `.d.ts`. Use this to compile a framework's declarations first when your
  `paths` map to its `dist` output, then your own.
- `dts`: emit declarations with tsc, default `true`. Set to `false` for a
  bundle-only build.
- `splitting`: code splitting, default `true`.
- `sourcemap`: linked sourcemaps, default `true`.
- `minify`: default controlled by `TSONE_MINIFY` (minified unless set to `0`).

The bundle targets browsers (`target: 'browser'`, `format: 'esm'`). A library
build does not require a site `entry`, so a library-only project can omit it.

## Mini Program Builds

Pass `--mp-weixin` to `tsone build` to compile the app into a native WeChat
Mini Program project instead of a web site. The compiler statically analyzes
each page's `render()` and emits a self-contained project under
`dist/build/mp-wx` (or the configured `mp.outDir`) with no framework runtime:
`app.json`, `app.js`, `app.wxss`, `project.config.json`, one directory per
page (`pages/<route>/`), and one directory per custom component
(`components/<tag>/`).

```typescript
import { defineConfig } from '@geektech/tsone-cli';

export default defineConfig({
  entry: 'src/main.ts', // root page entry, also used as the "/" mini program page
  mp: {
    appId: 'wx1234567890', // default 'touristappid'（微信开发者工具测试号）
    outDir: 'dist/build/mp-wx', // default
    navigationBarTitleText: 'My Mini App', // default 'TSone'
    pages: {
      '/': 'src/main.ts',
      '/about': 'src/about.ts',
    },
    // app.json.window 合并（可选）
    window: { navigationBarBackgroundColor: '#1c2333' },
    // 底部 tabBar（可选）
    tabBar: {
      color: '#333333',
      selectedColor: '#1c2333',
      list: [{ pagePath: 'pages/index/index', text: '首页' }],
    },
    // 其他 app.json 顶层字段（可选）
    appExtra: { lazyCodeLoading: 'requiredComponents' },
    // 页面级 json 合并（可选）
    pageExtra: { '/': { enablePullDownRefresh: true } },
    // 数字长度单位（可选）：'px' | 'rpx'
    lengthUnit: 'rpx',
    // 静态资源目录（可选，默认 public）
    publicDir: 'public',
    // App 全局数据（可选）
    globalData: { version: '1.0.0' },
  },
});
```

Mini program options:

- `appId`: mini program appid written to `project.config.json`; default
  `touristappid`.
- `outDir`: output directory; default `dist/build/mp-wx`. `--out-dir`
  overrides it.
- `navigationBarTitleText`: global navigation bar title; default `TSone`.
- `pages`: mini program page routes (route → entry file). Routes must start
  with `/`; `'/'` is the root page. When omitted, `config.pages` is reused.
- `window`: extra fields merged into `app.json.window` (e.g.
  `navigationBarBackgroundColor`).
- `tabBar`: complete `app.json.tabBar` object (bottom tab bar).
- `appExtra`: other top-level `app.json` fields (e.g.
  `lazyCodeLoading: 'requiredComponents'`, `permission`,
  global `usingComponents`).
- `pageExtra`: per-page json fields keyed by route (e.g.
  `{ '/': { enablePullDownRefresh: true } }`).
- `lengthUnit`: style unit for numeric lengths, `'px'` (default) or `'rpx'`
  (numbers are converted at 1px = 2rpx for a 375pt design width).
- `publicDir`: static assets directory copied into the bundle (only files
  that don't collide with generated project files); default `public`,
  skipped when absent.
- `globalData`: static app data written into `app.js` as
  `App({ globalData })`.

The compiler supports the static subset of TSone's command-style rendering:
`h`/`Tag`/element shortcuts (`Div`, `Span`, ...), `createComponent` (including
the `{ component, props, emitters }` object form), `each`, `slot`, ternary and
`&&` conditionals, plus `initState()`/`initStyles()` static declarations.
WXML semantics apply: `this.state` reads compile to `{{...}}` bindings,
`setState`/`this.state.x = ...` compile to `setData`, `click` maps to `tap`,
HTML tags map to WXML base components (`div` → `view`, `span` → `text`,
`a` → `navigator`, `img` → `image`), and `body` styles merge into `app.wxss`
as `page`. WeChat-specific components are first-class: `scroll-view`,
`swiper`, `picker`, `switch`, `checkbox-group`, `radio-group`, `slider`,
`progress`, `map`, `video`, `canvas`, `rich-text`, `ad`, and more compile to
their native WXML tags, and camelCase props become kebab attributes
(`scrollX` → `scroll-x`, `dataId` → `data-id` for `dataset` reads).

List-item interactions work through dataset: write `dataId: item.id` on the
element and bind `onClick: (e) => this.selectRow(e)`; the generated WXML uses
`data-id="{{item.id}}"` + `bindtap="selectRow"`, and the method reads
`e.currentTarget.dataset.id` (this works in the H5 build too, where the DOM
event exposes `currentTarget.dataset`).

Page-level WeChat lifecycles map by same-name methods: `onShow`, `onHide`,
`onPullDownRefresh`, `onReachBottom`, `onShareAppMessage`, `onPageScroll`,
`onResize` land on `Page({ ... })` in addition to the TSone
`beforeMount`/`onMounted`/`onUnmounted` mapping. `hover` styles compile to a
`.selector-hover` WXSS block and the element gets `hover-class` automatically.

Numeric style lengths get a unit (`fontSize: 28` → `font-size: 28px`, or
`28rpx` × 2 under `lengthUnit: 'rpx'`), while `0`, `opacity`, `line-height`,
`font-weight` and other unitless properties stay bare. Templates cannot call
methods (`item.score.toFixed(1)` fails fast with a Chinese error): precompute
formatted values into state instead. Anything else that cannot be statically
compiled fails fast with a Chinese error message — fix the source instead of
patching the output.

Component events use the `emitters` object form and `this.emit('name', ...)`:
the compiler wires them to native `triggerEvent`/`bind:<event>` and restores
the arguments through `event.detail.args`.

`tsone dev --mp-weixin` runs the same compiler in watch mode: it builds the
mini program project into `dist/dev/mp-wx` on startup and recompiles when a
source, style, or config file changes, so a WeChat DevTools project can stay
open against a regenerating output directory. There is no HTTP server in this
mode; `dist/dev/mp-wx` mirrors the production `dist/build/mp-wx` layout.

## Command Line

`tsone create` scaffolds a basic TSone project into the current directory:
`package.json`, `tsone.config.ts`, `tsconfig.json`, `.gitignore`, and a
`src/main.ts` homepage that shows the TSone name and a link to the framework
GitHub repository. It refuses to overwrite existing files.

Development and build options are deliberately separate:

```text
tsone create
tsone dev [--host <host>] [--port <port>] [--no-watch] [--mp-weixin]
tsone build [--out-dir <path>] [--library] [--mp-weixin]
```

`create` takes no options. `dev` accepts `--host`, `--port`, `--no-watch`, and
`--mp-weixin`; `build` accepts `--out-dir`, `--library`, and `--mp-weixin`.
Options override `tsone.config.ts`. Both separated and equals forms work, for
example `--port 3000`, `--port=3000`, `--out-dir output`, and
`--out-dir=output`. `--library` switches `build` from a site build to the npm
library build described above; `--mp-weixin` switches it to the mini program
build described above (mutually exclusive with `--library`). With `dev`,
`--mp-weixin` replaces the HTTP server with a watch mode that recompiles the
mini program project into `dist/dev/mp-wx` on source changes.

`tsone dev` watches the project by default: when a source, style, or config
file changes it rebuilds the current page and notifies connected browsers to
reload over a server-sent events stream at `/__tsone/reload`, so the page
updates without a manual refresh. A failed rebuild keeps the last working page
served, and changes to `tsone.config.ts` restart the development server with
the fresh configuration. Pass `--no-watch` to disable file watching and keep
the server as a plain on-demand builder.

`tsone dev` serves the generated HTML at `/` and `/index.html`, plus one route
per configured page. Each document build writes an immutable browser ESM
generation beneath the `dist/dev/h5/` directory and references exact
`/dev/<session>/<generation>/...` JavaScript and stylesheet URLs. Bun uses that
exact generation URL as its public path, so emitted file-asset strings are
absolute URLs under the same generation and resolve correctly from the document
URL across concurrent pages. `/bundle.js` remains a compatibility alias that
rebuilds and redirects to the latest root entry URL. Other unmatched paths
return 404. The `dist/dev/` directory is generated tooling output and can be
removed while the development server is stopped. A `dist` path that resolves
outside the project through a symlink is rejected before the development server
starts.

`tsone build` writes a Bun browser bundle and one HTML document per page to the
safe output directory.

## Development Proxy

The development server serves HTTP only. Proxy targets may use HTTP or HTTPS.
A rule is matched as a literal pathname prefix, and the longest matching prefix
wins. The proxy preserves the query string, request method, request body, and
end-to-end headers while removing hop-by-hop headers. `changeOrigin: true`
changes the upstream `Host` header; otherwise the incoming host is retained.
`rewrite` synchronously changes the pathname before it is joined to the target
base path. An upstream connection failure returns the fixed response
`502 Bad Gateway`.

## Programmatic API

All tooling APIs come from `@geektech/tsone-cli`, not from the framework root:

```typescript
import {
  build,
  createProject,
  defineConfig,
  resolveConfig,
  startDevServer,
} from '@geektech/tsone-cli';

const config = defineConfig({ build: { outDir: 'output' } });
const resolved = await resolveConfig({ root: process.cwd(), config });
const server = await startDevServer({ root: resolved.root, port: 0 });

try {
  console.log(server.url);
} finally {
  server.stop();
}

const result = await build({ root: resolved.root, outDir: 'release' });
console.log(result.root, result.outDir, result.assetsBuilt);
```

- `defineConfig(config)` returns the same typed config object.
- `resolveConfig(options?)` validates and merges defaults, a config file,
  direct config, and host/port/outDir overrides. It returns absolute `root`,
  `entry`, and `build.outDir` values, the resolved `pages` route map, the
  resolved server configuration, and the resolved `library` configuration when
  one is declared.
- `startDevServer(options?)` resolves the configuration and returns the Bun
  server. The caller owns its lifecycle and must call `server.stop()`.
- `build(options?)` validates the entry and output path, then returns
  `{ root, outDir, assetsBuilt }`; the paths in the result are absolute. Pass
  `{ library: true }` to run the library build instead of the site build.
- `createProject(options?)` writes a basic TSone scaffold into `options.root`
  (defaults to the current working directory) and returns
  `{ root, files }`; it refuses to overwrite existing files.

## Version 1 Scope

The development server serves HTTP only. Proxy targets may use HTTP or HTTPS.
CLI v1 has no config plugins, WebSocket, HMR, SSR, functional config,
`public/` directory copying, or public `minify` and `sourcemap`
configuration for site builds. Development bundles use an internal inline
source map, and `tsone build` minifies production output by default. Library
builds (`tsone build --library`) expose `minify` and `sourcemap` controls via
the `library` config block.
