import {
  apiTable,
  callout,
  codeBlock,
  demo,
  heading,
  inlineCode,
  paragraph,
  t,
  type OneChartDocPage,
} from './types';

export const gettingStartedPage: OneChartDocPage = {
  path: '/guide/getting-started/',
  title: t('快速上手', 'Getting started'),
  description: t(
    '安装、创建并挂载第一个 One Chart 图表。',
    'Install, create and mount your first One Chart chart.'
  ),
  section: 'guide',
  sectionOrder: 1,
  order: 0,
  body: [
    heading(1, 'getting-started', t('快速上手', 'Getting started')),
    heading(2, 'install', t('安装', 'Installation')),
    paragraph(
      t(
        'One Chart 是独立的 npm 包，peer 依赖 ',
        'One Chart is a standalone package with peer dependency on '
      ),
      inlineCode('@geektech/tsone'),
      t('：', ':'),
    ),
    codeBlock('bash', 'bun add @geektech/tsone @geektech/one-chart'),
    heading(2, 'first-chart', t('第一个图表', 'Your first chart')),
    paragraph(
      t(
        '创建一个组件实例，传入数据并挂载到 DOM 节点。图表会渲染为一个 ',
        'Create a chart instance, pass in the data and mount it to a DOM node. The chart renders as an '
      ),
      inlineCode('<svg>'),
      t(
        ' 元素，宽高可通过 props 配置，默认自适应内容。',
        ' element; size is configurable via props and defaults to a sensible canvas.'
      )
    ),
    demo('bar', true),
    codeBlock(
      'ts',
      [
        "import { OneBarChart } from '@geektech/one-chart';",
        '',
        "const chart = new OneBarChart({",
        "  categories: ['Q1', 'Q2', 'Q3', 'Q4'],",
        '  series: [{ name: \'华东\', data: [120, 200, 150, 280] }],',
        '});',
        "chart.mount(document.querySelector('#app')!);",
      ].join('\n')
    ),
    heading(2, 'reactive', t('响应式更新', 'Reactive updates')),
    paragraph(
      t(
        '图表组件继承自 TSone 的 Component：调用 ',
        'Chart components extend TSone\'s Component: calling '
      ),
      inlineCode('setProps'),
      t(
        ' 或修改 state 后，图表的 SVG 节点会在下一次渲染中自动更新（由 TSone 响应式调度器批处理）。',
        ' or mutating state repaints the SVG nodes on the next render, batched by the TSone reactive scheduler.'
      )
    ),
    codeBlock(
      'ts',
      [
        'chart.setProps({',
        "  categories: ['Q1', 'Q2', 'Q3', 'Q4', 'Q5'],",
        "  series: [{ name: '华东', data: [1, 2, 3, 4, 5] }],",
        '});',
      ].join('\n')
    ),
    heading(2, 'animation', t('动画', 'Animation')),
    paragraph(
      t(
        '动画默认开启，基于原生 SVG SMIL 实现（无需逐帧 JS）：首次挂载时图形从起点形态生长出现，数据变更时从旧几何平滑过渡到新几何，容器尺寸（width / height）变化时 SVG 根节点同步缩放。传 ',
        'Animations are on by default and powered by native SVG SMIL (no per-frame JavaScript): shapes grow in on first mount, transition from old to new geometry on data changes, and the SVG root resizes smoothly when width / height change. Pass '
      ),
      inlineCode('animation: false'),
      t(' 完全关闭，或传入 ', ' to disable entirely, or pass '),
      inlineCode('{ duration: 800, easing: \'easeInOut\' }'),
      t(
        ' 调节时长与缓动；初始化 / 数据变更 / 容器大小变更三类动画可分别用 ',
        ' to tune duration and easing; the init / update / resize phases can be toggled individually via '
      ),
      inlineCode('init'),
      t(' / ', ' / '),
      inlineCode('update'),
      t(' / ', ' / '),
      inlineCode('resize'),
      t(
        ' 开关。系统启用「减少动态效果」时动画自动关闭。',
        '. Animations also respect the prefers-reduced-motion system setting.'
      )
    ),
    heading(2, 'common-props', t('通用属性', 'Common props')),
    paragraph(
      t(
        '所有图表共享以下基础属性：',
        'All charts share these base props:'
      )
    ),
    apiTable(t('通用属性', 'Common props'), [
      {
        name: 'width / height',
        signature: 'number',
        description: t(
          '画布尺寸（px），默认 640 × 400',
          'Canvas size in px, defaults to 640 × 400'
        ),
      },
      {
        name: 'title',
        signature: 'string',
        description: t('图表标题，显示在左上角', 'Chart title, shown at the top'),
      },
      {
        name: 'margin',
        signature: 'Partial<{ top; right; bottom; left }>',
        description: t(
          '绘图区外边距，默认 16/24/44/52',
          'Plot margins, defaults to 16/24/44/52'
        ),
      },
      {
        name: 'colors',
        signature: 'string[]',
        description: t(
          '调色板，按系列顺序取色并循环',
          'Palette, assigned per series in order and cycled'
        ),
      },
      {
        name: 'showLegend',
        signature: 'boolean',
        description: t('是否显示图例，默认 true', 'Whether to show the legend, default true'),
      },
      {
        name: 'ariaLabel',
        signature: 'string',
        description: t(
          '无障碍标签，默认取标题或图表名',
          'Accessibility label, defaults to title or chart name'
        ),
      },
      {
        name: 'tooltip',
        signature: 'boolean | { formatter }',
        description: t(
          '是否启用 tooltip，默认 true；传入对象时可自定义内容格式',
          'Whether tooltips are enabled, default true; pass an object to customize the content'
        ),
      },
      {
        name: 'animation',
        signature: 'boolean | { duration; easing; init; update; resize }',
        description: t(
          '是否启用动画，默认 true；传对象可配置时长、缓动并单独开关初始化 / 数据变更 / 容器大小变更动画',
          'Whether animations are enabled, default true; pass an object to configure duration, easing and per-phase toggles for init / update / resize'
        ),
      },
    ]),
    callout(
      'tip',
      t('SVG 与样式', 'SVG and styling'),
      [
        t(
          '图表输出为内联 SVG，字体与颜色使用 CSS 变量或 props 传入；默认字体栈与 TSone 保持一致。',
          'Charts emit inline SVG; fonts and colors come from props (CSS variables are not required). The default font stack matches TSone.'
        ),
      ]
    ),
  ],
};
