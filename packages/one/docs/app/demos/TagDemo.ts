import { Component, type VNode } from '@geektech/tsone';
import { OneTag } from '../../../lib';

interface TagDemoState {
  closedCount: number;
}

export class TagDemo extends Component<Record<string, never>, TagDemoState> {
  private readonly handleClose = (): void => {
    this.setState({ closedCount: this.state.closedCount + 1 });
  };

  protected initState(): TagDemoState {
    return { closedCount: 0 };
  }

  protected initStyles(): void {}

  protected render(): VNode {
    return {
      tag: 'div',
      props: { className: 'one-docs-tag-demo' },
      children: [
        {
          component: OneTag,
          props: { variant: 'success', closable: true },
          emitters: { close: this.handleClose },
          children: ['已发布'],
        },
        {
          component: OneTag,
          props: { variant: 'warning' },
          children: ['待检查'],
        },
        {
          component: OneTag,
          props: { variant: 'error' },
          children: ['已阻塞'],
        },
        {
          tag: 'output',
          props: { 'data-one-tag-result': '' },
          children: [`已关闭 ${this.state.closedCount} 个标签`],
        },
      ],
    };
  }
}
