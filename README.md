# TSone

轻量级纯 TypeScript 前端框架，提供响应式系统、类组件、策略化渲染和路由能力。

## 特性

- 纯 TypeScript 实现，公开 API 提供类型定义
- Bun 原生工具链：安装、测试、构建、示例服务和文档服务均由 Bun 驱动
- 文档内容由 TSone 的 TypeScript typed content registry 提供
- 响应式系统：`reactive`、`effect`、`computed`
- 面向对象组件模型：`Component<Props, State>`、生命周期、事件、插槽
- 策略模式渲染层：文本、元素、组件、插槽按 VNode 类型分发
- 内置路由：`createRouter`、`RouterView`、`RouterLink`
- 轻量级运行时，生产包无外部运行时依赖

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
      version: '0.0.1',
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

const app = createApp({ root: App, rootElement: '#app', state });
app.mount();

console.log(status.value);
```

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

createApp({ root: Layout, rootElement: '#app' }).use(router).mount();
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

文档站点内容维护在 `docs/app/content/*.ts` 的 typed content registry 中。

生成静态文档产物：

```bash
bun run docs:build
```

## 公开 API

主入口 `@geektech/tsone`：

- `createApp(options)`
- `Component<Props, State>`
- `VNode`
- `h()` / `createComponent()` / `slot()`
- `reactive()` / `readonly()`
- `effect()` / `stop()`
- `computed()`
- `ref()` / `isRef()` / `unref()`
- `version`，当前为 `0.0.1`

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

## 发布前检查

```bash
bun test
bunx tsc --noEmit
bun run build
bun pm pack --dry-run
```

## 贡献

欢迎提交 Issue 和 Pull Request。开源发布前请确保测试、类型检查和构建均通过。

## 许可证

[MIT](LICENSE)
