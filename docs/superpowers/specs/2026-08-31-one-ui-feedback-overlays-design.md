# One UI 反馈与浮层组件设计

日期：2026-08-31

状态：已确认设计，待用户审阅

## 1. 目标

扩展 `@geektech/one` 的“反馈与浮层”分类，新增 `OneAlert`、
`OneMessage`、`OneDialog` 和 `OneTooltip`。组件既保持 TSone 类组件的使用方式，
又为临时通知和对话框提供命令式服务。

本期成功标准：

- `OneAlert` 提供页面内的四类反馈和可选关闭能力。
- `OneMessage` 同时支持组件和 `oneMessage` 命令式服务，并能可靠堆叠、更新和关闭。
- `OneDialog` 同时支持受控、非受控和 `oneDialog` 命令式服务，具备完整的焦点与
  键盘行为。
- `OneTooltip` 支持 12 个方向、自动翻转、视口碰撞修正以及 hover、focus、click、
  manual 触发方式。
- 浮层默认挂载到 `document.body`，也允许调用者提供自定义容器。
- 定位系统不增加运行时依赖，也不修改 TSone 框架公开 API。
- 每个组件有独立文档页、真实交互 Demo、严格类型和自动化测试。

数据展示组件和导航组件属于后续两个独立批次，不纳入本期实现。

## 2. 范围与分类

`ONE_COMPONENT_CATEGORIES` 的反馈分类更新为：

```ts
{
  id: 'feedback',
  label: '反馈与浮层',
  components: ['OneAlert', 'OneMessage', 'OneDialog', 'OneTooltip'],
}
```

本期不实现图标组件、通用动画框架、第三方定位库、Dialog 表单封装、抽屉、
Popover、Tour、Notification Center 或跨 iframe 浮层。

## 3. 对象关系与职责

- 四个公开组件分别继承 TSone `Component<Props, State>`；组件之间不形成继承关系。
- `OneMessage`、`OneDialog` 和 `OneTooltip` 在父组件树中保留稳定锚点或触发节点，
  并分别**组合**内部 `MessageOverlay`、`DialogOverlay`、`TooltipBubble` 视图。
- 三个公开组件**组合** `OneOverlayMountController`，由控制器负责目标容器解析、
  内部浮层视图的挂载、更新和卸载；控制器不移动公开组件的根节点。
- `OneMessageService` 和 `OneDialogService` **依赖** `OneOverlayHost` 接口；默认服务
  使用共享实现，但测试和高级调用方可以注入独立 Host。
- `OneTooltip` **依赖** `OneOverlayPositioner` 接口；默认组合零依赖的
  `OneFloatingPositioner`。
- `OneOverlayHost` **聚合**每个容器中的浮层记录，并拥有服务动态创建的组件实例。
  Host 不拥有声明式父组件创建的实例。
- `OneFloatingPositioner` 只计算坐标和监听布局变化，不创建组件、不管理业务状态。

这些边界满足单一职责和依赖倒置：服务不直接散落全局 DOM 操作，Tooltip 不依赖
具体定位实现，新增其他浮层组件时可复用 Host 和控制器，而无需修改已有组件。

## 4. 共享公开类型

```ts
export type OneFeedbackVariant = 'info' | 'success' | 'warning' | 'error';

export type OneOverlayContainer = HTMLElement | (() => HTMLElement | null);

export type OneOverlayPlacement =
  | 'top-start'
  | 'top'
  | 'top-end'
  | 'right-start'
  | 'right'
  | 'right-end'
  | 'bottom-start'
  | 'bottom'
  | 'bottom-end'
  | 'left-start'
  | 'left'
  | 'left-end';

export interface OneOverlayHandle<TOptions extends object> {
  readonly id: string;
  update(options: Partial<TOptions>): void;
  close(): void;
}
```

容器函数在每次打开时求值，适用于晚于模块加载才创建的节点。容器必须属于当前
`document`、仍连接到 DOM 且具有可用布局；否则抛出稳定的
`OneOverlayContainerError`。模块本身允许在无 DOM 环境中导入，只有调用挂载方法时
才抛出 `OneOverlayEnvironmentError`。

## 5. OneAlert

```ts
export interface OneAlertProps {
  title?: string;
  description?: string;
  variant?: OneFeedbackVariant;
  closable?: boolean;
  children?: Array<VNode | string>;
}
```

`variant` 默认 `info`。默认插槽作为 description 的后备内容；具名 `icon` 和
`actions` 插槽允许调用方自定义图标及操作区。没有 title 或 description 时不渲染
对应空节点。

关闭按钮触发 `close` 事件并在非受控内部状态中隐藏 Alert。关闭按钮具有可访问名称，
根节点使用与 variant 对应的 `role="status"` 或 `role="alert"`，但不依赖颜色表达
反馈类型。

## 6. OneMessage 与 oneMessage

```ts
export type OneMessagePlacement =
  | 'top-start'
  | 'top'
  | 'top-end'
  | 'bottom-start'
  | 'bottom'
  | 'bottom-end';

export interface OneMessageOptions {
  content: string;
  variant?: OneFeedbackVariant;
  duration?: number;
  closable?: boolean;
  placement?: OneMessagePlacement;
  container?: OneOverlayContainer;
}

export interface OneMessageProps extends OneMessageOptions {
  open?: boolean;
  defaultOpen?: boolean;
}
```

