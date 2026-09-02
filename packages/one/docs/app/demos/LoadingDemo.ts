import { Component, type VNode } from '@geektech/tsone';
import { OneLoading } from '../../../lib';
import { pick } from './locale';

export class LoadingDemo extends Component<Record<string, never>, object> {
  protected initState(): object {
    return {};
  }

  protected initStyles(): void {}

  protected render(): VNode {
    return {
      tag: 'div',
      props: { className: 'one-docs-loading-demo' },
      children: [
        {
          component: OneLoading,
          props: { size: 'sm', label: pick('加载中', 'Loading') },
        },
        {
          component: OneLoading,
          props: {
            size: 'md',
            variant: 'primary',
            label: pick('加载中', 'Loading'),
          },
        },
        {
          component: OneLoading,
          props: {
            size: 'lg',
            variant: 'success',
            label: pick('已完成', 'Completed'),
          },
        },
      ],
    };
  }
}
