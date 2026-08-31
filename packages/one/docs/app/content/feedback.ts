import {
  apiTable,
  callout,
  codeBlock,
  demo,
  heading,
  list,
  paragraph,
  type OneDocPage,
} from './types';

export const feedbackPages: OneDocPage[] = [
  {
    path: '/components/feedback/',
    title: '反馈与浮层',
    description: '页面内反馈、临时消息、对话框和定位提示的使用边界。',
    section: '组件',
    sectionOrder: 2,
    order: 8,
    body: [
      heading(1, 'feedback', '反馈与浮层'),
      paragraph(
        'OneAlert 用于页面内持续反馈，OneMessage 用于短暂状态通知，OneDialog 处理需要用户决策的流程，OneTooltip 为触发元素补充简短说明。'
      ),
      demo('alert'),
      heading(2, 'choose', '如何选择'),
      list([
        ['内容需要一直可见时使用 OneAlert。'],
        ['操作结果无需打断用户时使用 OneMessage。'],
        ['必须确认或取消时使用 OneDialog。'],
        ['补充控件含义时使用 OneTooltip。'],
      ]),
      heading(2, 'components', '组件'),
      apiTable('反馈与浮层组件', [
        {
          name: 'OneAlert',
          signature: 'new OneAlert(props)',
          description: '页面流内的四类反馈。',
        },
        {
          name: 'OneMessage',
          signature: 'OneMessage / oneMessage',
          description: '声明式组件与命令式临时消息。',
        },
        {
          name: 'OneDialog',
          signature: 'OneDialog / oneDialog',
          description: '受控、非受控和命令式对话框。',
        },
        {
          name: 'OneTooltip',
          signature: 'new OneTooltip(props)',
          description: '可定位的简短辅助说明。',
        },
      ]),
    ],
  },
  {
    path: '/components/feedback/alert/',
    title: 'OneAlert',
    description: '在页面内容流中展示 info、success、warning 或 error 反馈。',
    section: '组件',
    sectionOrder: 2,
    order: 9,
    body: [
      heading(1, 'onealert', 'OneAlert'),
      paragraph(
        "OneAlert 适合无需遮挡界面的持续反馈；warning 和 error 使用 role='alert'，其余变体使用 role='status'。"
      ),
      demo('alert'),
      heading(2, 'example', '示例'),
      codeBlock(
        'ts',
        "new OneAlert({ title: '保存成功', description: '更改已经同步。', variant: 'success', closable: true })"
      ),
      heading(2, 'api', 'API'),
      apiTable('OneAlert 属性与事件', [
        {
          name: 'title',
          signature: 'title?: string',
          description: '提示标题。',
        },
        {
          name: 'description',
          signature: 'description?: string',
          description: '提示说明；默认插槽优先。',
        },
        {
          name: 'variant',
          signature: 'variant?: OneFeedbackVariant',
          description: "'info' | 'success' | 'warning' | 'error'。",
        },
        {
          name: 'closable',
          signature: 'closable?: boolean',
          description: '显示关闭按钮。',
        },
        {
          name: 'children',
          signature: 'children?: Array<VNode | string>',
          description: 'default、icon 和 actions 插槽内容。',
        },
        {
          name: 'close',
          signature: '() => void',
          description: '用户关闭提示时发出。',
        },
      ]),
      heading(2, 'accessibility', '键盘与 ARIA'),
      paragraph(
        '关闭按钮使用原生 button，可通过 Tab 聚焦并使用 Enter 或 Space 激活。'
      ),
    ],
  },
  {
    path: '/components/feedback/message/',
    title: 'OneMessage',
    description: '以声明式组件或 oneMessage 服务展示可堆叠的临时通知。',
    section: '组件',
    sectionOrder: 2,
    order: 10,
    body: [
      heading(1, 'onemessage', 'OneMessage'),
      paragraph(
        '消息默认显示 3000ms，鼠标悬停会暂停计时；duration=0 时持续显示。'
      ),
      demo('message'),
      heading(2, 'example', '组件与服务'),
      codeBlock(
        'ts',
        [
          "new OneMessage({ content: '保存成功', variant: 'success', defaultOpen: true });",
          "const handle = oneMessage.success('保存成功', { placement: 'top-end' });",
          "handle.update({ content: '已同步' });",
        ].join('\n')
      ),
      heading(2, 'api', 'API'),
      apiTable('OneMessage 属性', [
        {
          name: 'content',
          signature: 'content: string',
          description: '消息文本。',
        },
        {
          name: 'open',
          signature: 'open?: boolean',
          description: '受控显示状态。',
        },
        {
          name: 'defaultOpen',
          signature: 'defaultOpen?: boolean',
          description: '非受控初始状态。',
        },
        {
          name: 'variant',
          signature: 'variant?: OneFeedbackVariant',
          description: '四种反馈变体。',
        },
        {
          name: 'duration',
          signature: 'duration?: number',
          description: '自动关闭毫秒数；0 表示不自动关闭。',
        },
        {
          name: 'closable',
          signature: 'closable?: boolean',
          description: '显示关闭按钮。',
        },
        {
          name: 'placement',
          signature: 'placement?: OneMessagePlacement',
          description: 'top/bottom 的 start、center、end 六个堆叠位置。',
        },
        {
          name: 'container',
          signature: 'container?: OneOverlayContainer',
          description: '自定义挂载容器；默认 document.body。',
        },
      ]),
      apiTable('OneMessage 事件与服务', [
        {
          name: 'openChange',
          signature: '(open: boolean) => void',
          description: '请求改变受控状态。',
        },
        {
          name: 'close',
          signature: '() => void',
          description: '用户或计时器请求关闭。',
        },
        {
          name: 'afterClose',
          signature: '() => void',
          description: '视图实际卸载后发出。',
        },
        {
          name: 'oneMessage.open',
          signature: '(options) => OneOverlayHandle',
          description: '创建可更新消息。',
        },
        {
          name: 'oneMessage.success',
          signature: '(content, options?) => OneOverlayHandle',
          description: '创建 success 消息；info/warning/error 同理。',
        },
        {
          name: 'oneMessage.closeAll',
          signature: '() => void',
          description: '只关闭 Message 记录。',
        },
      ]),
      heading(2, 'accessibility', '键盘与 ARIA'),
      paragraph(
        'warning/error 使用 alert，其余使用 status；可关闭消息的按钮支持标准键盘操作。'
      ),
    ],
  },
  {
    path: '/components/feedback/dialog/',
    title: 'OneDialog',
    description: '提供受控、非受控和命令式确认流程，并管理焦点与滚动锁。',
    section: '组件',
    sectionOrder: 2,
    order: 11,
    body: [
      heading(1, 'onedialog', 'OneDialog'),
      paragraph('对话框默认挂载到 body；自定义容器模式不会锁定 body 滚动。'),
      demo('dialog'),
      heading(2, 'example', '异步确认'),
      codeBlock(
        'ts',
        "const saved = await oneDialog.confirm({ title: '保存更改？', onConfirm: async () => save() });"
      ),
      callout('note', 'Promise 语义', [
        'oneDialog.confirm 返回 Promise<boolean>。onConfirm 返回 false 时保持打开；返回 true、void 或对应 Promise 时关闭并得到 true。',
      ]),
      heading(2, 'api', 'API'),
      apiTable('OneDialog 属性', [
        {
          name: 'open',
          signature: 'open?: boolean',
          description: '受控显示状态。',
        },
        {
          name: 'defaultOpen',
          signature: 'defaultOpen?: boolean',
          description: '非受控初始状态。',
        },
        {
          name: 'title',
          signature: 'title?: string',
          description: '标题；header 插槽优先。',
        },
        {
          name: 'description',
          signature: 'description?: string',
          description: '说明；default 插槽优先。',
        },
        {
          name: 'closeOnOverlay',
          signature: 'closeOnOverlay?: boolean',
          description: '是否允许点击遮罩关闭，默认 true。',
        },
        {
          name: 'closeOnEscape',
          signature: 'closeOnEscape?: boolean',
          description: '是否允许 Escape 关闭，默认 true。',
        },
        {
          name: 'confirmLoading',
          signature: 'confirmLoading?: boolean',
          description: '确认中的加载与禁用状态。',
        },
        {
          name: 'container',
          signature: 'container?: OneOverlayContainer',
          description: '自定义挂载容器。',
        },
        {
          name: 'children',
          signature: 'children?: Array<VNode | string>',
          description: 'default、header、footer 插槽。',
        },
      ]),
      apiTable('OneDialog 事件与服务', [
        {
          name: 'confirm',
          signature: '() => void',
          description: '点击默认确认按钮。',
        },
        {
          name: 'cancel',
          signature: '(reason) => void',
          description: '取消、遮罩或 Escape 请求。',
        },
        {
          name: 'openChange',
          signature: '(open: boolean) => void',
          description: '受控状态变更请求。',
        },
        {
          name: 'afterClose',
          signature: '() => void',
          description: '视图实际卸载后发出。',
        },
        {
          name: 'oneDialog.open',
          signature: '(options) => OneOverlayHandle',
          description: '创建可更新对话框。',
        },
        {
          name: 'oneDialog.confirm',
          signature: '(options) => Promise<boolean>',
          description: '创建可等待的确认对话框。',
        },
        {
          name: 'oneDialog.closeAll',
          signature: '() => void',
          description: '关闭全部 Dialog 并以 false 结算等待。',
        },
      ]),
      heading(2, 'accessibility', '键盘与 ARIA'),
      paragraph(
        '使用 role=dialog、aria-modal、aria-labelledby 和 aria-describedby。Tab / Shift+Tab 在最上层对话框内循环，Escape 按配置关闭，关闭后恢复原焦点。'
      ),
    ],
  },
  {
    path: '/components/feedback/tooltip/',
    title: 'OneTooltip',
    description:
      '支持 12 个方向、碰撞翻转和 hover、focus、click、manual 触发。',
    section: '组件',
    sectionOrder: 2,
    order: 12,
    body: [
      heading(1, 'onetooltip', 'OneTooltip'),
      paragraph(
        '默认使用 hover-focus 触发，定位器会按可用空间翻转并限制在视口或自定义容器内。'
      ),
      demo('tooltip'),
      heading(2, 'example', '示例'),
      codeBlock(
        'ts',
        "new OneTooltip({ content: '复制链接', placement: 'bottom-end', children: [{ tag: 'button', children: ['复制'] }] })"
      ),
      heading(2, 'placements', '12 个方向'),
      paragraph(
        'top-start, top, top-end, right-start, right, right-end, bottom-start, bottom, bottom-end, left-start, left, left-end。'
      ),
      heading(2, 'api', 'API'),
      apiTable('OneTooltip 属性与事件', [
        {
          name: 'content',
          signature: 'content: VNode | string',
          description: '提示内容。',
        },
        {
          name: 'placement',
          signature: 'placement?: OneOverlayPlacement',
          description: '首选方向，空间不足时自动翻转和位移。',
        },
        {
          name: 'trigger',
          signature: "trigger?: 'hover-focus' | 'click' | 'manual'",
          description: '触发方式。',
        },
        {
          name: 'open',
          signature: 'open?: boolean',
          description: '受控显示状态。',
        },
        {
          name: 'defaultOpen',
          signature: 'defaultOpen?: boolean',
          description: '非受控初始状态。',
        },
        {
          name: 'openDelay',
          signature: 'openDelay?: number',
          description: '打开延迟，默认 100ms。',
        },
        {
          name: 'closeDelay',
          signature: 'closeDelay?: number',
          description: '关闭延迟，默认 100ms。',
        },
        {
          name: 'offset',
          signature: 'offset?: number',
          description: '与触发元素的距离，默认 8px。',
        },
        {
          name: 'container',
          signature: 'container?: OneOverlayContainer',
          description: '自定义挂载与碰撞边界。',
        },
        {
          name: 'arrow',
          signature: 'arrow?: boolean',
          description: '是否显示箭头。',
        },
        {
          name: 'disabled',
          signature: 'disabled?: boolean',
          description: '禁用提示。',
        },
        {
          name: 'children',
          signature: 'children?: Array<VNode | string>',
          description: '必须包含一个 HTMLElement 触发节点。',
        },
        {
          name: 'openChange',
          signature: '(open: boolean) => void',
          description: '显示状态变更请求。',
        },
      ]),
      heading(2, 'accessibility', '键盘与 ARIA'),
      paragraph(
        '气泡使用 role=tooltip，打开时通过 aria-describedby 关联触发元素；focus 可打开，Escape 可关闭，并在卸载时恢复原属性。'
      ),
    ],
  },
];
