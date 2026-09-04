# TSone CLI

`@geektech/tsone-cli` is the Bun-native development and build CLI for TSone
applications. It requires Bun `>=1.3.0`.

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
  build: { outDir: 'dist' },
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
- `build.outDir`: `dist`

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

## Command Line

`tsone create` scaffolds a basic TSone project into the current directory:
`package.json`, `tsone.config.ts`, `tsconfig.json`, `.gitignore`, and a
`src/main.ts` homepage that shows the TSone name and a link to the framework
GitHub repository. It refuses to overwrite existing files.

Development and build options are deliberately separate:

```text
tsone create
tsone dev [--host <host>] [--port <port>] [--no-watch]
tsone build [--out-dir <path>]
```

`create` takes no options. `dev` accepts `--host`, `--port`, and `--no-watch`;
`build` accepts only `--out-dir`. Options override `tsone.config.ts`. Both
separated and equals forms work, for example `--port 3000`, `--port=3000`,
`--out-dir output`, and `--out-dir=output`.

`tsone dev` watches the project by default: when a source, style, or config
file changes it rebuilds the current page and notifies connected browsers to
reload over a server-sent events stream at `/__tsone/reload`, so the page
updates without a manual refresh. A failed rebuild keeps the last working page
served, and changes to `tsone.config.ts` restart the development server with
the fresh configuration. Pass `--no-watch` to disable file watching and keep
the server as a plain on-demand builder.

`tsone dev` serves the generated HTML at `/` and `/index.html`, plus one route
per configured page. Each document build writes an immutable browser ESM
generation beneath the internal `.tsone/dev/` directory and references exact
`/dev/<session>/<generation>/...` JavaScript and stylesheet URLs. Bun uses that
exact generation URL as its public path, so emitted file-asset strings are
absolute URLs under the same generation and resolve correctly from the document
URL across concurrent pages. `/bundle.js` remains a compatibility alias that
rebuilds and redirects to the latest root entry URL. Other unmatched paths
return 404. The `.tsone/` directory is generated tooling output and can be
removed while the development server is stopped. A `.tsone` path that resolves
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
  `entry`, and `build.outDir` values, the resolved `pages` route map, plus the
  resolved server configuration.
- `startDevServer(options?)` resolves the configuration and returns the Bun
  server. The caller owns its lifecycle and must call `server.stop()`.
- `build(options?)` validates the entry and output path, then returns
  `{ root, outDir, assetsBuilt }`; the paths in the result are absolute.
- `createProject(options?)` writes a basic TSone scaffold into `options.root`
  (defaults to the current working directory) and returns
  `{ root, files }`; it refuses to overwrite existing files.

## Version 1 Scope

The development server serves HTTP only. Proxy targets may use HTTP or HTTPS.
CLI v1 has no config plugins, WebSocket, HMR, SSR, functional config,
`public/` directory copying, or public `minify` and `sourcemap`
configuration. Development bundles use an internal inline source map, while
`tsone build` minifies production output by default; minification and
source-map controls are intentionally not configurable.
