import {
  apiTable,
  demo,
  heading,
  inlineCode,
  list,
  paragraph,
  t,
  type OneChartDocPage,
} from './types';

export const lineChartPage: OneChartDocPage = {
  path: '/charts/line/',
  title: t('折线图', 'Line chart'),
  description: t(
    'OneLineChart：趋势展示、平滑曲线与面积填充。',
    'OneLineChart: trends, smooth curves and area fill.'
  ),
  section: 'charts',
  sectionOrder: 2,
  order: 1,
  body: [
    heading(1, 'line-chart', 'OneLineChart'),
    heading(2, 'basic', t('基础用法', 'Basic usage')),
    paragraph(
      t(
        '折线图把每个分类映射到 X 轴，系列数值映射到 Y 轴，适合观察随时间或类别的变化趋势。',
        'A line chart maps categories to the X axis and series values to the Y axis, ideal for observing trends over time or across categories.'
      )
    ),
    heading(2, 'tooltip', t('Tooltip', 'Tooltip')),
    paragraph(
      t(
        '折线图为每个数据点渲染了不可见热区，悬停即可显示系列名与数值（无需开启 showPoints），tooltip 默认开启，可传 ',
        'The line chart renders invisible hit areas at every data point, so hovering shows the series and value without showPoints; tooltips are on by default. Pass '
      ),
      inlineCode('tooltip: false'),
      t(' 关闭或传入 ', ' to disable, or pass '),
      inlineCode('{ formatter }'),
      t(' 自定义内容。', ' to customize the content.'),
    ),
    demo('line', true),
    heading(2, 'props', t('属性', 'Props')),
    apiTable(t('OneLineChart 属性', 'OneLineChart props'), [
      {
        name: 'categories',
        signature: 'string[]',
        description: t('分类名，对应 X 轴刻度', 'Category names, mapped to X ticks'),
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
        name: 'curve',
        signature: "'linear' | 'smooth'",
        description: t(
          '连线方式：直线或 Catmull-Rom 平滑曲线，默认 linear',
          'Curve type: straight lines or Catmull-Rom smoothing, default linear'
        ),
      },
      {
        name: 'fill',
        signature: 'boolean',
        description: t(
          '在折线下方填充半透明面积，默认 false',
          'Fill a translucent area under the line, default false'
        ),
      },
      {
        name: 'showPoints',
        signature: 'boolean',
        description: t('在每个数据点绘制圆点，默认 false', 'Draw dots at data points, default false'),
      },
      {
        name: 'grid',
        signature: 'boolean',
        description: t('是否显示网格线，默认 true', 'Show grid lines, default true'),
      },
    ]),
    heading(2, 'smooth-fill', t('平滑与填充', 'Smoothing and fill')),
    paragraph(
      t(
        'smooth 模式基于 Catmull-Rom 样条生成三次贝塞尔曲线；fill 模式额外生成一个闭合到基线的面积路径，透明度固定为 12%。',
        'Smooth mode generates cubic beziers from a Catmull-Rom spline; fill mode adds an area path closed to the baseline with a fixed 12% opacity.'
      )
    ),
    list([
      [
        t(
          '数据点少于 3 个时，smooth 自动退化为直线。',
          'With fewer than 3 points, smooth falls back to straight lines.'
        ),
      ],
      [
        t(
          '折线与面积路径都随 props 变化响应式重绘。',
          'Both the line and area paths repaint reactively when props change.'
        ),
      ],
    ]),
    demo('line', true),
  ],
};
