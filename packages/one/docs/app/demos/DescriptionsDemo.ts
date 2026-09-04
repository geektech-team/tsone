import { Component, type VNode } from '@geektech/tsone';
import { OneDescriptions } from '../../../lib';
import { pick } from './locale';

export class DescriptionsDemo extends Component<
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
      props: { className: 'one-docs-descriptions-demo' },
      children: [
        {
          component: OneDescriptions,
          props: {
            title: pick('订单信息', 'Order info'),
            column: 2,
            bordered: true,
            items: [
              { label: pick('订单号', 'Order ID'), value: 'A-1024' },
              { label: pick('状态', 'Status'), value: pick('已发货', 'Shipped') },
              { label: pick('收件人', 'Recipient'), value: pick('张三', 'Zhang San') },
              { label: pick('金额', 'Amount'), value: '¥ 128.00' },
              {
                label: pick('备注', 'Note'),
                value: pick('请尽快配送', 'Deliver ASAP'),
                span: 2,
              },
            ],
          },
        },
        {
          component: OneDescriptions,
          props: {
            items: [
              { label: pick('用户名', 'Username'), value: 'max' },
              { label: pick('角色', 'Role'), value: pick('管理员', 'Admin') },
            ],
          },
        },
      ],
    };
  }
}
