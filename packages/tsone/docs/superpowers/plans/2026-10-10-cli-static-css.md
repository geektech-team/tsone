# TSone CLI Static CSS Extraction Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `tsone build` 自动将固定文档和组件规则生成静态 CSS，保持应用写法，无法确认固定的规则继续运行时处理。

**Architecture:** Bun 内存发现构建提供实际模块图，TypeScript AST 保守分析固定初始化，最终构建只追加静态资源申请。管理器保留同步内联样式，以实际节点 CSS 快照校验资源并等待 link 加载，再按实例原位置切换；修改恢复内联。文档 CSS 按每路由最终 HTML 独立抽取。

**Tech Stack:** Bun、TypeScript compiler API（已有依赖）、HTMLRewriter、bun:test、现有 DOM preload。

**Spec:** [已确认设计](../specs/2026-10-10-cli-static-css-design.md)。执行前同时阅读根 `AGENTS.md` 和框架 OOP skill。

## Global Constraints

- 范围包括 `document.styles`、组件 `initStyles()` 中通过 `StyleManager` 注册的固定规则，以及能明确识别的新建 `StyleManager` 的固定初始化。
- 无法确认固定的规则继续使用运行时样式路径；不得执行应用函数、使用 eval 或仅匹配类名和方法名。
- 生成代码完整保留原注册代码、逐项求值、forEach 和其他副作用的原顺序，只在候选组后追加 `StyleManager.useStaticStyleSheet(href)`。
- 首屏保留同步内联样式，直到对应外链加载成功；完整有序 Map 和规则对象保留在 JavaScript 中以支持动态回退。
- CSS 使用保留前缀加完整 SHA-256 内容摘要命名；管理器 CSS 原文不另外压缩；组件 CSS 不进入全页 stylesheet 注入列表。
- CSS 位于对应 HTML 同目录；`basePath` 是部署 URL 前缀，不生成额外磁盘目录。
- 相对 URL、片段 URL、`@import`、不明确 URL 和 HTML base 元素保守回退；不新增资源复制或 CSS URL 重写系统。
- `tsone dev`、watch 和 `tsone build --library` 不启用本优化；不改 `OneApp` 的通用 head 覆盖语义。
- 框架浏览器运行时保持零外部依赖；CLI 不增加 npm 依赖、公开配置字段或 exports 路径。
- 保持 CLI Bun 引擎要求 `>=1.3.0`；缺少可信 resolved-import metadata 时跳过组件分析。
- 当前 checkout 工作，保留无关修改；不提交生成物、不改版本、不发布 npm、不改独立 docs 构建脚本。

## Review Focus

1. 加载期间只修改规则对象：按实际写入节点的 CSS 快照比较，不能让新属性意外生效（Task 2）。
2. 两个实例同 selector 且加载乱序：保持原节点层叠位置，销毁一个不影响另一个（Task 2）。
3. 旧框架缺少新方法或存在同名非框架类：保留原调用正常运行，不误认类身份（Tasks 3、5、8）。
4. 两阶段间源文件变化：整个入口放弃候选变换和组件 CSS，不能混用旧规则与新 bundle（Tasks 3、7）。
5. 同入口按路由生成不同 document.styles：每路由独立提取，资源去重，嵌套页面与 directoryPages 地址正确（Tasks 6、7）。

## 文件职责和依赖

所有路径相对仓库根。新文件按以下职责拆分，不另建公共插件系统。

| 文件 | 职责 |
| --- | --- |
| `packages/tsone/lib/style/managed-sheet.ts` | 无 DOM 的管理器规则序列化，保持旧格式 |
| `packages/tsone/lib/style/static-style-resource.ts` | 绝对 URL 到 CSS 获取 Promise 的私有缓存 |
| `packages/tsone/lib/style/StyleManager.ts` | 每实例节点、加载代次及动态恢复 |
| `packages/tsone/lib/style/index.ts` | 导出纯 serializer，不导出缓存 |
| `packages/tsone/lib/core/document.ts` | 标记受控 document.styles 节点 |
| `packages/tsone-cli/src/static-styles/module-graph.ts` | 发现构建、源快照、已证实导入边和绑定身份 |
| `packages/tsone-cli/src/static-styles/evaluate.ts` | 有限静态表达式求值 |
| `packages/tsone-cli/src/static-styles/analyze.ts` | 注册组边界、规则验证及追加变换 |
| `packages/tsone-cli/src/static-styles/assets.ts` | URL 回退、内容命名、文档抽取和目录写盘 |
| `packages/tsone-cli/src/build.ts` | 组合两次构建与最终页面输出，保留 library 分支 |

