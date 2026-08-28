# TSone 文档多语言系统设计

日期：2026-08-28

状态：设计已确认，等待实施计划

## 背景

TSone 文档当前由 TypeScript typed content registry 提供，并构建为 MPA
静态站点。现有 14 个页面均为中文，中文路由直接位于 `/`、`/guide/.../`、
`/api/.../` 等路径。文档搜索、导航、主题切换和客户端 bundle 也只处理单一
语言。

本次改造在保留纯 TypeScript 文档源和 MPA 静态输出的前提下，增加中文、英文
两种完整语言版本，并支持浏览器语言自动识别和用户手动切换。

## 目标

- 支持中文 `zh` 与英文 `en` 两个 locale。
- 中文继续使用现有无前缀路由，保持已有链接兼容。
- 英文统一使用 `/en/` 前缀。
- 中英文必须拥有完全相同的 14 个逻辑页面，不允许缺页回退。
- 仅访问 `/` 时根据用户偏好或浏览器语言自动选择语言。
- 用户可在任意页面手动切换语言，并保持当前逻辑页面。
- 搜索、导航、页面元数据和短 UI 文案均限定在当前语言。
- 文档内容继续全部使用 TypeScript，不新增 Markdown、手写 HTML 或手写
  JavaScript 文档源。

## 非目标

- 本阶段不支持中文、英文以外的语言。
- 不在运行时调用机器翻译服务。
- 不把 MPA 文档改造成 SPA。
- 不允许英文缺失时回退中文，也不允许同一页面中英混排。
- 不改动 TSone 框架的公共国际化 API；多语言能力属于文档系统。

## 已确认决策

### URL

- 中文首页：`/`
- 中文内容页：`/guide/getting-started/`、`/api/app/` 等现有路径
- 英文首页：`/en/`
- 英文内容页：`/en/guide/getting-started/`、`/en/api/app/` 等
- 语言切换保持逻辑路径，只增加或移除 `/en` 前缀。

### 自动识别优先级

1. 明确 URL 决定当前页面语言，具体内容页不会被自动改写。
2. 只有访问 `/` 时执行自动识别。
3. `/` 先读取用户手动选择的 `localStorage` 记录。
4. 没有有效记录时读取 `navigator.languages`。
5. 首选语言以 `zh` 开头时使用中文，其他语言使用英文。
6. `navigator.languages` 不可用时默认中文。

### 翻译完整性

- 中文和英文分别维护完整 typed content。
- 两种语言的规范化逻辑路由集合必须完全相同。
- 缺少、多出或重复页面时，构建直接失败。
- 不提供跨语言内容回退。

## 内容组织

目录调整为：

```text
docs/app/content/
  zh/
    home.ts
    guide.ts
    api.ts
    examples.ts
    contributing.ts
    index.ts
  en/
    home.ts
    guide.ts
    api.ts
    examples.ts
    contributing.ts
    index.ts
  index.ts
  locales.ts
  types.ts
```

现有中文内容迁移到 `zh/`，英文目录使用相同文件边界和逻辑路由。代码示例中
属于用户可见内容的中文字符串也翻译为英文，API 标识符和 TypeScript 代码结构
保持一致。

核心类型：

```typescript
export type DocLocale = 'zh' | 'en';

export interface DocLocaleMessages {
  searchPlaceholder: string;
  searchLabel: string;
  navigationLabel: string;
  languageLabel: string;
  themeToggleLabel: string;
  lightThemeLabel: string;
  darkThemeLabel: string;
  apiNameLabel: string;
  apiSignatureLabel: string;
  apiDescriptionLabel: string;
}

export interface DocLocaleConfig {
  locale: DocLocale;
  htmlLang: 'zh-CN' | 'en';
  pathPrefix: '' | '/en';
  label: string;
  messages: DocLocaleMessages;
}

export interface DocCatalog {
  locale: DocLocale;
  config: DocLocaleConfig;
  pages: DocPage[];
  searchEntries: SearchEntry[];
}
```

`DocPage.path` 始终保存无 locale 前缀的逻辑路径。`DocCatalog` 聚合一种语言的
配置、页面和搜索索引。内容注册表聚合两个 `DocCatalog`，不让组件直接依赖
`zh/` 或 `en/` 文件。

现有 `docPages`、`searchEntries`、`findDocPage` 继续作为中文默认兼容出口；新增
locale-aware catalog 与查找函数供多语言构建和客户端使用。

## 路由函数

共享纯函数负责所有语言路径计算：

