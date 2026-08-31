# One UI 数据展示组件设计

日期：2026-08-31

状态：已确认设计，待用户审阅

## 1. 目标

扩展 `@geektech/one` 的“数据展示”分类，新增 `OneTag`、`OneBadge` 和
`OneEmpty`。三个组件保持 TSone 类组件风格、严格类型和零运行时依赖，并同步完善
文档中的 One 组件复用、Demo 内边距和示例源码展示。

本期成功标准：

- `OneTag` 支持状态颜色、尺寸、关闭交互和可访问的关闭按钮。
- `OneBadge` 支持数字、字符串、封顶值、圆点、零值策略和包裹内容。
- `OneEmpty` 支持默认描述、图片、正文和操作插槽。
- 三个组件加入公开导出、稳定分类、README、文档页和真实交互 Demo。
- 文档自己的操作按钮尽量使用 `OneButton`，位置选择尽量使用 `OneSelect`。
- 所有交互 Demo 根区域统一具有 `24px` 内边距，避免各 Demo 重复控制外间距。
- 不增加浏览器运行时依赖，不修改 TSone 框架公开 API。

导航组件属于后续独立批次，不纳入本期。

## 2. 范围与分类

`ONE_COMPONENT_CATEGORIES` 的数据展示分类更新为：

```ts
{
  id: 'data-display',
  label: '数据展示',
  components: ['OneCard', 'OneTag', 'OneBadge', 'OneEmpty'],
}
```

本期不实现表格、列表、树、时间线、统计卡片、头像、图片加载器、骨架屏、
虚拟滚动、图标系统或导航组件。

## 3. 设计方式与对象关系

采用“独立组件 + 共享类型”方式，不增加抽象数据展示基类：

- `OneTag`、`OneBadge`、`OneEmpty` 分别**继承** TSone
  `Component<Props, State>`；三个组件之间不形成继承关系。
- `OneTag` 和 `OneBadge` **依赖**共享的 `OneDataDisplayVariant` 类型与纯规范化函数，
  但各自拥有渲染结构和样式。
- `OneEmpty` **依赖** TSone 的插槽协议，根据具名插槽选择图片和操作内容。
- 文档 Demo **依赖** One 的公开组件，不导入组件内部实现。
- `ONE_COMPONENT_CATEGORIES` **聚合**公开组件名称，只表达信息架构，不创建组件实例。

这满足单一职责和开闭原则：共享类型只定义跨组件视觉语义，各组件独立处理自己的
DOM、状态和可访问性。组件差异远大于可复用模板，因此不建立
`BaseDataDisplayComponent`，避免空泛继承和不必要耦合。

## 4. 共享公开类型

```ts
export type OneDataDisplayVariant =
  | 'neutral'
  | 'primary'
  | 'success'
  | 'warning'
  | 'error';
```

`neutral` 用于无状态的普通信息，`primary` 用于品牌强调，其余三种表达结果或风险。
运行时收到非法 variant 时回退到 `neutral`。尺寸继续复用已有
`OneComponentSize = 'sm' | 'md' | 'lg'` 和 `normalizeOneSize()`。

共享模块只放类型、白名单和纯规范化函数，不包含组件状态或 DOM 行为。

## 5. OneTag

```ts
export interface OneTagProps {
  variant?: OneDataDisplayVariant;
  size?: OneComponentSize;
  closable?: boolean;
  children?: Array<VNode | string>;
}
```

默认 `variant` 为 `neutral`，默认 `size` 为 `md`。根节点使用内联 `span`，内容来自
默认插槽。`closable` 为 `true` 时渲染原生关闭按钮，按钮的默认可访问名称为
“关闭标签”。

用户激活关闭按钮时：

1. 发出一次 `close` 事件。
2. 更新组件内部可见状态。
3. 用隐藏锚点替换标签，保持父组件树中的组件位置稳定。

重复点击或组件已经隐藏时不会重复发出事件。关闭按钮使用原生 button，支持 Enter、
Space 和焦点样式；颜色不是关闭能力的唯一提示。

## 6. OneBadge

```ts
export interface OneBadgeProps {
  value?: number | string;
  max?: number;
  dot?: boolean;
  showZero?: boolean;
  variant?: OneDataDisplayVariant;
  ariaLabel?: string;
  children?: Array<VNode | string>;
}
```

默认 `variant` 为 `primary`，默认 `max` 为 `99`。Badge 支持两种结构：

- 有默认插槽时，根节点包裹目标内容，标记显示在右上角。
- 没有默认插槽时，根节点只显示独立标记，不创建空目标节点。

显示规则：

- `dot=true` 时忽略 `value` 和 `max`，只显示圆点。
- 数字大于规范化后的 `max` 时显示 `${max}+`。
- `value=0` 且 `showZero` 不是 `true` 时隐藏标记。
- `value` 为 `undefined` 或空字符串时隐藏标记。
- 非法 `max` 回退到 `99`；有效 max 必须是大于零的有限整数。

`ariaLabel` 存在时应用到标记；圆点没有 `ariaLabel` 时作为装饰隐藏于辅助技术。
数字和字符串标记保留可读取文本，但不使用 `aria-live`，避免普通重渲染产生意外播报。

## 7. OneEmpty

```ts
export interface OneEmptyProps {
  description?: string;
  children?: Array<VNode | string>;
}
```

默认 description 为“暂无数据”。组件支持三个插槽：

- `image`：替换默认空状态图形。
- `default`：替换 description 文本。
- `actions`：显示恢复、创建或刷新操作。

