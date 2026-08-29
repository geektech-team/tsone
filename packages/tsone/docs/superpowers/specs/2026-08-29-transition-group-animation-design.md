# TSone 列表进入退出动画设计

## 背景与目标

TSone 已提供类组件、策略化 DOM 渲染和 keyed 列表更新，但删除列表项时会同步
卸载并移除 DOM，无法展示退出动画。本次新增公开的 `TransitionGroup` 类组件，
为直属 keyed 子节点提供进入和退出动画，并允许选择内置动画类型与时长。

设计保持浏览器运行时零外部依赖，复用现有组件与渲染策略体系，不引入动画库、
CSS 编译、移动动画或通用 VNode transition 协议。

## 公共 API

新增动画类型和组件 props：

```ts
type TransitionAnimationType =
  | 'fade'
  | 'slide-up'
  | 'slide-down'
  | 'slide-left'
  | 'slide-right'
  | 'scale';

interface TransitionGroupProps {
  tag?: string;
  type?: TransitionAnimationType;
  duration?: number;
  elementProps?: HTMLProps;
  listeners?: EventListeners;
  children?: VNode[];
}
```

`tag` 默认为 `div`，`type` 默认为 `fade`，`duration` 默认为 `300` 毫秒。
缓动固定为 `ease`。`elementProps` 和 `listeners` 直接应用于容器元素。

使用方式：

```ts
{
  component: TransitionGroup,
  props: {
    tag: 'ul',
    type: 'slide-up',
    duration: 300,
    elementProps: { className: 'users' },
  },
  children: each(
    this.state.users,
    (user) => Li({ children: [user.name] }),
    (user) => user.id
  ),
}
```

直属子节点必须是带唯一 `key` 的 VNode。支持 HTML VNode，以及最终根节点为
`HTMLElement` 的类组件 VNode；不支持直属文本节点。

## 架构与对象关系

能力落在三个单一职责边界中：

| 单元                            | 职责                                        | 对象关系                     |
| ------------------------------- | ------------------------------------------- | ---------------------------- |
| `TransitionGroup`               | 将公开 props 和 children 转换为动画组 VNode | 继承 `Component`             |
| `TransitionGroupRenderStrategy` | keyed 子节点 diff、DOM 排序和延迟卸载       | 继承 `ElementRenderStrategy` |
| `ListAnimationController`       | 预设关键帧、动画启动/取消、reduced-motion   | 策略组合控制器               |

`RendererContext` 依赖并分派渲染策略。动画组策略是元素策略的特化，只覆盖
子节点挂载、更新和卸载边界；属性、事件和 directions 仍复用普通元素行为。
普通 HTML VNode 不携带动画组元数据，继续匹配原有元素策略。

内部动画组 VNode 扩展 `HTMLNode`，保存规范化后的动画配置。该类型只用于
`TransitionGroup` 和专用策略之间通信，不作为用户手写 VNode 的首选 API。

## 动画预设

使用浏览器 Web Animations API。进入关键帧如下，退出动画使用相反顺序：

| 类型          | 进入起点                        | 进入终点                    |
| ------------- | ------------------------------- | --------------------------- |
| `fade`        | `opacity: 0`                    | `opacity: 1`                |
| `slide-up`    | `opacity: 0; translateY(12px)`  | `opacity: 1; translateY(0)` |
| `slide-down`  | `opacity: 0; translateY(-12px)` | `opacity: 1; translateY(0)` |
| `slide-left`  | `opacity: 0; translateX(12px)`  | `opacity: 1; translateX(0)` |
| `slide-right` | `opacity: 0; translateX(-12px)` | `opacity: 1; translateX(0)` |
| `scale`       | `opacity: 0; scale(0.95)`       | `opacity: 1; scale(1)`      |

同一批元素同时开始动画，不做 stagger。列表重排继续复用并移动现有 DOM，
不触发进入、退出或 FLIP 位移动画。

