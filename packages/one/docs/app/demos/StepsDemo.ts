import { Component, type VNode } from '@geektech/tsone';
import { OneButton, OneSpace, OneSteps } from '../../../lib';
import { pick } from './locale';

interface StepsDemoState {
  current: number;
}

export class StepsDemo extends Component<
  Record<string, never>,
  StepsDemoState
> {
  private readonly advance = (): void => {
    this.setState({ current: (this.state.current + 1) % 4 });
  };

  private readonly reset = (): void => {
    this.setState({ current: 0 });
  };

  protected initState(): StepsDemoState {
    return { current: 1 };
  }

  protected initStyles(): void {}

  protected render(): VNode {
    return {
      tag: 'div',
      props: { className: 'one-docs-steps-demo' },
      children: [
        {
          component: OneSteps,
          props: {
            current: this.state.current,
            items: [
              { title: pick('填写信息', 'Fill details') },
              {
                title: pick('确认订单', 'Confirm order'),
                description: pick('核对收货地址', 'Check the address'),
              },
              { title: pick('完成支付', 'Pay') },
              { title: pick('完成', 'Done') },
            ],
          },
        },
        {
          component: OneSpace,
          props: { size: 'sm' },
          children: [
            {
              component: OneButton,
              props: { size: 'sm' },
              emitters: { click: this.advance },
              children: [pick('下一步', 'Next')],
            },
            {
              component: OneButton,
              props: { size: 'sm', variant: 'secondary' },
              emitters: { click: this.reset },
              children: [pick('重置', 'Reset')],
            },
          ],
        },
        {
          tag: 'output',
          props: { 'data-one-steps-result': '' },
          children: [pick(`当前第 ${this.state.current + 1} 步`, `Step ${this.state.current + 1}`)],
        },
      ],
    };
  }
}
