import { Component, type VNode } from '@geektech/tsone';
import { OneTextarea } from '../../../lib';
import { pick } from './locale';

export class TextareaDemo extends Component<
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
      props: { className: 'one-docs-textarea-demo' },
      children: [
        {
          component: OneTextarea,
          props: {
            defaultValue: pick('多行文本内容', 'Multi-line text'),
            ariaLabel: pick('备注', 'Notes'),
          },
        },
        {
          component: OneTextarea,
          props: {
            rows: 5,
            placeholder: pick('请输入补充说明', 'Type additional notes'),
            ariaLabel: pick('补充说明', 'Additional notes'),
          },
        },
      ],
    };
  }
}
