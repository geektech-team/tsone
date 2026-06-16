---
title: TSone
description: 轻量级纯TypeScript前端框架，提供响应式系统、组件化和路由功能
---

# TSone

轻量级纯TypeScript前端框架，提供响应式系统、组件化和路由功能。

## 特性

- ✨ 纯TypeScript实现，提供完整的类型支持
- ⚡ 高效的响应式系统
- 🧩 组件化开发模式
- 🛣️ 内置路由功能
- 💅 样式管理系统
- 📦 轻量级设计，无外部依赖
- 🐇 Bun 原生工具链：包管理、测试、构建和文档服务均由 Bun 驱动

## 快速开始

### 安装

```bash
# 使用 Bun
bun add tsone
```

### 创建第一个应用

```typescript
import { createApp, Component } from 'tsone';

// 创建一个简单的组件
class App extends Component {
  protected initState() {
    return {
      count: 0
    };
  }

  protected initStyles() {
    this.styleManager.addStyle('.app', {
      selector: '.app',
      properties: {
        textAlign: 'center',
        padding: '20px'
      }
    });
  }

  protected render() {
    return {
      tag: 'div',
      props: { className: 'app' },
      children: [
        {
          tag: 'h1',
          children: [`计数: {{count}}`]
        },
        {
          tag: 'button',
          props: { className: 'btn' },
          listeners: {
            click: () => this.state.count++
          },
          children: ['增加计数']
        }
      ]
    };
  }
}

// 创建并挂载应用
const app = createApp({ root: App });
app.mount();
```

## 核心功能

### 响应式系统

TSone 提供了高效的响应式系统，使您能够轻松创建响应式状态并自动更新UI。

### 组件系统

基于类的组件系统，支持生命周期钩子、组件嵌套和事件传递。

### 路由系统

内置路由功能，支持声明式路由配置和导航。

### 样式管理

集成的样式管理系统，使您能够在组件中定义和管理样式。

## 浏览器支持

- Chrome (最新)
- Firefox (最新)
- Safari (最新)
- Edge (最新)

## 许可证

[MIT](https://github.com/yourusername/tsone/blob/main/LICENSE)
