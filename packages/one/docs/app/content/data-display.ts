import {
  apiTable,
  demo,
  heading,
  inlineCode,
  paragraph,
  t,
  type OneDocPage,
} from './types';

export const dataDisplayPages: OneDocPage[] = [
  {
    path: '/components/data-display/',
    title: t('数据展示', 'Data display'),
    description: t(
      '使用 Card、Tag、Badge、Avatar、Progress、Empty、Table、Collapse 和 Skeleton 清晰呈现内容与状态。',
      'Use Card, Tag, Badge, Avatar, Progress, Empty, Table, Collapse and Skeleton to present content and state clearly.'
    ),
    section: 'components',
    sectionOrder: 2,
    order: 3,
    body: [
      heading(1, 'data-display', t('数据展示', 'Data display')),
      paragraph(
        t(
          '数据展示组件负责组织内容、标记状态、提示数量、表达进度以及展示空状态。',
          'Data display components organize content, mark status, hint counts, express progress and present empty states.'
        )
      ),
      demo('tag'),
      heading(2, 'components', t('组件', 'Components')),
      apiTable(t('数据展示组件', 'Data display components'), [
        {
          name: 'OneCard',
          signature: 'new OneCard(props)',
          description: t('组织标题、正文和底部操作。', 'Organizes a title, body and bottom actions.'),
        },
        {
          name: 'OneTag',
          signature: 'new OneTag(props)',
          description: t('展示状态或分类标签。', 'Shows status or category tags.'),
        },
        {
          name: 'OneBadge',
          signature: 'new OneBadge(props)',
          description: t('展示计数、短文本或状态圆点。', 'Shows counts, short text or a status dot.'),
        },
        {
          name: 'OneAvatar',
          signature: 'new OneAvatar(props)',
          description: t('展示图片或文字占位头像。', 'Shows an image or text-placeholder avatar.'),
        },
        {
          name: 'OneProgress',
          signature: 'new OneProgress(props)',
          description: t('展示线性的完成进度。', 'Shows linear completion progress.'),
        },
        {
          name: 'OneEmpty',
          signature: 'new OneEmpty(props)',
          description: t('展示无数据状态和恢复操作。', 'Shows an empty state and recovery actions.'),
        },
        {
          name: 'OneTable',
          signature: 'new OneTable(props)',
          description: t('用表格组织行列数据与状态。', 'Organizes row and column data and states in a table.'),
        },
        {
          name: 'OneCollapse',
          signature: 'new OneCollapse(props)',
          description: t('折叠面板，支持手风琴与多开。', 'Collapsible panels, with accordion and multi-open modes.'),
        },
        {
          name: 'OneSkeleton',
          signature: 'new OneSkeleton(props)',
          description: t('展示加载占位骨架。', 'Shows loading placeholder skeletons.'),
        },
      ]),
    ],
  },
  {
    path: '/components/data-display/tag/',
    title: 'OneTag',
    description: t('展示状态、分类和可关闭的轻量标签。', 'Lightweight tags for status, category and dismissible labels.'),
    section: 'components',
    sectionOrder: 2,
    order: 4,
    body: [
      heading(1, 'onetag', 'OneTag'),
      paragraph(
        t(
          'OneTag 支持 neutral、primary、success、warning、error 五种状态与三种尺寸。',
          'OneTag supports five variants (neutral, primary, success, warning, error) and three sizes.'
        )
      ),
      demo('tag'),
      heading(2, 'behavior', t('尺寸与关闭', 'Sizes and dismiss')),
      paragraph(
        inlineCode('closable'),
        t(
          ' 会显示原生关闭按钮；关闭后发出 close 事件并保留隐藏锚点。',
          ' shows a native close button; closing emits the close event and keeps a hidden anchor.'
        )
      ),
      heading(2, 'api', 'API'),
      apiTable(t('OneTag 属性与事件', 'OneTag props and events'), [
        {
          name: 'variant',
          signature: 'variant?: OneDataDisplayVariant',
          description: t('neutral、primary、success、warning 或 error。', 'neutral, primary, success, warning or error.'),
        },
        {
          name: 'size',
          signature: 'size?: OneComponentSize',
          description: t('sm、md 或 lg，默认 md。', 'sm, md or lg; default md.'),
        },
        {
          name: 'closable',
          signature: 'closable?: boolean',
          description: t('显示可访问的关闭按钮。', 'Shows an accessible close button.'),
        },
        {
          name: 'children',
          signature: 'children?: Array<VNode | string>',
          description: t('标签内容。', 'Tag content.'),
        },
        {
          name: 'close',
          signature: '() => void',
          description: t('用户关闭标签时发出一次。', 'Emitted once when the user dismisses the tag.'),
        },
      ]),
    ],
  },
  {
    path: '/components/data-display/badge/',
    title: 'OneBadge',
    description: t('展示数字、短文本、封顶计数和状态圆点。', 'Shows numbers, short text, capped counts and status dots.'),
    section: 'components',
    sectionOrder: 2,
    order: 5,
    body: [
      heading(1, 'onebadge', 'OneBadge'),
      paragraph(
        t(
          'OneBadge 可以包裹目标内容，也可以独立显示；数字默认在 99 处封顶。',
          'OneBadge can wrap target content or render standalone; numbers cap at 99 by default.'
        )
      ),
      demo('badge'),
      heading(2, 'display-rules', t('显示规则', 'Display rules')),
      paragraph(
        inlineCode('dot'),
        t(' 优先显示圆点；', ' takes precedence as a dot; '),
        inlineCode('showZero'),
        t(' 控制零值是否可见。圆点应通过 ariaLabel 表达业务含义。', ' controls whether a zero value is visible. Dots should express their meaning through ariaLabel.')
      ),
      heading(2, 'api', 'API'),
      apiTable(t('OneBadge 属性', 'OneBadge props'), [
        {
          name: 'value',
          signature: 'value?: number | string',
          description: t('数字计数或短文本。', 'Numeric count or short text.'),
        },
        {
          name: 'max',
          signature: 'max?: number',
          description: t('数字封顶值，默认 99。', 'Numeric cap; default 99.'),
        },
        {
          name: 'dot',
          signature: 'dot?: boolean',
          description: t('忽略 value 并显示状态圆点。', 'Ignores value and shows a status dot.'),
        },
        {
          name: 'showZero',
          signature: 'showZero?: boolean',
          description: t('value 为 0 时仍显示标记。', 'Still shows the badge when value is 0.'),
        },
        {
          name: 'variant',
          signature: 'variant?: OneDataDisplayVariant',
          description: t('标记的状态颜色，默认 primary。', 'Status color of the badge; default primary.'),
        },
        {
          name: 'ariaLabel',
          signature: 'ariaLabel?: string',
          description: t('标记的可访问名称。', 'Accessible name of the badge.'),
        },
        {
          name: 'children',
          signature: 'children?: Array<VNode | string>',
          description: t('可选的被标记内容。', 'Optional wrapped content.'),
        },
      ]),
    ],
  },
  {
    path: '/components/data-display/empty/',
    title: 'OneEmpty',
    description: t('展示无数据说明、图片与后续操作。', 'Shows an empty-state description, image and follow-up actions.'),
    section: 'components',
    sectionOrder: 2,
    order: 6,
    body: [
      heading(1, 'oneempty', 'OneEmpty'),
      paragraph(
        t(
          'OneEmpty 默认显示“暂无数据”，也允许替换图片、正文和操作。',
          'OneEmpty shows "暂无数据" by default and allows replacing the image, body and actions.'
        )
      ),
      demo('empty'),
      heading(2, 'slots', t('插槽优先级', 'Slot precedence')),
      paragraph(
        inlineCode('image'),
        t(' 替换默认 CSS 图形；default 替换 description；', ' replaces the default CSS graphic; default replaces the description; '),
        inlineCode('actions'),
        t(' 提供创建、刷新或恢复操作。', ' provides create, refresh or recovery actions.')
      ),
      heading(2, 'api', 'API'),
      apiTable(t('OneEmpty 属性与插槽', 'OneEmpty props and slots'), [
        {
          name: 'description',
          signature: 'description?: string',
          description: t('没有 default 插槽时使用的说明。', 'Description used when no default slot is present.'),
        },
        {
          name: 'children',
          signature: 'children?: Array<VNode | string>',
          description: t('image、default 和 actions 插槽内容。', 'image, default and actions slot content.'),
        },
        {
          name: 'image',
          signature: "Array<VNode & { slot: 'image' }>",
          description: t('替换默认装饰图形。', 'Replaces the default decorative graphic.'),
        },
        {
          name: 'default',
          signature: 'Array<VNode | string>',
          description: t('替换 description 文本。', 'Replaces the description text.'),
        },
        {
          name: 'actions',
          signature: "Array<VNode & { slot: 'actions' }>",
          description: t('可选操作区域。', 'Optional action area.'),
        },
      ]),
    ],
  },
  {
    path: '/components/data-display/avatar/',
    title: 'OneAvatar',
    description: t(
      '展示图片头像或文字占位头像，支持圆形/方形与五种状态色。',
      'Shows an image or text-placeholder avatar with circle/square shapes and five status colors.'
    ),
    section: 'components',
    sectionOrder: 2,
    order: 7,
    body: [
      heading(1, 'oneavatar', 'OneAvatar'),
      paragraph(
        t('提供 ', 'When '),
        inlineCode('src'),
        t(' 时渲染图片；否则回退到 ', ' is provided it renders an image; otherwise it falls back to '),
        inlineCode('text'),
        t(' 或默认插槽中的文字。尺寸与状态色与其它数据展示组件一致。', ' or the text in the default slot. Sizes and status colors match other data display components.')
      ),
      demo('avatar'),
      heading(2, 'shape-size', t('形状与尺寸', 'Shape and size')),
      paragraph(
        inlineCode('shape'),
        t(' 支持 circle 和 square，非法值回退 circle；', ' supports circle and square, falling back to circle for invalid values; '),
        inlineCode('size'),
        t(' 支持 sm、md、lg，非法值回退 md。', ' supports sm, md, lg, falling back to md for invalid values.')
      ),
      heading(2, 'api', 'API'),
      apiTable(t('OneAvatar 属性', 'OneAvatar props'), [
        {
          name: 'src',
          signature: 'src?: string',
          description: t('图片地址；存在时渲染 img。', 'Image URL; renders an img when present.'),
        },
        {
          name: 'alt',
          signature: 'alt?: string',
          description: t('图片替代文本。', 'Image alternative text.'),
        },
        {
          name: 'text',
          signature: 'text?: string',
          description: t('无 src 时的文字回退。', 'Text fallback when src is absent.'),
        },
        {
          name: 'size',
          signature: 'size?: OneComponentSize',
          description: t('sm、md 或 lg，默认 md。', 'sm, md or lg; default md.'),
        },
        {
          name: 'shape',
          signature: "shape?: 'circle' | 'square'",
          description: t('头像形状，默认 circle。', 'Avatar shape; default circle.'),
        },
        {
          name: 'variant',
          signature: 'variant?: OneDataDisplayVariant',
          description: t('状态背景色，默认 neutral。', 'Status background color; default neutral.'),
        },
        {
          name: 'ariaLabel',
          signature: 'ariaLabel?: string',
          description: t('存在时设置 role="img" 与 aria-label。', 'Sets role="img" and aria-label when present.'),
        },
        {
          name: 'children',
          signature: 'children?: Array<VNode | string>',
          description: t('无 src 时的文字回退，优先于 text。', 'Text fallback when src is absent; takes precedence over text.'),
        },
      ]),
    ],
  },
  {
    path: '/components/data-display/progress/',
    title: 'OneProgress',
    description: t(
      '展示线性进度，百分比自动钳制到 0–100，并暴露 progressbar 语义。',
      'Shows linear progress, clamps the percentage to 0–100 and exposes progressbar semantics.'
    ),
    section: 'components',
    sectionOrder: 2,
    order: 8,
    body: [
      heading(1, 'oneprogress', 'OneProgress'),
      paragraph(
        t('百分比会被钳制到 0–100；', 'The percentage is clamped to 0–100; '),
        inlineCode('showText'),
        t(' 会显示四舍五入后的百分比文本，', ' shows the rounded percentage text, and '),
        inlineCode('variant'),
        t(' 控制进度条颜色。', ' controls the bar color.')
      ),
      demo('progress'),
      heading(2, 'aria', 'ARIA'),
      paragraph(
        t(
          '使用 role=progressbar，并通过 aria-valuemin、aria-valuemax、aria-valuenow 和 aria-valuetext 表达当前进度。',
          'Uses role=progressbar and expresses progress through aria-valuemin, aria-valuemax, aria-valuenow and aria-valuetext.'
        )
      ),
      heading(2, 'api', 'API'),
      apiTable(t('OneProgress 属性', 'OneProgress props'), [
        {
          name: 'percent',
          signature: 'percent?: number',
          description: t('进度百分比，NaN 归 0 并钳制到 0–100。', 'Progress percentage; NaN becomes 0 and clamps to 0–100.'),
        },
        {
          name: 'variant',
          signature: 'variant?: OneDataDisplayVariant',
          description: t('进度条颜色，默认 primary。', 'Bar color; default primary.'),
        },
        {
          name: 'showText',
          signature: 'showText?: boolean',
          description: t('显示四舍五入后的百分比文本。', 'Shows the rounded percentage text.'),
        },
        {
          name: 'ariaLabel',
          signature: 'ariaLabel?: string',
          description: t('进度条的可访问名称。', 'Accessible name of the progress bar.'),
        },
      ]),
    ],
  },
  {
    path: '/components/data-display/table/',
    title: 'OneTable',
    description: t(
      '用列定义与数据行渲染表格，支持自定义单元格、空状态与斑马纹。',
      'Renders a table from column definitions and data rows, with custom cells, an empty state and zebra striping.'
    ),
    section: 'components',
    sectionOrder: 2,
    order: 9,
    body: [
      heading(1, 'onetable', 'OneTable'),
      paragraph(
        t('未提供 ', 'When '),
        inlineCode('columns'),
        t(' 时会从首行数据推导列；', ' is omitted the columns are derived from the first data row; '),
        inlineCode('render'),
        t(' 可返回文本或 VNode（例如状态标签）。', ' can return text or a VNode, such as a status tag.')
      ),
      demo('table'),
      heading(2, 'empty', t('空状态', 'Empty state')),
      paragraph(
        t(
          '数据为空时渲染一个跨列单元格，展示 emptyText（默认“暂无数据”）。',
          'When data is empty a full-width cell renders emptyText, defaulting to “暂无数据”.'
        )
      ),
      heading(2, 'api', 'API'),
      apiTable(t('OneTable 属性', 'OneTable props'), [
        {
          name: 'data',
          signature: 'data?: readonly OneTableRow[]',
          description: t('表格数据行。', 'Table data rows.'),
        },
        {
          name: 'columns',
          signature: 'columns?: readonly OneTableColumn[]',
          description: t('列定义；缺省时从首行推导。', 'Column definitions; derived from the first row when omitted.'),
        },
        {
          name: 'rowKey',
          signature: 'rowKey?: string',
          description: t('用于行标识的字段名，缺省回退到索引。', 'Field used as the row key; falls back to the index when absent.'),
        },
        {
          name: 'striped',
          signature: 'striped?: boolean',
          description: t('偶数行斑马纹。', 'Zebra striping on even rows.'),
        },
        {
          name: 'hover',
          signature: 'hover?: boolean',
          description: t('悬停行高亮。', 'Highlights rows on hover.'),
        },
        {
          name: 'emptyText',
          signature: 'emptyText?: string',
          description: t('空状态文本，默认“暂无数据”。', 'Empty-state text; defaults to “暂无数据”.'),
        },
        {
          name: 'ariaLabel',
          signature: 'ariaLabel?: string',
          description: t('表格的可访问名称。', 'Accessible name of the table.'),
        },
      ]),
    ],
  },
  {
    path: '/components/data-display/collapse/',
    title: 'OneCollapse',
    description: t(
      '一组可展开/收起的面板，支持受控、非受控与手风琴模式。',
      'A set of expandable/collapsible panels, supporting controlled, uncontrolled and accordion modes.'
    ),
    section: 'components',
    sectionOrder: 2,
    order: 10,
    body: [
      heading(1, 'onecollapse', 'OneCollapse'),
      paragraph(
        t('每个面板头部是 ', 'Each panel header is a '),
        inlineCode('button[aria-expanded]'),
        t('，内容区使用 ', ' and the content area uses '),
        inlineCode('role="region"'),
        t(' 关联到头部。', ' associated with the header.')
      ),
      demo('collapse'),
      heading(2, 'accordion', t('手风琴', 'Accordion')),
      paragraph(
        t(
          'accordion 模式下同时只保留一个展开项；受控 active 与事件载荷均为字符串数组。',
          'In accordion mode only one panel stays open; the controlled active prop and event payload are string arrays.'
        )
      ),
      heading(2, 'api', 'API'),
      apiTable(t('OneCollapse 属性与事件', 'OneCollapse props and events'), [
        {
          name: 'items',
          signature: 'items?: readonly OneCollapseItem[]',
          description: t('面板定义，支持禁用项。', 'Panel definitions; supports disabled items.'),
        },
        {
          name: 'active',
          signature: 'active?: readonly string[]',
          description: t('受控展开项。', 'Controlled active panels.'),
        },
        {
          name: 'defaultActive',
          signature: 'defaultActive?: readonly string[]',
          description: t('非受控初始展开项。', 'Uncontrolled initial active panels.'),
        },
        {
          name: 'accordion',
          signature: 'accordion?: boolean',
          description: t('手风琴模式，同时只开一项。', 'Accordion mode; only one panel is open at a time.'),
        },
        {
          name: 'ariaLabel',
          signature: 'ariaLabel?: string',
          description: t('折叠组容器的访问名称。', 'Accessible name of the collapse container.'),
        },
        {
          name: 'change',
          signature: '(event: OneCollapseChangeEvent) => void',
          description: t(
            '展开项变化时发出 value: string[] 与 originalEvent: Event。',
            'Emitted when active panels change with value: string[] and originalEvent: Event.'
          ),
        },
      ]),
    ],
  },
  {
    path: '/components/data-display/skeleton/',
    title: 'OneSkeleton',
    description: t(
      '用占位块呈现加载中的内容轮廓，支持头像、标题、段落行与动画。',
      'Presents the outline of loading content with placeholder blocks, supporting avatar, title, paragraph rows and animation.'
    ),
    section: 'components',
    sectionOrder: 2,
    order: 11,
    body: [
      heading(1, 'oneskeleton', 'OneSkeleton'),
      paragraph(
        t('骨架块使用 ', 'Skeleton blocks use '),
        inlineCode('--one-color-border'),
        t(' 着色；', ' for their color; '),
        inlineCode('animated'),
        t(' 开启 one-skeleton-pulse 闪烁动画（默认开启）。', ' enables the one-skeleton-pulse animation, on by default.')
      ),
      demo('skeleton'),
      heading(2, 'aria', 'ARIA'),
      paragraph(
        t(
          '容器使用 role="status" 与 aria-busy，并通过 ariaLabel 表达加载语义；内部占位块对读屏隐藏。',
          'The container uses role="status" with aria-busy and expresses loading semantics through ariaLabel; inner placeholder blocks are hidden from screen readers.'
        )
      ),
      heading(2, 'api', 'API'),
      apiTable(t('OneSkeleton 属性', 'OneSkeleton props'), [
        {
          name: 'rows',
          signature: 'rows?: number',
          description: t('段落行数，默认 3。', 'Number of paragraph rows; default 3.'),
        },
        {
          name: 'title',
          signature: 'title?: boolean',
          description: t('显示标题条，默认 true。', 'Shows the title bar; default true.'),
        },
        {
          name: 'avatar',
          signature: 'avatar?: boolean',
          description: t('显示圆形头像占位。', 'Shows a circular avatar placeholder.'),
        },
        {
          name: 'animated',
          signature: 'animated?: boolean',
          description: t('闪烁动画，默认 true。', 'Pulse animation; default true.'),
        },
        {
          name: 'widths',
          signature: 'widths?: readonly string[]',
          description: t('每行占位宽度，按序循环。', 'Per-row placeholder widths, cycled in order.'),
        },
        {
          name: 'ariaLabel',
          signature: 'ariaLabel?: string',
          description: t('加载语义，默认“加载中”。', 'Loading semantics; defaults to “加载中”.'),
        },
      ]),
    ],
  },
];
