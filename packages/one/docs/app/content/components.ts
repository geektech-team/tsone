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

export const componentPages: OneDocPage[] = [
  {
    path: '/components/button/',
    title: 'OneButton',
    description: t(
      'OneButton 的变体、尺寸、状态、点击事件与完整 props。',
      'OneButton variants, sizes, states, click events and the full props reference.'
    ),
    section: 'components',
    sectionOrder: 2,
    order: 0,
    body: [
      heading(1, 'button', 'OneButton'),
      paragraph(
        t(
          'OneButton 使用原生 button 元素呈现 primary、secondary 和 danger 操作。',
          'OneButton renders primary, secondary and danger actions with a native button element.'
        )
      ),
      demo('button'),
      heading(2, 'variants-sizes', t('变体与尺寸', 'Variants and sizes')),
      codeBlock(
        'ts',
        [
          "import { createComponent } from '@geektech/tsone';",
          "import { OneButton } from '@geektech/one';",
          '',
          "createComponent(OneButton, { variant: 'primary', size: 'sm' }, ['Primary']);",
          "createComponent(OneButton, { variant: 'secondary', size: 'md' }, ['Secondary']);",
          "createComponent(OneButton, { variant: 'danger', size: 'lg' }, ['Danger']);",
        ].join('\n')
      ),
      heading(2, 'states-events', t('状态与事件', 'States and events')),
      paragraph(
        inlineCode('disabled'),
        t(' 禁止交互；', ' blocks interaction; '),
        inlineCode('loading'),
        t(
          ' 同时禁用按钮、显示静态 spinner 并设置 aria-busy。启用状态下的原生点击会发出 click 事件。',
          ' disables the button, shows a static spinner and sets aria-busy. A native click on an enabled button emits the click event.'
        )
      ),
      codeBlock(
        'ts',
        [
          "import { OneButton } from '@geektech/one';",
          '',
          "const button = new OneButton({ loading: false, children: ['保存'] });",
          "button.on('click', (event) => {",
          '  const mouseEvent = event as MouseEvent;',
          "  console.log('clicked', mouseEvent);",
          '});',
        ].join('\n')
      ),
      heading(2, 'api', 'API'),
      apiTable(t('OneButton 属性与事件', 'OneButton props and events'), [
        {
          name: 'variant',
          signature: 'variant?: OneButtonVariant',
          description: t(
            "视觉变体：'primary' | 'secondary' | 'danger'，默认 primary。",
            "Visual variants: 'primary' | 'secondary' | 'danger'; default primary."
          ),
        },
        {
          name: 'size',
          signature: 'size?: OneComponentSize',
          description: t(
            "组件尺寸：'sm' | 'md' | 'lg'，默认 md。",
            "Component size: 'sm' | 'md' | 'lg'; default md."
          ),
        },
        {
          name: 'type',
          signature: "type?: 'button' | 'submit' | 'reset'",
          description: t('原生按钮类型，默认 button。', 'Native button type; default button.'),
        },
        {
          name: 'disabled',
          signature: 'disabled?: boolean',
          description: t('禁用按钮。', 'Disables the button.'),
        },
        {
          name: 'loading',
          signature: 'loading?: boolean',
          description: t('显示加载状态并禁用按钮。', 'Shows a loading state and disables the button.'),
        },
        {
          name: 'children',
          signature: 'children?: Array<VNode | string>',
          description: t('按钮默认内容。', 'Default button content.'),
        },
        {
          name: 'click',
          signature: '(event: MouseEvent) => void',
          description: t('按钮启用且未加载时发出。', 'Emitted when the button is enabled and not loading.'),
        },
      ]),
    ],
  },
  {
    path: '/components/divider/',
    title: 'OneDivider',
    description: t(
      '分割内容区域的横线或竖线，支持带文字的居中分割。',
      'A horizontal or vertical rule that separates content, with an optional centered label.'
    ),
    section: 'components',
    sectionOrder: 2,
    order: 1,
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
  {
    path: '/components/space/',
    title: 'OneSpace',
    description: t(
      '用统一间距排布子元素的布局容器。',
      'A layout container that spaces child elements uniformly.'
    ),
    section: 'components',
    sectionOrder: 2,
    order: 2,
    body: [
      heading(1, 'onespace', 'OneSpace'),
      paragraph(
        t(
          'OneSpace 把子元素按水平或垂直方向排布，并用统一间距分隔，避免手动设置 margin。',
          'OneSpace lays children out horizontally or vertically with a uniform gap, avoiding manual margins.'
        )
      ),
      demo('space'),
      heading(2, 'sizes', t('间距与对齐', 'Sizes and alignment')),
      paragraph(
        t(
          'size 接受 sm/md/lg 或像素数值；align 控制子元素对齐，wrap 允许换行。',
          'size accepts sm/md/lg or a pixel number; align controls alignment and wrap enables wrapping.'
        )
      ),
      heading(2, 'api', 'API'),
      apiTable(t('OneSpace 属性', 'OneSpace props'), [
        {
          name: 'direction',
          signature: "direction?: 'horizontal' | 'vertical'",
          description: t(
            '排列方向，默认 horizontal。',
            'Layout direction; defaults to horizontal.'
          ),
        },
        {
          name: 'size',
          signature: 'size?: OneComponentSize | number',
          description: t(
            '间距，sm/md/lg 或像素值，默认 md。',
            'Gap as sm/md/lg or a pixel number; defaults to md.'
          ),
        },
        {
          name: 'wrap',
          signature: 'wrap?: boolean',
          description: t(
            '允许子元素换行。',
            'Allows children to wrap.'
          ),
        },
        {
          name: 'align',
          signature: 'align?: OneSpaceAlign',
          description: t(
            '子元素对齐方式。',
            'Child alignment.'
          ),
        },
        {
          name: 'children',
          signature: 'children?: Array<VNode | string>',
          description: t(
            '排布的内容。',
            'Children to lay out.'
          ),
        },
      ]),
    ],
  },
  {
    path: '/components/card/',
    title: 'OneCard',
    description: t(
      'OneCard 的 title、header/default/footer 插槽和优先级。',
      'OneCard title, header/default/footer slots and their precedence.'
    ),
    section: 'components',
    sectionOrder: 2,
    order: 3,
    body: [
      heading(1, 'card', 'OneCard'),
      paragraph(
        t(
          'OneCard 将标题、主体与操作区域组织为语义化 section。',
          'OneCard organizes a title, body and action area into a semantic section.'
        )
      ),
      demo('card'),
      heading(2, 'slots', t('插槽与优先级', 'Slots and precedence')),
      paragraph(
        t('带 ', 'An explicit header slot with '),
        inlineCode("slot: 'header'"),
        t(' 的显式 header 插槽优先于 title。无 slot 的 children 进入 default 主体，带 ', ' takes precedence over title. Children without a slot enter the default body, and nodes with '),
        inlineCode("slot: 'footer'"),
        t(' 的节点进入 footer；未提供 footer 时不会渲染空区域。', ' enter the footer; no empty area is rendered when the footer is absent.')
      ),
      codeBlock(
        'ts',
        [
          "import { createComponent } from '@geektech/tsone';",
          "import { OneButton, OneCard } from '@geektech/one';",
          '',
          "createComponent(OneCard, { title: '后备标题' }, [",
          "  { tag: 'strong', slot: 'header', children: ['显式标题'] },",
          "  { tag: 'p', children: ['default 内容'] },",
          "  { component: OneButton, slot: 'footer', children: ['继续'] },",
          ']);',
        ].join('\n')
      ),
      heading(2, 'api', 'API'),
      apiTable(t('OneCard 属性', 'OneCard props'), [
        {
          name: 'title',
          signature: 'title?: string',
          description: t('没有 header 插槽时显示的标题。', 'Title shown when no header slot is present.'),
        },
        {
          name: 'children',
          signature: 'children?: Array<VNode | string>',
          description: t('默认内容和命名插槽节点。', 'Default content and named slot nodes.'),
        },
      ]),
      apiTable(t('OneCard 插槽', 'OneCard slots'), [
        {
          name: 'header',
          signature: "Array<VNode & { slot: 'header' }>",
          description: t('标题区域，优先于 title。', 'Title area; takes precedence over title.'),
        },
        {
          name: 'default',
          signature: 'Array<VNode | string>',
          description: t('卡片主体内容。', 'Card body content.'),
        },
        {
          name: 'footer',
          signature: "Array<VNode & { slot: 'footer' }>",
          description: t('可选底部操作区域。', 'Optional bottom action area.'),
        },
      ]),
    ],
  },
];
