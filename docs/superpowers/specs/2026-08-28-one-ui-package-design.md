# One UI Package 设计

日期：2026-08-28

状态：已确认，待实施计划

## 1. 背景与目标

TSone 当前提供响应式系统、面向对象组件、VNode、插槽、事件、样式管理和
文档渲染能力，但仓库中尚无独立、可发布的 UI 组件库。现有 playground
重复实现了按钮、输入框和卡片样式，适合抽取一个真实消费 TSone 的独立
package，用于验证框架的组件组合、事件、样式、类型声明和发布链路。

本次新增 `packages/one/`，发布包名为 `@geektech/one`，品牌显示名为
`One UI`。首版只包含三个基础组件：`OneButton`、`OneInput`、`OneCard`。
同时新增位于 `packages/one/docs/` 的文档系统。文档站本身使用 TSone 构建，
并直接渲染 One UI 的真实组件。

成功标准：

- One UI 是可独立构建、测试、打包和安装的 Bun workspace package。
- 消费者通过 `@geektech/one` 获得稳定的 ESM 运行时和 TypeScript 类型。
- 三个组件具备已定义的行为、可访问性和主题定制入口。
- 文档站介绍设计理念、安装、主题令牌和三个组件的完整 API。
- One UI 不修改 TSone 的公开导出，也不增加浏览器运行时外部依赖。

## 2. 范围

### 2.1 本期范围

- 独立 package、构建脚本、类型声明、发布清单和双语 README。
- `OneButton`：三种 variant、三种 size、disabled、loading 和 click。
- `OneInput`：受控与非受控值、常用原生属性、状态和事件。
- `OneCard`：title 简写及 header、default、footer 插槽。
- 使用 CSS Variables 的默认主题。
- 基于 TSone 的静态多页文档站及真实交互示例。
- 组件、类型、样式、文档构建和发布包测试。
- 根 workspace 的 One UI 构建和文档命令。

### 2.2 非目标

- 图标系统、表单系统、Modal、Table 或其他高级组件。
- ThemeProvider、运行时主题对象或全局状态容器。
- 在线代码编辑器、沙箱或组件参数实验室。
- React、Vue、JSX 编译器、Markdown 解析器或外部文档框架。
- 修改 TSone 核心组件模型、渲染器或公开 API。
- 抽取 TSone 与 One UI 共用的通用文档生成框架。

## 3. Package 架构

目标目录：

```text
packages/one/
├── lib/
│   ├── button/
│   ├── input/
│   ├── card/
│   ├── styles/
│   └── index.ts
├── tests/
├── docs/
│   └── app/
│       ├── components/
│       ├── content/
│       ├── demos/
│       ├── app.ts
│       ├── client.ts
│       └── styles.ts
├── scripts/
│   ├── build.ts
│   └── docs.ts
├── package.json
├── tsconfig.json
├── tsconfig.build.json
├── README.md
├── README-zh.md
└── LICENSE
```

`@geektech/one` 初始版本为 `0.0.1`。`@geektech/tsone` 以
`>=0.0.2 <0.1.0` 声明为 peer dependency，避免应用安装多个 TSone 运行时；
开发期间同时通过 `devDependencies: "workspace:*"` 使用 workspace 源码。

包输出浏览器 ESM 和 `.d.ts`。npm 发布内容只包含 `dist/`、`README.md`、
`README-zh.md`、`LICENSE` 和 `package.json`。文档源码和构建结果不进入 npm
包。

根 workspace 增加 `@geektech/one` 的源码 path mapping，并提供
`build:one`、`docs:one`、`docs:one:build` 命令。根 `build` 按顺序构建
TSone 和 One UI，确保 peer 的本地构建产物先就绪。

## 4. 对象关系与职责

`OneButton`、`OneInput` 和 `OneCard` 分别继承 TSone 的 `Component`，这是
本设计唯一新增的继承关系。每个组件只管理自己的 props、状态、渲染和样式，
组件之间没有继承或相互依赖。

三个组件依赖 TSone 的 VNode、slot 和事件接口。组件的 `StyleManager` 由
TSone `Component` 组合并管理，One UI 不建立第二套样式生命周期。共享样式
模块只提供受限的类型、令牌和值归一化函数，不保存全局可变状态。

