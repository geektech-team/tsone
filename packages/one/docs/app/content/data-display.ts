import {
  apiTable,
  demo,
  heading,
  inlineCode,
  paragraph,
  type OneDocPage,
} from './types';

export const dataDisplayPages: OneDocPage[] = [
  {
    path: '/components/data-display/',
    title: '数据展示',
    description: '使用 Card、Tag、Badge 和 Empty 清晰呈现内容与状态。',
    section: '组件',
    sectionOrder: 2,
    order: 3,
    body: [
      heading(1, 'data-display', '数据展示'),
      paragraph('数据展示组件负责组织内容、标记状态、提示数量以及表达空状态。'),
      demo('tag'),
      heading(2, 'components', '组件'),
      apiTable('数据展示组件', [
        {
          name: 'OneCard',
          signature: 'new OneCard(props)',
          description: '组织标题、正文和底部操作。',
        },
        {
          name: 'OneTag',
          signature: 'new OneTag(props)',
          description: '展示状态或分类标签。',
        },
        {
          name: 'OneBadge',
          signature: 'new OneBadge(props)',
          description: '展示计数、短文本或状态圆点。',
        },
        {
          name: 'OneEmpty',
          signature: 'new OneEmpty(props)',
          description: '展示无数据状态和恢复操作。',
        },
      ]),
    ],
  },
  {
    path: '/components/data-display/tag/',
    title: 'OneTag',
    description: '展示状态、分类和可关闭的轻量标签。',
    section: '组件',
    sectionOrder: 2,
    order: 4,
    body: [
      heading(1, 'onetag', 'OneTag'),
      paragraph(
        'OneTag 支持 neutral、primary、success、warning、error 五种状态与三种尺寸。'
      ),
      demo('tag'),
      heading(2, 'behavior', '尺寸与关闭'),
      paragraph(
        inlineCode('closable'),
        ' 会显示原生关闭按钮；关闭后发出 close 事件并保留隐藏锚点。'
      ),
      heading(2, 'api', 'API'),
      apiTable('OneTag 属性与事件', [
        {
          name: 'variant',
          signature: 'variant?: OneDataDisplayVariant',
          description: 'neutral、primary、success、warning 或 error。',
        },
        {
          name: 'size',
          signature: 'size?: OneComponentSize',
          description: 'sm、md 或 lg，默认 md。',
        },
        {
          name: 'closable',
          signature: 'closable?: boolean',
          description: '显示可访问的关闭按钮。',
        },
        {
          name: 'children',
          signature: 'children?: Array<VNode | string>',
          description: '标签内容。',
        },
        {
          name: 'close',
          signature: '() => void',
          description: '用户关闭标签时发出一次。',
        },
      ]),
    ],
  },
  {
    path: '/components/data-display/badge/',
    title: 'OneBadge',
    description: '展示数字、短文本、封顶计数和状态圆点。',
    section: '组件',
    sectionOrder: 2,
    order: 5,
    body: [
      heading(1, 'onebadge', 'OneBadge'),
      paragraph(
        'OneBadge 可以包裹目标内容，也可以独立显示；数字默认在 99 处封顶。'
      ),
      demo('badge'),
      heading(2, 'display-rules', '显示规则'),
      paragraph(
        inlineCode('dot'),
        ' 优先显示圆点；',
        inlineCode('showZero'),
        ' 控制零值是否可见。圆点应通过 ariaLabel 表达业务含义。'
      ),
      heading(2, 'api', 'API'),
      apiTable('OneBadge 属性', [
        {
          name: 'value',
          signature: 'value?: number | string',
          description: '数字计数或短文本。',
        },
        {
          name: 'max',
          signature: 'max?: number',
          description: '数字封顶值，默认 99。',
        },
        {
          name: 'dot',
          signature: 'dot?: boolean',
          description: '忽略 value 并显示状态圆点。',
        },
        {
          name: 'showZero',
          signature: 'showZero?: boolean',
          description: 'value 为 0 时仍显示标记。',
        },
        {
          name: 'variant',
          signature: 'variant?: OneDataDisplayVariant',
          description: '标记的状态颜色，默认 primary。',
        },
        {
          name: 'ariaLabel',
          signature: 'ariaLabel?: string',
          description: '标记的可访问名称。',
        },
        {
          name: 'children',
          signature: 'children?: Array<VNode | string>',
          description: '可选的被标记内容。',
        },
      ]),
    ],
  },
  {
    path: '/components/data-display/empty/',
    title: 'OneEmpty',
    description: '展示无数据说明、图片与后续操作。',
    section: '组件',
    sectionOrder: 2,
    order: 6,
    body: [
      heading(1, 'oneempty', 'OneEmpty'),
      paragraph('OneEmpty 默认显示“暂无数据”，也允许替换图片、正文和操作。'),
      demo('empty'),
      heading(2, 'slots', '插槽优先级'),
      paragraph(
        inlineCode('image'),
        ' 替换默认 CSS 图形；default 替换 description；',
        inlineCode('actions'),
        ' 提供创建、刷新或恢复操作。'
      ),
      heading(2, 'api', 'API'),
      apiTable('OneEmpty 属性与插槽', [
        {
          name: 'description',
          signature: 'description?: string',
          description: '没有 default 插槽时使用的说明。',
        },
        {
          name: 'children',
          signature: 'children?: Array<VNode | string>',
          description: 'image、default 和 actions 插槽内容。',
        },
        {
          name: 'image',
          signature: "Array<VNode & { slot: 'image' }>",
          description: '替换默认装饰图形。',
        },
        {
          name: 'default',
          signature: 'Array<VNode | string>',
          description: '替换 description 文本。',
        },
        {
          name: 'actions',
          signature: "Array<VNode & { slot: 'actions' }>",
          description: '可选操作区域。',
        },
      ]),
    ],
  },
];
