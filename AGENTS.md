# TSone Agent Guide

本文件给 Codex 和其他协作代理提供项目级约定。开始任何改动前，先读本文件，再按改动范围阅读相邻源码、测试和文档。

## 项目定位

本仓库是 Bun workspace monorepo。TSone 发布面包含两个包：
`packages/tsone/` 的 `@geektech/tsone` 是轻量级纯 TypeScript 前端框架，
`packages/tsone-cli/` 的 `@geektech/tsone-cli` 是 Bun 原生开发和构建工具。
框架当前公开能力包括：

- 响应式系统：`reactive`、`readonly`、`effect`、`stop`、`computed`、`ref`
- 面向对象组件：`Component<Props, State>`、生命周期、事件、插槽
- 策略化 DOM 渲染：文本、元素、组件、插槽按 VNode 类型分发
- 内置路由：`createRouter`、`RouterView`、`RouterLink`
- 样式管理：`StyleManager`
- Bun 原生开发、测试、构建、示例和文档服务

保持项目的小型、依赖少、浏览器运行时无外部依赖。不要向框架包增加
`./dev` 导出或 Happy DOM/browser 运行时依赖。不要引入 React/Vue、JSX
编译器、SSR、路由守卫、devtools 或构建系统替换，除非任务明确要求。CLI
首版配置保持普通对象默认导出，不增加 plugins、WebSocket、HMR、SSR、
`public/` 复制或公开的 minify/sourcemap 配置。

## 技术栈和命令

本仓库是 Bun-first。优先使用 Bun 命令，不要把旧的 npm/Vite/Vitest 工作流重新引回主路径。

- 安装依赖：`bun install`
- 全量测试：`bun test`
- 指定测试：`bun test packages/tsone/tests/component-types.test.ts`
- CLI 全量测试：`bun test packages/tsone-cli/tests`
- CLI 指定测试：`bun test packages/tsone-cli/tests/config.test.ts`
- 类型检查：`bunx tsc --noEmit`
- 构建发布产物：`bun run build`
- 代码检查：`bun run lint`
- CLI 开发服务：在应用目录运行 `bun run tsone dev`
- CLI 应用构建：在应用目录运行 `bun run tsone build`
- 演练服务：`bun run dev`
- 文档服务：`bun run docs`
- 发布前建议检查：`bun test && bunx tsc --noEmit && bun run build && bun pm pack --cwd packages/tsone --dry-run && bun pm pack --cwd packages/tsone-cli --dry-run`

测试使用 `bun:test`。从仓库根运行时，DOM 测试通过根 `bunfig.toml`
preload `packages/tsone/tests/setup-dom.ts` 注入 Happy DOM 全局对象；从包目录
运行时，`packages/tsone/bunfig.toml` preload `tests/setup-dom.ts`。

## 代码地图

- 根 `package.json` 是私有 workspace manifest，根脚本协调各 workspace。
- `packages/tsone/package.json` 是发布包 manifest，保留 exports、files 和
  publishConfig。
- `packages/tsone-cli/package.json` 是独立 CLI 发布 manifest，保留根导出、
  `tsone` bin、files 和 publishConfig。
- `packages/tsone-cli/src/config.ts` 管理 `defineConfig`、配置加载、默认值、
  CLI 覆盖和校验；`types.ts` 定义公开配置类型。
- `packages/tsone-cli/src/server.ts` 与 `build.ts` 分别实现开发服务和生产构建，
  `proxy.ts` 实现 HTTP/HTTPS 开发代理，`project.ts` 隔离入口文档渲染。
- `packages/tsone-cli/src/index.ts` 是编程式 API 入口，`src/cli.ts` 与
  `bin/tsone.ts` 是命令行入口。
- `packages/tsone/lib/index.ts` 是包入口，导出核心、路由、`createApp`、
  `version` 和 `name`。
- `packages/tsone/lib/core/` 存放框架核心：
  - `app.ts` 管理应用实例、插件、全局上下文和根组件挂载。
  - `component/base.ts` 定义类组件、props/state、生命周期、插槽收集和更新。
  - `renderer.ts` 定义策略化渲染上下文和渲染策略。
  - `renderer/types.ts`、`renderer/props.ts` 放渲染公共类型和 props/event helper。
  - `reactive.ts`、`reactive/types.ts` 是响应式系统。
  - `template.ts` 处理 `{{name}}` 模板绑定。
  - `vnode.ts` 定义 VNode、HTML 节点、组件节点、slot 和 helper。
- `packages/tsone/lib/router/` 存放路由：
  - `index.ts` 暴露 `Router`、`createRouter`、`RouterView`、`RouterLink`、`useRouter`。
  - `history.ts` 处理 history/hash URL 读写。
  - `matcher.ts` 处理静态和动态路径匹配。
  - `instance.ts` 管理当前路由实例。
