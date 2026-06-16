# 路由 API

TSone 路由以插件形式安装，并通过 `RouterView` 渲染当前路由组件。

## createRouter

```typescript
import { createRouter } from '@geektech/tsone/router';

const router = createRouter({
  mode: 'history',
  base: '/',
  routes: [
    { path: '/', name: 'home', component: HomePage },
    {
      path: '/users/:id',
      name: 'user',
      component: UserPage,
      meta: { title: '用户详情' },
    },
  ],
});
```

最小配置可以写成 `createRouter({ routes: [...] })`。

也可以传入路由数组：

```typescript
const router = createRouter([
  { path: '/', component: HomePage },
  { path: '/about', component: AboutPage },
]);
```

## RouterOptions

```typescript
interface RouterOptions {
  routes: RouteRecord[];
  mode?: 'history' | 'hash';
  base?: string;
}
```

- `routes`: 路由记录数组。
- `mode`: `'history'` 或 `'hash'`，默认是 `'history'`。
- `base`: 基础路径，默认是 `'/'`。

## RouteRecord

```typescript
interface RouteRecord {
  path: string;
  component: ComponentConstructor;
  name?: string;
  meta?: Record<string, unknown>;
}
```

`path` 支持动态参数，例如 `/users/:id`。匹配后参数会出现在 `RouteLocation.params`。

## RouterView

```typescript
import { Component, VNode } from '@geektech/tsone';
import { RouterView } from '@geektech/tsone/router';

class Layout extends Component {
  protected initState(): object {
    return {};
  }

  protected initStyles(): void {}

  protected render(): VNode {
    return {
      tag: 'main',
      children: [{ component: RouterView }],
    };
  }
}
```

`RouterView` 会监听路由变化，并在当前位置匹配到路由记录时渲染对应组件。

## RouterLink

```typescript
import { RouterLink } from '@geektech/tsone/router';

{
  component: RouterLink,
  props: {
    to: '/users/42',
    activeClass: 'is-active',
    children: ['用户详情']
  }
}
```

`RouterLink` 会生成 `<a>` 标签，点击后调用 `router.push()` 或 `router.replace()`。

## Router 方法

### push / replace

```typescript
router.push('/about');
router.replace('/login');
```

导航到新路径。当前版本支持字符串路径。

### back / forward / go

```typescript
router.back();
router.forward();
router.go(-1);
```

调用浏览器历史记录能力。

### getCurrentRoute

```typescript
const route = router.getCurrentRoute();
console.log(route?.path);
console.log(route?.params.id);
```

返回当前路由位置。

### getCurrentRouteRecord

```typescript
const record = router.getCurrentRouteRecord();
console.log(record?.component);
```

返回当前匹配到的路由记录。

### onRouteChange

```typescript
const stop = router.onRouteChange((to, from) => {
  document.title = String(to.meta?.title ?? 'TSone');
});

stop();
```

注册路由变化监听器，返回取消监听函数。

### addRoute

```typescript
router.addRoute({
  path: '/settings',
  component: SettingsPage,
});
```

动态添加路由。路径重复时会抛出错误。

### createHref

```typescript
const href = router.createHref('/about');
```

根据路由模式和 `base` 生成链接地址。

### destroy

```typescript
router.destroy();
```

移除窗口事件监听，并解除应用上的路由引用。
