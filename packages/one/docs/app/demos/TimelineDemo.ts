import { Component, type VNode } from '@geektech/tsone';
import { OneTimeline } from '../../../lib';
import { pick } from './locale';

export class TimelineDemo extends Component<
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
      props: { className: 'one-docs-timeline-demo' },
      children: [
        {
          component: OneTimeline,
          props: {
            items: [
              {
                title: pick('创建订单', 'Order created'),
                time: '09-01 10:00',
                content: pick('订单已创建', 'Order created'),
              },
              {
                title: pick('已发货', 'Shipped'),
                time: '09-01 14:20',
                color: 'success',
                content: pick('快递已揽收', 'Parcel picked up'),
              },
              {
                title: pick('派送中', 'Out for delivery'),
                time: '09-02 09:05',
                color: 'primary',
                content: pick('预计今日送达', 'Expected today'),
              },
              {
                title: pick('送达失败', 'Delivery failed'),
                time: '09-02 18:30',
                color: 'danger',
                content: pick('收件人电话未接通', 'Recipient not reachable'),
              },
            ],
          },
        },
      ],
    };
  }
}
