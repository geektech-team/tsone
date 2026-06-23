# 组件 API

TSone 使用面向对象组件模型。每个组件继承 `Component<Props, State>`，通过 `render()` 返回 `VNode`。

## Component<Props, State>

```typescript
import { Component, VNode } from '@geektech/tsone';

interface CounterProps {
  initial?: number;
}

interface CounterState {
  count: number;
}

class Counter extends Component<CounterProps, CounterState> {
  protected initState(): CounterState {
    return {
      count: this.props.initial ?? 0,
    };
  }

  protected initStyles(): void {}

  protected render(): VNode {
    return {
      tag: 'button',
      listeners: {
        click: () => {
          this.state.count += 1;
        },
      },
      children: [`count: {{count}}`],
    };
  }
}
```

## 必须实现的方法

### initState

```typescript
protected initState(): State;
```

返回组件初始状态。状态会被 `reactive()` 包装，后续修改会触发组件更新。

### initStyles

```typescript
protected initStyles(): void;
```

初始化组件样式。组件实例提供 `this.styleManager`。

### render

```typescript
protected render(): VNode;
```

返回虚拟节点。渲染器会根据 VNode 类型选择对应策略：文本、元素、组件或插槽。

## 元素快捷函数

常用 HTML 元素可以用快捷函数创建 VNode，减少重复书写 `tag` 字段。

```typescript
import { Button, Div, Input, P, Span } from '@geektech/tsone';

Div({
  props: { className: 'card' },
  children: [
    Span({ children: ['标题'] }),
    P({ children: ['{{content}}'] }),
    Input({
      props: { 'aria-label': '内容' },
      directions: { model: 'content' },
    }),
    Button({ children: ['保存'] }),
  ],
});
```

当前公开快捷函数包括 `Div()`、`Span()`、`P()`、`Button()` 和 `Input()`。它们接收与普通元素 VNode 相同的 `props`、`children`、`listeners`、`key`、`slot` 和 `directions` 字段。

## 生命周期

- `beforeMount()`: 首次渲染前。
- `onMounted()`: DOM 挂载后。
- `beforeUpdate()`: 状态更新触发 patch 前。
- `onUpdated()`: patch 完成后。
- `beforeUnmount()`: 卸载前。
- `onUnmounted()`: 卸载后。

## 状态和属性

```typescript
component.setProps({ initial: 3 });
component.setState({ count: 4 });
```

- `props`: 构造组件时传入，也可通过父组件 VNode 的 `props` 传递。
- `state`: 响应式状态。
- `setProps(props)`: 合并更新属性，已挂载时触发更新。
- `setState(state)`: 合并更新状态。

## 事件

```typescript
component.on('submit', (payload) => {
  console.log(payload);
});

component.off('submit', listener);
```

组件可以通过 `on()` 和 `off()` 注册或移除事件监听。在组件内部可使用 `this.emit(eventName, ...args)` 触发事件。

## Slots

```typescript
class Panel extends Component {
  protected initState(): object {
    return {};
  }

  protected initStyles(): void {}

  protected render(): VNode {
    return {
      tag: 'section',
      children: [
        { tag: 'slot', props: { name: 'header' } },
        { tag: 'slot', props: { name: 'default' } },
      ],
    };
  }
}
```

父组件通过子节点的 `slot` 字段声明命名插槽内容。没有 `slot` 字段的子节点会进入默认插槽。
