# 应用 API

应用入口负责创建根组件、安装插件、挂载和卸载组件树。

## createApp

```typescript
import { Component, VNode, createApp } from '@geektech/tsone';

class App extends Component {
  protected initState(): object {
    return {};
  }

  protected initStyles(): void {}

  protected render(): VNode {
    return {
      tag: 'main',
      children: ['Hello TSone'],
    };
  }
}

const app = createApp({
  root: App,
  rootElement: '#app',
  state: {
    appName: 'TSone',
  },
  config: {
    debug: true,
  },
});

app.mount();
```

最小应用可以写成 `createApp({ root: App })`。

## AppOptions

```typescript
interface AppOptions<TState, TConfig> {
  root?: ComponentConstructor;
  rootElement?: string | Element;
  state?: TState;
  config?: TConfig;
}
```

- `root`: 根组件类。没有传入时会创建一个空应用实例，可用于插件或测试。
- `rootElement`: 挂载点选择器或 DOM 元素。默认使用 `document.body`。
- `state`: 应用级状态，会传递给根组件。
- `config`: 应用级配置，会出现在 `app.getContext().config`。

## OneApp 方法

### mount

```typescript
app.mount();
```

挂载根组件并触发插件的 `onMounted` 钩子。

### unmount

```typescript
app.unmount();
```

卸载根组件、清理模板绑定并清空挂载容器。

### use

```typescript
import { createRouter } from '@geektech/tsone/router';

const router = createRouter({ routes: [{ path: '/', component: App }] });
app.use(router);
```

安装插件。插件需要提供 `install(app, ...args)` 方法。

### update

```typescript
app.update({ appName: 'Updated TSone' });
```

合并更新应用状态，并触发插件的 `onUpdated` 钩子。

### getState / setState

```typescript
const state = app.getState();
app.setState({ appName: 'TSone' });
```

读取或替换应用级状态。

### getContext

```typescript
const context = app.getContext();
console.log(context.version);
```

返回应用上下文，包含 `app`、`version` 和 `config`。

### updateRootComponent

```typescript
app.updateRootComponent(App);
```

替换根组件。应用已挂载时会先卸载旧组件，再挂载新组件。

### onUnmounted

```typescript
app.onUnmounted(() => {
  console.log('App unmounted');
});
```

注册应用卸载完成后的回调。
