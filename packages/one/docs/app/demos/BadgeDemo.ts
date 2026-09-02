import { Component, type VNode } from '@geektech/tsone';
import { OneBadge, OneButton } from '../../../lib';
import { pick } from './locale';

interface BadgeDemoState {
  count: number;
}

export class BadgeDemo extends Component<
  Record<string, never>,
  BadgeDemoState
> {
  private readonly increment = (): void => {
    this.setState({ count: this.state.count + 1 });
  };

  protected initState(): BadgeDemoState {
    return { count: 99 };
  }

  protected initStyles(): void {}

  protected render(): VNode {
    return {
      tag: 'div',
      props: { className: 'one-docs-badge-demo' },
      children: [
        {
          component: OneBadge,
          props: { value: this.state.count, max: 99, variant: 'error' },
          children: [
            {
              tag: 'span',
              children: [pick('待办事项', 'To-do items')],
            },
          ],
        },
        {
          component: OneButton,
          props: { size: 'sm', variant: 'secondary' },
          emitters: { click: this.increment },
          children: [pick('增加数量', 'Increase count')],
        },
        {
          tag: 'output',
          props: { 'data-one-badge-result': '' },
          children: [
            pick(
              `当前数量：${this.state.count}`,
              `Current count: ${this.state.count}`
            ),
          ],
        },
      ],
    };
  }
}
