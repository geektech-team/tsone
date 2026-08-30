# TSone

English | [简体中文](./README-zh.md)

A lightweight frontend framework written entirely in TypeScript, with
reactivity, class-based components, strategy-driven rendering, and routing.

## Features

- TypeScript-first implementation with typed public APIs
- Bun-native tooling for installation, testing, builds, playgrounds, and docs
- Documentation backed by a TypeScript typed-content registry
- Reactive primitives: `reactive`, `effect`, and `computed`
- Object-oriented components with `Component<Props, State>`, lifecycle hooks,
  events, and slots
- Strategy-based rendering that dispatches text, elements, components, and
  slots by VNode type
- Built-in routing with `createRouter`, `RouterView`, and `RouterLink`
- Lightweight runtime with no external production dependencies

## Repository Structure

This repository is a Bun workspace monorepo with two published packages:
`packages/tsone/` contains the browser framework `@geektech/tsone`, and
`packages/tsone-cli/` contains the Bun-native development tooling
`@geektech/tsone-cli`. Standalone example projects live in the root
`playground/` directory.

## Installation

```bash
bun add @geektech/tsone @geektech/tsone-cli
```

```bash
pnpm add @geektech/tsone @geektech/tsone-cli
```

The framework and CLI require Bun `>=1.3.0` for the documented workflow.

## Quick Start

```typescript
import {
  Component,
  VNode,
  createApp,
  computed,
  reactive,
} from '@geektech/tsone';

interface AppState {
  count: number;
  version: string;
}

class App extends Component<Record<string, never>, AppState> {
  protected initState(): AppState {
    return {
      count: 0,
      version: '0.0.2',
    };
  }

  protected initStyles(): void {}

  protected render(): VNode {
    return {
      tag: 'main',
      props: { className: 'app' },
      children: [
        { tag: 'h1', children: ['TSone'] },
        { tag: 'p', children: [`version: '{{version}}'`] },
        {
          tag: 'button',
          listeners: {
            click: () => {
              this.state.count += 1;
            },
          },
          children: [`count: {{count}}`],
        },
      ],
    };
  }
}

const state = reactive({ ready: true });
const status = computed(() => (state.ready ? 'ready' : 'pending'));

const app = createApp({ root: App, state });
app.mount();

console.log(status.value);
```

`createApp` uses `#app` as its default mount target, so an application can call
`app.mount()` immediately after creation. If the target is not currently in the
document, `mount()` safely skips that attempt. Pass `rootElement` only when you
need to override the default target.

## Development Tooling

The separate `@geektech/tsone-cli` package provides `tsone dev` and
`tsone build`. Its default entry is `src/main.ts`; that module must expose the
application as `export const app`, and the value must provide
`renderHtmlDocument()`.

Create an optional `tsone.config.ts` at the project root:

The config file supports only a plain-object default export; functional or
function-valued config is not supported.

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

The string proxy shorthand is also supported, for example
`{ '/backend': 'http://localhost:4000' }`. Defaults are `src/main.ts`,
`127.0.0.1`, port `52211`, an empty `server.proxy`, and `dist`.

```text
tsone dev [--host <host>] [--port <port>]
tsone build [--out-dir <path>]
```

`dev` accepts host/port overrides and `build` accepts the output-directory
override; both `--port 3000` and `--port=3000` forms are valid. Build output
must remain a safe child directory inside the project root.

Programmatic tooling is imported from `@geektech/tsone-cli`, not from the
framework root. It exports `defineConfig`, `resolveConfig`, `startDevServer`,
and `build`. The dev server is owned by the caller, which must call
`server.stop()`; `build()` returns absolute `root` and `outDir` values plus
`assetsBuilt`.

The development server serves HTTP only. Proxy targets may use HTTP or HTTPS.
Rules use literal prefix matching with the longest match first, retain
query/body/end-to-end headers, optionally apply `changeOrigin` and `rewrite`,
and return `502 Bad Gateway` when the upstream is unreachable. CLI v1 has no
config plugins, WebSocket, HMR, SSR, functional config, `public/` copying, or
public minify/sourcemap settings.

## Routing

```typescript
import { Component, VNode, createApp } from '@geektech/tsone';
import { RouterLink, RouterView, createRouter } from '@geektech/tsone/router';

class Layout extends Component {
  protected initState(): object {
    return {};
  }

  protected initStyles(): void {}

  protected render(): VNode {
    return {
      tag: 'main',
      children: [
        {
          component: RouterLink,
          props: { to: '/', children: ['Home'] },
        },
        {
          component: RouterLink,
          props: { to: '/users/42', children: ['User'] },
        },
        { component: RouterView },
      ],
    };
  }
}

const router = createRouter({
  mode: 'history',
  routes: [
    { path: '/', component: HomePage },
    {
      path: '/users/:id',
      component: UserPage,
      meta: { title: 'User Details' },
    },
  ],
});

createApp({ root: Layout }).use(router).mount();
```

## Development Commands

```bash
bun install
bun test
bun run build
bun run dev
bun run docs
bun run docs:build
```

The root `playground/` directory contains two standalone projects:

```bash
bun run dev
bun run dev:site
bun run dev:admin
```

- `playground/official-site`: product website example
- `playground/admin-dashboard`: admin dashboard example

