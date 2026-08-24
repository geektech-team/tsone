# TSone Docs System Design

## Goal

把 TSone 文档系统重构为由 TSone 自身生成的静态 MPA 文档站。文档内容直接写在 TypeScript 文档系统中，不再以 `docs/src/**/*.md` 作为文档源；每个静态页面由 TSone 组件在构建期生成，浏览器端再用 TSone 挂载小型增强应用。

## Decisions

- `bun run docs` 继续表示启动文档预览服务。
- 新增 `bun run docs:build` 生成静态文档产物。
- 文档站第一阶段采用 MPA：每个路由输出独立 HTML 文件，页面导航走真实链接跳转，不依赖 history fallback。
- 文档内容迁移为 TypeScript content registry，例如 `docs/app/content/*.ts`。
- 不引入 React、Vue、JSX 编译器、VitePress、SSR 框架或新的浏览器运行时依赖。
- `docs/dist` 是生成产物，不提交到仓库。

## Scope

In scope:

- 新建 TSone 文档应用源码目录，承载内容模型、布局组件、文章渲染组件和客户端增强组件。
- 将现有 Markdown 文档内容迁移为 typed TypeScript 文档模块。
- 使用 TSone 组件在 Bun 构建脚本中生成每个静态 HTML 页面。
- 使用 Bun 构建一个轻量浏览器 bundle，负责主题切换、搜索过滤、当前导航态等增强行为。
- 更新 `scripts/docs.ts`，支持构建静态文档和预览 `docs/dist`。
- 更新 README、文档命令说明和相关测试契约。

Out of scope:

- 全站 SPA 路由和 history fallback。
- Markdown 作为文档源或运行时 Markdown parser。
- 全文搜索索引、模糊搜索、代码高亮引擎、版本切换、多语言、Algolia、主题市场。
- 新增 TSone hydration 能力。客户端增强通过独立 island 挂载实现。

## Architecture

文档系统分三层：

1. **Content Registry**
   `docs/app/content/` 导出类型化文档页面。每个页面声明 `path`、`title`、`description`、`section`、`order` 和 `body`。`body` 使用结构化 block helper 表达，例如 `heading()`、`paragraph()`、`list()`、`codeBlock()`、`apiTable()`、`callout()`。这些 helper 返回可类型检查的 `DocBlock`，由渲染层转换为 TSone `VNode`。

2. **TSone Document Components**
   `docs/app/components/` 使用 TSone 类组件实现页面结构。核心组件包括 `DocsPage`、`DocsNav`、`DocArticle`、`ThemeToggle` 和 `SearchBox`。静态生成时，`DocsPage` 组合导航、文章内容和增强 island 占位符。浏览器端不重新挂载整页，而是在预留节点中分别挂载 `ThemeToggle`、`SearchBox` 等小组件，避免重复 DOM。

3. **Bun Build and Preview**
   `scripts/docs.ts` 暴露 `buildDocs()`、`startDocsServer()` 和解析命令参数的 helper。构建期使用已有 dev dependency `happy-dom` 创建本地 DOM，调用 TSone `createApp` 或组件 `mountToNode()` 生成 HTML，再输出到 `docs/dist`。同时用 `Bun.build` 生成 `/assets/docs-client.js`。预览服务只服务 `docs/dist`，如果产物不存在则先执行一次 `buildDocs()`。

## File Responsibilities

- `docs/app/content/types.ts`：定义 `DocPage`, `DocSection`, `DocBlock` 和 block helper 类型。
- `docs/app/content/index.ts`：导出完整页面注册表，并检查页面路径唯一、排序稳定。
- `docs/app/content/*.ts`：承载从现有 Markdown 迁移来的具体文档页面。
- `docs/app/components/DocsPage.ts`：静态页面根组件，负责页面壳和布局。
- `docs/app/components/DocsNav.ts`：按 section 和 order 渲染 MPA 导航链接。
- `docs/app/components/DocArticle.ts`：把 `DocBlock[]` 转换为文章 VNode。
- `docs/app/components/SearchBox.ts`：客户端增强搜索 UI，基于页面注册表过滤链接。
- `docs/app/components/ThemeToggle.ts`：客户端增强主题切换 UI。
- `docs/app/client.ts`：浏览器增强入口，只挂载 island，不接管整页路由。
- `scripts/docs.ts`：构建静态文档、生成 client bundle、启动预览服务。