依赖为 1→2、3→4→5、1/5/6→7、全部→8。Task 6 可与模块分析并行。框架不依赖 CLI/TypeScript；分析器不写盘；管理器组合自己的 DOM 节点，共享缓存不共享激活节点。

## Task 1: 共用序列化并标记文档样式

**Files:** Create `packages/tsone/lib/style/managed-sheet.ts`、`packages/tsone/lib/style/__tests__/managed-sheet.test.ts`；Modify `packages/tsone/lib/style/{StyleManager,index}.ts`、`packages/tsone/lib/core/document.ts`、`packages/tsone/lib/core/__tests__/document.test.ts`。

**Interfaces:** Consumes `StyleOptions` 和现有 document serializer。Produces `renderManagedStyleSheet(styles: Iterable<StyleOptions>): string`，由现有 `@geektech/tsone/style` 导出；文档标记为 `data-tsone-document-style`。

- [ ] 写精确原文失败测试，覆盖基础/hover/media、空 iterable、重复 name 的 Map 顺序和现有属性转换（不顺手改变 custom property 行为）。

```ts
const rules: StyleOptions[] = [{ selector: '.a',
  properties: { fontSize: 12 }, hover: { color: 'red' },
  media: { print: { display: 'none' } } }];
expect(renderManagedStyleSheet(rules)).toBe(
  '.a {\nfont-size: 12;\n}\n.a:hover {\ncolor: red;\n}\n' +
  '@media print {\n.a {\ndisplay: none;\n}\n}\n'
);
expect(renderManagedStyleSheet([])).toBe('');
```

- [ ] 跑 `bun test packages/tsone/lib/style/__tests__/managed-sheet.test.ts`，确认缺少 helper 失败。
- [ ] 从原 manager 搬移序列化循环；空 Map 分支、节点创建留在 manager，导出 helper。

```ts
export function renderManagedStyleSheet(styles: Iterable<StyleOptions>): string {
  const properties = (values: Record<string, string | number>) =>
    Object.entries(values).map(([key, value]) =>
      `${key.replace(/([A-Z])/g, '-$1').toLowerCase()}: ${value};`
    ).join('\n');
  let css = '';
  for (const style of styles) {
    css += `${style.selector} {\n${properties(style.properties)}\n}\n`;
    if (style.hover) css += `${style.selector}:hover {\n${properties(style.hover)}\n}\n`;
    for (const [query, values] of Object.entries(style.media ?? {})) {
      css += `@media ${query} {\n${style.selector} {\n${properties(values)}\n}\n}\n`;
    }
  }
  return css;
}
// 原 updateStyles 空 Map 分支之后：
this.ensureStyleElement().textContent = renderManagedStyleSheet(this.styles.values());
```

- [ ] 增加文档标记测试，再将 document.styles 的起始标签改为 `<style data-tsone-document-style>`；手写 head style 不加标记。

```ts
const html = renderHtmlDocument({ title: 'Styles', body: [],
  head: [{ tag: 'style', text: '.user { color: red; }' }],
  styles: [{ selector: '.fixed', properties: { color: 'blue' } }] });
expect(html).toContain('<style data-tsone-document-style>');
expect(html).toContain('<style>.user { color: red; }</style>');
```

- [ ] 跑 `bun test packages/tsone/lib/style/__tests__ packages/tsone/lib/core/__tests__/document.test.ts`；通过后仅提交此任务文件，信息 `refactor(style): share managed CSS serialization`。

## Task 2: 实例加载和动态恢复

**Files:** Create `packages/tsone/lib/style/static-style-resource.ts`、`packages/tsone/lib/style/__tests__/static-style.test.ts`；Modify `packages/tsone/lib/style/StyleManager.ts`。

**Interfaces:** Consumes Task 1。Produces public `useStaticStyleSheet(href: string): void`；internal `fetchStaticStyleSheet(absoluteHref: string): Promise<string | null>`。公开 `styleElement` 类型仍为 `HTMLStyleElement | null`，外链激活后为 null。

- [ ] 写加载失败测试。测试保存/恢复 fetch，清理所有 manager；使用 Response mock 和手动 Event，不假设 DOM mock 会加载 CSS。

```ts
async function flush(): Promise<void> {
  for (let i = 0; i < 8; i++) await Promise.resolve();
}
const manager = new StyleManager();
manager.addStyle('a', { selector: '.a', properties: { color: 'red' } });
const inline = manager.styleElement!;
globalThis.fetch = async () => new Response(inline.textContent);
manager.useStaticStyleSheet('https://styles.test/a.css');
expect(inline.isConnected).toBe(true);
await flush();
const link = inline.previousElementSibling!;
expect(link.getAttribute('media')).toBe('not all');
link.dispatchEvent(new Event('load'));
expect(manager.styleElement).toBeNull();
expect(inline.isConnected).toBe(false);
manager.addStyle('a', { selector: '.a', properties: { color: 'blue' } });
expect(link.isConnected).toBe(false);
expect(manager.styleElement!.textContent).toContain('color: blue');
```

