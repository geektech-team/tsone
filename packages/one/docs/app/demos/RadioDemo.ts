import { Component, type VNode } from '@geektech/tsone';
import {
  OneRadio,
  OneRadioGroup,
  type OneFieldValueEvent,
  type OneSelectOption,
} from '../../../lib';
import { pick } from './locale';

interface RadioDemoState {
  frequency: string;
}

export class RadioDemo extends Component<Record<string, never>, RadioDemoState> {
  private readonly handleFrequency = (payload: unknown): void => {
    const event = payload as OneFieldValueEvent<string>;
    this.setState({ frequency: event.value });
  };

  protected initState(): RadioDemoState {
    return { frequency: 'weekly' };
  }

  protected initStyles(): void {}

  protected render(): VNode {
    return {
      tag: 'div',
      props: { className: 'one-docs-radio-demo' },
      children: [
        {
          component: OneRadio,
          props: {
            value: 'design',
            defaultChecked: true,
            ariaLabel: pick('设计', 'Design'),
          },
          children: [pick('设计', 'Design')],
        },
        {
          component: OneRadioGroup,
          props: {
            options: this.frequencyOptions(),
            value: this.state.frequency,
            ariaLabel: pick('通知频率', 'Notification frequency'),
          },
          emitters: { change: this.handleFrequency },
        },
        {
          tag: 'output',
          props: { 'data-one-radio-result': '' },
          children: [
            pick(
              `已选择：${this.state.frequency}`,
              `Selected: ${this.state.frequency}`
            ),
          ],
        },
      ],
    };
  }

  private frequencyOptions(): readonly OneSelectOption[] {
    return [
      { value: 'daily', label: pick('每天', 'Daily') },
      { value: 'weekly', label: pick('每周', 'Weekly') },
      {
        value: 'monthly',
        label: pick('每月', 'Monthly'),
        disabled: true,
      },
    ];
  }
}
