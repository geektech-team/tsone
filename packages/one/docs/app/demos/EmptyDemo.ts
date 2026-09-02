import { Component, type VNode } from '@geektech/tsone';
import { OneButton, OneEmpty } from '../../../lib';
import { pick } from './locale';

interface EmptyDemoState {
  requested: boolean;
}

export class EmptyDemo extends Component<
  Record<string, never>,
  EmptyDemoState
> {
  private readonly requestCreate = (): void => {
    this.setState({ requested: true });
  };

  protected initState(): EmptyDemoState {
    return { requested: false };
  }

  protected initStyles(): void {}

  protected render(): VNode {
    return {
      tag: 'div',
      props: { className: 'one-docs-empty-demo' },
      children: [
        {
          component: OneEmpty,
          props: { description: pick('暂无项目', 'No projects') },
          children: [
            {
              component: OneButton,
              slot: 'actions',
              emitters: { click: this.requestCreate },
              children: [pick('创建项目', 'Create project')],
            },
          ],
        },
        {
          tag: 'output',
          props: { 'data-one-empty-result': '' },
          children: [
            this.state.requested
              ? pick('已请求创建项目', 'Create requested')
              : pick('等待操作', 'Waiting for action'),
          ],
        },
      ],
    };
  }
}