- [ ] 跑 `bun test packages/tsone/lib/style/__tests__/static-style.test.ts`，确认方法缺失失败。
- [ ] 实现无导入副作用的共享 fetch cache：非 2xx、拒绝和读取错误返回 null；失败 cache 删除以允许重试，不取消其他实例请求。

```ts
const resources = new Map<string, Promise<string | null>>();
export function fetchStaticStyleSheet(href: string): Promise<string | null> {
  const existing = resources.get(href);
  if (existing) return existing;
  const pending: Promise<string | null> = Promise.resolve().then(() => fetch(href)).then(response =>
    response.ok ? response.text() : null
  ).catch(() => null).then(css => {
    if (css === null && resources.get(href) === pending) resources.delete(href);
    return css;
  });
  resources.set(href, pending);
  return pending;
}
```

- [ ] 增加私有 generation、pendingLink、staticLink 和最近一次管理器写入的节点/原文。方法身份与模块初始化时保存的原 prototype methods 比较，覆写方法或直接操纵节点则不申请静态路径。存在 base、不可信 snapshot、无 CSS 或无法解析相对 href 时返回。用 ownerDocument.baseURI/URL 和 new URL，不依赖 HTMLLinkElement 全局。

```ts
const generation = ++this.generation;
const inline = this.styleElement;
if (!inline || !inline.isConnected) return;
const css = inline.textContent ?? '';
const current = () => this.generation === generation &&
  this.styleElement === inline && inline.isConnected && inline.textContent === css;
```

每个异步边界检查 current，fetch 原文必须等于 css。候选在 inline 前插入，先安装 load/error 回调，再设 href；使用 `rel=stylesheet`、`media=not all`。load 再检查，去掉 media 后移除 inline；error 保留 inline。过期回调只能移除自己的候选，不能清除新代次引用。

- [ ] add/remove/clear/destroy 首步调用 private `invalidateStaticStyle(): void`，代次失效并清除候选。激活后 add/remove/clear 用 link.replaceWith(style) 原位置恢复，再按完整 Map 更新；clear 恢复空节点，destroy 清理节点。destroy 后 add 仍能复用 manager。
- [ ] 加 Review Focus 1 测试：fetch pending 时只修改对象，旧 CSS 可激活但新值不生效，下一次 add 才写新值；不能在 await 后重新序列化对象来比较。

```ts
let finish!: (response: Response) => void;
globalThis.fetch = () => new Promise<Response>(resolve => { finish = resolve; });
const rule = { selector: '.a', properties: { color: 'red' } };
manager.addStyle('a', rule);
const snapshot = manager.styleElement!.textContent!;
manager.useStaticStyleSheet('https://styles.test/mutation.css');
await flush();
rule.properties.color = 'green';
finish(new Response(snapshot));
await flush();
manager.styleElement!.previousElementSibling!.dispatchEvent(new Event('load'));
expect(manager.styleElement).toBeNull();
```

- [ ] 加 Review Focus 2 测试：两个实例依次写 red/blue，各加 sentinel，逆序 load 后 sentinel 与 link 顺序不变；销毁 red 后 blue link 仍连接，fetch 共享但节点独立。覆盖重复 name、remove、clear、destroy 后复用、节点/text 被改、重复申请、fetch/link error、内容不匹配、等待中增删/卸载，以及 subclass addStyle 覆写不发请求。

```ts
const first = new StyleManager();
const second = new StyleManager();
first.addStyle('same', { selector: '.same', properties: { color: 'red' } });
second.addStyle('same', { selector: '.same', properties: { color: 'blue' } });
const firstInline = first.styleElement!;
const secondInline = second.styleElement!;
globalThis.fetch = async input => new Response(String(input).includes('red')
  ? firstInline.textContent : secondInline.textContent);
first.useStaticStyleSheet('https://styles.test/red.css');
second.useStaticStyleSheet('https://styles.test/blue.css');
await flush();
const firstLink = firstInline.previousElementSibling!;
const secondLink = secondInline.previousElementSibling!;
secondLink.dispatchEvent(new Event('load'));
firstLink.dispatchEvent(new Event('load'));
expect(firstLink.nextElementSibling).toBe(secondLink);
first.destroy();
expect(secondLink.isConnected).toBe(true);
second.destroy();
```

- [ ] 跑 `bun test packages/tsone/lib/style/__tests__ packages/tsone/lib/core/__tests__/component.test.ts`；通过后提交，信息 `feat(style): activate static sheets with lifecycle fallback`。

