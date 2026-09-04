import { Component, type VNode } from '@geektech/tsone';
import { OnePopover } from '../../../lib';
import { pick } from './locale';

export class PopoverDemo extends Component<
  Record<string, never>,
  Record<string, never>
> {
  protected initState(): Record<string, never> {
    return {};
  }

  protected initStyles(): void {}

  protected render(): VNode {
    return {
      tag: 'div',
      props: { className: 'one-docs-popover-demo' },
      children: [
        {
          component: OnePopover,
          props: {
            content: pick(
              '这是一段浮层说明。点击外部或按 Escape 关闭。',
              'Popover content. Click outside or press Escape to close.'
            ),
            placement: 'bottom',
          },
          children: [
            {
              tag: 'button',
              props: {
                className: 'one-button one-button--secondary one-button--md',
              },
              children: [pick('点击打开', 'Open popover')],
            },
          ],
        },
        {
          component: OnePopover,
          props: {
            trigger: 'hover-focus',
            placement: 'right',
            content: pick(
              '悬停展示的内容。',
              'Content shown on hover.'
            ),
          },
          children: [
            {
              tag: 'button',
              props: {
                className: 'one-button one-button--secondary one-button--md',
              },
              children: [pick('悬停查看', 'Hover')],
            },
          ],
        },
      ],
    };
  }
}
