import { Component, type VNode } from '@geektech/tsone';
import {
  OneSelect,
  type OneFieldValueEvent,
  type OneSelectOption,
  type OneSelectOptionGroup,
} from '../../../lib';
import { pick } from './locale';

interface SelectDemoState {
  value: string[];
}

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
            options: this.options(),
            value: this.state.value,
            multiple: true,
            searchable: true,
            ariaLabel: pick('选择城市', 'Select a city'),
            placeholder: pick('搜索并选择城市', 'Search and select cities'),
          },
          emitters: { change: this.handleChange },
        },
        {
          tag: 'output',
          props: { 'data-one-select-value': '' },
          children: [
            this.state.value.join(', ') || pick('尚未选择', 'Not selected'),
          ],
        },
      ],
    };
  }

  private options(): readonly (OneSelectOption | OneSelectOptionGroup)[] {
    return [
      { value: 'beijing', label: pick('北京', 'Beijing') },
      { value: 'shanghai', label: pick('上海', 'Shanghai') },
      {
        label: pick('海外', 'Overseas'),
        options: [
          { value: 'tokyo', label: pick('东京', 'Tokyo') },
          {
            value: 'disabled',
            label: pick('暂不可选', 'Unavailable'),
            disabled: true,
          },
        ],
      },
    ];
  }
}
