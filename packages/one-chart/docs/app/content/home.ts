import {
  codeBlock,
  heading,
  link,
  list,
  paragraph,
  t,
  type OneChartDocPage,
} from './types';

export const homePage: OneChartDocPage = {
  path: '/',
  title: t('TSone 的轻量 SVG 图表库', 'A lightweight SVG chart library for TSone'),
  description: t(
    'One Chart 为 TSone 类组件应用提供纯 SVG 渲染、零外部依赖的常用图表。',
    'One Chart provides common charts rendered purely as SVG with zero external dependencies for TSone class-component applications.'
  ),
  section: 'start',
  sectionOrder: 0,
  order: 0,
  body: [
    heading(1, 'one-chart', 'One Chart'),
    paragraph(
      t(
        'One Chart 是面向 TSone 类组件应用的轻量级图表库，第一版提供柱状图、折线图、饼图与雷达图。所有图表仅以 SVG 渲染，浏览器运行时零外部依赖，样式与交互通过真实 TypeScript API 配置，并天然支持响应式数据更新。',
        'One Chart is a lightweight chart library for TSone class-component applications. The first release ships bar, line, pie and radar charts. Every chart renders purely as SVG with zero external dependencies in the browser runtime; styling and interactions are configured through a real TypeScript API with reactive data updates out of the box.'
      )
    ),
    heading(2, 'install', t('安装', 'Installation')),
    codeBlock('bash', 'bun add @geektech/tsone @geektech/one-chart'),
    heading(2, 'charts', t('图表', 'Charts')),
    paragraph(
      link('OneBarChart', '/charts/bar/'),
      t(' 展示分类数值的对比，', ' compares category values, '),
      link('OneLineChart', '/charts/line/'),
      t(' 展示数值随分类的趋势，', ' shows trends across categories, '),
      link('OnePieChart', '/charts/pie/'),
      t(' 展示占比构成，', ' shows proportional composition, '),
      link('OneRadarChart', '/charts/radar/'),
      t(' 展示多维度能力对比。', ' compares multi-dimensional capabilities.')
    ),
    heading(2, 'features', t('特性', 'Features')),
    list([
      [
        t(
          '纯 SVG 渲染：无 Canvas、无第三方渲染依赖',
          'Pure SVG rendering: no Canvas, no third-party rendering dependency'
        ),
      ],
      [
        t(
          '面向对象 API：继承 Component，支持生命周期与响应式更新',
          'Object-oriented API: extends Component with lifecycle and reactive updates'
        ),
      ],
      [
        t(
          '基础组件：标题、图例、坐标轴、网格与数值标签开箱即用',
          'Base features: title, legend, axes, grid and value labels out of the box'
        ),
      ],
    ]),
  ],
};
