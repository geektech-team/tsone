import {
  apiTable,
  callout,
  codeBlock,
  demo,
  heading,
  inlineCode,
  list,
  paragraph,
  t,
  type OneDocPage,
} from './types';

export const feedbackPages: OneDocPage[] = [
  {
    path: '/components/feedback/',
    title: t('反馈与浮层', 'Feedback and overlays'),
    description: t(
      '页面内反馈、临时消息、对话框、定位提示与加载指示的使用边界。',
      'The usage boundaries of in-page feedback, transient messages, dialogs, positioned hints and loading indicators.'
    ),
    section: 'components',
    sectionOrder: 2,
    order: 26,
    body: [
      heading(1, 'feedback', t('反馈与浮层', 'Feedback and overlays')),
      paragraph(
        t(
          'OneAlert 用于页面内持续反馈，OneMessage 用于短暂状态通知，OneDialog 处理需要用户决策的流程，OneTooltip 为触发元素补充简短说明，OneLoading 表达进行中的加载状态。',
          'OneAlert provides persistent in-page feedback, OneMessage provides brief status notifications, OneDialog handles flows that require user decisions, OneTooltip adds short descriptions to trigger elements, and OneLoading expresses an in-progress loading state.'
        )
      ),
      demo('alert'),
      heading(2, 'choose', t('如何选择', 'How to choose')),
      list([
        [t('内容需要一直可见时使用 OneAlert。', 'Use OneAlert when the content must stay visible.')],
        [t('操作结果无需打断用户时使用 OneMessage。', 'Use OneMessage when the result does not need to interrupt the user.')],
        [t('必须确认或取消时使用 OneDialog。', 'Use OneDialog when confirmation or cancellation is required.')],
        [t('补充控件含义时使用 OneTooltip。', 'Use OneTooltip to clarify a control.')],
        [t('表达异步加载状态时使用 OneLoading。', 'Use OneLoading to express an asynchronous loading state.')],
      ]),
      heading(2, 'components', t('组件', 'Components')),
      apiTable(t('反馈与浮层组件', 'Feedback and overlay components'), [
        {
          name: 'OneAlert',
          signature: 'new OneAlert(props)',
          description: t('页面流内的四类反馈。', 'Four kinds of feedback inside the page flow.'),
        },
        {
          name: 'OneMessage',
          signature: 'OneMessage / oneMessage',
          description: t('声明式组件与命令式临时消息。', 'Declarative component and imperative transient messages.'),
        },
        {
          name: 'OneDialog',
          signature: 'OneDialog / oneDialog',
          description: t('受控、非受控和命令式对话框。', 'Controlled, uncontrolled and imperative dialogs.'),
        },
        {
          name: 'OneTooltip',
          signature: 'new OneTooltip(props)',
          description: t('可定位的简短辅助说明。', 'Positionable short helper description.'),
        },
        {
          name: 'OneLoading',
          signature: 'new OneLoading(props)',
          description: t('带状态语义的加载指示器。', 'Loading indicator with status semantics.'),
        },
      ]),
    ],
  },
  {
    path: '/components/feedback/alert/',
    title: 'OneAlert',
    description: t(
      '在页面内容流中展示 info、success、warning 或 error 反馈。',
      'Shows info, success, warning or error feedback inside the page content flow.'
    ),
    section: 'components',
    sectionOrder: 2,
    order: 27,
    body: [
      heading(1, 'onealert', 'OneAlert'),
      paragraph(
        t(
          "OneAlert 适合无需遮挡界面的持续反馈；warning 和 error 使用 role='alert'，其余变体使用 role='status'。",
          "OneAlert suits persistent feedback that does not block the interface; warning and error use role='alert', other variants use role='status'."
        )
      ),
      demo('alert'),
      heading(2, 'example', t('示例', 'Example')),
      codeBlock(
        'ts',
        "new OneAlert({ title: '保存成功', description: '更改已经同步。', variant: 'success', closable: true })"
      ),
      heading(2, 'api', 'API'),
      apiTable(t('OneAlert 属性与事件', 'OneAlert props and events'), [
        {
          name: 'title',
          signature: 'title?: string',
          description: t('提示标题。', 'Alert title.'),
        },
        {
          name: 'description',
          signature: 'description?: string',
          description: t('提示说明；默认插槽优先。', 'Alert description; the default slot takes precedence.'),
        },
        {
          name: 'variant',
          signature: 'variant?: OneFeedbackVariant',
          description: t("'info' | 'success' | 'warning' | 'error'。", "'info' | 'success' | 'warning' | 'error'."),
        },
        {
          name: 'closable',
          signature: 'closable?: boolean',
          description: t('显示关闭按钮。', 'Shows a close button.'),
        },
        {
          name: 'children',
          signature: 'children?: Array<VNode | string>',
          description: t('default、icon 和 actions 插槽内容。', 'default, icon and actions slot content.'),
        },
        {
          name: 'close',
          signature: '() => void',
          description: t('用户关闭提示时发出。', 'Emitted when the user closes the alert.'),
        },
      ]),
      heading(2, 'accessibility', t('键盘与 ARIA', 'Keyboard and ARIA')),
      paragraph(
        t(
          '关闭按钮使用原生 button，可通过 Tab 聚焦并使用 Enter 或 Space 激活。',
          'The close button uses a native button, is focusable via Tab and activates with Enter or Space.'
        )
      ),
    ],
  },
  {
    path: '/components/feedback/message/',
    title: 'OneMessage',
    description: t(
      '以声明式组件或 oneMessage 服务展示可堆叠的临时通知。',
      'Shows stackable transient notifications via the declarative component or the oneMessage service.'
    ),
    section: 'components',
    sectionOrder: 2,
    order: 28,
    body: [
      heading(1, 'onemessage', 'OneMessage'),
      paragraph(
        t(
          '消息默认显示 3000ms，鼠标悬停会暂停计时；duration=0 时持续显示。',
          'Messages show for 3000ms by default; hovering pauses the timer, and duration=0 keeps them visible.'
        )
      ),
      demo('message'),
      heading(2, 'example', t('组件与服务', 'Component and service')),
      codeBlock(
        'ts',
        [
          "new OneMessage({ content: '保存成功', variant: 'success', defaultOpen: true });",
          "const handle = oneMessage.success('保存成功', { placement: 'top-end' });",
          "handle.update({ content: '已同步' });",
        ].join('\n')
      ),
      heading(2, 'api', 'API'),
      apiTable(t('OneMessage 属性', 'OneMessage props'), [
        {
          name: 'content',
          signature: 'content: string',
          description: t('消息文本。', 'Message text.'),
        },
        {
          name: 'open',
          signature: 'open?: boolean',
          description: t('受控显示状态。', 'Controlled visibility state.'),
        },
        {
          name: 'defaultOpen',
          signature: 'defaultOpen?: boolean',
          description: t('非受控初始状态。', 'Uncontrolled initial state.'),
        },
        {
          name: 'variant',
          signature: 'variant?: OneFeedbackVariant',
          description: t('四种反馈变体。', 'The four feedback variants.'),
        },
        {
          name: 'duration',
          signature: 'duration?: number',
          description: t('自动关闭毫秒数；0 表示不自动关闭。', 'Auto-close time in milliseconds; 0 disables auto-close.'),
        },
        {
          name: 'closable',
          signature: 'closable?: boolean',
          description: t('显示关闭按钮。', 'Shows a close button.'),
        },
        {
          name: 'placement',
          signature: 'placement?: OneMessagePlacement',
          description: t('top/bottom 的 start、center、end 六个堆叠位置。', 'Six stacking positions: start, center and end for top and bottom.'),
        },
        {
          name: 'container',
          signature: 'container?: OneOverlayContainer',
          description: t('自定义挂载容器；默认 document.body。', 'Custom mount container; default document.body.'),
        },
      ]),
      apiTable(t('OneMessage 事件与服务', 'OneMessage events and service'), [
        {
          name: 'openChange',
          signature: '(open: boolean) => void',
          description: t('请求改变受控状态。', 'Requests a controlled state change.'),
        },
        {
          name: 'close',
          signature: '() => void',
          description: t('用户或计时器请求关闭。', 'Requested by the user or timer to close.'),
        },
        {
          name: 'afterClose',
          signature: '() => void',
          description: t('视图实际卸载后发出。', 'Emitted after the view is actually unmounted.'),
        },
        {
          name: 'oneMessage.open',
          signature: '(options) => OneOverlayHandle',
          description: t('创建可更新消息。', 'Creates an updatable message.'),
        },
        {
          name: 'oneMessage.success',
          signature: '(content, options?) => OneOverlayHandle',
          description: t('创建 success 消息；info/warning/error 同理。', 'Creates a success message; info/warning/error work the same way.'),
        },
        {
          name: 'oneMessage.closeAll',
          signature: '() => void',
          description: t('只关闭 Message 记录。', 'Closes Message records only.'),
        },
      ]),
      heading(2, 'accessibility', t('键盘与 ARIA', 'Keyboard and ARIA')),
      paragraph(
        t(
          'warning/error 使用 alert，其余使用 status；可关闭消息的按钮支持标准键盘操作。',
          'warning/error use alert, the rest use status; the close button of closable messages supports standard keyboard operation.'
        )
      ),
    ],
  },
  {
    path: '/components/feedback/dialog/',
    title: 'OneDialog',
    description: t(
      '提供受控、非受控和命令式确认流程，并管理焦点与滚动锁。',
      'Provides controlled, uncontrolled and imperative confirmation flows, and manages focus and scroll lock.'
    ),
    section: 'components',
    sectionOrder: 2,
    order: 29,
    body: [
      heading(1, 'onedialog', 'OneDialog'),
      paragraph(
        t(
          '对话框默认挂载到 body；自定义容器模式不会锁定 body 滚动。',
          'Dialogs mount to body by default; the custom container mode does not lock body scrolling.'
        )
      ),
      demo('dialog'),
      heading(2, 'example', t('异步确认', 'Async confirmation')),
      codeBlock(
        'ts',
        "const saved = await oneDialog.confirm({ title: '保存更改？', onConfirm: async () => save() });"
      ),
      callout('note', t('Promise 语义', 'Promise semantics'), [
        t(
          'oneDialog.confirm 返回 Promise<boolean>。onConfirm 返回 false 时保持打开；返回 true、void 或对应 Promise 时关闭并得到 true。',
          'oneDialog.confirm returns Promise<boolean>. Returning false from onConfirm keeps it open; returning true, void or the corresponding Promise closes it and resolves true.'
        ),
      ]),
      heading(2, 'api', 'API'),
      apiTable(t('OneDialog 属性', 'OneDialog props'), [
        {
          name: 'open',
          signature: 'open?: boolean',
          description: t('受控显示状态。', 'Controlled visibility state.'),
        },
        {
          name: 'defaultOpen',
          signature: 'defaultOpen?: boolean',
          description: t('非受控初始状态。', 'Uncontrolled initial state.'),
        },
        {
          name: 'title',
          signature: 'title?: string',
          description: t('标题；header 插槽优先。', 'Title; the header slot takes precedence.'),
        },
        {
          name: 'description',
          signature: 'description?: string',
          description: t('说明；default 插槽优先。', 'Description; the default slot takes precedence.'),
        },
        {
          name: 'closeOnOverlay',
          signature: 'closeOnOverlay?: boolean',
          description: t('是否允许点击遮罩关闭，默认 true。', 'Whether clicking the overlay closes it; default true.'),
        },
        {
          name: 'closeOnEscape',
          signature: 'closeOnEscape?: boolean',
          description: t('是否允许 Escape 关闭，默认 true。', 'Whether Escape closes it; default true.'),
        },
        {
          name: 'confirmLoading',
          signature: 'confirmLoading?: boolean',
          description: t('确认中的加载与禁用状态。', 'Loading and disabled state during confirmation.'),
        },
        {
          name: 'container',
          signature: 'container?: OneOverlayContainer',
          description: t('自定义挂载容器。', 'Custom mount container.'),
        },
        {
          name: 'children',
          signature: 'children?: Array<VNode | string>',
          description: t('default、header、footer 插槽。', 'default, header and footer slots.'),
        },
      ]),
      apiTable(t('OneDialog 事件与服务', 'OneDialog events and service'), [
        {
          name: 'confirm',
          signature: '() => void',
          description: t('点击默认确认按钮。', 'Clicks the default confirm button.'),
        },
        {
          name: 'cancel',
          signature: '(reason) => void',
          description: t('取消、遮罩或 Escape 请求。', 'Cancel, overlay or Escape request.'),
        },
        {
          name: 'openChange',
          signature: '(open: boolean) => void',
          description: t('受控状态变更请求。', 'Controlled state change request.'),
        },
        {
          name: 'afterClose',
          signature: '() => void',
          description: t('视图实际卸载后发出。', 'Emitted after the view is actually unmounted.'),
        },
        {
          name: 'oneDialog.open',
          signature: '(options) => OneOverlayHandle',
          description: t('创建可更新对话框。', 'Creates an updatable dialog.'),
        },
        {
          name: 'oneDialog.confirm',
          signature: '(options) => Promise<boolean>',
          description: t('创建可等待的确认对话框。', 'Creates an awaitable confirmation dialog.'),
        },
        {
          name: 'oneDialog.closeAll',
          signature: '() => void',
          description: t('关闭全部 Dialog 并以 false 结算等待。', 'Closes all dialogs and settles waiters with false.'),
        },
      ]),
      heading(2, 'accessibility', t('键盘与 ARIA', 'Keyboard and ARIA')),
      paragraph(
        t(
          '使用 role=dialog、aria-modal、aria-labelledby 和 aria-describedby。Tab / Shift+Tab 在最上层对话框内循环，Escape 按配置关闭，关闭后恢复原焦点。',
          'Uses role=dialog, aria-modal, aria-labelledby and aria-describedby. Tab / Shift+Tab cycle within the topmost dialog, Escape closes it per configuration, and focus is restored after closing.'
        )
      ),
    ],
  },
  {
    path: '/components/feedback/tooltip/',
    title: 'OneTooltip',
    description: t(
      '支持 12 个方向、碰撞翻转和 hover、focus、click、manual 触发。',
      'Supports 12 placements, collision flipping, and hover, focus, click and manual triggers.'
    ),
    section: 'components',
    sectionOrder: 2,
    order: 30,
    body: [
      heading(1, 'onetooltip', 'OneTooltip'),
      paragraph(
        t(
          '默认使用 hover-focus 触发，定位器会按可用空间翻转并限制在视口或自定义容器内。',
          'Uses hover-focus trigger by default; the positioner flips according to available space and stays within the viewport or a custom container.'
        )
      ),
      demo('tooltip'),
      heading(2, 'example', t('示例', 'Example')),
      codeBlock(
        'ts',
        "new OneTooltip({ content: '复制链接', placement: 'bottom-end', children: [{ component: OneButton, children: ['复制'] }] })"
      ),
      heading(2, 'placements', t('12 个方向', '12 placements')),
      paragraph(
        t(
          'top-start, top, top-end, right-start, right, right-end, bottom-start, bottom, bottom-end, left-start, left, left-end。',
          'top-start, top, top-end, right-start, right, right-end, bottom-start, bottom, bottom-end, left-start, left, left-end.'
        )
      ),
      heading(2, 'api', 'API'),
      apiTable(t('OneTooltip 属性与事件', 'OneTooltip props and events'), [
        {
          name: 'content',
          signature: 'content: VNode | string',
          description: t('提示内容。', 'Tooltip content.'),
        },
        {
          name: 'placement',
          signature: 'placement?: OneOverlayPlacement',
          description: t('首选方向，空间不足时自动翻转和位移。', 'Preferred placement; flips and shifts automatically when space is insufficient.'),
        },
        {
          name: 'trigger',
          signature: "trigger?: 'hover-focus' | 'click' | 'manual'",
          description: t('触发方式。', 'Trigger mode.'),
        },
        {
          name: 'open',
          signature: 'open?: boolean',
          description: t('受控显示状态。', 'Controlled visibility state.'),
        },
        {
          name: 'defaultOpen',
          signature: 'defaultOpen?: boolean',
          description: t('非受控初始状态。', 'Uncontrolled initial state.'),
        },
        {
          name: 'openDelay',
          signature: 'openDelay?: number',
          description: t('打开延迟，默认 100ms。', 'Open delay; default 100ms.'),
        },
        {
          name: 'closeDelay',
          signature: 'closeDelay?: number',
          description: t('关闭延迟，默认 100ms。', 'Close delay; default 100ms.'),
        },
        {
          name: 'offset',
          signature: 'offset?: number',
          description: t('与触发元素的距离，默认 8px。', 'Distance from the trigger element; default 8px.'),
        },
        {
          name: 'container',
          signature: 'container?: OneOverlayContainer',
          description: t('自定义挂载与碰撞边界。', 'Custom mount and collision boundary.'),
        },
        {
          name: 'arrow',
          signature: 'arrow?: boolean',
          description: t('是否显示箭头。', 'Whether to show the arrow.'),
        },
        {
          name: 'disabled',
          signature: 'disabled?: boolean',
          description: t('禁用提示。', 'Disables the tooltip.'),
        },
        {
          name: 'children',
          signature: 'children?: Array<VNode | string>',
          description: t('必须包含一个 HTMLElement 触发节点。', 'Must contain a single HTMLElement trigger node.'),
        },
        {
          name: 'openChange',
          signature: '(open: boolean) => void',
          description: t('显示状态变更请求。', 'Visibility state change request.'),
        },
      ]),
      heading(2, 'accessibility', t('键盘与 ARIA', 'Keyboard and ARIA')),
      paragraph(
        t(
          '气泡使用 role=tooltip，打开时通过 aria-describedby 关联触发元素；focus 可打开，Escape 可关闭，并在卸载时恢复原属性。',
          'The bubble uses role=tooltip and is associated with the trigger element via aria-describedby when open; focus opens it, Escape closes it, and original attributes are restored on unmount.'
        )
      ),
    ],
  },
  {
    path: '/components/feedback/loading/',
    title: 'OneLoading',
    description: t(
      '表达进行中的加载状态，使用 status 语义并支持三种尺寸与状态色。',
      'Expresses an in-progress loading state with status semantics, three sizes and status colors.'
    ),
    section: 'components',
    sectionOrder: 2,
    order: 31,
    body: [
      heading(1, 'oneloading', 'OneLoading'),
      paragraph(
        t(
          'OneLoading 渲染一个静态 CSS 圆环 spinner，通过 role=status 与 aria-label 暴露加载语义。',
          'OneLoading renders a static CSS ring spinner and exposes loading semantics through role=status and aria-label.'
        )
      ),
      demo('loading'),
      heading(2, 'size-variant', t('尺寸与状态色', 'Size and status color')),
      paragraph(
        inlineCode('size'),
        t(' 支持 sm、md、lg，非法值回退 md；', ' supports sm, md, lg, falling back to md for invalid values; '),
        inlineCode('variant'),
        t(' 控制 spinner 颜色，非法值回退 primary。', ' controls the spinner color, falling back to primary for invalid values.')
      ),
      heading(2, 'api', 'API'),
      apiTable(t('OneLoading 属性', 'OneLoading props'), [
        {
          name: 'size',
          signature: 'size?: OneComponentSize',
          description: t('sm、md 或 lg，默认 md。', 'sm, md or lg; default md.'),
        },
        {
          name: 'variant',
          signature: 'variant?: OneDataDisplayVariant',
          description: t('spinner 颜色，默认 primary。', 'Spinner color; default primary.'),
        },
        {
          name: 'label',
          signature: 'label?: string',
          description: t('可访问名称，默认“加载中”。', 'Accessible name; default "loading".'),
        },
        {
          name: 'children',
          signature: 'children?: Array<VNode | string>',
          description: t('spinner 之后的可选文本。', 'Optional text after the spinner.'),
        },
      ]),
    ],
  },
];
