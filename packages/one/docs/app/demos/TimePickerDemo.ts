import { Component, type VNode } from '@geektech/tsone';
import { OneTimePicker, type OneTimePickerValueEvent } from '../../../lib';
import { pick } from './locale';

interface TimePickerDemoState {
  startTime: string;
}

export class TimePickerDemo extends Component<
  Record<string, never>,
  TimePickerDemoState
> {
  private readonly handleInput = (payload: unknown): void => {
    const event = payload as OneTimePickerValueEvent;
    this.setState({ startTime: event.value });
  };

  protected initState(): TimePickerDemoState {
    return { startTime: '09:30' };
  }

  protected initStyles(): void {}

  protected render(): VNode {
    return {
      tag: 'div',
      props: { className: 'one-docs-time-picker-demo' },
      children: [
        {
          component: OneTimePicker,
          props: {
            value: this.state.startTime,
            ariaLabel: pick('开始时间', 'Start time'),
          },
          emitters: { input: this.handleInput },
        },
        {
          tag: 'output',
          props: { 'data-one-time-picker-result': '' },
          children: [
            pick(
              `开始时间：${this.state.startTime}`,
              `Start time: ${this.state.startTime}`
            ),
          ],
        },
      ],
    };
  }
}
