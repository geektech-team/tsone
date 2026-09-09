# TSone

English | [简体中文](./README-zh.md)

**Documentation:** <https://geektech-team.github.io/tsone/>

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

This repository is a Bun workspace monorepo with three published packages:
`packages/tsone/` contains the browser framework `@geektech/tsone`,
`packages/one/` contains the component library `@geektech/one` built on the
framework, and `packages/tsone-cli/` contains the Bun-native development
tooling `@geektech/tsone-cli`. Standalone example projects live in the root
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
      version: '0.5.0',
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

The separate `@geektech/tsone-cli` package provides `tsone create`, `tsone dev`,
and `tsone build`. `tsone create` scaffolds a basic project (including a
homepage showing the TSone name and a GitHub link) into the current directory.
The CLI's default entry is `src/main.ts`; that module must expose the
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
`127.0.0.1`, port `52211`, an empty `server.proxy`, `dist`, and no additional
pages.

Multi-page applications map routes to page entries in the same config file;
each page entry exposes `app` with `renderHtmlDocument()` exactly like the root
entry:

```typescript
export default defineConfig({
  entry: 'src/main.ts',
  pages: {
    '/about': 'src/about.ts',
    '/docs/guide': 'src/guide.ts',
  },
});
```

`pages` keys must start with `/` and may nest; the root `/` is served by
`entry`. During development each page is served at its route, and `tsone build`
emits one HTML document per page (`index.html`, `about.html`,
`docs/guide.html`) with page-relative asset URLs.

```text
tsone create
tsone dev [--host <host>] [--port <port>] [--no-watch]
tsone build [--out-dir <path>]
```

`create` takes no options. `dev` accepts host/port overrides and `--no-watch`;
`build` accepts the output-directory override; both `--port 3000` and
`--port=3000` forms are valid. `tsone dev` watches the project by default and
notifies browsers to reload over `/__tsone/reload` when a watched file changes.
Build output must remain a safe child directory inside the project root.

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
    { path: '/old', redirect: '/new' },
    { path: '/new', component: NewPage },
    {
      path: '/users/:id',
      component: UserPage,
      meta: { title: 'User Details' },
    },
    { path: '*', component: NotFoundPage },
  ],
});

router.beforeEach((to, from) => {
  if (to.path === '/admin' && !isAuthenticated) {
    return false;
  }
  return true;
});
router.afterEach((to) => {
  document.title = to.meta?.title ?? 'TSone';
});

createApp({ root: Layout }).use(router).mount();
```

Guards run on programmatic navigation only. Returning `false` cancels the
navigation, returning a string redirects to that path. `redirect` routes
resolve to their target, and a `*` route matches every otherwise unmatched
path with the remaining path available as `params.pathMatch`.

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

Chinese and English catalogs each contain exactly 15 logical routes. Add or
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

To host the site under a sub-path (for example a GitHub Pages project page such
as `https://<owner>.github.io/tsone/`), build it with a base path:

```bash
bun run docs:build -- --base=/tsone/
```

You can also set the `DOCS_BASE_PATH` environment variable. When a base path is
configured, every link and asset URL is prefixed with it, and the locale
bootstrap reads the base path from the rendered document, so the site works
under any sub-path.

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
- `TransitionGroup` / `TransitionGroupProps` / `TransitionAnimationType`
- `Transition` / `TransitionProps` — enter/leave CSS class transitions
- `KeepAlive` / `KeepAliveProps` — keep child components mounted across
  `activeKey` switches
- Router guards: `Router.beforeEach` / `Router.afterEach`, plus
  `RouteRecord.redirect` and `*` catch-all routes
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
- `watch(source, callback, options)` — reactive watching with `immediate`,
  `deep`, and `sync` options
- `nextTick()` / `flushSync()`
- `version`, currently `0.5.0`

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

`TransitionGroup` animates the enter and exit of direct keyed children:

```typescript
{
  component: TransitionGroup,
  props: { tag: 'ul', type: 'fade', duration: 300 },
  children: each(
    this.state.items,
    (item) => Li({ children: [item.label] }),
    (item) => item.id
  ),
}
```

The animation types are `fade`, `slide-up`, `slide-down`, `slide-left`,
`slide-right`, and `scale`. The defaults are a `div` wrapper, `fade`, and
`300` ms with `ease` easing. Every direct child must have a unique key. Initial
children animate in, and removed children stay mounted until their exit ends.
TSone automatically disables these animations for
`prefers-reduced-motion: reduce` or when Web Animations is unavailable.
Reordering reuses and moves existing nodes without a reorder or FLIP animation.

`Transition` animates a single element as `show` flips. It applies
`{name}-enter-from` / `{name}-enter-to` and `{name}-leave-from` /
`{name}-leave-to` CSS classes (each paired with a `-active` class) and keeps
the element mounted until `duration` ms after the leave starts:

```typescript
{
  component: Transition,
  props: { show: this.state.open, name: 'fade', duration: 300 },
  children: [Dialog({ children: ['Settings'] })],
}
```

`KeepAlive` keeps every keyed child component mounted (state and DOM are
preserved) while hiding inactive ones with `display: none`:

```typescript
{
  component: KeepAlive,
  props: { activeKey: this.state.activeTab },
  children: [
    createComponent(Editor, {}, [], 'editor'),
    createComponent(Preview, {}, [], 'preview'),
  ],
}
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
