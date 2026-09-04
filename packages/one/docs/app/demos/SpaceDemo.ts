import { Component, type VNode } from '@geektech/tsone';
import { OneButton, OneSpace } from '../../../lib';
import { pick } from './locale';

export class SpaceDemo extends Component<
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
      props: { className: 'one-docs-space-demo' },
      children: [
        {
          component: OneSpace,
          props: { size: 'md', wrap: true },
          children: [
            {
              component: OneButton,
              props: { variant: 'primary', size: 'sm' },
              children: [pick('保存', 'Save')],
            },
            {
              component: OneButton,
              props: { size: 'sm' },
              children: [pick('取消', 'Cancel')],
            },
            {
              component: OneButton,
              props: { variant: 'danger', size: 'sm' },
              children: [pick('删除', 'Delete')],
            },
          ],
        },
        {
          component: OneSpace,
          props: { direction: 'vertical', size: 'sm' },
          children: [
            pick('垂直排列第一行', 'Vertical first row'),
            pick('垂直排列第二行', 'Vertical second row'),
            pick('垂直排列第三行', 'Vertical third row'),
          ],
        },
      ],
    };
  }
}
