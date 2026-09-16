import { Component, type VNode } from '@geektech/tsone';
import { OneLineChart } from '../../../lib';
import { pick } from './locale';

interface LineChartDemoState {
  smooth: boolean;
}

const CATEGORIES = ['周一', '周二', '周三', '周四', '周五'];
const SERIES = [
  { name: '访问量', data: [120, 200, 150, 280, 190] },
  { name: '转化率', data: [30, 45, 40, 60, 55] },
];

export class LineChartDemo extends Component<
  Record<string, never>,
  LineChartDemoState
> {
  private readonly handleToggle = (): void => {
    this.setState({ smooth: !this.state.smooth });
  };

  protected initState(): LineChartDemoState {
    return { smooth: false };
  }

  protected initStyles(): void {}

  protected render(): VNode {
    return {
      tag: 'div',
      props: { className: 'one-chart-docs-demo' },
      children: [
        {
          component: OneLineChart,
          props: {
            title: pick('访问趋势', 'Traffic trend'),
            categories: CATEGORIES,
            series: SERIES,
            curve: this.state.smooth ? 'smooth' : 'linear',
            fill: true,
            showPoints: true,
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
              `切换为${this.state.smooth ? '直线' : '平滑曲线'}`,
              this.state.smooth ? 'Switch to linear' : 'Switch to smooth'
            ),
          ],
        },
      ],
    };
  }
}