- `packages/tsone/lib/style/StyleManager.ts` 是样式管理实现，
  `packages/tsone/lib/style/index.ts` 是公开入口。
- 根 `playground/` 存放本地演练应用，每个子项目有独立 `package.json`。
- `packages/tsone/docs/app/content/` 是 typed content 文档源，
  `packages/tsone/scripts/docs.ts` 是 Bun 文档服务器。
- `packages/tsone/docs/superpowers/` 记录历史设计和实施计划，可作为架构意图参考。
- `packages/tsone/skills/object-oriented-design-constraints/SKILL.md` 是项目内的
  OOP 设计约束；涉及类、接口、继承、组合或 SOLID 判断时先读它。

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

- `packages/tsone/package.json` 的 `name`、`version`、`exports`、`files`、scripts
- `packages/tsone/lib/index.ts` 的 `version` 和 `name`
- `packages/tsone/lib/core/app.ts` 中 app context 的 `version`
- `packages/tsone/README.md` 快速开始、公开 API、开发命令、发布前检查
- `packages/tsone-cli/package.json`、`README.md`、`src/index.ts` 与相关类型
- `packages/tsone/docs/app/content/en/*.ts`、`zh/*.ts` 和相关 guide/example 文档
- `packages/tsone/tests/public-api-docs.test.ts`
- `packages/tsone/tests/component-types.test.ts`
- `packages/tsone/tests/package-smoke.test.ts`
- `packages/tsone/tests/brand-consistency.test.ts`

品牌统一为显示名 `TSone`、包名 `@geektech/tsone`。不要引入旧项目名或占位版本。
CLI 品牌包名固定为 `@geektech/tsone-cli`，bin 名固定为 `tsone`。

## 测试策略

改动时优先跑最小相关测试，完成前按风险扩大验证：

- 响应式系统：`bun test packages/tsone/lib/core/__tests__/reactive.test.ts`
- 组件、生命周期、状态、模板、插槽：`bun test packages/tsone/lib/core/__tests__/component.test.ts packages/tsone/tests/framework-plan.test.ts`
- 渲染策略、keyed diff、props/listeners：`bun test packages/tsone/tests/framework-plan.test.ts`
- 路由：`bun test packages/tsone/lib/router/__tests__/router.test.ts`
- 样式：`bun test packages/tsone/lib/style/__tests__/StyleManager.test.ts`
- 公开类型：`bun test packages/tsone/tests/component-types.test.ts`
- README/API 文档契约：`bun test packages/tsone/tests/public-api-docs.test.ts`
- 文档服务器 helper：`bun test packages/tsone/tests/docs-server.test.ts`
- 示例入口：`bun test packages/tsone/tests/example-entry.test.ts`
- 仓库卫生：`bun test packages/tsone/tests/repository-hygiene.test.ts`
- 发布包：`bun test packages/tsone/tests/package-smoke.test.ts`
- CLI 配置：`bun test packages/tsone-cli/tests/config.test.ts`
- CLI 代理：`bun test packages/tsone-cli/tests/proxy.test.ts`
- CLI 开发服务：`bun test packages/tsone-cli/tests/server.test.ts`
- CLI 构建和命令行：`bun test packages/tsone-cli/tests/build.test.ts packages/tsone-cli/tests/cli.test.ts`
- CLI 发布包：`bun test packages/tsone-cli/tests/package-smoke.test.ts`

对行为修复和新功能，先补或调整能复现问题的测试，再实现。改动发布面、构建
脚本或 exports 时必须跑 `bun run build`，并按包运行对应的 dry-run pack 或
package smoke test。

## 文档和示例

- 用户可见能力变化需要同步 `packages/tsone/README.md`、
  `packages/tsone/README-zh.md`、CLI README 和双语 typed content。
- 示例代码应能代表真实 API，不要展示未导出的符号或过期命令。
- `packages/tsone/scripts/docs.ts` 只支持当前 typed content 渲染能力；写文档时避免依赖它不支持的复杂 Markdown 功能。
- `playground/official-site/src/main.ts` 和
  `playground/admin-dashboard/src/main.ts` 是开发演练入口，公共组件行为变化时检查 playground 仍能渲染。

## 协作守则

- 开始前先看 `git status --short`，不要回滚或整理用户已有改动。
- 只修改任务相关文件；如果发现无关问题，记录给用户，不顺手大改。
- 新增依赖前先证明必要性。框架运行时代码应保持零外部运行时依赖。
- 不要提交生成产物来“修测试”；构建产物由 `bun run build` 产生，包内容由 `package.json` `files` 和 `.npmignore` 控制。
- 最终汇报要说明改了哪些文件、跑了哪些验证、还有哪些风险或未跑的检查。
