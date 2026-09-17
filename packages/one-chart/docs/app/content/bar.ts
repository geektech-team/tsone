import {
  apiTable,
  callout,
  demo,
  heading,
  inlineCode,
  list,
  paragraph,
  t,
  type OneChartDocPage,
} from './types';

export const barChartPage: OneChartDocPage = {
  path: '/charts/bar/',
  title: t('柱状图', 'Bar chart'),
  description: t(
    'OneBarChart：分类对比、横向与堆叠。',
    'OneBarChart: category comparison, horizontal and stacked modes.'
  ),
  section: 'charts',
  sectionOrder: 2,
  order: 0,
  body: [
    heading(1, 'bar-chart', 'OneBarChart'),
    heading(2, 'basic', t('基础用法', 'Basic usage')),
    paragraph(
      t(
        '传入分类与系列数据即可渲染分组柱状图，支持多系列并排对比。',
        'Pass categories and series data to render grouped bars with multi-series comparison.'
      )
    ),
    heading(2, 'tooltip', t('Tooltip', 'Tooltip')),
    paragraph(
      t(
        '鼠标悬停到柱子上显示该柱的系列名与数值（分组、堆叠、横向模式均支持），tooltip 默认开启，可传 ',
        'Hovering a bar shows its series name and value (grouped, stacked and horizontal modes all support it); tooltips are on by default. Pass '
      ),
      inlineCode('tooltip: false'),
      t(' 关闭或传入 ', ' to disable, or pass '),
      inlineCode('{ formatter }'),
      t(' 自定义内容。', ' to customize the content.'),
    ),
    demo('bar', true),
    heading(2, 'props', t('属性', 'Props')),
    apiTable(t('OneBarChart 属性', 'OneBarChart props'), [
      {
        name: 'categories',
        signature: 'string[]',
        description: t('分类名，决定 X 轴刻度数量', 'Category names, defining X axis ticks'),
      },
      {
        name: 'series',
        signature: '{ name: string; data: number[] }[]',
        description: t(
          '系列数据，每个系列长度须与分类一致',
          'Series data; each series length must match categories'
        ),
      },
      {
        name: 'horizontal',
        signature: 'boolean',
        description: t('横向布局，默认 false', 'Horizontal layout, default false'),
      },
      {
        name: 'stacked',
        signature: 'boolean',
        description: t(
          '堆叠模式，默认 false；不支持负值',
          'Stacked mode, default false; negative values rejected'
        ),
      },
      {
        name: 'showValues',
        signature: 'boolean',
        description: t(
          '在柱顶显示数值标签，默认 false',
          'Show value labels above bars, default false'
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
          '数值刻度与标签格式化',
          'Formats value ticks and labels'
        ),
      },
    ]),
    heading(2, 'stacked', t('堆叠与横向', 'Stacked and horizontal')),
    list([
      [
        t(
          '堆叠模式下数值域自动覆盖各分类的累计总和，避免柱子溢出绘图区。',
          'In stacked mode the value domain automatically covers per-category cumulative sums so bars never overflow the plot.'
        ),
      ],
      [
        t(
          '横向模式将分类放到 Y 轴，适合分类名较长的场景。',
          'Horizontal mode puts categories on the Y axis, good for long category names.'
        ),
      ],
    ]),
    callout(
      'note',
      t('数据校验', 'Data validation'),
      [
        t(
          '分类与系列长度不一致、系列缺少名称或数值非有限数时，会在渲染阶段抛出 ',
          'Mismatched category/series lengths, missing series names or non-finite values throw '
        ),
        inlineCode('OneChartDataError'),
        t('。', '.'),
      ]
    ),
  ],
};