这种设计满足以下约束：

- 单一职责：组件、共享样式、构建和文档分别位于独立模块。
- 开闭原则：新增组件通过新增目录和导出完成，不修改已有组件。
- 里氏替换：所有 One UI 组件保持 TSone `Component` 的挂载、更新和卸载契约。
- 接口隔离：组件只公开与自身行为相关的 props 和事件类型。
- 依赖倒置：One UI 依赖 TSone 的公开抽象，不导入渲染器内部实现。

不增加 `BaseOneComponent`。当前三个组件没有足够的共享行为证明额外继承层
有价值，公共函数组合比空泛基类更直接。

## 5. 公开 API

包入口导出：

```ts
export {
  OneButton,
  OneInput,
  OneCard,
  type OneButtonProps,
  type OneInputProps,
  type OneCardProps,
  type OneInputValueEvent,
  type OneButtonVariant,
  type OneComponentSize,
} from '@geektech/one';
```

类型不使用 `any`。所有 HTML 事件通过明确的事件类型或
`OneInputValueEvent` 暴露。

### 5.1 OneButton

`OneButtonProps` 包含：

- `variant?: 'primary' | 'secondary' | 'danger'`，默认 `primary`。
- `size?: 'sm' | 'md' | 'lg'`，默认 `md`。
- `type?: 'button' | 'submit' | 'reset'`，默认 `button`。
- `disabled?: boolean`。
- `loading?: boolean`。
- `children?: Array<VNode | string>`，作为默认插槽内容。

组件通过 `click` 事件向父组件传递 `MouseEvent`。`disabled` 或 `loading`
为真时，底层 `<button>` 同时具有原生 disabled 状态，且组件不发出 click。
loading 状态增加 `aria-busy="true"` 和 CSS 加载指示器，但保留默认插槽文本
作为按钮的可访问名称，不增加新的 loadingText API。

运行时收到非法 variant 或 size 时回退到默认值；TypeScript 消费者通过联合
类型在编译期得到错误。

### 5.2 OneInput

`OneInputProps` 包含：

- `value?: string`：受控值。
- `defaultValue?: string`：非受控初始值。
- `type?: string`，默认 `text`。
- `name?: string`。
- `placeholder?: string`。
- `size?: 'sm' | 'md' | 'lg'`，默认 `md`。
- `disabled?: boolean`。
- `readonly?: boolean`。
- `required?: boolean`。
- `invalid?: boolean`。
- `ariaLabel?: string`。

事件载荷：

```ts
export interface OneInputValueEvent {
  value: string;
  originalEvent: Event;
}
```

组件通过 `input` 和 `change` 事件发送该载荷。`value` 一旦存在即进入受控
模式；同时存在 `value` 和 `defaultValue` 时以 `value` 为准。受控模式只发出
事件，并确保 DOM 最终展示最新 props.value；非受控模式更新内部响应式状态后
发出事件。`defaultValue` 只在构造时读取，后续 props 更新不重置用户输入。

`invalid` 为真时输出 `aria-invalid="true"` 和对应状态类，但首版不生成错误
文案；错误文案由使用方在输入框旁组合。

### 5.3 OneCard

`OneCardProps` 包含：

- `title?: string`。
- `children?: Array<VNode | string>`。

组件提供 `header`、default、`footer` 三个插槽。显式 header 插槽优先于
title；没有 header 内容时不渲染 header 容器，没有 footer 内容时不渲染
footer 容器。首版只提供中性卡片外观，不增加 variant、交互或可折叠状态。

## 6. 样式与主题

所有组件类名使用 `.one-*` 前缀，所有主题变量使用 `--one-*` 前缀。组件不
设置 `body`、`html` 或无前缀的元素选择器。

默认令牌至少包含：

- 颜色：primary、primary-hover、danger、surface、text、muted、border、focus。
- 圆角：sm、md。
- 间距：xs、sm、md、lg。
- 字号：sm、md、lg。
- 阴影：card。
- 字体：font-family。

样式规则以 CSS Variables 的 fallback 值保证开箱即用。使用方可在 `:root`
或任意父容器覆盖变量，不需要安装插件或创建 ThemeProvider。

