import {
  apiTable,
  callout,
  demo,
  heading,
  inlineCode,
  paragraph,
  t,
  type OneChartDocPage,
} from './types';

export const funnelChartPage: OneChartDocPage = {
  path: '/charts/funnel/',
  title: t('漏斗图', 'Funnel chart'),
  description: t(
    'OneFunnelChart：梯形漏斗、逐级转化率与数值标签。',
    'OneFunnelChart: trapezoid funnel with per-level conversion and value labels.'
  ),
  section: 'charts',
  sectionOrder: 2,
  order: 5,
  body: [
    heading(1, 'funnel-chart', 'OneFunnelChart'),
    heading(2, 'basic', t('基础用法', 'Basic usage')),
    paragraph(
      t(
        '传入逐级数据（通常由大到小）即可渲染漏斗：每级为梯形，上底宽按该级数值比例计算，下一级上底即本级下底，最后一级收拢为三角形。',
        'Pass level data (usually descending) to render a funnel: every level is a trapezoid whose top width is proportional to its value; the next top reuses the current bottom, and the last level converges to a triangle.'
      )
    ),
    demo('funnel', true),
    heading(2, 'props', t('属性', 'Props')),
    apiTable(t('OneFunnelChart 属性', 'OneFunnelChart props'), [
      {
        name: 'data',
        signature: '{ name: string; value: number }[]',
        description: t(
          '漏斗数据项，按展示顺序逐级排列',
          'Funnel data items, ordered by display level'
        ),
      },
      {
        name: 'showValues',
        signature: 'boolean',
        description: t(
          '在梯形右侧显示数值，默认 false',
          'Show values to the right of each trapezoid, default false'
        ),
      },
      {
        name: 'showPercent',
        signature: 'boolean',
        description: t(
          '显示相对首级的百分比（首级 100%），默认 false',
          'Show percentage relative to the first level (100% for the first), default false'
        ),
      },
      {
        name: 'gap',
        signature: 'number',
        description: t('相邻两级间距（px），默认 2', 'Gap between levels in px, default 2'),
      },
      {
        name: 'valueFormat',
        signature: '(value: number) => string',
        description: t(
          '数值标签与 tooltip 的格式化',
          'Formats value labels and tooltip values'
        ),
      },
    ]),
    heading(2, 'labels', t('标签', 'Labels')),
    paragraph(
      t(
        '名称显示在宽级内部居中（过窄的级别自动隐藏）；数值与百分比标签并排显示在梯形右侧。',
        'Names render centered inside wide levels (narrow levels hide them automatically); value and percentage labels sit side by side on the right.'
      )
    ),
    heading(2, 'tooltip', t('Tooltip', 'Tooltip')),
    paragraph(
      t(
        '悬停梯形显示级别名称、数值与相对首级的转化率，tooltip 默认开启，可传 ',
        'Hovering a trapezoid shows its name, value and conversion relative to the first level; tooltips are on by default. Pass '
      ),
      inlineCode('tooltip: false'),
      t(' 关闭或传入 ', ' to disable, or pass '),
      inlineCode('{ formatter }'),
      t(' 自定义内容。', ' to customize the content.'),
    ),
    callout(
      'note',
      t('数据校验', 'Data validation'),
      [
        t(
          '空数据、零值或负值会在渲染阶段抛出 ',
          'Empty data, zero or negative values throw '
        ),
        inlineCode('OneChartDataError'),
        t('。', ' at render time.'),
      ]
    ),
    demo('funnel', true),
  ],
};