## Task 3: 实际模块图与框架身份

**Files:** Create `packages/tsone-cli/src/static-styles/module-graph.ts`、`packages/tsone-cli/tests/static-style-graph.test.ts`。

**Interfaces:** Produces 以下内部契约；不写盘、不 import 应用。Bun 配置由 Task 7 共享给两阶段。

```ts
export interface RuntimeModule {
  path: string; source: string; loader: 'js' | 'jsx' | 'ts' | 'tsx';
  imports: ReadonlyMap<string, string>; packageName?: string;
}
export interface Discovery {
  entry: string; modules: ReadonlyMap<string, RuntimeModule>;
  hasResolvedImports: boolean;
}
export async function discoverModules(options: Bun.BuildConfig): Promise<Discovery>;
export async function sourcesUnchanged(discovery: Discovery): Promise<boolean>;
export class RuntimeModuleGraph {
  constructor(discovery: Discovery);
  getSourceFiles(): readonly ts.SourceFile[];
  getSourceFile(path: string): ts.SourceFile | undefined;
  resolveDeclaration(node: ts.Node): ts.Declaration | undefined;
  isFrameworkConstructor(expression: ts.Expression,
    name: 'Component' | 'StyleManager'): boolean;
  hasObservableMutation(declaration: ts.Declaration): boolean;
}
```

- [ ] 临时 fixture 使用真实 Bun 内存构建，入口通过 barrel/重命名 import framework source；断言 imports 实际路径和继承身份。同名本地类必须返回 false。

```ts
const discovery = await discoverModules({ entrypoints: [entry],
  target: 'browser', format: 'esm', throw: false });
expect(discovery.hasResolvedImports).toBe(true);
expect(discovery.modules.get(entry)?.imports.get('./barrel')).toBe(barrel);
const graph = new RuntimeModuleGraph(discovery);
const source = graph.getSourceFile(entry)!;
const expression = source.statements.find(ts.isClassDeclaration)!
  .heritageClauses![0].types[0].expression;
expect(graph.isFrameworkConstructor(expression, 'Component')).toBe(true);
```

- [ ] 跑 `bun test packages/tsone-cli/tests/static-style-graph.test.ts`，确认 API 缺失失败。
- [ ] discovery 内部 onLoad 仅 file namespace 的 JS/TS loader，读绝对规范路径并返回相同 source/loader；其余资源留给 Bun。显式移除 outdir，使用 metafile:true，保留入口、target、format、minify、naming 和解析配置。Bun 失败抛带 logs 的错误。
- [ ] 用 unknown 缩窄 metafile 对象，不 JSON.parse 对象。仅 inputs.imports 的 original→path 唯一指向已加载模块的边可信；相对路径按 discovery root 规范化。缺 metadata 时 hasResolvedImports=false，不提升引擎下限、不调用 PluginBuilder.resolve。
- [ ] 用只含发现源码的 TS Program/custom host 绑定；模块解析回调仅返回证实边，不读 d.ts、不允许 TS 猜 package 条件。追踪 import/export/barrel/alias，循环/歧义返回 undefined；最近包 manifest name 与实际 Component/StyleManager 定义绑定共同确认身份。记录重新赋值、对象写入、未知调用逃逸和 getter，供 evaluator 判定不可求值。
- [ ] 补 path mapping、browser 条件、双框架副本、无 metadata 和循环 barrel 测试，证明不了即回退。Review Focus 4 直接修改 discovery 后源文件：

```ts
expect(await sourcesUnchanged(discovery)).toBe(true);
await Bun.write(entry, originalSource + '\nexport const changed = true;');
expect(await sourcesUnchanged(discovery)).toBe(false);
```

- [ ] 最小测试通过后提交，信息 `feat(cli): discover resolved modules for style analysis`。

## Task 4: 有限表达式求值

**Files:** Create `packages/tsone-cli/src/static-styles/evaluate.ts`、`packages/tsone-cli/tests/static-style-evaluate.test.ts`。

**Interfaces:** Consumes Task 3 graph。Produces：

```ts
export type StaticValue = string | number | boolean | null | undefined |
  StaticValue[] | { [key: string]: StaticValue };
export type StaticResult = { ok: true; value: StaticValue } | { ok: false };
export class StaticEvaluator {
  constructor(graph: RuntimeModuleGraph);
  evaluate(expression: ts.Expression,
    bindings?: ReadonlyMap<string, StaticValue>): StaticResult;
}
```

- [ ] 从真实 SourceFile initializer 写失败测试，覆盖 default 参数、模板、spread、Object.freeze、单赋值 var；unknown call/props/getter/mutation 返回 ok:false。

