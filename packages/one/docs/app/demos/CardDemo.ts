import { Component, type VNode } from '@geektech/tsone';
import { OneCard } from '../../../lib';

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
          children: ['显式标题插槽'],
        },
        {
          tag: 'p',
          children: ['卡片正文由默认插槽提供。'],
        },
        {
          tag: 'span',
          slot: 'footer',
          children: ['显式页脚插槽'],
        },
      ],
    };
  }
}