每个组件通过继承得到的 `StyleManager` 注册自身选择器，并在组件卸载时按
TSone 生命周期清理。首版接受当前 StyleManager 的实例级 style element 模型，
不为了去重样式修改 TSone 核心。

## 7. 文档系统

文档源码位于 `packages/one/docs/`，使用 TSone 类组件和 typed content 构建。
构建脚本通过 Happy DOM 提供文档渲染环境，调用
`createApp(...).renderHtmlDocument()` 输出静态多页 HTML，再由 Bun 构建必要的
客户端脚本。

首版路由：

```text
/
├── /guide/design/
├── /guide/getting-started/
├── /guide/theming/
├── /components/button/
├── /components/input/
└── /components/card/
```

页面采用已确认的经典文档布局：固定顶部导航、左侧站点目录、中央正文和右侧
页内目录。窄屏下隐藏两侧固定栏，按单列顺序展示导航入口和正文。

内容职责：

- 首页介绍 One UI 定位、安装命令和组件入口。
- 设计理念说明轻量、类组件、明确组合关系、可访问性和 CSS Variables。
- 快速开始展示 TSone 应用中导入、创建和渲染 One UI 组件的真实代码。
- 主题页面列出全部 `--one-*` 令牌及局部覆盖示例。
- 三个组件页面包含用途、基础示例、状态、尺寸、事件、props 和 slot 表格。

组件页面直接导入 One UI 源码并渲染真实组件。静态构建输出初始组件 HTML；
客户端 bundle 只挂载需要响应用户输入的 demo。首版不实现在线代码编辑器或
通用 props 控制面板。

## 8. 错误处理与可访问性

- 构建脚本任一子命令失败时以非零状态退出，并保留原始命令错误。
- 文档服务器拒绝包含路径穿越片段的请求，未知资源返回 404。
- 组件的无效枚举值使用安全默认值，不生成无前缀的任意 CSS 类。
- Button 使用原生 button 语义、type 和 disabled。
- Input 将 disabled、readonly、required 和 invalid 映射到原生属性或 ARIA。
- 可交互组件保留可见 focus 样式，不能只依赖颜色表达状态。
- 文档示例为输入框提供 label 或 aria-label，为按钮提供可访问名称。

## 9. 测试策略

实施遵循测试驱动开发：先写能表达行为的失败测试，再写最小实现。

组件测试覆盖：

- Button 默认值、variant、size、type、click、disabled 和 loading。
- Input 受控值、非受控初始值、输入更新、change、原生属性和 invalid。
- Card title、三个插槽、header 优先级及空容器省略。
- 三个组件的 class 前缀、主题变量和卸载行为。

契约与发布测试覆盖：

- 合法公开类型可编译，非法 variant 和 size 不能通过类型检查。
- `lib/index.ts` 与 README、组件文档中的公开 API 一致。
- build 输出入口 JS 和声明文件，不包含测试、文档源码或内部目录。
- dry-run tarball 可安装到临时消费者目录，并通过运行时导入和严格类型检查。

文档测试覆盖：

- 七个路由（包含根首页）均能输出目录式 HTML。
- 每个公开组件在导航、内容和 API 表中出现。
- 文档 HTML 由 TSone `renderHtmlDocument()` 生成。
- 客户端 bundle 能挂载真实交互 demo。
- 文档服务器正确处理目录路由、静态资源、404 和路径穿越。

完成前按风险扩大验证：

```bash
bun test packages/one
bunx tsc --noEmit
bun run build
bun run docs:one:build
bun pm pack --cwd packages/one --dry-run
```

若全仓测试存在与本任务无关的基线失败，最终报告将把 One UI 相关验证与已知
基线问题分开列出，不修改无关代码。

## 10. 仓库集成与文件边界

预计修改根 `package.json`、`tsconfig.json`、`.gitignore` 和 `bun.lock`，新增
`packages/one/` 及其源码、测试、文档和脚本。`.superpowers/` 加入
`.gitignore`，设计过程生成的浏览器草图不进入版本控制。

当前工作区已有大量未提交变更。实施时只在任务相关位置做增量编辑，不回滚、
格式化或提交用户已有改动。涉及同一根配置文件时保留现有内容，仅加入 One UI
所需字段和命令。
