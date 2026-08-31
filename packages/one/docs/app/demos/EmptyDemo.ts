import { Component, type VNode } from '@geektech/tsone';
import { OneButton, OneEmpty } from '../../../lib';

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
          props: { description: '暂无项目' },
          children: [
            {
              component: OneButton,
              slot: 'actions',
              emitters: { click: this.requestCreate },
              children: ['创建项目'],
            },
          ],
        },
        {
          tag: 'output',
          props: { 'data-one-empty-result': '' },
          children: [this.state.requested ? '已请求创建项目' : '等待操作'],
        },
      ],
    };
  }
}
