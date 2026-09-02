import { Component, type VNode } from '@geektech/tsone';
import { OneInput, type OneInputValueEvent } from '../../../lib';
import { pick } from './locale';

interface InputDemoState {
  controlledValue: string;
}

export class InputDemo extends Component<
  Record<string, never>,
  InputDemoState
> {
  private readonly handleInput = (payload: unknown): void => {
    const event = payload as OneInputValueEvent;
    this.setState({ controlledValue: event.value });
  };

  protected initState(): InputDemoState {
    return { controlledValue: pick('初始受控值', 'Initial controlled value') };
  }

  protected initStyles(): void {}

  protected render(): VNode {
    return {
      tag: 'div',
      props: { className: 'one-docs-input-demo' },
      children: [
        {
          component: OneInput,
          props: {
            defaultValue: pick('非受控值', 'Uncontrolled value'),
            ariaLabel: pick('非受控输入', 'Uncontrolled input'),
          },
        },
        {
          component: OneInput,
          props: {
            value: this.state.controlledValue,
            ariaLabel: pick('受控输入', 'Controlled input'),
          },
          emitters: {
            input: this.handleInput,
          },
        },
        {
          tag: 'span',
          props: { 'data-one-controlled-value': '' },
          children: [
            pick(
              `受控值：${this.state.controlledValue}`,
              `Controlled value: ${this.state.controlledValue}`
            ),
          ],
        },
      ],
    };
  }
}
