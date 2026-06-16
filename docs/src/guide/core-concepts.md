# 核心概念

本文档介绍 TSone 框架的核心概念，帮助您更好地理解框架的设计理念和工作原理。

## 1. 应用实例

应用实例是 TSone 应用的入口点，通过 `createApp` 函数创建。应用实例负责管理组件的挂载、更新和卸载，以及提供插件系统。

```typescript
import { createApp } from '@geektech/tsone';

const app = createApp({
  rootElement: '#app',
  state: {
    appName: 'My App',
  },
});

app.mount();
```

## 2. 组件

组件是 TSone 应用的基本构建块，所有组件都继承自 `Component` 基类。组件负责管理自己的状态、样式和渲染逻辑。

### 组件生命周期

TSone 组件具有以下生命周期钩子：

- `beforeMount()`: 组件挂载前调用
- `onMounted()`: 组件挂载后调用
- `beforeUpdate()`: 组件更新前调用
- `onUpdated()`: 组件更新后调用
- `beforeUnmount()`: 组件卸载前调用
- `onUnmounted()`: 组件卸载后调用

### 组件渲染

组件通过 `render()` 方法返回虚拟 DOM 节点，框架会将其转换为真实 DOM 并挂载到页面上。

## 3. 响应式系统

TSone 的响应式系统基于 Proxy 实现，通过 `reactive` 函数创建响应式对象。当响应式对象的属性发生变化时，依赖该属性的副作用函数会自动重新执行。

### 核心 API

- `reactive(target)`: 创建响应式对象
- `effect(fn)`: 创建副作用函数，依赖响应式对象的变化
- `computed(fn)`: 创建计算属性
- `readonly(target)`: 创建只读响应式对象

## 4. 虚拟 DOM

虚拟 DOM 是对真实 DOM 的轻量级抽象，通过 JavaScript 对象描述 DOM 结构。TSone 使用虚拟 DOM 来提高渲染性能，减少直接操作 DOM 的开销。

### 虚拟 DOM 结构

```typescript
// 元素节点
const vnode = {
  tag: 'div',
  props: { className: 'container' },
  listeners: {
    click: () => console.log('clicked'),
  },
  children: [
    'Hello World',
    {
      tag: 'button',
      children: ['Click Me'],
    },
  ],
};

// 组件节点
const componentVnode = {
  component: MyComponent,
  props: { title: 'My Component' },
};
```

## 5. 路由系统

TSone 内置了路由系统，通过 `createRouter` 函数创建路由实例。路由系统负责管理应用的导航和页面切换。

### 路由配置

```typescript
import { createRouter } from '@geektech/tsone/router';

const router = createRouter({
  routes: [
    {
      path: '/',
      component: HomeComponent,
      meta: { title: '首页' },
    },
    {
      path: '/about',
      component: AboutComponent,
      meta: { title: '关于我们' },
    },
  ],
  mode: 'history',
  base: '/',
});

app.use(router);
```

## 6. 样式管理

TSone 提供了内置的样式管理系统，通过 `StyleManager` 类管理组件的样式。样式管理系统支持动态添加、更新和删除样式。

### 样式定义

```typescript
protected initStyles() {
  this.styleManager.addStyle('.container', {
    selector: '.container',
    properties: {
      width: '100%',
      maxWidth: '1200px',
      margin: '0 auto'
    }
  });
}
```

## 7. 插件系统

TSone 提供了插件系统，通过 `app.use()` 方法使用插件。插件可以扩展应用的功能，例如路由、状态管理等。

### 插件示例

```typescript
// 创建一个简单的插件
const myPlugin = {
  install(app) {
    // 扩展应用实例
    app.myMethod = () => {
      console.log('My plugin method');
    };
  },
};

// 使用插件
app.use(myPlugin);

// 调用插件方法
app.myMethod();
```

## 8. 事件系统

TSone 提供了事件系统，组件可以通过 `emit` 方法发射事件，通过 `on` 方法监听事件。

### 事件示例

```typescript
// 在组件中发射事件
this.emit('custom-event', 'event data');

// 监听事件
component.on('custom-event', (data) => {
  console.log('Event received:', data);
});
```

## 9. 依赖注入

TSone 提供了依赖注入系统，通过 `provide` 和 `inject` 方法实现组件间的数据传递。

### 依赖注入示例

```typescript
// 在父组件中提供数据
protected initState() {
  this.provide('user', {
    name: 'John Doe',
    age: 30
  });
  return {};
}

// 在子组件中注入数据
protected initState() {
  const user = this.inject('user');
  return {
    user
  };
}
```

## 总结

以上是 TSone 框架的核心概念，通过理解这些概念，您可以更好地使用和扩展框架。如果您想了解更多细节，请参考相关的 API 文档和示例代码。
