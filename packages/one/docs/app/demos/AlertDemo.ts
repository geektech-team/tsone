import { Component, type VNode } from '@geektech/tsone';
import { OneAlert } from '../../../lib';

interface AlertDemoState {
  actionCount: number;
}

export class AlertDemo extends Component<
  Record<string, never>,
  AlertDemoState
> {
  protected initState(): AlertDemoState {
    return { actionCount: 0 };
  }

  protected initStyles(): void {}

  protected render(): VNode {
    return {
      tag: 'div',
      props: { className: 'one-docs-feedback-stack' },
      children: [
        {
          component: OneAlert,
          props: { title: '信息', description: '这是一条普通提示。' },
        },
        {
          component: OneAlert,
          props: {
            title: '保存成功',
            description: '更改已经同步。',
            variant: 'success',
          },
        },
        {
          component: OneAlert,
          props: {
            title: '需要注意',
            description: '请检查当前配置。',
            variant: 'warning',
          },
          children: [
            {
              tag: 'button',
              slot: 'actions',
              props: { type: 'button', 'data-one-alert-action': '' },
              children: ['撤销'],
              listeners: {
                click: () => {
                  this.state.actionCount += 1;
                },
              },
            },
          ],
        },
        {
          component: OneAlert,
          props: {
            title: '操作失败',
            description: '可以关闭这条提示。',
            variant: 'error',
            closable: true,
          },
        },
        {
          tag: 'output',
          props: { 'data-one-alert-result': '' },
          children: [`已撤销 ${this.state.actionCount} 次`],
        },
      ],
    };
  }
}
