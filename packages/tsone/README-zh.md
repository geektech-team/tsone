# TSone

[English](./README.md) | 简体中文

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

本仓库是 Bun workspace monorepo，当前发布包位于 `packages/tsone/`。
根目录命令会代理到该包，包内保留源码、测试、文档和发布配置，独立演练项目位于
根目录的 `playground/`。

## 安装

```bash
bun add @geektech/tsone
```

```bash
pnpm add @geektech/tsone
```

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

`createApp` 默认使用 `#app` 作为挂载点，创建应用后直接调用 `app.mount()`
即可。页面中暂时不存在挂载点时，`mount()` 会安全跳过；只有需要覆盖默认挂载点
时才传入 `rootElement`。

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
    { path: '/users/:id', component: UserPage, meta: { title: '用户详情' } },
  ],
});

createApp({ root: Layout }).use(router).mount();
```

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

内容链接保持 locale-neutral，不要手写 `/en/`。中文公开路由不带前缀，英文公开
路由使用 `/en/`。浏览器语言检测仅在 `/` 生效；手动选择优先并持久化，后续访问
继续使用用户选择。

生成静态文档产物：

```bash
bun run docs:build
```

构建遇到缺失、多余、重复、空内容或混用语言的页面时会严格失败。

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
- `VNode`
- `h()` / `createComponent()` / `slot()` / `each()`
- `Div()` / `Span()` / `P()` / `Button()` / `Input()`
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
- `version`，当前为 `0.0.2`

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
