import { Component, type VNode } from '@geektech/tsone';
import { OneSkeleton } from '../../../lib';
import { pick } from './locale';

export class SkeletonDemo extends Component<Record<string, never>, object> {
  protected initState(): object {
    return {};
  }

  protected initStyles(): void {}

  protected render(): VNode {
    return {
      tag: 'div',
      props: { className: 'one-docs-skeleton-demo' },
      children: [
        {
          component: OneSkeleton,
          props: { rows: 3, title: true, ariaLabel: pick('加载中', 'Loading') },
        },
        {
          component: OneSkeleton,
          props: {
            rows: 2,
            avatar: true,
            widths: ['60%', '40%'],
            ariaLabel: pick('个人资料加载中', 'Loading profile'),
          },
        },
        {
          component: OneSkeleton,
          props: {
            rows: 2,
            title: false,
            animated: false,
            ariaLabel: pick('静态占位', 'Static placeholder'),
          },
        },
      ],
    };
  }
}