显式插槽优先于对应 prop。没有 `image` 插槽时使用纯 CSS 图形并设置
`aria-hidden="true"`，不增加图片或图标依赖。没有 `actions` 插槽时不渲染空操作区。
根节点使用语义化 section，但不主动设置 `aria-live`；业务需要播报时由调用方所在区域
决定 live region 策略。

## 8. 样式与主题

沿用 `.one-*` 类名和 `--one-*` CSS 变量：

- Tag 使用 `.one-tag`、variant、size、close 和 hidden anchor 类。
- Badge 使用 `.one-badge`、content、standalone、dot、hidden 和 variant 类。
- Empty 使用 `.one-empty`、image、description 和 actions 类。

颜色继续基于现有 primary、success、warning、danger、surface、border、text 和 muted
token。`error` variant 使用 danger token，不新增重复颜色。Tag 的三种尺寸复用已有
字体和间距 token。Badge 的定位以自身 wrapper 为 containing block，不修改被包裹内容。

默认文字与背景保持 WCAG AA；warning/error 不只依赖颜色，Badge 的可访问名称和业务
上下文负责表达具体含义。

## 9. 文档结构

新增文档路径：

```text
/components/data-display/
/components/data-display/tag/
/components/data-display/badge/
/components/data-display/empty/
```

保留已有 `/components/card/`，避免破坏现有链接。数据展示总览页同时列出
`OneCard`、`OneTag`、`OneBadge`、`OneEmpty`，文档总页数由 17 增加为 21。

每个组件页包含真实静态预览、交互 Demo、默认折叠的 TypeScript 示例源码、完整 API、
可访问性说明和边界行为：

- Tag Demo 覆盖五种 variant、三种尺寸和关闭事件。
- Badge Demo 覆盖封顶值、圆点、零值、独立标记和包裹内容。
- Empty Demo 覆盖默认状态、自定义正文、图片插槽和 actions 插槽。

README 和 README-zh 同步更新分类清单与三个最小示例。

## 10. 文档组件复用与 Demo 间距

文档交互 Demo 的操作控件按以下规则调整：

- Alert actions、Message actions、Dialog actions 改用 `OneButton`。
- Tooltip 的触发按钮和手动切换按钮改用 `OneButton`。
- Tooltip 的 placement 控件在不损害示例清晰度时改用 `OneSelect`。
- 文档测试改为按可访问名称、文本或 One 组件类定位，不为测试向公开组件增加
  `data-*` props。
- Dialog、Alert 等组件内部为了原生语义或自身视觉规范使用的 button 不在此轮强制替换。

所有 `[data-one-demo]` 根区域统一设置：

```css
box-sizing: border-box;
padding: 24px;
```

现有 `.one-docs-feedback-stack`、`.one-docs-feedback-actions`、
`.one-docs-dialog-demo`、`.one-docs-tooltip-demo` 删除重复的外层 padding。静态预览
`.one-docs-demo-preview` 保持已有 `24px` 内边距。代码 disclosure 不属于 Demo 根区域，
不继承预览内边距。

## 11. 数据流与错误边界

- Tag 关闭只改变自己的可见状态并发出事件，不修改父组件业务数据。
- Badge 的显示文本完全由 props 派生，不维护重复内部状态。
- Empty 的插槽选择在每次渲染时计算，不缓存调用方 VNode。
- 非法 variant、size、max 使用稳定回退，不抛出运行时异常。
- 本批次没有网络、异步状态、全局服务、Portal 或外部容器，因此不增加新的环境错误。
- 文档 Demo 卸载时只清理由既有 Message、Dialog 和 Tooltip 示例创建的资源；新增三个
  数据展示 Demo 不注册全局监听器。

## 12. 测试与验证

行为实现遵循测试先行：先写能失败的组件、公开契约和文档测试，再写最小实现。

- Tag：默认值、五种 variant、三种 size、关闭事件、隐藏锚点、键盘按钮和非法值回退。
- Badge：数字、字符串、99+、自定义 max、dot、showZero、独立/包裹结构、ARIA 和非法
  max 回退。
- Empty：默认描述、image/default/actions 插槽优先级、不渲染空操作区和默认图形 ARIA。
- 公共契约：根导出、子模块导出、类型消费者、分类、README、样式收集、构建与打包。
- 文档：四条新路由、21 页顺序、静态预览、三个 hydration Demo、示例源码、OneButton/
  OneSelect 复用、统一 `24px` 内边距、client bundle、server 和 build。
- 回归：原有 Button、Input、Card、表单与反馈浮层组件测试继续通过。

完成前运行：

```sh
bun test packages/one --timeout 15000
bunx tsc --noEmit
bun run --cwd packages/one build
bun run --cwd packages/one docs:build
bun pm pack --cwd packages/one --dry-run
bunx prettier --check packages/one docs/superpowers/specs
git diff --check
```

若全量测试仍只出现当前用户未提交的 `packages/one/package.json` peer range 与旧契约测试
不一致，则单独报告该基线冲突，不修改或覆盖用户文件。

## 13. 明确决策

- 本批次实现数据展示，不实现导航。
- 采用独立组件和共享类型，不建立数据展示继承层级。
- Tag 支持 variant、size 和非受控关闭。
- Badge 支持 value、max、dot、showZero、包裹内容和独立显示。
- Empty 支持 image、default、actions 插槽和默认 CSS 图形。
- 数据展示文档新增总览和三个组件页，保留旧 Card 路径。
- 文档操作控件尽量复用 OneButton/OneSelect；组件内部原生语义不强制改写。
- 所有交互 Demo 根区域统一使用 `24px` 内边距。
- 不增加运行时依赖，不修改 TSone 公开 API。
