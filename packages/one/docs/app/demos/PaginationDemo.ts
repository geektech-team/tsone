import { Component, type VNode } from '@geektech/tsone';
import { OnePagination, type OnePaginationChangeEvent } from '../../../lib';

interface PaginationDemoState {
  page: number;
  pageSize: number;
}

export class PaginationDemo extends Component<
  Record<string, never>,
  PaginationDemoState
> {
  private readonly handleChange = (payload: unknown): void => {
    const event = payload as OnePaginationChangeEvent;
    this.setState({ page: event.page, pageSize: event.pageSize });
  };

  protected initState(): PaginationDemoState {
    return { page: 1, pageSize: 10 };
  }

  protected initStyles(): void {}

  protected render(): VNode {
    return {
      tag: 'div',
      props: { className: 'one-docs-pagination-demo' },
      children: [
        {
          component: OnePagination,
          props: {
            total: 95,
            page: this.state.page,
            pageSize: this.state.pageSize,
            pageSizeOptions: [10, 20, 50],
            showQuickJumper: true,
          },
          emitters: { change: this.handleChange },
        },
        {
          tag: 'output',
          props: { 'data-one-pagination-result': '' },
          children: [
            `第 ${this.state.page} 页，每页 ${this.state.pageSize} 条`,
          ],
        },
      ],
    };
  }
}
