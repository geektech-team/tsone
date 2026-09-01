import { Component, type VNode } from '@geektech/tsone';
import { OneBreadcrumb, type OneBreadcrumbClickEvent } from '../../../lib';

interface BreadcrumbDemoState {
  clickedLabel: string;
}

export class BreadcrumbDemo extends Component<
  Record<string, never>,
  BreadcrumbDemoState
> {
  private readonly handleItemClick = (payload: unknown): void => {
    const event = payload as OneBreadcrumbClickEvent;
    event.originalEvent.preventDefault();
    this.setState({ clickedLabel: event.item.label });
  };

  protected initState(): BreadcrumbDemoState {
    return { clickedLabel: '尚未点击' };
  }

  protected initStyles(): void {}

  protected render(): VNode {
    return {
      tag: 'div',
      props: { className: 'one-docs-breadcrumb-demo' },
      children: [
        {
          component: OneBreadcrumb,
          props: {
            maxItems: 3,
            ariaLabel: '项目路径',
            items: [
              { label: '首页', href: '/' },
              { label: '工作台', href: '/workspace' },
              { label: '项目', current: true },
              { label: '设置', href: '/settings' },
              { label: '详情' },
            ],
          },
          emitters: { itemClick: this.handleItemClick },
        },
        {
          tag: 'output',
          props: { 'data-one-breadcrumb-result': '' },
          children: [
            this.state.clickedLabel === '尚未点击'
              ? this.state.clickedLabel
              : `点击：${this.state.clickedLabel}`,
          ],
        },
      ],
    };
  }
}
