export type OneChartDocDemoName = 'bar' | 'line' | 'pie' | 'radar';

export interface OneChartDocDemoSource {
  language: 'ts';
  code: string;
}

export const oneChartDocDemoExamples: Record<
  OneChartDocDemoName,
  OneChartDocDemoSource
> = {
  bar: {
    language: 'ts',
    code: [
      "import { OneBarChart } from '@geektech/one-chart';",
      '',
      "const chart = new OneBarChart({",
      "  title: '季度销量',",
      "  categories: ['Q1', 'Q2', 'Q3', 'Q4'],",
      '  series: [',
      "    { name: '华东', data: [120, 200, 150, 280] },",
      "    { name: '华南', data: [80, 110, 130, 160] },",
      '  ],',
      '  showValues: true,',
      '});',
      "chart.mount(document.querySelector('#app')!);",
    ].join('\n'),
  },
  line: {
    language: 'ts',
    code: [
      "import { OneLineChart } from '@geektech/one-chart';",
      '',
      "const chart = new OneLineChart({",
      "  title: '访问趋势',",
      "  categories: ['周一', '周二', '周三', '周四', '周五'],",
      '  series: [',
      "    { name: '访问量', data: [120, 200, 150, 280, 190] },",
      '  ],',
      '  curve: \'smooth\',',
      '  fill: true,',
      '  showPoints: true,',
      '});',
      "chart.mount(document.querySelector('#app')!);",
    ].join('\n'),
  },
  pie: {
    language: 'ts',
    code: [
      "import { OnePieChart } from '@geektech/one-chart';",
      '',
      "const chart = new OnePieChart({",
      "  title: '渠道占比',",
      '  data: [',
      "    { name: '华东', value: 30 },",
      "    { name: '华南', value: 50 },",
      "    { name: '华北', value: 20 },",
      '  ],',
      '  showLabels: true,',
      "  innerRadius: 'auto',",
      '});',
      "chart.mount(document.querySelector('#app')!);",
    ].join('\n'),
  },
  radar: {
    language: 'ts',
    code: [
      "import { OneRadarChart } from '@geektech/one-chart';",
      '',
      "const chart = new OneRadarChart({",
      "  title: '能力对比',",
      "  indicators: ['速度', '力量', '技巧', '耐力', '智力'],",
      '  series: [',
      "    { name: '战士', data: [80, 60, 90, 70, 85] },",
      "    { name: '法师', data: [50, 80, 60, 95, 60] },",
      '  ],',
      '  showPoints: true,',
      '});',
      "chart.mount(document.querySelector('#app')!);",
    ].join('\n'),
  },
};
