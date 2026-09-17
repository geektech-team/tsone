import { Component, type VNode } from '@geektech/tsone';
import { OneFunnelChart } from '../../../lib';
import { pick } from './locale';

const DATA = [
  { name: '曝光', value: 1000 },
  { name: '点击', value: 420 },
  { name: '注册', value: 190 },
  { name: '转化', value: 72 },
];

export class FunnelChartDemo extends Component<
  Record<string, never>,
  Record<string, never>
> {
  protected initState(): Record<string, never> {
    return {};
  }

  protected initStyles(): void {}

  protected render(): VNode {
    return {
      tag: 'div',
      props: { className: 'one-chart-docs-demo' },
      children: [
        {
          component: OneFunnelChart,
          props: {
            title: pick('转化漏斗', 'Conversion funnel'),
            data: DATA,
            showValues: true,
            showPercent: true,
          },
        },
      ],
    };
  }
}
