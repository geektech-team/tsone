import { Component, type VNode } from '@geektech/tsone';
import { OneBarChart } from '../../../lib';
import { pick } from './locale';

interface BarChartDemoState {
  mode: 0 | 1 | 2;
}

interface BarDemoMode {
  titleZh: string;
  titleEn: string;
  nextZh: string;
  nextEn: string;
  stacked?: boolean;
  horizontal?: boolean;
}

/** 分组 → 堆叠 → 横向 循环切换。 */
const MODES: BarDemoMode[] = [
  {
    titleZh: '季度销量（分组）',
    titleEn: 'Quarterly sales (grouped)',
    nextZh: '切换到堆叠',
    nextEn: 'Switch to stacked',
  },
  {
    titleZh: '季度销量（堆叠）',
    titleEn: 'Quarterly sales (stacked)',
    nextZh: '切换到横向',
    nextEn: 'Switch to horizontal',
    stacked: true,
  },
  {
    titleZh: '季度销量（横向）',
    titleEn: 'Quarterly sales (horizontal)',
    nextZh: '切换到分组',
    nextEn: 'Switch to grouped',
    horizontal: true,
  },
];

const CATEGORIES = ['Q1', 'Q2', 'Q3', 'Q4'];
const SERIES = [
  { name: '华东', data: [120, 200, 150, 280] },
  { name: '华南', data: [80, 110, 130, 160] },
];

export class BarChartDemo extends Component<
  Record<string, never>,
  BarChartDemoState
> {
  private readonly handleToggle = (): void => {
    this.setState({ mode: ((this.state.mode + 1) % 3) as 0 | 1 | 2 });
  };

  protected initState(): BarChartDemoState {
    return { mode: 0 };
  }

  protected initStyles(): void {}

  protected render(): VNode {
    const mode = MODES[this.state.mode];
    if (!mode) {
      return { tag: 'div', children: [] };
    }

    return {
      tag: 'div',
      props: { className: 'one-chart-docs-demo' },
      children: [
        {
          component: OneBarChart,
          props: {
            title: pick(mode.titleZh, mode.titleEn),
            categories: CATEGORIES,
            series: SERIES,
            stacked: mode.stacked === true,
            horizontal: mode.horizontal === true,
            showValues: true,
          },
        },
        {
          tag: 'button',
          props: {
            type: 'button',
            className: 'one-chart-docs-demo-action',
          },
          listeners: { click: this.handleToggle },
          children: [pick(mode.nextZh, mode.nextEn)],
        },
      ],
    };
  }
}
