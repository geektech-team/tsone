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
```

The export must be written as `export const app`; a default export or another
name is not used by the CLI.

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
- `server.host`: `127.0.0.1`
- `server.port`: `52211`
- `server.proxy`: `{}`
- `build.outDir`: `dist`

`build.outDir` must resolve to a child directory inside the project root. The
project root itself, an outside path, and a path that escapes through a symlink
are rejected before the output directory is removed.

## Command Line

Development and build options are deliberately separate:

```text
tsone dev [--host <host>] [--port <port>]
tsone build [--out-dir <path>]
```

`dev` accepts only `--host` and `--port`; `build` accepts only `--out-dir`.
Options override `tsone.config.ts`. Both separated and equals forms work, for
example `--port 3000`, `--port=3000`, `--out-dir output`, and
`--out-dir=output`.

`tsone dev` serves the generated HTML at `/` and `/index.html`. Each document
build writes an immutable browser ESM generation beneath the internal
`.tsone/dev/` directory and references exact `/dev/<session>/<generation>/...`
JavaScript and stylesheet URLs. Bun uses that exact generation URL as its
public path, so emitted file-asset strings are absolute URLs under the same
generation and resolve correctly from the document URL across concurrent pages.
`/bundle.js` remains a compatibility alias that rebuilds and redirects to the
latest exact entry URL. Other unmatched paths return 404. The `.tsone/`
directory is generated tooling output and can be removed while the development
server is stopped. A `.tsone` path that resolves outside the project through a
symlink is rejected before the development server starts.

`tsone build` writes a Bun browser bundle and `index.html` to the safe output
directory.

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
  `entry`, and `build.outDir` values plus the resolved server configuration.
- `startDevServer(options?)` resolves the configuration and returns the Bun
  server. The caller owns its lifecycle and must call `server.stop()`.
- `build(options?)` validates the entry and output path, then returns
  `{ root, outDir, assetsBuilt }`; the paths in the result are absolute.

## Version 1 Scope

The development server serves HTTP only. Proxy targets may use HTTP or HTTPS.
CLI v1 has no config plugins, WebSocket, HMR, SSR, functional config, `public/`
directory copying, or public `minify` and `sourcemap` configuration.
Development bundles use an internal inline source map, while production build
minification and source-map controls are intentionally not configurable.