默认 placement 为 `top`，默认 duration 为 `3000` 毫秒。`duration: 0` 表示不自动
关闭。鼠标进入时暂停剩余时间，离开后从剩余时间继续。相同容器和 placement 的
Message 按创建顺序堆叠；关闭后其余项平滑补位，但本期不依赖 TSone TransitionGroup。

组件触发 `openChange`、`close` 和 `afterClose`。受控模式只发出状态变化事件；
非受控模式同步内部状态。

```ts
oneMessage.open(options): OneOverlayHandle<OneMessageOptions>;
oneMessage.info(content, options?): OneOverlayHandle<OneMessageOptions>;
oneMessage.success(content, options?): OneOverlayHandle<OneMessageOptions>;
oneMessage.warning(content, options?): OneOverlayHandle<OneMessageOptions>;
oneMessage.error(content, options?): OneOverlayHandle<OneMessageOptions>;
oneMessage.close(id): void;
oneMessage.closeAll(): void;
```

`update()` 合并现有配置并重新计算计时器；重复 `close()` 是幂等操作。

## 7. OneDialog 与 oneDialog

```ts
export interface OneDialogProps {
  open?: boolean;
  defaultOpen?: boolean;
  title?: string;
  description?: string;
  closeOnOverlay?: boolean;
  closeOnEscape?: boolean;
  confirmLoading?: boolean;
  container?: OneOverlayContainer;
  children?: Array<VNode | string>;
}

export interface OneDialogServiceOptions
  extends Omit<OneDialogProps, 'open' | 'defaultOpen'> {
  content?: VNode | string;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => boolean | void | Promise<boolean | void>;
  onCancel?: () => void;
  onError?: (error: unknown) => void;
}
```

Dialog 支持 `default`、`header`、`footer` 三个插槽；显式插槽优先于 title、description
和默认按钮。默认 `closeOnOverlay`、`closeOnEscape` 为 `true`。

组件触发 `openChange`、`confirm`、`cancel` 和 `afterClose`。打开时保存当前焦点，
将焦点移入 Dialog，使用 Tab/Shift+Tab 维持焦点陷阱，设置 `role="dialog"`、
`aria-modal="true"` 和标题/描述关联，关闭后恢复原焦点。默认 body 容器打开第一个
Dialog 时锁定背景滚动，最后一个关闭后恢复原值；自定义容器只限制自己的交互范围，
不锁定 body。

```ts
oneDialog.open(options): OneOverlayHandle<OneDialogServiceOptions>;
oneDialog.confirm(options): Promise<boolean>;
oneDialog.close(id): void;
oneDialog.closeAll(): void;
```

`confirm()` 在确认时执行 `onConfirm`。返回 `false` 时保持打开；返回 `true`、`void`
或对应 Promise 时关闭并 resolve `true`。执行期间进入 loading 并阻止重复确认。
回调抛错或 Promise reject 时恢复按钮状态、保持打开并调用 `onError`。取消、遮罩关闭、
Esc 关闭或外部关闭均 resolve `false`。`open()` 用于需要 handle 更新内容的场景，
不返回布尔 Promise。

多层 Dialog 只允许最上层响应 Esc、遮罩和焦点陷阱。

## 8. OneTooltip 与定位器

```ts
export type OneTooltipTrigger = 'hover-focus' | 'click' | 'manual';

export interface OneTooltipProps {
  content: VNode | string;
  placement?: OneOverlayPlacement;
  trigger?: OneTooltipTrigger;
  open?: boolean;
  defaultOpen?: boolean;
  openDelay?: number;
  closeDelay?: number;
  offset?: number;
  container?: OneOverlayContainer;
  arrow?: boolean;
  disabled?: boolean;
  children?: Array<VNode | string>;
}
```

默认 trigger 为 `hover-focus`，placement 为 `top`，openDelay 为 `100` 毫秒，
closeDelay 为 `100` 毫秒，offset 为 `8` 像素，arrow 为 `true`。默认插槽必须产生
一个可定位触发节点；无可用触发元素时抛出 `OneTooltipTriggerError`。

hover-focus 模式在 hover 或 focus 任一状态仍存在时保持打开，避免焦点和鼠标事件
互相错误关闭。click 模式点击触发节点切换，点击外部或 Esc 关闭；manual 只响应
`open`/`defaultOpen` 和公开事件。Tooltip 使用 `role="tooltip"`，打开时通过稳定 id
写入触发元素的 `aria-describedby`，关闭或卸载时恢复调用前属性。

`OneFloatingPositioner` 的算法：

1. 测量触发节点、浮层、目标容器和视口矩形。
2. 先计算首选 placement，再按相反方向、同对齐方式的正交方向生成候选位置。
3. 选择第一个完整容纳浮层的位置；若都不完整，选择可见面积最大的候选位置。
4. 使用 8 像素 viewport padding 执行 shift，并把箭头限制在浮层安全边界内。
5. body 容器使用 viewport 坐标；自定义容器把坐标转换到其实际 offsetParent，且不
   修改调用方容器的 position 样式。
