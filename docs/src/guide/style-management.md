# 样式管理

TSone 提供了内置的样式管理系统，通过 `StyleManager` 类管理组件的样式。本文档将详细介绍样式管理系统的使用方法和最佳实践。

## 核心概念

### StyleManager

`StyleManager` 是 TSone 中负责管理样式的类，每个组件实例都有一个 `styleManager` 属性，可以用来添加、修改和删除样式。

### 样式对象

样式对象是一个包含 `selector` 和 `properties` 属性的对象：

- `selector`: CSS 选择器
- `properties`: CSS 属性和值的映射

## 基本使用

### 在组件中使用

每个组件都可以通过 `initStyles()` 方法初始化样式：

```typescript
import { Component } from '@geektech/tsone';

class ButtonComponent extends Component {
  protected initState() {
    return {};
  }

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
        fontSize: '14px',
        transition: 'background-color 0.2s',
      },
    });

    // 添加 hover 状态
    this.styleManager.addStyle('.button:hover', {
      selector: '.button:hover',
      properties: {
        backgroundColor: '#0069d9',
      },
    });

    // 添加 disabled 状态
    this.styleManager.addStyle('.button:disabled', {
      selector: '.button:disabled',
      properties: {
        backgroundColor: '#6c757d',
        cursor: 'not-allowed',
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

## 样式管理 API

### 添加样式

使用 `addStyle` 方法添加样式：

```typescript
// 添加单个样式
this.styleManager.addStyle('.container', {
  selector: '.container',
  properties: {
    width: '100%',
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '0 15px',
  },
});
```

### 移除样式

使用 `removeStyle` 方法移除样式：

```typescript
// 移除单个样式
this.styleManager.removeStyle('.container');
```

### 清除所有样式

使用 `clearStyles` 方法清除所有样式：

```typescript
// 清除所有样式
this.styleManager.clearStyles();
```

### 获取样式

使用 `getStyle` 方法获取样式：

```typescript
// 获取样式
const buttonStyle = this.styleManager.getStyle('.button');
console.log(buttonStyle);
// { selector: '.button', properties: { ... } }
```

## 高级用法

### 样式优先级

当多个样式规则应用于同一个元素时，CSS 优先级规则会决定哪个样式生效。您可以通过以下方式控制样式优先级：

1. **选择器特异性**：更具体的选择器具有更高的优先级
2. **样式顺序**：后添加的样式会覆盖先添加的样式（如果选择器特异性相同）

### 响应式样式

您可以使用媒体查询创建响应式样式：

```typescript
protected initStyles() {
  // 基础样式
  this.styleManager.addStyle('.container', {
    selector: '.container',
    properties: {
      width: '100%',
      padding: '20px'
    }
  });

  // 小屏幕样式
  this.styleManager.addStyle('@media (max-width: 768px)', {
    selector: '@media (max-width: 768px)',
    properties: {
      '.container': {
        padding: '10px'
      }
    }
  });

  // 大屏幕样式
  this.styleManager.addStyle('@media (min-width: 1200px)', {
    selector: '@media (min-width: 1200px)',
    properties: {
      '.container': {
        maxWidth: '1200px',
        margin: '0 auto'
      }
    }
  });
}
```

### 动态样式

您可以根据组件状态动态添加或修改样式：

```typescript
class DynamicStyleComponent extends Component {
  protected initState() {
    return {
      isActive: false,
    };
  }

  protected initStyles() {
    // 基础样式
    this.styleManager.addStyle('.box', {
      selector: '.box',
      properties: {
        width: '200px',
        height: '200px',
        backgroundColor: '#f0f0f0',
        transition: 'background-color 0.3s',
      },
    });

    // 激活状态样式
    this.styleManager.addStyle('.box.active', {
      selector: '.box.active',
      properties: {
        backgroundColor: '#007bff',
      },
    });
  }

  protected toggleActive() {
    this.state.isActive = !this.state.isActive;
  }

  protected render() {
    return {
      tag: 'div',
      props: {
        className: `box ${this.state.isActive ? 'active' : ''}`,
      },
      listeners: {
        click: () => this.toggleActive(),
      },
      children: ['Click to toggle'],
    };
  }
}
```

### 全局样式

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

## 样式管理原理

### 样式注入

TSone 的样式管理系统通过以下步骤注入样式：

1. 创建一个 `<style>` 元素
2. 将样式规则转换为 CSS 字符串
3. 将 CSS 字符串设置为 `<style>` 元素的内容
4. 将 `<style>` 元素添加到文档头部

### 样式更新

当您添加、修改或删除样式时，StyleManager 会：

1. 更新内部样式存储
2. 重新生成 CSS 字符串
3. 更新 `<style>` 元素的内容

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

## 与其他样式方案集成

### 使用 CSS 预处理器

您可以使用 CSS 预处理器（如 Sass、Less）编写样式，然后在组件中导入：

```typescript
// 假设您有一个 button.scss 文件
// 编译后导入
import buttonStyles from './button.css';

class ButtonComponent extends Component {
  protected initStyles() {
    // 解析 CSS 字符串并添加样式
    this.styleManager.addStyleFromCSS(buttonStyles);
  }
}
```

### 使用 CSS 模块

您也可以使用 CSS 模块：

```typescript
import styles from './Button.module.css';

class ButtonComponent extends Component {
  protected render() {
    return {
      tag: 'button',
      props: { className: styles.button },
      children: ['Click Me'],
    };
  }
}
```

### 使用第三方样式库

您可以使用第三方样式库，如 Bootstrap、Tailwind CSS 等：

```typescript
// 在 HTML 中引入
// <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css">

class ButtonComponent extends Component {
  protected render() {
    return {
      tag: 'button',
      props: { className: 'btn btn-primary' },
      children: ['Click Me'],
    };
  }
}
```

## 总结

TSone 的样式管理系统提供了一种灵活、便捷的方式来管理组件样式。通过理解和掌握样式管理系统的使用方法，您可以创建更加美观、响应式的应用界面。

如果您想了解更多关于样式管理系统的细节，请参考 [API 参考](/api/style.md) 文档。
