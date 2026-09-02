import { Component, type VNode } from '@geektech/tsone';
import { OneTabs, type OneTabsChangeEvent } from '../../../lib';
import { pick } from './locale';

interface TabsDemoState {
  value: string;
}

export class TabsDemo extends Component<Record<string, never>, TabsDemoState> {
  private readonly handleChange = (payload: unknown): void => {
    const event = payload as OneTabsChangeEvent;
    this.setState({ value: event.value });
  };

  protected initState(): TabsDemoState {
    return { value: 'overview' };
  }

  protected initStyles(): void {}

  protected render(): VNode {
    return {
      tag: 'div',
      props: { className: 'one-docs-tabs-demo' },
      children: [
        {
          component: OneTabs,
          props: {
            value: this.state.value,
            ariaLabel: pick('账户设置', 'Account settings'),
            items: [
              { value: 'overview', label: pick('概览', 'Overview') },
              { value: 'security', label: pick('安全', 'Security') },
            ],
          },
          emitters: { change: this.handleChange },
          children: [
            {
              tag: 'p',
              slot: 'overview',
              children: [pick('概览内容', 'Overview content')],
            },
            {
              tag: 'p',
              slot: 'security',
              children: [pick('安全内容', 'Security content')],
            },
          ],
        },
        {
          tag: 'output',
          props: { 'data-one-tabs-result': '' },
          children: [
            pick(
              `当前标签：${this.state.value}`,
              `Current tab: ${this.state.value}`
            ),
          ],
        },
      ],
    };
  }
}
