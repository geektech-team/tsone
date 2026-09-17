import {
  apiTable,
  demo,
  heading,
  inlineCode,
  paragraph,
  t,
  type OneChartDocPage,
} from './types';

export const radarChartPage: OneChartDocPage = {
  path: '/charts/radar/',
  title: t('雷达图', 'Radar chart'),
  description: t(
    'OneRadarChart：多维指标对比与网格环。',
    'OneRadarChart: multi-dimensional comparison with grid rings.'
  ),
  section: 'charts',
  sectionOrder: 2,
  order: 3,
  body: [
    heading(1, 'radar-chart', 'OneRadarChart'),
    heading(2, 'basic', t('基础用法', 'Basic usage')),
    paragraph(
      t(
        '雷达图把每个指标映射到等角度的辐条上，系列数值映射为半径，适合做多维能力对比。',
        'A radar chart maps each indicator to an equally spaced spoke and series values to radii, ideal for multi-dimensional comparison.'
      )
    ),
    heading(2, 'tooltip', t('Tooltip', 'Tooltip')),
    paragraph(
      t(
        '雷达图为每个系列与指标的交点渲染热区，悬停显示指标名、系列名与数值，tooltip 默认开启，可传 ',
        'The radar chart adds hit areas at every series-by-indicator vertex, showing indicator, series and value on hover; tooltips are on by default. Pass '
      ),
      inlineCode('tooltip: false'),
      t(' 关闭或传入 ', ' to disable, or pass '),
      inlineCode('{ formatter }'),
      t(' 自定义内容。', ' to customize the content.'),
    ),
    demo('radar', true),
    heading(2, 'props', t('属性', 'Props')),
    apiTable(t('OneRadarChart 属性', 'OneRadarChart props'), [
      {
        name: 'indicators',
        signature: 'string[]',
        description: t('指标（坐标轴）名称', 'Indicator (axis) names'),
      },
      {
        name: 'series',
        signature: '{ name: string; data: number[] }[]',
        description: t(
          '系列数据，每个系列长度须与指标一致',
          'Series data; each series length must match indicators'
        ),
      },
      {
        name: 'levels',
        signature: 'number',
        description: t('网格环层数，默认 5', 'Grid ring count, default 5'),
      },
      {
        name: 'max',
        signature: 'number',
        description: t(
          '数值域上限，默认按数据自动取整；超过上限的数值会被夹取',
          'Domain max, defaulting to a nice ceiling of the data; larger values clamp'
        ),
      },
      {
        name: 'showPoints',
        signature: 'boolean',
        description: t('在每个数据点绘制圆点，默认 false', 'Draw dots at data points, default false'),
      },
      {
        name: 'fill',
        signature: 'boolean',
        description: t('是否填充多边形，默认 true', 'Fill the polygons, default true'),
      },
    ]),
    heading(2, 'geometry', t('几何与布局', 'Geometry and layout')),
    paragraph(
      t(
        '网格环为同心正多边形，辐条从圆心指向各指标；数据点通过线性比例尺从 ',
        'Grid rings are concentric regular polygons and spokes point from the center to each indicator; data points map linearly from '
      ),
      inlineCode('[0, max]'),
      t(
        ' 到半径。指标标签按所在辐条的角度自动选择锚点，避免越界。',
        ' to the radius. Indicator labels pick their anchor by spoke angle to stay inside the canvas.'
      )
    ),
    demo('radar', true),
  ],
};