```ts
// fixture 原文，不能作为分析器 eval 输入执行：
const palette = { color: '#fff' };
function border(color = palette.color) { return `1px solid ${color}`; }
const rule = Object.freeze({ selector: '.a',
  properties: { ...palette, border: border(), opacity: -1 } });
// 测试对 rule initializer 求值：
expect(evaluator.evaluate(ruleInitializer)).toEqual({ ok: true, value: {
  selector: '.a', properties: { color: '#fff', border: '1px solid #fff', opacity: -1 }
} });
expect(evaluator.evaluate(unknownCallInitializer)).toEqual({ ok: false });
```

- [ ] 跑 `bun test packages/tsone-cli/tests/static-style-evaluate.test.ts`，确认 evaluator 缺失失败。
- [ ] 按 SyntaxKind 显式分发字面量/负数、括号/as/satisfies、数组/对象纯 spread、已知属性、模板和图中唯一固定绑定。对象使用无原型记录；getter/setter/method、未知计算 key、原型访问失败。递归 visiting 集合和步数限制防循环，未知语法返回失败值而非空对象；内部异常向上传递。

```ts
const failed: StaticResult = { ok: false };
const result = this.evaluate(property.initializer, bindings);
if (!result.ok) return failed;
// 每个已确认 property 使用其结果加入无原型记录；不得访问真实对象 getter。
```

- [ ] function/arrow 仅参数/default 加单 return expression 或箭头表达式；按参数顺序扩充新的 bindings Map，不修改调用者 bindings；拒绝 this/arguments、其它语句和未知 closure mutation。Object.freeze 仅内建 Object 未被 shadow 时恒等。var/let 必须通过图 mutation 检查；const 对象也检查写入/逃逸。
- [ ] 补 shadow Object、循环常量、重赋值 var、export 数组本模块修改、未知函数带副作用测试；分析过程计数保持零。最小测试通过后提交，信息 `feat(cli): evaluate fixed style expressions conservatively`。

## Task 5: 注册组与追加变换

**Files:** Create `packages/tsone-cli/src/static-styles/analyze.ts`、`packages/tsone-cli/tests/static-style-analyze.test.ts`。

**Interfaces:** Consumes Tasks 1、3、4。Produces：

```ts
export interface FixedStyleGroup {
  modulePath: string; insertionOffset: number;
  managerExpression: string; cssText: string;
}
export function analyzeFixedStyles(graph: RuntimeModuleGraph): FixedStyleGroup[];
export function transformStaticStyles(source: string,
  groups: readonly FixedStyleGroup[], hrefForCss: (cssText: string) => string): string;
```

- [ ] 写三类源码失败测试：已证实 Component 的连续注册、局部/模块数组 forEach（含 name/rest 解构）、fresh StyleManager。断言 CSS 原文、偏移、受限 receiver，并保证原语句不变。

```ts
// fixture initStyles 原文：
styles.forEach(({ name, ...style }) => this.styleManager.addStyle(name, style));
// test：
const groups = analyzeFixedStyles(graph);
expect(groups).toHaveLength(1);
const transformed = transformStaticStyles(source, groups, () => './fixed.css');
expect(transformed).toContain(
  'styles.forEach(({ name, ...style }) => this.styleManager.addStyle(name, style));'
);
expect(transformed).toContain('useStaticStyleSheet');
```

- [ ] 跑 `bun test packages/tsone-cli/tests/static-style-analyze.test.ts`，确认 API 缺失失败。
- [ ] 只分析 manager 初始状态明确的组；forEach callback 只含注册调用，以 evaluator 绑定参数/解构。验证 name/selector/properties/hover/media 类型；Map 模拟重复 name 更新和插入顺序，调用 Task 1 serializer。super/未知继承、alias/逃逸、节点内省、控制流、未知管理器操作跳过对应组；可隔离 side effect 保留且不能跨组越过。
- [ ] 从后向前按源码 offset 插入，receiver 仅 `this.styleManager` 或 local identifier；永不重写原调用/批量 Map 操作/打印整个 AST。href JSON.stringify，缺少新方法保持原调用。

```ts
const receiver = group.managerExpression;
const insertion = `\nif (typeof ${receiver}.useStaticStyleSheet === 'function') {` +
  ` ${receiver}.useStaticStyleSheet(${JSON.stringify(hrefForCss(group.cssText))}); }\n`;
output = output.slice(0, group.insertionOffset) + insertion +
  output.slice(group.insertionOffset);
```

