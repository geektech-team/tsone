# TSone

[English](./README.md) | 简体中文

**文档：** <https://geektech-team.github.io/tsone/>

轻量级纯 TypeScript 前端框架，提供响应式系统、类组件、策略化渲染和路由能力。

## 特性

- 纯 TypeScript 实现，TypeScript为第一公民，公开 API 提供类型定义
- Bun 原生工具链：安装、测试、构建、playground 和文档服务均由 Bun 驱动
- 文档内容由 TSone 的 TypeScript typed content registry 提供
- 响应式系统：`reactive`、`effect`、`computed`
- 面向对象组件模型：`Component<Props, State>`、生命周期、事件、插槽
- 策略模式渲染层：文本、元素、组件、插槽按 VNode 类型分发
- 内置路由：`createRouter`、`RouterView`、`RouterLink`
- 轻量级运行时，生产包无外部运行时依赖

## 仓库结构

本仓库是 Bun workspace monorepo，包含两个发布包：`packages/tsone/`
提供浏览器框架 `@geektech/tsone`，`packages/tsone-cli/` 提供 Bun 原生开发工具
`@geektech/tsone-cli`。独立演练项目位于根目录的 `playground/`。

## 安装

```bash
bun add @geektech/tsone @geektech/tsone-cli
```

```bash
pnpm add @geektech/tsone @geektech/tsone-cli
```

本文档中的框架与 CLI 工作流要求 Bun `>=1.3.0`。

## 快速开始

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

`createApp` 默认使用 `#app` 作为挂载点，创建应用后直接调用 `app.mount()`
即可。页面中暂时不存在挂载点时，`mount()` 会安全跳过；只有需要覆盖默认挂载点
时才传入 `rootElement`。

## 开发工具

独立的 `@geektech/tsone-cli` 包提供 `tsone create`、`tsone dev` 与
`tsone build`。`tsone create` 会在当前目录脚手架一个基础项目（包含一个展示
TSone 名称与 GitHub 链接的首页）。CLI 的默认入口为 `src/main.ts`；入口模块必须
通过 `export const app` 导出应用，并且该值必须提供 `renderHtmlDocument()`。

可以在项目根目录创建可选的 `tsone.config.ts`：

配置文件只支持普通对象默认导出；不支持函数式配置或函数值配置。

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

代理也支持字符串简写，例如 `{ '/backend': 'http://localhost:4000' }`。默认值为
入口 `src/main.ts`、主机 `127.0.0.1`、端口 `52211`、空的 `server.proxy`、输出
目录 `dist`，且没有额外页面。

多页应用可在同一配置文件里把路由映射到页面入口；每个页面入口与根入口一样，
都要通过 `export const app` 暴露带有 `renderHtmlDocument()` 的应用：

```typescript
export default defineConfig({
  entry: 'src/main.ts',
  pages: {
    '/about': 'src/about.ts',
    '/docs/guide': 'src/guide.ts',
  },
});
```

`pages` 的键必须以 `/` 开头并支持嵌套；根路径 `/` 由 `entry` 提供。开发时每个
页面在其路由下提供服务，`tsone build` 会为每个页面输出一个 HTML 文档
（`index.html`、`about.html`、`docs/guide.html`），资源 URL 相对各文档。

```text
tsone create
tsone dev [--host <host>] [--port <port>] [--no-watch]
tsone build [--out-dir <path>]
```

`create` 不接受任何选项。`dev` 接受主机、端口覆盖和 `--no-watch`；`build` 只
接受输出目录覆盖；`--port 3000` 和 `--port=3000` 两种形式均可。`tsone dev`
默认监听项目文件，文件变化时通过 `/__tsone/reload` 通知浏览器刷新。构建输出
必须是项目根目录内部的安全子目录。

编程式工具 API 来自 `@geektech/tsone-cli`，而不是框架主入口。该包导出
`defineConfig`、`resolveConfig`、`startDevServer` 与 `build`。调用方负责开发
服务器生命周期，结束时必须调用 `server.stop()`；`build()` 返回绝对的 `root`、
`outDir` 以及 `assetsBuilt`。

