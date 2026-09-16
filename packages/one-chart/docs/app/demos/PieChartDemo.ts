import { Component, type VNode } from '@geektech/tsone';
import { OnePieChart } from '../../../lib';
import { pick } from './locale';

interface PieChartDemoState {
  donut: boolean;
}

const DATA = [
  { name: '华东', value: 30 },
  { name: '华南', value: 50 },
  { name: '华北', value: 20 },
];

export class PieChartDemo extends Component<
  Record<string, never>,
  PieChartDemoState
> {
  private readonly handleToggle = (): void => {
    this.setState({ donut: !this.state.donut });
  };

  protected initState(): PieChartDemoState {
    return { donut: false };
  }

  protected initStyles(): void {}

  protected render(): VNode {
    return {
      tag: 'div',
      props: { className: 'one-chart-docs-demo' },
      children: [
        {
          component: OnePieChart,
          props: {
            title: pick('渠道占比', 'Channel share'),
            data: DATA,
            showLabels: true,
            innerRadius: this.state.donut ? 'auto' : 0,
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
              `切换为${this.state.donut ? '实心饼图' : '环形图'}`,
              this.state.donut ? 'Switch to solid pie' : 'Switch to donut'
            ),
          ],
        },
      ],
    };
  }
}