## 挂载、更新与卸载语义

### 首次挂载和新增

策略先挂载并插入子节点，再启动进入动画。首次渲染的所有子节点也执行进入
动画。动画只作用于每个子 VNode 对应的根 `HTMLElement`，不会修改用户声明的
VNode props 或永久内联样式。

### 保留和重排

策略按 key 查找旧条目。保留条目先通过 renderer patch，再按新 key 顺序移动
根 DOM。只改变顺序的条目不启动动画。

### 删除

删除条目先标记为 `exiting` 并执行退出动画。动画完成前，节点保留在 DOM，且
组件实例、事件监听器和响应式 effect 尚未清理。动画成功完成后，策略调用标准
renderer unmount，再从容器移除节点。

退出条目不再参与新列表的索引和排序，但可以暂时与活动条目共存。插入和移动
活动条目时，策略根据活动 key 顺序查找 DOM 参照节点，不能直接用
`childNodes[newIndex]` 推断位置。

### 同 key 快速重新加入

若退出动画结束前同 key 再次出现，策略取消旧退出动画，保留原节点，使用最新
VNode patch 它并重新执行进入动画。每个条目保存当前动画令牌；旧动画的完成或
取消回调必须核对令牌和条目状态，不能卸载已重新激活的节点。

### 动画组整体卸载

父组件卸载 `TransitionGroup` 时，策略取消所有进行中的动画，立即通过标准
renderer 同步卸载全部活动和退出条目，然后清空内部记录。父级卸载不等待动画
Promise。

## 降级与异常处理

- 当 `matchMedia('(prefers-reduced-motion: reduce)')` 命中时，进入动画跳过，
  退出卸载立即完成。
- 当根节点不是 `HTMLElement` 或浏览器不支持 `Element.animate` 时采用同样的
  立即完成行为。
- 缺少 key、重复 key、未知动画类型、空 `tag`、负数或非有限 `duration` 抛出
  明确错误。
- 动画取消产生的 Promise rejection 由控制器消费，防止未处理 rejection。
- renderer mount、patch、unmount 和组件生命周期异常保持现有传播语义，不被
  动画层吞掉。

## 测试策略

使用真实 renderer 和 DOM 节点，测试工具只提供可控的 Web Animations API
实现，以便在测试中显式完成或取消动画。断言面向节点存在性、顺序和生命周期，
不以 mock 调用次数作为成功条件。

覆盖：

- 六种动画类型的进入关键帧和反向退出关键帧；
- 默认 `fade`、默认容器和默认 `300ms`；
- 首次列表与新增项的进入动画；
- 删除项在退出完成前保留，完成后才卸载和移除；
- 类组件子项的 `onUnmounted` 在退出完成后触发；
- 同 key 快速删除再加入时取消旧退出并复用节点；
- 纯重排复用节点且不启动进入或退出动画；
- reduced-motion、缺少 Web Animations API 和动画组整体卸载；
- 缺少或重复 key、非法类型、tag 和 duration；
- 公共 TypeScript 类型、根导出、README 和中英文 typed-content 文档。

发布面验证包括框架测试、`bunx tsc --noEmit`、lint、build、package smoke 和
`bun pm pack --cwd packages/tsone --dry-run`。

## 文档与示例

同步更新英文和中文 README 的公开 API 列表，并在双语组件 API 文档中加入
`TransitionGroup` 示例、全部预设、默认值、key 要求、reduced-motion 和
不支持移动动画的说明。示例使用现有 `each()` 与标签快捷函数，不展示未导出的
内部动画组 VNode。

## 非目标

- 单元素 `Transition` 组件；
- 列表移动或 FLIP 动画；
- 自定义 CSS 类、关键帧、easing、delay 或 stagger；
- JavaScript 动画库、CSS-in-JS 或构建链改造；
- 嵌套列表项或非直属后代的自动动画；
- 为所有 VNode 新增通用 transition 协议。
