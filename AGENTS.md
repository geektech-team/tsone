# TSone Agent Guide

本文件给 Codex 和其他协作代理提供项目级约定。开始任何改动前，先读本文件，再按改动范围阅读相邻源码、测试和文档。

## 项目定位

TSone 是一个轻量级、纯 TypeScript 前端框架。当前公开能力包括：

- 响应式系统：`reactive`、`readonly`、`effect`、`stop`、`computed`、`ref`
- 面向对象组件：`Component<Props, State>`、生命周期、事件、插槽
- 策略化 DOM 渲染：文本、元素、组件、插槽按 VNode 类型分发
- 内置路由：`createRouter`、`RouterView`、`RouterLink`
- 样式管理：`StyleManager`
- Bun 原生开发、测试、构建、示例和文档服务

保持项目的小型、依赖少、浏览器运行时无外部依赖。不要引入 React/Vue、JSX 编译器、SSR、路由守卫、devtools 或构建系统替换，除非任务明确要求。

## 技术栈和命令

本仓库是 Bun-first。优先使用 Bun 命令，不要把旧的 npm/Vite/Vitest 工作流重新引回主路径。

- 安装依赖：`bun install`
- 全量测试：`bun test`
- 指定测试：`bun test tests/component-types.test.ts`
- 类型检查：`bunx tsc --noEmit`
- 构建发布产物：`bun run build`
- 代码检查：`bun run lint`
- 示例服务：`bun run dev`
- 文档服务：`bun run docs`
- 发布前建议检查：`bun test && bunx tsc --noEmit && bun run build && bun pm pack --dry-run`

测试使用 `bun:test`。DOM 测试通过 `bunfig.toml` preload `tests/setup-dom.ts` 注入 Happy DOM 全局对象。

## 代码地图

- `lib/index.ts` 是根入口，导出核心、路由、`createApp`、`version` 和 `name`。
- `lib/core/` 存放框架核心：
  - `app.ts` 管理应用实例、插件、全局上下文和根组件挂载。
  - `component/base.ts` 定义类组件、props/state、生命周期、插槽收集和更新。
  - `renderer.ts` 定义策略化渲染上下文和渲染策略。
  - `renderer/types.ts`、`renderer/props.ts` 放渲染公共类型和 props/event helper。
  - `reactive.ts`、`reactive/types.ts` 是响应式系统。
  - `template.ts` 处理 `{{name}}` 模板绑定。
  - `vnode.ts` 定义 VNode、HTML 节点、组件节点、slot 和 helper。
- `lib/router/` 存放路由：
  - `index.ts` 暴露 `Router`、`createRouter`、`RouterView`、`RouterLink`、`useRouter`。
  - `history.ts` 处理 history/hash URL 读写。
  - `matcher.ts` 处理静态和动态路径匹配。
  - `instance.ts` 管理当前路由实例。
- `lib/style/StyleManager.ts` 是样式管理实现，`lib/style/index.ts` 是公开入口。
- `examples/` 是本地示例应用。
- `docs/src/` 是文档源，`scripts/docs.ts` 是 Bun 文档服务器。
- `docs/superpowers/` 记录历史设计和实施计划，可作为架构意图参考。
- `skills/object-oriented-design-constraints/SKILL.md` 是项目内的 OOP 设计约束；涉及类、接口、继承、组合或 SOLID 判断时先读它。

## 开发约定

- 使用 TypeScript strict 风格，避免新增 `any`；公共 API 优先用泛型、`unknown`、显式接口或受限记录类型表达。
- 保持现有类组件和策略模式设计。新增渲染行为时优先扩展或拆分 `RenderStrategy`，不要把所有逻辑塞回单个大函数。
- 面向对象关系需要清晰，至少能说明依赖、关联、聚合、组合、继承或实现关系中的哪一种。设计和重构时遵守 SOLID。
- 文件命名按现有风格：目录和文件多用 kebab-case，类用 PascalCase，函数和变量用 camelCase，常量用 UPPER_SNAKE_CASE。
- 格式遵守 Prettier：2 spaces、single quote、semicolons、trailingComma es5、printWidth 80。
- 代码注释保持少而有用。已有源码中有中文注释，可以继续使用中文；不要添加解释显而易见代码的注释。
- 不要提交或依赖 `dist/`、`coverage/`、`node_modules/`、`.DS_Store`、`.worktrees/`、日志、`.env*`、docs 构建缓存等生成或本地文件。

## 公共 API 和版本同步

改动公开 API、导出路径、包名、版本或 README 示例时，同步检查：

- `package.json` 的 `name`、`version`、`exports`、`files`、scripts
- `lib/index.ts` 的 `version` 和 `name`
- `lib/core/app.ts` 中 app context 的 `version`
- `README.md` 快速开始、公开 API、开发命令、发布前检查
- `docs/src/api/*.md` 和相关 guide/example 文档
- `tests/public-api-docs.test.ts`
- `tests/component-types.test.ts`
- `tests/package-smoke.test.ts`
- `tests/brand-consistency.test.ts`

品牌统一为显示名 `TSone`、包名 `tsone`。不要引入旧项目名或占位版本。

## 测试策略

改动时优先跑最小相关测试，完成前按风险扩大验证：

- 响应式系统：`bun test lib/core/__tests__/reactive.test.ts`
- 组件、生命周期、状态、模板、插槽：`bun test lib/core/__tests__/component.test.ts tests/framework-plan.test.ts`
- 渲染策略、keyed diff、props/listeners：`bun test tests/framework-plan.test.ts`
- 路由：`bun test lib/router/__tests__/router.test.ts`
- 样式：`bun test lib/style/__tests__/StyleManager.test.ts`
- 公开类型：`bun test tests/component-types.test.ts`
- README/API 文档契约：`bun test tests/public-api-docs.test.ts`
- 文档服务器 helper：`bun test tests/docs-server.test.ts`
- 示例入口：`bun test tests/example-entry.test.ts`
- 仓库卫生：`bun test tests/repository-hygiene.test.ts`
- 发布包：`bun test tests/package-smoke.test.ts`

对行为修复和新功能，先补或调整能复现问题的测试，再实现。改动发布面、构建脚本或 exports 时必须跑 `bun run build`，必要时跑 `bun pm pack --dry-run` 或 `tests/package-smoke.test.ts`。

## 文档和示例

- 用户可见能力变化需要同步 `README.md` 和 `docs/src/`。
- 示例代码应能代表真实 API，不要展示未导出的符号或过期命令。
- `scripts/docs.ts` 只支持当前轻量 Markdown 渲染能力；写文档时避免依赖它不支持的复杂 Markdown 功能。
- `examples/index.ts` 和 `examples/components/` 是开发服务入口，公共组件行为变化时检查示例仍能渲染。

## 协作守则

- 开始前先看 `git status --short`，不要回滚或整理用户已有改动。
- 只修改任务相关文件；如果发现无关问题，记录给用户，不顺手大改。
- 新增依赖前先证明必要性。框架运行时代码应保持零外部运行时依赖。
- 不要提交生成产物来“修测试”；构建产物由 `bun run build` 产生，包内容由 `package.json` `files` 和 `.npmignore` 控制。
- 最终汇报要说明改了哪些文件、跑了哪些验证、还有哪些风险或未跑的检查。
