import { Component, type VNode } from '@geektech/tsone';
import { OneBarChart } from '../../../lib';
import { pick } from './locale';

interface BarChartDemoState {
  dataset: 0 | 1;
}

interface BarDemoDataset {
  titleZh: string;
  titleEn: string;
  stacked?: boolean;
}

const DATASETS: BarDemoDataset[] = [
  { titleZh: '季度销量（分组）', titleEn: 'Quarterly sales (grouped)' },
  { titleZh: '季度销量（堆叠）', titleEn: 'Quarterly sales (stacked)', stacked: true },
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
    this.setState({ dataset: this.state.dataset === 0 ? 1 : 0 });
  };

  protected initState(): BarChartDemoState {
    return { dataset: 0 };
  }

  protected initStyles(): void {}

  protected render(): VNode {
    const dataset = DATASETS[this.state.dataset];
    if (!dataset) {
      return { tag: 'div', children: [] };
    }

    return {
      tag: 'div',
      props: { className: 'one-chart-docs-demo' },
      children: [
        {
          component: OneBarChart,
          props: {
            title: pick(dataset.titleZh, dataset.titleEn),
            categories: CATEGORIES,
            series: SERIES,
            stacked: dataset.stacked === true,
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
          children: [
            pick(
              `切换到${dataset.stacked ? '分组' : '堆叠'}`,
              dataset.stacked ? 'Switch to grouped' : 'Switch to stacked'
            ),
          ],
        },
      ],
    };
  }
}
