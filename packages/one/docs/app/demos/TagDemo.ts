import { Component, type VNode } from '@geektech/tsone';
import { OneTag } from '../../../lib';
import { pick } from './locale';

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
          children: [pick('已发布', 'Published')],
        },
        {
          component: OneTag,
          props: { variant: 'warning' },
          children: [pick('待检查', 'Needs review')],
        },
        {
          component: OneTag,
          props: { variant: 'error' },
          children: [pick('已阻塞', 'Blocked')],
        },
        {
          tag: 'output',
          props: { 'data-one-tag-result': '' },
          children: [
            pick(
              `已关闭 ${this.state.closedCount} 个标签`,
              `${this.state.closedCount} tags closed`
            ),
          ],
        },
      ],
    };
  }
}
