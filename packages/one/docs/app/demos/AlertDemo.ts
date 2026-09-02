import { Component, type VNode } from '@geektech/tsone';
import { OneAlert, OneButton } from '../../../lib';
import { pick } from './locale';

interface AlertDemoState {
  actionCount: number;
}

export class AlertDemo extends Component<
  Record<string, never>,
  AlertDemoState
> {
  private readonly handleAction = (): void => {
    this.setState({ actionCount: this.state.actionCount + 1 });
  };

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
          props: {
            title: pick('信息', 'Info'),
            description: pick('这是一条普通提示。', 'This is a regular notice.'),
          },
        },
        {
          component: OneAlert,
          props: {
            title: pick('保存成功', 'Saved successfully'),
            description: pick('更改已经同步。', 'Changes have been synced.'),
            variant: 'success',
          },
        },
        {
          component: OneAlert,
          props: {
            title: pick('需要注意', 'Attention needed'),
            description: pick('请检查当前配置。', 'Please review the current configuration.'),
            variant: 'warning',
          },
          children: [
            {
              component: OneButton,
              slot: 'actions',
              props: { size: 'sm', variant: 'secondary' },
              children: [pick('撤销', 'Undo')],
              emitters: { click: this.handleAction },
            },
          ],
        },
        {
          component: OneAlert,
          props: {
            title: pick('操作失败', 'Operation failed'),
            description: pick('可以关闭这条提示。', 'You can dismiss this alert.'),
            variant: 'error',
            closable: true,
          },
        },
        {
          tag: 'output',
          props: { 'data-one-alert-result': '' },
          children: [
            pick(
              `已撤销 ${this.state.actionCount} 次`,
              `Undone ${this.state.actionCount} times`
            ),
          ],
        },
      ],
    };
  }
}