- `localizeDocPath(locale, logicalPath)`：将逻辑路径转换为公开 URL。
- `parseLocalizedDocPath(urlPath)`：返回 locale 与逻辑路径。
- `switchDocLocale(urlPath, targetLocale)`：生成同一逻辑页面的目标语言 URL。
- `localizeDocHref(locale, href)`：只转换 typed content 中站内文档链接，外部链接
  和锚点保持不变。

导航、正文链接、搜索结果、语言切换器和构建输出全部依赖这些函数，不在页面
内容中手写 `/en/`。

## 严格校验

单语言 `validateDocPages` 继续负责路径格式、重复路由、标题、描述和正文校验。
新增 locale registry 校验：

1. 分别校验并排序中文、英文页面。
2. 以中文逻辑路由集为基准比较英文路由集。
3. 错误信息包含 locale 和具体缺失、多出或重复的逻辑路径。
4. 校验完成后才创建搜索索引并进入静态构建。

英文 catalog 额外进行正文字符检查，避免遗留中文标题、段落、UI 文案或代码示例
字符串。检查对象使用 `docText(page)`，因此覆盖所有 structured block。

## 组件设计

### `DocsPage`

`DocsPage` 继续组合 `DocsNav` 和 `DocArticle`，并新增语言切换挂载区域。props
增加当前 `locale`、locale 配置和页面逻辑路径。它只负责页面结构，不读取
`localStorage` 或浏览器语言。

### `DocsNav`

`DocsNav` 接收当前 locale、逻辑页面列表和当前逻辑路径。链接通过
`localizeDocPath` 生成，当前项比较逻辑路径。`aria-label` 来自 locale messages。

### `DocArticle`

`DocArticle` 接收 locale messages，并通过 `localizeDocHref` 转换 structured
content 中的站内链接。API 表格的 Name、Signature、Description 表头从 messages
读取，其他文章 block 渲染职责不变。

### `SearchBox`

`SearchBox` 只接收当前 locale 的 `SearchEntry[]` 与搜索 UI 文案。搜索结果 URL
已经本地化，不查询另一语言 catalog。

### `ThemeToggle`

`ThemeToggle` 接收当前 locale 的主题切换 aria-label 和浅色、深色显示文案。
主题存储 key 与切换逻辑保持不变。

### `LocaleSwitcher`

新增 `LocaleSwitcher` 类组件，渲染紧凑的语言选择菜单，与主题切换器并列放在
固定 header 中。它只依赖当前 locale 和当前逻辑路径：

1. 用户选择目标语言。
2. 尝试写入 `localStorage`。
3. 写入失败不阻止跳转。
4. 通过 `switchDocLocale` 计算 URL 并导航。

### 类关系

- `DocsPage` 组合 `DocsNav`、`DocArticle` 及三个客户端挂载区域。
- `SearchBox`、`ThemeToggle`、`LocaleSwitcher` 分别作为独立 TSone 应用挂载，
  并接收当前 locale messages。
- 组件依赖 locale props 和纯路由函数，不依赖具体语言 catalog。
- locale registry 聚合 `DocCatalog`，构建器依赖 registry 接口。
- 除现有组件继承 `Component` 外不新增继承层级，保持单一职责和依赖倒置。

## 浏览器语言启动脚本

新增 TypeScript 源文件 `docs/app/locale-bootstrap.ts`，构建为轻量同步脚本
`/assets/docs-locale.js` 并放入页面 head。脚本只在 `location.pathname === '/'`
时执行：

1. 安全读取 `localStorage` 中的 `tsone-docs-locale`。
2. 有效值 `zh` 保持当前页面，有效值 `en` 使用 `location.replace('/en/')`。
3. 无有效值时读取 `navigator.languages` 或 `navigator.language`。
4. 首选语言以 `zh` 开头时保持中文，否则跳转英文。
5. 存储读取异常按“没有已保存偏好”处理并继续判断浏览器语言；navigator 缺失
   或异常时保持中文，导航异常时保留当前中文页面。

具体中文内容页和所有 `/en/...` 页面不执行自动跳转，确保显式 URL 优先且分享
链接稳定。

## 客户端数据流

静态 HTML 的根节点记录当前 locale 和逻辑路径。`docs-client.ts` 根据路径解析
locale，从 locale registry 选择对应搜索索引与 UI 文案，然后挂载：

- 当前语言 `SearchBox`
- `ThemeToggle`
- 当前页面 `LocaleSwitcher`

第一版客户端 bundle 可以包含两个 catalog。当前文档规模较小，优先保持构建和
运行模型简单；不额外引入搜索 JSON 请求或按语言拆分客户端 bundle。