开发服务器仅提供 HTTP。代理目标可以使用 HTTP 或 HTTPS。规则按字面路径前缀
匹配，优先最长前缀，保留查询参数、请求体和端到端请求头，可选应用
`changeOrigin` 与 `rewrite`；上游不可达时固定返回 `502 Bad Gateway`。CLI 首版
配置不提供 plugins、WebSocket、HMR、SSR、函数式配置、`public/` 复制以及
公开的 minify/sourcemap 配置。

## 路由

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
          props: { to: '/', children: ['首页'] },
        },
        {
          component: RouterLink,
          props: { to: '/users/42', children: ['用户'] },
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
    { path: '/users/:id', component: UserPage, meta: { title: '用户详情' } },
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

守卫仅在编程式导航时执行。返回 `false` 取消导航，返回字符串则重定向到该路径。
`redirect` 路由会解析到其目标；`*` 路由匹配所有未命中的路径，剩余路径可通过
`params.pathMatch` 获取。

## 开发命令

```bash
bun install
bun test
bun run build
bun run dev
bun run docs
bun run docs:build
```

根目录的 `playground/` 提供两个独立演练项目：

```bash
bun run dev
bun run dev:site
bun run dev:admin
```

- `playground/official-site`：官网首页示例
- `playground/admin-dashboard`：后台管理页示例

文档站点使用 typed content registry：中文内容维护在
`packages/tsone/docs/app/content/zh/`，英文内容维护在
`packages/tsone/docs/app/content/en/`，中英文逻辑路由必须一致。
中英文 catalog 当前各包含 15 条逻辑路由；新增或删除路由时必须同步修改两边。

内容链接保持 locale-neutral，不要手写 `/en/`。中文公开路由不带前缀，英文公开
路由使用 `/en/`。浏览器语言检测仅在 `/` 生效；手动选择优先并持久化，后续访问
继续使用用户选择。

生成静态文档产物：

```bash
bun run docs:build
```

构建遇到缺失、多余、重复、空内容或混用语言的页面时会严格失败。

需要把站点托管到某个子路径下（例如 GitHub Pages 项目页
`https://<owner>.github.io/tsone/`）时，可以用 base path 构建：

```bash
bun run docs:build -- --base=/tsone/
```

也可以通过环境变量 `DOCS_BASE_PATH` 指定。配置 base path 后，产物中的所有
链接与资源 URL 都会带上该前缀，语言引导脚本会从渲染后的文档读取 base path，
站点即可在任意子路径下正常工作。

基础 HTML 文档壳也可以放进 `createApp` 配置里生成。默认会输出 `#app`
挂载节点；需要自定义挂载点时再传 `rootElement`。`body` 需要自定义时传入组件
或 VNode，不传 HTML 字符串。
该 API 会通过 TSone 渲染器挂载节点；在 Bun/Node 静态生成环境中，请先提供
DOM-like document：

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
    lang: 'zh-CN',
    title: 'TSone App',
    styles,
  },
});

