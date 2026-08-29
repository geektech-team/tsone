import { Component, type VNode } from '@geektech/tsone';
import { OneInput, type OneInputValueEvent } from '../../../lib';

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
    return { controlledValue: '初始受控值' };
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
            defaultValue: '非受控值',
            ariaLabel: '非受控输入',
          },
        },
        {
          component: OneInput,
          props: {
            value: this.state.controlledValue,
            ariaLabel: '受控输入',
          },
          emitters: {
            input: this.handleInput,
          },
        },
        {
          tag: 'span',
          props: { 'data-one-controlled-value': '' },
          children: [`受控值：${this.state.controlledValue}`],
        },
      ],
    };
  }
}
