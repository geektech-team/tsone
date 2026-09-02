import { Component, type VNode } from '@geektech/tsone';
import { OneAvatar } from '../../../lib';
import { pick } from './locale';

export class AvatarDemo extends Component<Record<string, never>, object> {
  protected initState(): object {
    return {};
  }

  protected initStyles(): void {}

  protected render(): VNode {
    return {
      tag: 'div',
      props: { className: 'one-docs-avatar-demo' },
      children: [
        { component: OneAvatar, props: { text: 'M', variant: 'primary' } },
        {
          component: OneAvatar,
          props: {
            text: pick('设计', 'Design'),
            shape: 'square',
            variant: 'success',
          },
        },
        {
          component: OneAvatar,
          props: { text: 'A', size: 'lg', variant: 'warning' },
        },
        {
          component: OneAvatar,
          props: {
            text: pick('空', 'Empty'),
            size: 'sm',
            variant: 'neutral',
          },
        },
      ],
    };
  }
}
