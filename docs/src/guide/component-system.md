# 组件系统

TSone 的组件系统是框架的核心功能之一，允许您将 UI 拆分为独立、可复用的模块。本文档将详细介绍组件系统的使用方法和最佳实践。

## 组件定义

在 TSone 中，组件是通过继承 `Component` 基类来定义的。每个组件都需要实现三个核心方法：`initState()`、`initStyles()` 和 `render()`。

### 基本组件结构

```typescript
import { Component } from 'tsone';

class MyComponent extends Component {
  // 初始化组件状态
  protected initState() {
    return {
      message: 'Hello, TSone!'
    };
  }

  // 初始化组件样式
  protected initStyles() {
    this.styleManager.addStyle('.my-component', {
      selector: '.my-component',
      properties: {
        color: '#333',
        fontSize: '16px',
        padding: '10px'
      }
    });
  }

  // 渲染组件
  protected render() {
    return {
      tag: 'div',
      props: { className: 'my-component' },
      children: [`{{message}}`]
    };
  }
}
```

## 组件生命周期

TSone 组件具有以下生命周期钩子，您可以在适当的时机执行相应的逻辑：

### 挂载阶段

- `beforeMount()`: 组件挂载到 DOM 前调用
- `onMounted()`: 组件挂载到 DOM 后调用

### 更新阶段

- `beforeUpdate()`: 组件状态更新前调用
- `onUpdated()`: 组件状态更新后调用

### 卸载阶段

- `beforeUnmount()`: 组件从 DOM 卸载前调用
- `onUnmounted()`: 组件从 DOM 卸载后调用

### 生命周期示例

```typescript
class LifecycleComponent extends Component {
  protected initState() {
    return { count: 0 };
  }

  protected initStyles() {
    // 初始化样式
  }

  protected beforeMount() {
    console.log('Component will mount');
  }

  protected onMounted() {
    console.log('Component mounted');
  }

  protected beforeUpdate() {
    console.log('Component will update');
  }

  protected onUpdated() {
    console.log('Component updated');
  }

  protected beforeUnmount() {
    console.log('Component will unmount');
  }

  protected onUnmounted() {
    console.log('Component unmounted');
  }

  protected render() {
    return {
      tag: 'div',
      children: [
        { tag: 'h1', children: [`Count: {{count}}`] },
        {
          tag: 'button',
          listeners: { click: () => this.state.count++ },
          children: ['Increment']
        }
      ]
    };
  }
}
```

## 组件属性

组件可以通过构造函数接收属性（props），并在组件内部使用。

### 定义属性接口

您可以为组件定义属性接口，以获得更好的类型提示：

```typescript
import { Component, ComponentProps } from 'tsone';

interface ButtonProps extends ComponentProps {
  text: string;
  disabled?: boolean;
  size?: 'small' | 'medium' | 'large';
}

class Button extends Component<ButtonProps> {
  protected initState() {
    return {};
  }

  protected initStyles() {
    // 初始化样式
  }

  protected render() {
    const { text, disabled = false, size = 'medium' } = this.props;
    
    return {
      tag: 'button',
      props: {
        className: `btn btn-${size} ${disabled ? 'btn-disabled' : ''}`,
        disabled
      },
      children: [text]
    };
  }
}
```

### 使用组件属性

在父组件中使用子组件时，可以传递属性：

```typescript
class ParentComponent extends Component {
  protected render() {
    return {
      tag: 'div',
      children: [
        {
          component: Button,
          props: {
            text: 'Click Me',
            size: 'large'
          }
        }
      ]
    };
  }
}
```

## 组件事件

组件可以通过 `emit` 方法发射事件，父组件可以通过 `listeners` 属性监听这些事件。

### 发射事件

```typescript
class CounterComponent extends Component {
  protected initState() {
    return { count: 0 };
  }

  protected initStyles() {
    // 初始化样式
  }

  protected handleIncrement() {
    this.state.count++;
    this.emit('increment', this.state.count);
  }

  protected handleDecrement() {
    this.state.count--;
    this.emit('decrement', this.state.count);
  }

  protected render() {
    return {
      tag: 'div',
      children: [
        { tag: 'span', children: [`Count: {{count}}`] },
        {
          tag: 'button',
          listeners: { click: this.handleIncrement.bind(this) },
          children: ['+']
        },
        {
          tag: 'button',
          listeners: { click: this.handleDecrement.bind(this) },
          children: ['-']
        }
      ]
    };
  }
}
```

