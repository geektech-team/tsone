import { Component, type VNode } from '@geektech/tsone';
import { OneCol, OneRow } from '../../../lib';
import { pick } from './locale';

export class GridDemo extends Component<
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
      props: { className: 'one-docs-grid-demo' },
      children: [
        {
          component: OneRow,
          props: { gutter: [16, 16] },
          children: [
            { component: OneCol, props: { span: 12 }, children: [this.box(pick('12', '12'))] },
            { component: OneCol, props: { span: 12 }, children: [this.box(pick('12', '12'))] },
          ],
        },
        {
          component: OneRow,
          props: { gutter: [16, 16] },
          children: [
            { component: OneCol, props: { span: 8 }, children: [this.box(pick('8', '8'))] },
            { component: OneCol, props: { span: 8 }, children: [this.box(pick('8', '8'))] },
            { component: OneCol, props: { span: 8 }, children: [this.box(pick('8', '8'))] },
          ],
        },
        {
          component: OneRow,
          props: { gutter: [16, 16] },
          children: [
            {
              component: OneCol,
              props: { span: 8, offset: 8 },
              children: [this.box(pick('8 偏移 8', '8 + offset 8'))],
            },
          ],
        },
        {
          component: OneRow,
          props: { gutter: [16, 16] },
          children: [
            {
              component: OneCol,
              props: { xs: 24, md: 12 },
              children: [this.box(pick('xs=24 md=12', 'xs=24 md=12'))],
            },
            {
              component: OneCol,
              props: { xs: 24, md: 12 },
              children: [this.box(pick('xs=24 md=12', 'xs=24 md=12'))],
            },
          ],
        },
      ],
    };
  }

  private box(label: string): VNode {
    return {
      tag: 'div',
      props: { className: 'one-docs-grid-box' },
      children: [label],
    };
  }
}
