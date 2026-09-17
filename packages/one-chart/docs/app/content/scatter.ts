import {
  apiTable,
  demo,
  heading,
  inlineCode,
  paragraph,
  t,
  type OneChartDocPage,
} from './types';

export const scatterChartPage: OneChartDocPage = {
  path: '/charts/scatter/',
  title: t('散点图', 'Scatter chart'),
  description: t(
    'OneScatterChart：双数值轴散点与多系列叠加。',
    'OneScatterChart: scatter plots on two numeric axes with multi-series overlay.'
  ),
  section: 'charts',
  sectionOrder: 2,
  order: 4,
  body: [
    heading(1, 'scatter-chart', 'OneScatterChart'),
    heading(2, 'basic', t('基础用法', 'Basic usage')),
    paragraph(
      t(
        '传入系列数据（每个点为 [x, y] 数值对）即可渲染散点图，x/y 轴均为线性比例尺。',
        'Pass series data (each point is an [x, y] pair) to render a scatter plot on two linear axes.'
      )
    ),
    demo('scatter', true),
    heading(2, 'props', t('属性', 'Props')),
    apiTable(t('OneScatterChart 属性', 'OneScatterChart props'), [
      {
        name: 'series',
        signature: '{ name: string; data: [number, number][] }[]',
        description: t(
          '系列数据，每个点为 x/y 数值对',
          'Series data; each point is an x/y numeric pair'
        ),
      },
      {
        name: 'grid',
        signature: 'boolean',
        description: t('是否显示网格线，默认 true', 'Show grid lines, default true'),
      },
      {
        name: 'valueFormat',
        signature: '(value: number) => string',
        description: t(
          '数值刻度与 tooltip 的格式化',
          'Formats numeric ticks and tooltip values'
        ),
      },
      {
        name: 'pointRadius',
        signature: 'number',
        description: t('数据点半径（px），默认 4', 'Data point radius in px, default 4'),
      },
    ]),
    heading(2, 'axes', t('坐标与数值域', 'Axes and domains')),
    paragraph(
      t(
        'x/y 数值域按数据范围取整齐边界，不强制包含 0；网格线沿两侧刻度生成，与柱状图/折线图共用配色常量。',
        'Both domains expand the data range to nice bounds without forcing zero; grid lines follow the ticks on both axes and share the common color constants.'
      )
    ),
    heading(2, 'tooltip', t('Tooltip', 'Tooltip')),
    paragraph(
      t(
        '悬停数据点显示系列名与坐标（x/y 数值），tooltip 默认开启，可传 ',
        'Hovering a point shows its series and coordinates; tooltips are on by default. Pass '
      ),
      inlineCode('tooltip: false'),
      t(' 关闭或传入 ', ' to disable, or pass '),
      inlineCode('{ formatter }'),
      t(' 自定义内容。', ' to customize the content.'),
    ),
    demo('scatter', true),
  ],
};