- [ ] 负向矩阵覆盖 props/state/time/environment、条件、unknown function、getter、mutation、alias、假同名类；groups 为空且 transform 原文不变。OneLoading 风格 keyframes 额外调用保持原位置，无法隔离时整个初始化回退。
- [ ] Review Focus 3 加执行测试：旧 manager 不存在新方法仍注册成功；运行时修改 export 数组、观察 getter、自定义 forEach 和覆写 addStyle 时原顺序/Map 观察结果保持，内容差异由 Task 2 回退。

```ts
const events: string[] = [];
class OldManager { addStyle(name: string): void { events.push(name); } }
const manager = new OldManager();
manager.addStyle('first');
expect(typeof (manager as OldManager & { useStaticStyleSheet?: unknown })
  .useStaticStyleSheet).toBe('undefined');
expect(events).toEqual(['first']);
```

- [ ] 用真实 Bun minify 创建临时 One UI 风格包：主题、Object.freeze、spread、default 模板函数、module-array 解构、继承/export aliases；external 保留 framework imports，exports 仅指向 JS。消费者 analyze 仍产相同 CSS，不依赖 repo one/dist。
- [ ] 图/求值/识别测试通过后提交，信息 `feat(cli): append static activation for fixed initializers`。

## Task 6: CSS 文件与受控文档抽取

**Files:** Create `packages/tsone-cli/src/static-styles/assets.ts`、`packages/tsone-cli/tests/static-style-assets.test.ts`。

**Interfaces:** Produces：

```ts
export interface StaticStyleAsset { filename: string; cssText: string; }
export function canExternalizeCss(cssText: string): boolean;
export function makeStaticStyleAsset(cssText: string): StaticStyleAsset;
export async function externalizeDocumentStyles(html: string): Promise<{
  html: string; assets: StaticStyleAsset[];
}>;
export async function writeStaticStyleAssets(htmlFile: string,
  assets: readonly StaticStyleAsset[]): Promise<string[]>;
```

- [ ] 写原位置、SHA256、手写 style 保留的失败测试。

```ts
const css = '.fixed {\ncolor: red;\n}\n';
const raw = '<!doctype html><html><head><meta name="a">' +
  `<style data-tsone-document-style>${css}</style>` +
  '<meta name="b"></head><body><style>.user{color:blue}</style></body></html>';
const result = await externalizeDocumentStyles(raw);
expect(result.assets).toEqual([makeStaticStyleAsset(css)]);
expect(result.html).toContain(
  `<meta name="a"><link rel="stylesheet" href="./${result.assets[0].filename}"><meta name="b">`
);
expect(result.html).toContain('<style>.user{color:blue}</style>');
expect(result.assets[0].filename).toMatch(/^tsone-static-[a-f0-9]{64}\.css$/);
```

- [ ] 跑 `bun test packages/tsone-cli/tests/static-style-assets.test.ts`，确认 API 缺失失败。
- [ ] CSS scanner 跳过注释/strings，识别 url/@import；拒绝所有不明确转义、相对/片段 URL、@import。允许明确绝对 scheme、根相对/协议相对和 data。空 CSS 不生成资产；不用单个 regex 代替 scanner。

```ts
expect(canExternalizeCss('.a{background:url(./icon.svg)}')).toBe(false);
expect(canExternalizeCss('.a{filter:url(#filter)}')).toBe(false);
expect(canExternalizeCss('@import "theme.css";')).toBe(false);
expect(canExternalizeCss('.a{background:url(/icon.svg)}')).toBe(true);
expect(canExternalizeCss('.a{background:url(data:image/png;base64,AAAA)}')).toBe(true);
```

- [ ] 命名为 `tsone-static-${new Bun.CryptoHasher('sha256').update(cssText).digest('hex')}.css`；不压缩原文。writer 在 dirname(htmlFile) 写盘，路径去重，hash 名已有不同内容或写失败抛错。
- [ ] HTMLRewriter 第一遍收集受控 head style text chunks 和 base 状态，丢弃此遍输出；含 base 返回原 HTML。第二遍按受控节点序号将非空安全 CSS 的节点 replace 为同目录 link，其余保留。无变化返回原 HTML；不用整棵 DOM 重渲染或 regex 删除 style。
- [ ] Review Focus 5 用 red/blue 两个路由 HTML 断言不同 CSS filename；同 CSS 重复节点 assets 去重。补 empty/no-head/custom renderer、base/unsafe URL、script 字符串/doctype/实体/内联属性保留、注释伪 URL、string 伪 import、nested 写盘和写错误测试。通过后提交，信息 `feat(cli): emit content-addressed document CSS`。

