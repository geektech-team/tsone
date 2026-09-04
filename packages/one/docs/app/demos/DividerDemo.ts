import { Component, type VNode } from '@geektech/tsone';
import { OneDivider } from '../../../lib';
import { pick } from './locale';

export class DividerDemo extends Component<
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
      props: { className: 'one-docs-divider-demo' },
      children: [
        { component: OneDivider, props: {} },
        {
          component: OneDivider,
          props: { text: pick('或', 'or') },
        },
        {
          component: OneDivider,
          props: { text: pick('分隔线', 'Divider'), textAlign: 'left' },
        },
        {
          tag: 'p',
          props: { className: 'one-docs-inline-divider-demo' },
          children: [
            pick('左边内容', 'Left'),
            { component: OneDivider, props: { direction: 'vertical' } },
            pick('右边内容', 'Right'),
          ],
        },
      ],
    };
  }
}
