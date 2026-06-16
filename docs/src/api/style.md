# 样式 API

本文档介绍 TSone 样式管理系统的 API。

## StyleManager

`StyleManager` 是 TSone 中负责管理样式的类，每个组件实例都有一个 `styleManager` 属性，可以用来添加、修改和删除样式。

### 创建 StyleManager

```typescript
import { StyleManager } from '@geektech/tsone/style';

const styleManager = new StyleManager();
```

## StyleManager 方法

### addStyle

添加样式：

```typescript
styleManager.addStyle('.button', {
  selector: '.button',
  properties: {
    padding: '8px 16px',
    backgroundColor: '#007bff',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  },
});
```

### removeStyle

移除样式：

```typescript
styleManager.removeStyle('.button');
```

### getStyle

获取样式：

```typescript
const buttonStyle = styleManager.getStyle('.button');
console.log(buttonStyle);
// {
//   selector: '.button',
//   properties: {
//     padding: '8px 16px',
//     backgroundColor: '#007bff',
//     color: '#fff',
//     border: 'none',
//     borderRadius: '4px',
//     cursor: 'pointer'
//   }
// }
```

### clearStyles

清除所有样式：

```typescript
styleManager.clearStyles();
```

### addStyleFromCSS

从 CSS 字符串添加样式：

```typescript
const css = `.button {
  padding: 8px 16px;
  background-color: #007bff;
  color: #fff;
}

.button:hover {
  background-color: #0069d9;
}`;

styleManager.addStyleFromCSS(css);
```

## 样式对象

### 基本样式对象

```typescript
{
  selector: '.button',
  properties: {
    padding: '8px 16px',
    backgroundColor: '#007bff',
    color: '#fff'
  }
}
```

### 媒体查询样式对象

```typescript
{
  selector: '@media (max-width: 768px)',
  properties: {
    '.button': {
      padding: '6px 12px',
      fontSize: '14px'
    }
  }
}
```

### 伪类样式对象

```typescript
{
  selector: '.button:hover',
  properties: {
    backgroundColor: '#0069d9'
  }
}

{
  selector: '.button:active',
  properties: {
    backgroundColor: '#005cbf'
  }
}
```

## 组件内样式管理

### 在组件中使用 styleManager

每个组件实例都有一个 `styleManager` 属性，您可以在 `initStyles` 方法中使用它来管理组件样式：

```typescript
class ButtonComponent extends Component {
  protected initStyles() {
    // 添加按钮样式
    this.styleManager.addStyle('.button', {
      selector: '.button',
      properties: {
        padding: '8px 16px',
        backgroundColor: '#007bff',
        color: '#fff',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
      },
    });

    // 添加 hover 状态
    this.styleManager.addStyle('.button:hover', {
      selector: '.button:hover',
      properties: {
        backgroundColor: '#0069d9',
      },
    });
  }

  protected render() {
    return {
      tag: 'button',
      props: { className: 'button' },
      children: ['Click Me'],
    };
  }
}
```

### 动态样式

您可以根据组件状态动态添加或修改样式：

```typescript
class ThemedButtonComponent extends Component {
  protected initState() {
    return {
      isDarkTheme: false,
    };
  }

  protected initStyles() {
    // 添加基础样式
    this.styleManager.addStyle('.button', {
      selector: '.button',
      properties: {
        padding: '8px 16px',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
      },
    });

    // 添加亮色主题样式
    this.styleManager.addStyle('.button.light', {
      selector: '.button.light',
      properties: {
        backgroundColor: '#007bff',
        color: '#fff',
      },
    });

    // 添加暗色主题样式
    this.styleManager.addStyle('.button.dark', {
      selector: '.button.dark',
      properties: {
        backgroundColor: '#343a40',
        color: '#fff',
      },
    });
  }

  protected toggleTheme() {
    this.state.isDarkTheme = !this.state.isDarkTheme;
  }

  protected render() {
    return {
      tag: 'div',
      children: [
        {
          tag: 'button',
          props: {
            className: `button ${this.state.isDarkTheme ? 'dark' : 'light'}`,
          },
          children: ['Themed Button'],
        },
        {
          tag: 'button',
          listeners: { click: () => this.toggleTheme() },
          children: ['Toggle Theme'],
        },
      ],
    };
  }
}
```

## 全局样式管理

### 在应用级别添加全局样式

您可以在应用级别添加全局样式：

```typescript
import { createApp } from '@geektech/tsone';

const app = createApp({
  rootElement: '#app',
});

// 添加全局样式
app.styleManager.addStyle('body', {
  selector: 'body',
  properties: {
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    fontSize: '16px',
    lineHeight: '1.5',
    color: '#333',
    backgroundColor: '#fff',
  },
});

app.mount();
```

## 示例

### 完整样式管理示例

```typescript
import { Component, createApp } from '@geektech/tsone';
import { StyleManager } from '@geektech/tsone/style';

// 创建全局样式管理器
const globalStyleManager = new StyleManager();

// 添加全局样式
globalStyleManager.addStyle('*', {
  selector: '*',
  properties: {
    boxSizing: 'border-box',
    margin: '0',
    padding: '0',
  },
});

globalStyleManager.addStyle('body', {
  selector: 'body',
  properties: {
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    fontSize: '16px',
    lineHeight: '1.5',
    color: '#333',
    backgroundColor: '#fff',
  },
});

// 创建组件
class CardComponent extends Component {
  protected initState() {
    return {
      title: 'Card Title',
      content: 'Card content goes here',
    };
  }

  protected initStyles() {
    // 添加卡片样式
    this.styleManager.addStyle('.card', {
      selector: '.card',
      properties: {
        border: '1px solid #dee2e6',
        borderRadius: '8px',
        padding: '20px',
        margin: '10px',
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
      },
    });

    // 添加卡片标题样式
    this.styleManager.addStyle('.card-title', {
      selector: '.card-title',
      properties: {
        fontSize: '1.25rem',
        fontWeight: 'bold',
        marginBottom: '10px',
        color: '#212529',
      },
    });

    // 添加卡片内容样式
    this.styleManager.addStyle('.card-content', {
      selector: '.card-content',
      properties: {
        fontSize: '1rem',
        color: '#495057',
      },
    });
  }

  protected render() {
    return {
      tag: 'div',
      props: { className: 'card' },
      children: [
        {
          tag: 'h3',
          props: { className: 'card-title' },
          children: [this.state.title],
        },
        {
          tag: 'p',
          props: { className: 'card-content' },
          children: [this.state.content],
        },
      ],
    };
  }
}

// 创建应用
const app = createApp({
  rootElement: '#app',
});

// 使用全局样式管理器
app.styleManager = globalStyleManager;

// 挂载应用
app.mount();
```

## 最佳实践

### 样式组织

1. **组件样式隔离**：每个组件只管理自己的样式
2. **使用语义化类名**：使用有意义的类名，遵循一致的命名约定
3. **模块化样式**：将相关样式组织在一起

### 性能优化

1. **批量添加样式**：尽量在 `initStyles()` 中一次性添加所有样式
2. **避免频繁样式更新**：减少运行时样式的添加和删除
3. **合理使用选择器**：避免过于复杂的选择器

### 常见问题

1. **样式不生效**：检查选择器是否正确，以及样式是否被其他样式覆盖

2. **样式冲突**：使用更具体的选择器，或使用命名空间避免冲突

3. **动态样式性能**：对于频繁变化的样式，考虑使用内联样式或 CSS 变量

## 总结

TSone 的样式管理系统提供了一种灵活、便捷的方式来管理组件样式。通过理解和掌握样式 API，您可以创建更加美观、响应式的应用界面。