```ts
const blue = await externalizeDocumentStyles(raw.replace('color: red', 'color: blue'));
expect(blue.assets[0].filename).not.toBe(result.assets[0].filename);
const noHead = '<main><style>.a{color:red}</style></main>';
expect(await externalizeDocumentStyles(noHead)).toEqual({ html: noHead, assets: [] });
const baseHtml = raw.replace('<head>', '<head><base href="/assets/">');
expect(await externalizeDocumentStyles(baseHtml)).toEqual({ html: baseHtml, assets: [] });
```


## Task 7: build 两阶段与页面路径

**Files:** Modify `packages/tsone-cli/src/build.ts`、`packages/tsone-cli/tests/{build,multipage,project,server,watch}.test.ts`；Create `packages/tsone-cli/tests/static-style-build.test.ts`。

**Interfaces:** Consumes Tasks 3、5、6。公开 build 签名不变，assetsBuilt 返回去重的绝对路径；内部 BuiltPage 增加 `staticStyles: StaticStyleAsset[]`。

- [ ] 真实 temporary consumer 包含 fixed component、document.styles、导入 CSS；断言组件 CSS 不被全页激活。

```ts
const result = await build({ root });
const cssFiles = result.assetsBuilt.filter(path =>
  /tsone-static-[a-f0-9]{64}\.css$/.test(path));
expect(cssFiles.length).toBeGreaterThanOrEqual(2);
expect(new Set(result.assetsBuilt).size).toBe(result.assetsBuilt.length);
const js = await Bun.file(join(result.outDir, 'main.js')).text();
expect(js).toContain('useStaticStyleSheet');
expect(js).toContain('addStyle');
const html = await Bun.file(join(result.outDir, 'index.html')).text();
const componentCss = cssFiles.find(path => readFileSync(path, 'utf8')
  .includes('.component-fixed'))!;
expect(html).not.toContain(basename(componentCss));
```

- [ ] 跑 `bun test packages/tsone-cli/tests/static-style-build.test.ts`，确认缺少资产失败。
- [ ] 保留安全目录检查、library early return、renderProjectHtml 预检。共用站点 Bun config，每 unique entry 在 rm 前 discover/analyze，过滤 unsafe CSS 并登记 filename。最终 build 前 sourcesUnchanged=false 则该入口全部候选/组件 CSS 清空。
- [ ] final onLoad 仅变换 source 与 discovery 一致的模块；若最终阶段发现变更，取消整个入口候选并无变换重建一次，丢弃该入口组件 CSS。重试仍持续改变则抛明确错误；不能留下半变换 bundle。unsupported input 仅 skip，内部异常/无效代码/写失败必须报错。
- [ ] 每路由最终 HTML 独立抽取，写当前入口组件资产与文档资产到 HTML 同目录，再写 HTML；component href 使用 `./filename`，不进入 stylesheetAssets。返回 Set 去重。

```ts
const documentStyles = await externalizeDocumentStyles(html);
const cssPaths = await writeStaticStyleAssets(pageHtmlPath, [
  ...page.staticStyles, ...documentStyles.assets,
]);
await writeFile(pageHtmlPath, documentStyles.html);
assetsBuilt.push(...page.assets, ...cssPaths, pageHtmlPath);
// BuildResult: assetsBuilt: [...new Set(assetsBuilt)]
```

- [ ] 调整 Bun mocks 按 outdir 区分 discovery/final，missing metadata mock 保留原行为。minify 测真正写盘调用；two entries 为两次发现+两次写盘，shared entry 只写盘一次；library 单次，server/watch 没有分析 plugin。
- [ ] Review Focus 4 用 hook 在两阶段之间及 final onLoad 改原文，断言无旧 activation/组件 CSS；discovery 错误保留旧 output sentinel。CSS 写失败和内部异常必须使 build 失败。

```ts
const originalBuild = Bun.build;
let discovered = false;
try {
  Bun.build = (async options => {
    const built = await originalBuild(options);
    if (!options.outdir && !discovered) {
      discovered = true;
      await Bun.write(componentFile, dynamicComponentSource);
    }
    return built;
  }) as typeof Bun.build;
  const changed = await build({ root });
  expect(changed.assetsBuilt.filter(path => /tsone-static-.*\.css$/.test(path)))
    .toHaveLength(0); // 本 fixture 没有 document.styles。
  expect(await Bun.file(join(changed.outDir, 'main.js')).text())
    .not.toContain('useStaticStyleSheet("./tsone-static-');
} finally {
  Bun.build = originalBuild;
}
```