6. 打开期间监听相关滚动祖先、window resize 和 ResizeObserver；一次动画帧内合并
   重复重算。关闭或卸载时全部解除。

定位结果包含最终 placement，组件通过 `data-placement` 暴露给样式和测试。

## 9. Overlay Host 与生命周期

默认服务按 `Document` 使用 WeakMap 延迟创建 Host，模块导入不触碰 DOM。每个 Host
按容器创建一个带 `data-one-overlay-host` 的节点，记录 Message 栈、Dialog 栈和层级。
容器内最后一个服务浮层关闭后移除空 Host。

声明式公开组件由父组件拥有，并在原组件树中保留稳定锚点或 Tooltip 触发节点，避免
破坏 TSone 渲染器按父节点索引维护的组件关系。MountController 只在 Host 中挂载和
卸载公开组件所拥有的内部浮层视图。命令式服务直接通过 Host 创建相同的内部视图，
因此两种入口共享渲染和清理逻辑。

两种关闭路径最终都执行同一资源清理协议，清除计时器、观察器、事件、焦点记录、
滚动锁和 DOM 关联。组件或 handle 的重复关闭不重复触发 afterClose。

默认 body 与自定义容器使用相同的服务 API。自定义容器布局无法计算、已经断开或属于
其他 Document 时，调用失败且不遗留 Host 或半挂载组件。

## 10. 样式与主题

沿用 `.one-*` 类名和 `--one-*` CSS 变量。主题基础值新增 info、success、warning、
遮罩、浮层阴影和浮层层级；组件级变量允许覆盖 Alert、Message、Dialog、Tooltip 的
背景、边框、间距、宽度和箭头颜色。

基础默认值：

```ts
colorInfo: '#2563eb';
colorSuccess: '#2f7c39';
colorWarning: '#9a6700';
colorOverlay: 'rgba(22, 32, 24, 0.48)';
shadowOverlay: '0 18px 48px rgba(22, 32, 24, 0.2)';
zIndexDialog: '1000';
zIndexMessage: '1100';
zIndexTooltip: '1200';
```

所有文字与默认背景继续满足 WCAG AA。状态不只通过颜色区分；默认图标由可隐藏的
文本符号和可访问名称表达，不引入图标运行时。

## 11. 文档与 Demo

新增文档路径：

```text
/components/feedback/
/components/feedback/alert/
/components/feedback/message/
/components/feedback/dialog/
/components/feedback/tooltip/
```

每页包含公开 API、状态模式、键盘操作、ARIA 行为和可复制示例。真实 Demo 分别覆盖：

- Alert 四种 variant、关闭和 actions 插槽。
- Message 组件及命令式创建、更新、暂停和 closeAll。
- Dialog 受控组件、confirm Promise、自定义容器和焦点恢复。
- Tooltip 12 个 placement、触发方式切换和靠近视口边缘时的自动翻转。

导航保留已有路径和分类顺序。README 中补充分类清单和最小命令式示例；包入口继续
提供扁平 named exports，同时按现有目录模式维护组件子模块。

## 12. 测试与验证

- Alert：四种 variant、插槽、关闭、角色和无效运行时值。
- Message：受控/非受控、自动关闭、暂停计时、堆叠、update、close/closeAll 和资源
  清理。
- Dialog：受控/非受控、遮罩、Esc、焦点陷阱、焦点恢复、body 锁定、多层栈、异步
  confirm、reject 和幂等关闭。
- Tooltip：三种 trigger、hover/focus 协同、12 个 placement、候选选择、flip、shift、
  箭头、外部点击、Esc、ARIA、滚动和 resize 重算。
- Overlay：body/自定义容器、按 Document 隔离、无 DOM 导入、错误容器和空 Host 清理。
- 公共契约：分类、根导出、公开类型、主题 token、README、严格消费者类型和包 smoke。
- 文档：五条新路由、导航、静态预览、真实 hydration Demo、client bundle、server 和
  build。

完成前运行：

```sh
bun test packages/one --timeout 15000
bunx tsc --noEmit --project packages/one/tsconfig.json
bun run --cwd packages/one build
bun run --cwd packages/one docs:build
bun pm pack --cwd packages/one --dry-run
bunx prettier --check packages/one docs/superpowers/specs
git diff --check
```

## 13. 明确决策

- 第一批只实现反馈与浮层，数据展示和导航在后续批次分别设计、实施和验收。
- Message 与 Dialog 同时提供组件和命令式服务。
- Dialog 组件支持受控/非受控；命令式 `confirm()` 返回布尔 Promise。
- 浮层默认挂载到 body，并支持自定义容器。
- Tooltip 支持 12 个方向、自动翻转和碰撞修正。
- 定位器由 One 内部实现，不引入 `@floating-ui/dom`，不修改 TSone 公共 API。
- 公开组件根节点不迁移出父组件树；浮层 Host 只拥有内部 Overlay 视图。
- 共享能力通过接口和组合复用，不建立反馈组件之间的继承层级。
