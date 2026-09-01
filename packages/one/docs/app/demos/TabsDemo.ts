import { Component, type VNode } from '@geektech/tsone';
import { OneTabs, type OneTabsChangeEvent } from '../../../lib';

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
            ariaLabel: '账户设置',
            items: [
              { value: 'overview', label: '概览' },
              { value: 'security', label: '安全' },
            ],
          },
          emitters: { change: this.handleChange },
          children: [
            { tag: 'p', slot: 'overview', children: ['概览内容'] },
            { tag: 'p', slot: 'security', children: ['安全内容'] },
          ],
        },
        {
          tag: 'output',
          props: { 'data-one-tabs-result': '' },
          children: [`当前标签：${this.state.value}`],
        },
      ],
    };
  }
}
