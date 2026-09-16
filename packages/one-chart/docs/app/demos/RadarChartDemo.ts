import { Component, type VNode } from '@geektech/tsone';
import { OneRadarChart } from '../../../lib';
import { pick } from './locale';

interface RadarChartDemoState {
  points: boolean;
}

const INDICATORS = ['速度', '力量', '技巧', '耐力', '智力'];
const SERIES = [
  { name: '战士', data: [80, 60, 90, 70, 85] },
  { name: '法师', data: [50, 80, 60, 95, 60] },
];

export class RadarChartDemo extends Component<
  Record<string, never>,
  RadarChartDemoState
> {
  private readonly handleToggle = (): void => {
    this.setState({ points: !this.state.points });
  };

  protected initState(): RadarChartDemoState {
    return { points: true };
  }

  protected initStyles(): void {}

  protected render(): VNode {
    return {
      tag: 'div',
      props: { className: 'one-chart-docs-demo' },
      children: [
        {
          component: OneRadarChart,
          props: {
            title: pick('能力对比', 'Ability comparison'),
            indicators: INDICATORS,
            series: SERIES,
            showPoints: this.state.points,
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
              this.state.points ? '隐藏数据点' : '显示数据点',
              this.state.points ? 'Hide data points' : 'Show data points'
            ),
          ],
        },
      ],
    };
  }
}