const html = app.renderHtmlDocument({
  scripts: [{ type: 'module', src: '/assets/app.js' }],
});
```

## 公开 API

主入口 `@geektech/tsone`：

- `createApp(options)`
- `createApp({ root, rootProps })`
- `Component<Props, State>`
- `TransitionGroup` / `TransitionGroupProps` / `TransitionAnimationType`
- `Transition` / `TransitionProps`——基于 CSS class 的进入/退出过渡
- `KeepAlive` / `KeepAliveProps`——在 `activeKey` 切换时保持子组件挂载
- 路由守卫：`Router.beforeEach` / `Router.afterEach`，以及
  `RouteRecord.redirect` 与 `*` 通配路由
- `VNode`
- `h()` / `createComponent()` / `slot()` / `each()`
- `Tag(tag, options)`，用于创建任意 HTML 元素
- `Div()` / `Span()` / `P()` / `Button()` / `Input()`
- `Section()` / `Main()` / `Header()` / `Footer()` / `Nav()` / `Article()` /
  `Aside()`
- `H1()` 至 `H6()` / `Strong()` / `Em()` / `Small()` / `Pre()` / `Code()` /
  `Blockquote()`
- `Ul()` / `Ol()` / `Li()` / `A()` / `Img()`
- `Form()` / `Label()` / `Textarea()` / `Select()` / `Option()`
- `Table()` / `Thead()` / `Tbody()` / `Tr()` / `Th()` / `Td()`
- `Directions` / `ModelBinding`
- `InjectionKey`、组件和应用的 `provide()` / `inject()`
- `createForm()` / `required()` / `minLength()` / `validate()`
- `createApp(options).renderHtmlDocument(options)`
- `renderHtmlDocument(options)`
- `StyleSheet` / `renderStyleSheet(styles)`
- `reactive()` / `readonly()`
- `effect()` / `stop()`
- `computed()`
- `ref()` / `isRef()` / `unref()`
- `watch(source, callback, options)`——响应式侦听，支持 `immediate`、`deep`、
  `sync` 选项
- `nextTick()` / `flushSync()`
- `version`，当前为 `0.5.0`

## 渲染、通信与表单

`directions.if` 可以控制元素、组件或插槽的挂载；不满足条件时会卸载节点：

```typescript
{
  component: ProfilePanel,
  directions: { if: this.state.visible },
}
```

`each()` 为列表产生稳定 key，供渲染器在排序、插入和删除时复用节点：

```typescript
const items = each(
  this.state.users,
  (user) => ({ tag: 'li', children: [user.name] }),
  (user) => user.id
);
```

`TransitionGroup` 为直属的带 key 子节点提供进入和退出动画：

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

动画类型包括 `fade`、`slide-up`、`slide-down`、`slide-left`、
`slide-right` 和 `scale`。默认包装标签为 `div`，默认类型为 `fade`，默认时长为
`300` 毫秒，并固定使用 `ease` 缓动。每个直属子节点都必须具有唯一 key。初始
子节点会播放进入动画，移除的子节点会保留到退出动画结束。系统启用
`prefers-reduced-motion: reduce` 或 Web Animations 不可用时，TSone 会自动跳过
动画。列表重排只复用并移动已有节点，不播放重排或 FLIP 动画。

`Transition` 在 `show` 切换时为单个元素播放过渡。它依次应用
`{name}-enter-from` / `{name}-enter-to` 和 `{name}-leave-from` /
`{name}-leave-to` CSS class（各配套一个 `-active` class），离开开始
`duration` 毫秒后才移除元素：

```typescript
{
  component: Transition,
  props: { show: this.state.open, name: 'fade', duration: 300 },
  children: [Dialog({ children: ['设置'] })],
}
```

`KeepAlive` 让所有带 key 的子组件保持挂载（状态与 DOM 均保留），非活跃项通过
`display: none` 隐藏：

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

组件事件可订阅并用返回的函数取消订阅；组件 VNode 可通过 `emitters` 声明父级监听器。

```typescript
const stopListening = child.on('saved', (payload) => console.log(payload));
stopListening();
// { component: Editor, emitters: { saved: (payload) => this.save(payload) } }
```

依赖注入从当前组件向父级再到应用实例查找：

```typescript
const THEME: InjectionKey<{ mode: string }> = Symbol('theme');
app.provide(THEME, { mode: 'dark' });
const theme = this.inject(THEME, { mode: 'light' });
```

`directions.model` 支持点分隔路径和转换函数，原生 input、textarea、checkbox、radio 与 select 会同步：

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

校验是纯函数，不负责错误 UI 或提交：

```typescript
const form = createForm(this.state, {
  'profile.name': [required('请输入姓名'), minLength(2)],
  'profile.age': [
    validate((value) => Number(value) >= 18 || '年龄须不小于 18'),
  ],
});

const result = form.validate();
form.resetErrors();
```

路由入口 `@geektech/tsone/router`：

- `createRouter({ routes, mode, base })`
- `Router`
- `RouterView`
- `RouterLink`
- `useRouter()`
- `RouteRecord`
- `RouteLocation`

样式入口 `@geektech/tsone/style`：

- `StyleManager`
- `StyleSheet` / `renderStyleSheet(styles)`

## 发布前检查

```bash
bun test
bunx tsc --noEmit
bun run build
bun pm pack --cwd packages/tsone --dry-run
```

## 贡献

欢迎提交 Issue 和 Pull Request。开源发布前请确保测试、类型检查和构建均通过。

## 许可证

[MIT](LICENSE)