### 监听事件

```typescript
class ParentComponent extends Component {
  protected handleCounterChange(value: number) {
    console.log('Counter changed:', value);
  }

  protected render() {
    return {
      tag: 'div',
      children: [
        {
          component: CounterComponent,
          listeners: {
            increment: this.handleCounterChange.bind(this),
            decrement: this.handleCounterChange.bind(this)
          }
        }
      ]
    };
  }
}
```

## 组件嵌套

您可以在一个组件中嵌套使用其他组件，形成组件树：

```typescript
class App extends Component {
  protected render() {
    return {
      tag: 'div',
      props: { className: 'app' },
      children: [
        {
          tag: 'header',
          children: [
            { tag: 'h1', children: ['My App'] },
            { component: NavigationComponent }
          ]
        },
        {
          tag: 'main',
          children: [
            { component: HomeComponent }
          ]
        },
        {
          tag: 'footer',
          children: [
            { tag: 'p', children: ['© 2023 My App'] }
          ]
        }
      ]
    };
  }
}
```

## 组件状态管理

每个组件都有自己的状态（state），通过 `initState()` 方法初始化。状态是响应式的，当状态发生变化时，组件会自动重新渲染。

### 状态初始化

```typescript
protected initState() {
  return {
    count: 0,
    user: {
      name: 'John',
      age: 30
    },
    items: ['Item 1', 'Item 2', 'Item 3']
  };
}
```

### 状态更新

您可以直接修改状态属性，框架会自动检测变化并触发更新：

```typescript
// 更新基本类型
this.state.count = 1;

// 更新对象属性
this.state.user.name = 'Jane';

// 更新数组
this.state.items.push('Item 4');
```

## 组件样式管理

TSone 提供了内置的样式管理系统，通过 `styleManager` 属性访问：

### 添加样式

```typescript
protected initStyles() {
  // 添加单个样式
  this.styleManager.addStyle('.button', {
    selector: '.button',
    properties: {
      padding: '8px 16px',
      backgroundColor: '#007bff',
      color: '#fff',
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer'
    }
  });

  // 添加样式变体
  this.styleManager.addStyle('.button:hover', {
    selector: '.button:hover',
    properties: {
      backgroundColor: '#0069d9'
    }
  });
}
```

### 移除样式

```typescript
// 移除单个样式
this.styleManager.removeStyle('.button');

// 清除所有样式
this.styleManager.clearStyles();
```

## 组件上下文

组件可以通过 `getContext()` 方法获取应用上下文，以及通过 `get router()` 获取路由实例：

### 获取上下文

```typescript
protected getContext() {
  return (globalThis as { __APP__?: { context?: unknown } }).__APP__?.context;
}

protected get router() {
  return (globalThis as { __APP__?: { router?: unknown } }).__APP__?.router;
}

protected navigateToAbout() {
  this.router.push('/about');
}
```

## 最佳实践

### 组件设计原则

1. **单一职责**：每个组件应该只负责一个功能
2. **可复用性**：设计通用的、可复用的组件
3. **可维护性**：保持组件代码简洁、清晰
4. **性能优化**：避免不必要的渲染和计算

### 组件命名约定

- 组件类名使用 PascalCase（例如：`MyComponent`）
- 组件文件使用 PascalCase（例如：`MyComponent.ts`）
- 组件样式类名使用 kebab-case（例如：`my-component`）

### 性能优化技巧

1. **避免在 render 方法中创建新对象**：将不变的对象提取到组件属性中
2. **合理使用状态**：只将需要响应式更新的属性放在 state 中
3. **使用计算属性**：对于复杂的计算逻辑，使用 `computed` 函数
4. **避免深层嵌套**：过多的组件嵌套会影响性能

## 总结

TSone 的组件系统提供了一种结构化、模块化的方式来构建 UI。通过理解和掌握组件系统的使用方法，您可以创建更加可维护、可复用的应用。

如果您想了解更多关于组件系统的细节，请参考 [API 参考](/api/component.md) 文档。