Documentation content is maintained in the typed-content registry. Chinese
content lives in `packages/tsone/docs/app/content/zh/`, while English content
lives in `packages/tsone/docs/app/content/en/`. Every logical route must exist
in both directories.

Chinese and English catalogs each contain exactly 14 logical routes. Add or
remove a route in both catalogs in the same change.

Content links stay locale-neutral: never write `/en/` manually. Chinese public
routes are unprefixed, while English routes use `/en/`. Browser-language
detection runs only at `/`; manual selection takes precedence and persists for
later visits.

Build the static documentation site with:

```bash
bun run docs:build
```

The build fails strictly for missing, extra, duplicate, empty, or
mixed-language pages.

The base HTML document shell can also be generated from `createApp`. It emits a
`#app` mount node by default; pass `rootElement` only to use a different target.
When a custom `body` is needed, pass a component or VNode rather than an HTML
string. This API renders the mount node through TSone's renderer. In a Bun or
Node static-generation environment, provide a DOM-like document first:

```typescript
import { createApp, type StyleSheet } from '@geektech/tsone';

const styles: StyleSheet = [
  {
    selector: '.app',
    properties: { maxWidth: '72rem' },
  },
];

const app = createApp({
  root: App,
  document: {
    lang: 'en',
    title: 'TSone App',
    styles,
  },
});

const html = app.renderHtmlDocument({
  scripts: [{ type: 'module', src: '/assets/app.js' }],
});
```

## Public API

The main `@geektech/tsone` entry point exports:

- `createApp(options)`
- `createApp({ root, rootProps })`
- `Component<Props, State>`
- `VNode`
- `h()` / `createComponent()` / `slot()` / `each()`
- `Tag(tag, options)` for arbitrary HTML elements
- `Div()` / `Span()` / `P()` / `Button()` / `Input()`
- `Section()` / `Main()` / `Header()` / `Footer()` / `Nav()` / `Article()` /
  `Aside()`
- `H1()` through `H6()` / `Strong()` / `Em()` / `Small()` / `Pre()` /
  `Code()` / `Blockquote()`
- `Ul()` / `Ol()` / `Li()` / `A()` / `Img()`
- `Form()` / `Label()` / `Textarea()` / `Select()` / `Option()`
- `Table()` / `Thead()` / `Tbody()` / `Tr()` / `Th()` / `Td()`
- `Directions` / `ModelBinding`
- `InjectionKey` and component/application `provide()` / `inject()`
- `createForm()` / `required()` / `minLength()` / `validate()`
- `createApp(options).renderHtmlDocument(options)`
- `renderHtmlDocument(options)`
- `StyleSheet` / `renderStyleSheet(styles)`
- `reactive()` / `readonly()`
- `effect()` / `stop()`
- `computed()`
- `ref()` / `isRef()` / `unref()`
- `version`, currently `0.0.2`

## Rendering, Communication, and Forms

`directions.if` controls whether an element, component, or slot is mounted. The
node is unmounted when the condition is false:

```typescript
{
  component: ProfilePanel,
  directions: { if: this.state.visible },
}
```

`each()` creates stable keys for list items so the renderer can reuse nodes
during reordering, insertion, and removal:

```typescript
const items = each(
  this.state.users,
  (user) => ({ tag: 'li', children: [user.name] }),
  (user) => user.id
);
```

Component events return an unsubscribe function, while component VNodes can
declare parent listeners through `emitters`:

```typescript
const stopListening = child.on('saved', (payload) => console.log(payload));
stopListening();
// { component: Editor, emitters: { saved: (payload) => this.save(payload) } }
```

Dependency injection resolves values from the current component, then its
parents, and finally the application instance:

```typescript
const THEME: InjectionKey<{ mode: string }> = Symbol('theme');
app.provide(THEME, { mode: 'dark' });
const theme = this.inject(THEME, { mode: 'light' });
```

`directions.model` supports dot-separated paths and conversion functions.
Native input, textarea, checkbox, radio, and select controls stay synchronized:

```typescript
Input({
  props: { type: 'number' },
  directions: {
    model: {
      path: 'profile.age',
      parse: (value) => Number(value),
      format: (value) => String(value ?? ''),
    },
  },
});
```

Validation uses pure functions and does not own error UI or submission:

```typescript
const form = createForm(this.state, {
  'profile.name': [required('Name is required'), minLength(2)],
  'profile.age': [
    validate((value) => Number(value) >= 18 || 'Age must be at least 18'),
  ],
});

const result = form.validate();
form.resetErrors();
```

The `@geektech/tsone/router` entry point exports:

- `createRouter({ routes, mode, base })`
- `Router`
- `RouterView`
- `RouterLink`
- `useRouter()`
- `RouteRecord`
- `RouteLocation`

The `@geektech/tsone/style` entry point exports:

- `StyleManager`
- `StyleSheet` / `renderStyleSheet(styles)`

## Pre-Publish Checklist

```bash
bun test
bunx tsc --noEmit
bun run build
bun pm pack --cwd packages/tsone --dry-run
```

## Contributing

Issues and pull requests are welcome. Before publishing an open-source release,
make sure the tests, type checks, and build all pass.

## License

[MIT](LICENSE)
