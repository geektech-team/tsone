import { Component, type VNode } from '@geektech/tsone';
import { OneScatterChart } from '../../../lib';
import { pick } from './locale';

const SERIES = [
  {
    name: 'A 组',
    data: [
      [1, 2],
      [2, 4],
      [3, 6],
      [4, 5],
      [5, 8],
      [6, 7],
      [7, 10],
      [8, 9],
    ] as Array<readonly [number, number]>,
  },
  {
    name: 'B 组',
    data: [
      [1, 5],
      [2, 3],
      [3, 4],
      [4, 7],
      [5, 6],
      [6, 9],
      [7, 8],
      [8, 11],
    ] as Array<readonly [number, number]>,
  },
];

export class ScatterChartDemo extends Component<
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
          component: OneScatterChart,
          props: {
            title: pick('身高与体重', 'Height vs weight'),
            series: SERIES,
          },
        },
      ],
    };
  }
}
