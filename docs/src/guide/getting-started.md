# 快速开始

本指南将帮助您快速上手 TSone 框架。

## 安装

首先，您需要安装 TSone 包。项目默认使用 Bun：

```bash
bun add @geektech/tsone
```

## 创建第一个应用

### 1. 创建一个简单的组件

首先，创建一个继承自 `Component` 类的组件：

```typescript
import { createApp, Component } from '@geektech/tsone';

class App extends Component {
  protected initState() {
    return {
      count: 0,
    };
  }

  protected initStyles() {
    this.styleManager.addStyle('.app', {
      selector: '.app',
      properties: {
        textAlign: 'center',
        padding: '20px',
      },
    });
  }

  protected render() {
    return {
      tag: 'div',
      props: { className: 'app' },
      children: [
        {
          tag: 'h1',
          children: [`计数: {{count}}`],
        },
        {
          tag: 'button',
          props: { className: 'btn' },
          listeners: {
            click: () => this.state.count++,
          },
          children: ['增加计数'],
        },
      ],
    };
  }
}
```

### 2. 创建应用实例并挂载

```typescript
// 创建应用实例
const app = createApp({
  rootElement: '#app',
  state: {
    appName: 'TSone 示例',
  },
});

// 挂载应用
app.mount();
```

### 3. HTML 结构

在您的 HTML 文件中，添加一个挂载点：

```html
<!DOCTYPE html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>TSone 示例</title>
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="./index.ts"></script>
  </body>
</html>
```

## 运行应用

在本仓库中可以直接使用 Bun 原生开发服务运行示例：

```bash
bun run dev
```

现在，您应该能看到一个简单的计数器应用，点击按钮可以增加计数。

## 下一步

- 了解 [核心概念](./core-concepts.md)
- 学习 [组件系统](./component-system.md)
- 探索 [响应式系统](./reactive-system.md)
- 掌握 [路由系统](./router-system.md)
- 了解 [样式管理](./style-management.md)
