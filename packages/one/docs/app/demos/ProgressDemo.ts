import { Component, type VNode } from '@geektech/tsone';
import { OneProgress } from '../../../lib';
import { pick } from './locale';

export class ProgressDemo extends Component<Record<string, never>, object> {
  protected initState(): object {
    return {};
  }

  protected initStyles(): void {}

  protected render(): VNode {
    return {
      tag: 'div',
      props: { className: 'one-docs-progress-demo' },
      children: [
        {
          component: OneProgress,
          props: {
            percent: 65,
            showText: true,
            ariaLabel: pick('完成进度', 'Completion progress'),
          },
        },
        {
          component: OneProgress,
          props: {
            percent: 30,
            variant: 'success',
            ariaLabel: pick('成功进度', 'Success progress'),
          },
        },
        {
          component: OneProgress,
          props: {
            percent: 85,
            variant: 'warning',
            showText: true,
            ariaLabel: pick('警告进度', 'Warning progress'),
          },
        },
      ],
    };
  }
}
