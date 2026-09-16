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

export const pieChartPage: OneChartDocPage = {
  path: '/charts/pie/',
  title: t('饼图', 'Pie chart'),
  description: t(
    'OnePieChart：占比构成、环形图与百分比标签。',
    'OnePieChart: proportions, donut rings and percentage labels.'
  ),
  section: 'charts',
  sectionOrder: 2,
  order: 2,
  body: [
    heading(1, 'pie-chart', 'OnePieChart'),
    heading(2, 'basic', t('基础用法', 'Basic usage')),
    paragraph(
      t(
        '饼图按数值占比切分圆形，适合展示整体构成。单数据项会渲染为整圆。',
        'A pie chart slices the circle by value proportions, suited to showing composition. A single datum renders as a full circle.'
      )
    ),
    demo('pie', true),
    heading(2, 'props', t('属性', 'Props')),
    apiTable(t('OnePieChart 属性', 'OnePieChart props'), [
      {
        name: 'data',
        signature: '{ name: string; value: number }[]',
        description: t(
          '数据项，value 须为有限正数',
          'Data items; values must be finite and positive'
        ),
      },
      {
        name: 'innerRadius',
        signature: "number | 'auto'",
        description: t(
          '内半径：> 0 时渲染环形图，auto 取外半径的 55%',
          'Inner radius: > 0 renders a donut, auto uses 55% of the outer radius'
        ),
      },
      {
        name: 'showLabels',
        signature: 'boolean',
        description: t(
          '在扇区外侧显示百分比标签，默认 false',
          'Show percentage labels outside sectors, default false'
        ),
      },
      {
        name: 'labelFormat',
        signature: '(value, total, percent) => string',
        description: t('自定义标签文本', 'Custom label text'),
      },
      {
        name: 'startAngle / endAngle',
        signature: 'number（度）',
        description: t(
          '起止角度，默认 -90 到 270（12 点钟方向起绕满一周）',
          'Start/end angles in degrees, default -90 to 270 (clockwise from 12 o\'clock)'
        ),
      },
      {
        name: 'padAngle',
        signature: 'number（度）',
        description: t('扇区间隙，默认 1°', 'Gap between sectors, default 1°'),
      },
    ]),
    heading(2, 'donut', t('环形图与标签', 'Donut and labels')),
    paragraph(
      t(
        '设置 innerRadius 为 \'auto\' 或任意正值即可得到环形图；标签默认显示百分比，可用 labelFormat 输出数值与占比的组合。',
        'Set innerRadius to \'auto\' or any positive number for a donut; labels show percentages by default and can be customized via labelFormat.'
      )
    ),
    list([
      [
        t(
          '扇区角度 = value / 总和 × 总弧度，比例精确。',
          'Sector angle equals value / total × full sweep, so proportions are exact.'
        ),
      ],
      [
        t(
          '默认带 1° 扇区间隙；铺满整圈时自动使用两段半圆弧路径。',
          'A 1° pad angle separates sectors; a full-circle item uses two semicircle arcs.'
        ),
      ],
    ]),
    callout(
      'note',
      t('数据校验', 'Data validation'),
      [
        t(
          '空数据、零值、负值或结束角度不大于起始角度都会抛出 ',
          'Empty data, zero/negative values, or an end angle not greater than the start angle throw '
        ),
        inlineCode('OneChartDataError'),
        t('。', '.'),
      ]
    ),
  ],
};
