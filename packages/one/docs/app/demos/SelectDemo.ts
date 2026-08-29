import { Component, type VNode } from '@geektech/tsone';
import { OneSelect, type OneFieldValueEvent } from '../../../lib';

interface SelectDemoState {
  value: string[];
}

const options = [
  { value: 'beijing', label: '北京' },
  { value: 'shanghai', label: '上海' },
  {
    label: '海外',
    options: [
      { value: 'tokyo', label: '东京' },
      { value: 'disabled', label: '暂不可选', disabled: true },
    ],
  },
] as const;

export class SelectDemo extends Component<
  Record<string, never>,
  SelectDemoState
> {
  private readonly handleChange = (payload: unknown): void => {
    const event = payload as OneFieldValueEvent<string[]>;
    this.setState({ value: event.value });
  };

  protected initState(): SelectDemoState {
    return { value: [] };
  }

  protected initStyles(): void {}

  protected render(): VNode {
    return {
      tag: 'div',
      props: { className: 'one-docs-select-demo' },
      children: [
        {
          component: OneSelect,
          props: {
            options,
            value: this.state.value,
            multiple: true,
            searchable: true,
            ariaLabel: '选择城市',
            placeholder: '搜索并选择城市',
          },
          emitters: { change: this.handleChange },
        },
        {
          tag: 'output',
          props: { 'data-one-select-value': '' },
          children: [this.state.value.join(', ') || '尚未选择'],
        },
      ],
    };
  }
}