## 静态构建

`buildDocs` 在清理输出目录前完成 locale registry 校验，然后：

1. 构建共享文档客户端 bundle。
2. 构建语言自动识别 bootstrap bundle。
3. 遍历中文、英文 catalog 的 28 个页面。
4. 使用 locale 路由函数计算输出路径。
5. 使用 TSone `createDocsPageApp(...).renderHtmlDocument()` 生成页面。

输出示例：

```text
dist/index.html
dist/guide/getting-started/index.html
dist/en/index.html
dist/en/guide/getting-started/index.html
dist/assets/docs-client.js
dist/assets/docs-locale.js
```

每个页面设置：

- 中文 `lang="zh-CN"`，英文 `lang="en"`。
- 当前语言标题和 meta description。
- 指向中文、英文对应页面的 `rel="alternate"` 与 `hreflang` head link。
- 共享 typed style objects。
- 共享客户端脚本；中文 `/` 额外执行语言自动识别判断。

构建结果 `pagesBuilt` 为 28，`assetsBuilt` 包含两个客户端资产。

## 错误处理

- 无效 locale 值被忽略，不进入路由或 catalog。
- `localStorage` 读写失败不影响页面渲染与手动切换。
- 浏览器语言 API 缺失或异常时默认中文。
- 自动识别只允许目标 `/en/`，不拼接未经校验的外部输入。
- 缺页、重复页、空内容和 route parity 错误阻止构建并输出明确错误。
- 静态服务器继续对不存在或越界路径返回 404，`/en/...` 使用现有 MPA 文件解析。

## 测试策略

### 内容模型

- locale 配置完整且只包含 `zh`、`en`。
- 中文、英文各 14 个页面，逻辑路由集合相同。
- 缺失、多出、重复页面时严格校验失败。
- 英文 `docText` 不包含中文正文字符。
- 两种语言搜索索引只包含对应语言内容。

### 路由与偏好

- 中文、英文首页与深层路径生成正确。
- locale 路径解析和中英文互转保持逻辑页面。
- 手动偏好优先于浏览器语言。
- 无偏好时根据 `navigator.languages` 选择。
- 无效存储值和缺失浏览器 API 时默认中文。
- 明确内容页不触发自动改写。

### 组件

- `DocsNav`、正文内部链接和搜索结果使用当前 locale URL。
- `SearchBox` 使用当前语言 placeholder、aria-label 和索引。
- `ThemeToggle` 和 API 表格表头使用当前语言文案。
- `LocaleSwitcher` 保存有效偏好并跳转对应页面；存储失败仍能跳转。
- header 同时容纳语言切换与主题切换，不破坏固定布局和移动端布局。

### 构建与服务

- 构建产生 28 个 HTML 页面和两个客户端资产。
- 中英文页面具有正确的 `lang`、标题、描述及 alternate links。
- `/`、`/en/` 和中英文深层 MPA 路径均可由预览服务访问。
- 自动识别 bundle 与文档客户端 bundle 均由 TypeScript 构建。
- README 与贡献指南说明多语言目录、严格构建规则和开发命令。

完成后运行相关测试、全量 `bun test`、`bunx tsc --noEmit`、`bun run lint`、
`bun run build` 与 `bun run docs:build`。

## 迁移顺序

1. 建立 locale 类型、配置、路由函数和严格校验。
2. 将现有中文内容迁移到 `content/zh/`，保持路由和内容不变。
3. 创建完整英文 catalog 并通过 route parity 与中文字符校验。
4. 让导航、文章链接、搜索和页面应用接受 locale 上下文。
5. 增加 `LocaleSwitcher` 与 locale bootstrap。
6. 扩展静态构建为 28 页面和两个客户端资产。
7. 同步样式、README、贡献指南与测试。

每一步按 TDD 先建立失败测试，再做最小实现，并保持现有中文 URL 与页面行为
持续通过。

## 验收标准

- `/` 保持中文 URL，并在首次访问时按已确认优先级自动识别语言。
- `/en/` 和全部英文深层页面可直接访问、刷新与分享。
- 任意页面可以手动切换到另一语言的同一逻辑页面。
- 用户手动选择能够持久化，并优先于浏览器语言。
- 中英文各 14 页，无缺失、回退或混排。
- 导航、搜索、页面元数据和 UI 文案均与当前语言一致。
- 静态站保持纯 TypeScript 文档源、MPA 输出和 TSone 组件实现。
- 所有相关及全量验证命令通过。
