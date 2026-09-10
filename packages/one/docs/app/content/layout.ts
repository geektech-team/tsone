import {
  apiTable,
  codeBlock,
  demo,
  heading,
  inlineCode,
  paragraph,
  t,
  type OneDocPage,
} from './types';

export const layoutPages: OneDocPage[] = [
  {
    path: '/components/layout/',
    title: t('布局', 'Layout'),
    description: t(
      '使用栅格与分割线组织页面结构与视觉分隔。',
      'Organize page structure and visual separation with grids and dividers.'
    ),
    section: 'components',
    sectionOrder: 2,
    order: 3,
    body: [
      heading(1, 'layout', t('布局', 'Layout')),
      paragraph(
        t(
          '布局组件用于组织页面结构：OneRow 与 OneCol 以 24 栅格分配宽度，OneDivider 在内容区域之间建立视觉分隔。',
          'Layout components organize page structure: OneRow and OneCol distribute width on a 24-column grid, and OneDivider creates visual separation between content sections.'
        )
      ),
      demo('grid'),
      heading(2, 'components', t('组件', 'Components')),
      apiTable(t('布局组件', 'Layout components'), [
        {
          name: 'OneRow',
          signature: 'new OneRow(props: OneRowProps)',
          description: t(
            'flex 行容器，提供 gutter、align、justify 与换行控制。',
            'A flex row container with gutter, align, justify and wrap control.'
          ),
        },
        {
          name: 'OneCol',
          signature: 'new OneCol(props: OneColProps)',
          description: t(
            '栅格列，按 span 占 1-24 等分，offset 向右偏移，支持响应式断点。',
            'A grid column occupying 1-24 divisions by span, shifted right by offset, with responsive breakpoints.'
          ),
        },
        {
          name: 'OneDivider',
          signature: 'new OneDivider(props: OneDividerProps)',
          description: t(
            '水平或垂直分割线，支持带文字的居中分割。',
            'A horizontal or vertical rule with an optional centered label.'
          ),
        },
      ]),
    ],
  },
  {
    path: '/components/layout/grid/',
    title: t('Grid', 'Grid'),
    description: t(
      'OneRow 与 OneCol 的 24 栅格：span 组合、offset 偏移、gutter 间距与响应式断点。',
      'OneRow and OneCol on a 24-column grid: span combinations, offset shifts, gutter spacing and responsive breakpoints.'
    ),
    section: 'components',
    sectionOrder: 2,
    order: 5,
    body: [
      heading(1, 'grid', 'OneRow / OneCol'),
      paragraph(
        t(
          'OneRow 把宽度等分为 24 份；每个 OneCol 通过 span 指定占用份数（1-24），多个列相加不超过 24 时同行排列，超出自动换行。',
          'OneRow divides the width into 24 parts; each OneCol takes span parts (1-24). Columns summing to at most 24 share a row, and excess wraps automatically.'
        )
      ),
      demo('grid'),
      heading(2, 'split', t('拆分组合', 'Split combinations')),
      paragraph(
        t(
          '使用不同 span 组合即可实现 12+12、8+8+8、6+18 等常见布局；不传 span 的列按内容自适应宽度。',
          'Different span combinations give common layouts such as 12+12, 8+8+8 and 6+18; a column without span sizes to its content.'
        )
      ),
      heading(2, 'offset', t('偏移', 'Offset')),
      paragraph(
        inlineCode('offset'),
        t(
          ' 让列向右偏移指定栅格数（0-23），常用于在行首留白或制造不对称布局。',
          ' shifts a column right by the given number of columns (0-23), often used to leave leading space or build asymmetric layouts.'
        )
      ),
      heading(2, 'responsive', t('响应式断点', 'Responsive breakpoints')),
      paragraph(
        t(
          'OneCol 支持 xs、sm、md、lg、xl、xxl 六档断点，每档可传数字（仅 span）或 { span, offset } 对象。小断点的设置会级联继承到更大的断点，直到被显式覆盖。',
          'OneCol supports six breakpoints (xs, sm, md, lg, xl, xxl); each accepts a number (span only) or a { span, offset } object. Smaller breakpoint values cascade to larger breakpoints until explicitly overridden.'
        )
      ),
      codeBlock(
        'ts',
        [
          "import { OneRow, OneCol } from '@geektech/one';",
          '',
          'new OneRow({',
          '  gutter: [16, 16],',
          '  children: [',
          "    { component: OneCol, props: { xs: 24, md: 12 }, children: ['A'] },",
          "    { component: OneCol, props: { xs: 24, md: 12 }, children: ['B'] },",
          '  ],',
          '});',
        ].join('\n')
      ),
      paragraph(
        t(
          '默认断点：xs < 576px，sm >= 576px，md >= 768px，lg >= 992px，xl >= 1200px，xxl >= 1600px。可通过主题 CSS 变量 --one-grid-breakpoint-sm/md/lg/xl/xxl 自定义。',
          'Default breakpoints: xs < 576px, sm >= 576px, md >= 768px, lg >= 992px, xl >= 1200px, xxl >= 1600px. Customize via theme CSS variables --one-grid-breakpoint-sm/md/lg/xl/xxl.'
        )
      ),
      heading(2, 'gutter', t('间距与对齐', 'Gutter and alignment')),
      paragraph(
        t(
          'gutter 接受像素数值或 [水平, 垂直] 数组；align 控制交叉轴对齐，justify 控制主轴分布，wrap 关闭后列不换行。',
          'gutter accepts a pixel number or a [horizontal, vertical] pair; align controls cross-axis alignment, justify controls main-axis distribution, and wrap disables wrapping when false.'
        )
      ),
      heading(2, 'api', 'API'),
      apiTable(t('OneRow 属性', 'OneRow props'), [
        {
          name: 'gutter',
          signature: 'gutter?: number | [number, number]',
          description: t(
            '列间距（px）：数值同时作用于水平和垂直，数组为 [水平, 垂直]，默认 0。',
            'Column spacing in px: a number applies to both axes, an array is [horizontal, vertical]; default 0.'
          ),
        },
        {
          name: 'align',
          signature:
            "align?: 'start' | 'center' | 'end' | 'baseline' | 'stretch'",
          description: t(
            '交叉轴对齐方式，默认 start。',
            'Cross-axis alignment; default start.'
          ),
        },
        {
          name: 'justify',
          signature:
            "justify?: 'start' | 'center' | 'end' | 'space-between' | 'space-around' | 'space-evenly'",
          description: t(
            '主轴分布方式，默认 start。',
            'Main-axis distribution; default start.'
          ),
        },
        {
          name: 'wrap',
          signature: 'wrap?: boolean',
          description: t(
            '允许列换行，默认 true。',
            'Allows columns to wrap; default true.'
          ),
        },
        {
          name: 'children',
          signature: 'children?: Array<VNode | string>',
          description: t(
            '行内内容，通常是 OneCol。',
            'Row content, usually OneCol.'
          ),
        },
      ]),
      apiTable(t('OneCol 属性', 'OneCol props'), [
        {
          name: 'span',
          signature: 'span?: number',
          description: t(
            '占用栅格数（1-24），不传时按内容自适应。',
            'Columns occupied (1-24); defaults to auto width when omitted.'
          ),
        },
        {
          name: 'offset',
          signature: 'offset?: number',
          description: t(
            '向右偏移栅格数（0-23），默认 0。',
            'Columns shifted right (0-23); default 0.'
          ),
        },
        {
          name: 'xs',
          signature: 'xs?: number | { span?: number; offset?: number }',
          description: t(
            '< 576px 断点的 span/offset。',
            'Span/offset for the < 576px breakpoint.'
          ),
        },
        {
          name: 'sm',
          signature: 'sm?: number | { span?: number; offset?: number }',
          description: t(
            '>= 576px 断点的 span/offset。',
            'Span/offset for the >= 576px breakpoint.'
          ),
        },
        {
          name: 'md',
          signature: 'md?: number | { span?: number; offset?: number }',
          description: t(
            '>= 768px 断点的 span/offset。',
            'Span/offset for the >= 768px breakpoint.'
          ),
        },
        {
          name: 'lg',
          signature: 'lg?: number | { span?: number; offset?: number }',
          description: t(
            '>= 992px 断点的 span/offset。',
            'Span/offset for the >= 992px breakpoint.'
          ),
        },
        {
          name: 'xl',
          signature: 'xl?: number | { span?: number; offset?: number }',
          description: t(
            '>= 1200px 断点的 span/offset。',
            'Span/offset for the >= 1200px breakpoint.'
          ),
        },
        {
          name: 'xxl',
          signature: 'xxl?: number | { span?: number; offset?: number }',
          description: t(
            '>= 1600px 断点的 span/offset。',
            'Span/offset for the >= 1600px breakpoint.'
          ),
        },
        {
          name: 'children',
          signature: 'children?: Array<VNode | string>',
          description: t('列内容。', 'Column content.'),
        },
      ]),
    ],
  },
  {
    path: '/components/layout/divider/',
    title: 'OneDivider',
    description: t(
      '分割内容区域的横线或竖线，支持带文字的居中分割。',
      'A horizontal or vertical rule that separates content, with an optional centered label.'
    ),
    section: 'components',
    sectionOrder: 2,
    order: 4,
    body: [
      heading(1, 'onedivider', 'OneDivider'),
      paragraph(
        t(
          'OneDivider 默认渲染水平分割线，传入 direction 可切换为垂直分隔。',
          'OneDivider renders a horizontal rule by default; pass direction to switch to a vertical separator.'
        )
      ),
      demo('divider'),
      heading(2, 'text', t('文字分割线', 'Divider with text')),
      paragraph(
        t(
          '传入 text 后，OneDivider 以 flex 布局在两侧绘制线条并把文字居中；textAlign 可让文字靠左或靠右。',
          'When text is provided OneDivider draws lines on both sides and centers the label; textAlign moves it to the left or right.'
        )
      ),
      heading(2, 'api', 'API'),
      apiTable(t('OneDivider 属性', 'OneDivider props'), [
        {
          name: 'direction',
          signature: "direction?: 'horizontal' | 'vertical'",
          description: t(
            '分割线方向，默认 horizontal。',
            'Rule direction; defaults to horizontal.'
          ),
        },
        {
          name: 'text',
          signature: 'text?: string',
          description: t(
            '可选文字，显示在水平分割线中间。',
            'Optional label shown in the middle of a horizontal rule.'
          ),
        },
        {
          name: 'textAlign',
          signature: "textAlign?: 'left' | 'center' | 'right'",
          description: t(
            '文字对齐方式，默认 center。',
            'Label alignment; defaults to center.'
          ),
        },
      ]),
    ],
  },
];