## Object Relationships

- `DocsPage` 对 `DocsNav` 和 `DocArticle` 是组合关系：页面实例拥有这两个子组件并决定它们的生命周期。
- `DocArticle` 依赖 `DocBlockRenderer` 或等价渲染函数把结构化内容转换为 `VNode`。
- `SearchBox` 与页面注册表是依赖关系：组件读取页面元数据，不拥有页面内容。
- 构建脚本依赖文档注册表和 TSone 组件，但不反向被组件依赖，避免文档应用和构建器循环耦合。

## Data Flow

构建流程：

1. 读取 `docs/app/content/index.ts` 的页面注册表。
2. 校验路径唯一、页面元数据完整、排序稳定。
3. 为每个 `DocPage` 创建 TSone 页面组件 props。
4. 在 Happy DOM 中挂载组件，序列化完整 HTML。
5. 按 MPA 路由写入 `docs/dist/index.html` 或 `docs/dist/<route>/index.html`。
6. 生成 `docs/dist/assets/docs-client.js`。

浏览器流程：

1. 用户打开某个静态 HTML 页面。
2. 页面无需 JS 即可阅读和跳转。
3. `docs-client.js` 加载后，TSone 在 island 节点挂载搜索和主题切换组件。
4. 主题选择写入 `localStorage`，搜索只影响客户端增强 UI，不改变静态 HTML 产物的可读性。

## Routing and Output

页面路径使用目录式输出：

- `/` -> `docs/dist/index.html`
- `/guide/getting-started/` -> `docs/dist/guide/getting-started/index.html`
- `/api/component/` -> `docs/dist/api/component/index.html`

导航链接统一使用带尾斜杠的绝对路径。预览服务对无尾斜杠路径做 301 或内部归一化，保证本地访问体验稳定。

## Styling and UI

文档站保持轻量、清晰、适合重复阅读。首屏直接呈现文档布局，不做营销式 landing page。布局包括左侧导航、顶部小工具区、正文和移动端折叠导航。设计保持克制，避免卡片套卡片和大量装饰元素。代码块、API 表格、提示块和导航当前态使用统一 token。

## Testing Strategy

按 TDD 推进：

- `tests/docs-content.test.ts`：先验证 content registry 路由唯一、排序稳定、页面元数据完整、每页有内容。
- `tests/docs-build.test.ts`：先验证 `buildDocs()` 输出 `docs/dist/index.html`、嵌套路由 HTML、client bundle，并包含 TSone 文档壳和页面标题。
- `tests/docs-server.test.ts`：更新为验证 `bun run docs` 预览静态产物，不再测试 Markdown parser。
- `tests/public-api-docs.test.ts`：更新公开文档契约，保留 `bun run docs`，新增 `bun run docs:build`。
- `tests/repository-hygiene.test.ts`：确认 `docs/dist` 被忽略。

完成前按风险扩大验证：

- `bun test tests/docs-content.test.ts tests/docs-build.test.ts tests/docs-server.test.ts`
- `bun test tests/public-api-docs.test.ts tests/repository-hygiene.test.ts`
- `bunx tsc --noEmit`
- `bun run build`，因为文档脚本和 content modules 都参与类型检查。

## Migration Plan

1. 为 TypeScript 文档内容建立类型和少量 helper。
2. 迁移首页、getting started、核心概念、组件、响应式、路由、样式、API 和示例文档。
3. 用 TSone 组件生成静态 HTML。
4. 接入客户端增强 island。
5. 删除 `docs/src` Markdown 源和旧 Markdown parser 测试路径。
6. 更新 README 和命令说明。

## Risks

- TSone 当前没有 hydration。通过 island 增强规避整页重复挂载。
- 旧 Markdown 内容较长，迁移为 TypeScript blocks 时容易漏段落。测试会覆盖页面数量、标题、关键公开 API 文案和核心命令。
- 构建期 DOM 依赖 Happy DOM。它已经是项目 dev dependency，不进入浏览器运行时，也不影响发布包运行时零依赖目标。
