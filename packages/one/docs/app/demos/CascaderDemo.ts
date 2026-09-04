import { Component, type VNode } from '@geektech/tsone';
import {
  OneCascader,
  type OneCascaderOption,
  type OneFieldValueEvent,
} from '../../../lib';
import { pick } from './locale';

const REGIONS: readonly OneCascaderOption[] = [
  {
    value: 'zhejiang',
    label: '浙江',
    children: [
      {
        value: 'hangzhou',
        label: '杭州',
        children: [
          { value: 'xihu', label: '西湖区' },
          { value: 'yuhang', label: '余杭区' },
        ],
      },
      { value: 'ningbo', label: '宁波' },
    ],
  },
  {
    value: 'jiangsu',
    label: '江苏',
    children: [{ value: 'nanjing', label: '南京' }],
  },
];

interface CascaderDemoState {
  region: string[];
}

export class CascaderDemo extends Component<
  Record<string, never>,
  CascaderDemoState
> {
  protected initState(): CascaderDemoState {
    return { region: [] };
  }

  protected initStyles(): void {}

  protected render(): VNode {
    return {
      tag: 'div',
      props: { className: 'one-docs-cascader-demo' },
      children: [
        {
          component: OneCascader,
          props: {
            options: REGIONS,
            placeholder: pick('请选择地区', 'Select a region'),
            value: this.state.region,
          },
          emitters: {
            change: (payload: unknown) => {
              const event = payload as OneFieldValueEvent<string[]>;
              this.setState({ region: event.value });
            },
          },
        },
        {
          tag: 'output',
          props: { 'data-one-cascader-result': '' },
          children: [
            this.state.region.length > 0
              ? pick(`已选择：${this.state.region.join(' / ')}`, `Selected: ${this.state.region.join(' / ')}`)
              : pick('尚未选择', 'Nothing selected'),
          ],
        },
        {
          component: OneCascader,
          props: {
            options: REGIONS,
            changeOnSelect: true,
            placeholder: pick('选择任意层级（changeOnSelect）', 'Select any level (changeOnSelect)'),
          },
        },
      ],
    };
  }
}
