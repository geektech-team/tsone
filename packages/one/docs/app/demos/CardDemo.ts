import { Component, type VNode } from '@geektech/tsone';
import { OneCard } from '../../../lib';
import { pick } from './locale';

export class CardDemo extends Component<Record<string, never>> {
  protected initState(): object {
    return {};
  }

  protected initStyles(): void {}

  protected render(): VNode {
    return {
      component: OneCard,
      children: [
        {
          tag: 'strong',
          slot: 'header',
          children: [pick('显式标题插槽', 'Explicit header slot')],
        },
        {
          tag: 'p',
          children: [
            pick(
              '卡片正文由默认插槽提供。',
              'Card body comes from the default slot.'
            ),
          ],
        },
        {
          tag: 'span',
          slot: 'footer',
          children: [pick('显式页脚插槽', 'Explicit footer slot')],
        },
      ],
    };
  }
}
