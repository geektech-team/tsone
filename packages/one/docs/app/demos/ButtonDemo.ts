import { Component, type VNode } from '@geektech/tsone';
import { OneButton } from '../../../lib';

interface ButtonDemoState {
  clickCount: number;
}

export class ButtonDemo extends Component<
  Record<string, never>,
  ButtonDemoState
> {
  private readonly handleClick = (): void => {
    this.setState({ clickCount: this.state.clickCount + 1 });
  };

  protected initState(): ButtonDemoState {
    return { clickCount: 0 };
  }

  protected initStyles(): void {}

  protected render(): VNode {
    return {
      tag: 'div',
      props: { className: 'one-docs-button-demo' },
      children: [
        {
          component: OneButton,
          props: { variant: 'primary' },
          emitters: { click: this.handleClick },
          children: ['Primary'],
        },
        {
          component: OneButton,
          props: { variant: 'secondary' },
          children: ['Secondary'],
        },
        {
          component: OneButton,
          props: { variant: 'danger' },
          children: ['Danger'],
        },
        {
          tag: 'span',
          props: { 'data-one-click-count': '' },
          children: [`点击次数：${this.state.clickCount}`],
        },
      ],
    };
  }
}