断言生成调用时应使用 parsed AST 或稳定模式匹配，不能误将 framework 自身 method 定义当作 activation；上例的文本检查仅用于未压缩 fixture。
- [ ] 覆盖 Review Focus 5 及 shared-entry、多路由文档、nested/detail.html、directoryPages、basePath、Bun 导入 CSS/脚本、重建、无固定规则、unsafe/base/custom renderer、命名冲突；源 sentinel 不变；不修 base 下既有 Bun 资产语义。
- [ ] 跑 `bun test packages/tsone-cli/tests/static-style*.test.ts packages/tsone-cli/tests/build.test.ts packages/tsone-cli/tests/project.test.ts packages/tsone-cli/tests/multipage.test.ts packages/tsone-cli/tests/server.test.ts packages/tsone-cli/tests/watch.test.ts`。通过后提交本任务文件，信息 `feat(cli): extract fixed CSS in production builds`。

## Task 8: 双语文档、发布消费者和浏览器验收

**Files:** Modify `packages/tsone/{README,README-zh}.md`、`packages/tsone/docs/app/content/{en,zh}/{guide,api}.ts`、`packages/tsone/tests/{component-types,public-api-docs,package-smoke}.test.ts`；Modify `packages/tsone-cli/README.md`、`packages/tsone-cli/docs/app/content/{guide,reference}.ts`、`packages/tsone-cli/tests/{docs-content,package-smoke}.test.ts`。仅核查 manifest/已有 style 构建入口，不新增发布路径。

**Interfaces:** 真实消费者从安装后的 exports 消费 helper/method；CLI 无新增配置。框架 runtime 无新增依赖，typescript 仍为 CLI 已有外部依赖。

- [ ] 在 type consumer 增加 style 子入口 mapping 和以下消费；API/docs 契约测试先断言 helper/method/双语说明缺失失败。

```ts
import { StyleManager, renderManagedStyleSheet, type StyleOptions }
  from '@geektech/tsone/style';
const rules: StyleOptions[] = [{ selector: '.typed', properties: { opacity: 1 } }];
const css: string = renderManagedStyleSheet(rules);
const manager = new StyleManager();
const returned: void = manager.useStaticStyleSheet('./fixed.css');
void css; void returned;
```

- [ ] 同步双语说明：四类自动识别、未知规则回退、同步内联到外链加载、动态增删卸载、styleElement 内省变化、保留规则对象、URL/base 边界、双构建成本。应用不需要手动调用新方法，说明它供生成代码使用。
- [ ] 扩展现有 build→pack→installconsumer package smoke，加入固定+props 动态组件、文档样式和 minified One UI 风格包；输出真实 CSS，包 exports 类型可消费。Review Focus 3 旧框架/无新方法 consumer 仍完成原注册，不通过升级 playground 旧依赖代替兼容测试。
- [ ] installed consumer 运行 dev，仍内联且无本优化产物；library 原构建不追加 activation。保持现有 smoke 临时项目/清理约定。
- [ ] 创建临时可运行生产消费者页面，用实际浏览器检查 computed style/尺寸、慢 CSS/404、多实例同 selector 乱序、动态覆盖删除、卸载和嵌套资源请求；load 成功后无重复内联。浏览器不可用则保留 fixture 并明确未跑项目，DOM mock 不替代真实 CSS 计算。
- [ ] 依次运行并记录实际结果：

```bash
bun test packages/tsone-cli/tests
bun test packages/tsone/lib/style/__tests__ packages/tsone/lib/core/__tests__/component.test.ts packages/tsone/tests/framework-plan.test.ts packages/tsone/tests/public-api-docs.test.ts packages/tsone/tests/component-types.test.ts
bunx tsc --noEmit
bun run lint
bun run build
bun test packages/tsone/tests/package-smoke.test.ts packages/tsone-cli/tests/package-smoke.test.ts
bun pm pack --cwd packages/tsone --dry-run
bun pm pack --cwd packages/tsone-cli --dry-run
git diff --check
```

通过且无新增变化/疑点后不重复测试。若声称 pre-existing failure，必须在 HEAD 临时副本或等价基线复现；不改无关文件掩盖问题。全量 bun test 可作最终整仓验证，但 focused green 不能声称全量 green。

- [ ] 提交本任务文件，信息 `docs: describe automatic static CSS builds`；独立 reviewer 检查整个改动，修复必须问题后跑相关验证。最终说明文件范围、验证结果、基线失败证据及未跑浏览器项目，不自动发布。

## 基线与验收

执行前重新检查 git status，保留已有修改。设计阶段 build/project/multipage 的 34 个通过测试仅是实施前基线，不能充当新功能证据。本地 Bun 1.4.0 已实测省略 outdir 的内存 build 和 metafile resolved imports；Bun 1.3 的缺 metadata 回退仍需验证。

验收以安全识别、真实静态文件、生命周期/层叠/动态行为及发布消费者可用为准，不承诺删除全部样式对象、消除首次序列化或缩短 build。root 交付前自审设计所有章节覆盖、接口名称一致、无占位步骤、五项 Review Focus 均有归属测试。
