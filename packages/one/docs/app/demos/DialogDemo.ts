import { Component, type VNode } from '@geektech/tsone';
import { OneDialog, oneDialog } from '../../../lib';

interface DialogDemoState {
  controlledOpen: boolean;
  result: string;
}

export class DialogDemo extends Component<
  Record<string, never>,
  DialogDemoState
> {
  private customContainer: HTMLElement | undefined;

  protected initState(): DialogDemoState {
    return { controlledOpen: false, result: '尚未确认' };
  }

  protected initStyles(): void {}

  protected onMounted(): void {
    const element = this.getElement();
    if (!(element instanceof HTMLElement)) {
      return;
    }
    this.customContainer =
      element.querySelector<HTMLElement>('[data-one-dialog-container]') ??
      undefined;
    if (this.customContainer) {
      this.customContainer.getBoundingClientRect = () => ({
        x: 0,
        y: 0,
        top: 0,
        left: 0,
        right: 520,
        bottom: 240,
        width: 520,
        height: 240,
        toJSON: () => ({}),
      });
    }
  }

  protected beforeUnmount(): void {
    oneDialog.closeAll();
    this.customContainer = undefined;
  }

  protected render(): VNode {
    return {
      tag: 'div',
      props: { className: 'one-docs-dialog-demo' },
      children: [
        this.button('打开 Dialog', 'data-one-open-dialog', () => {
          oneDialog.open({
            title: '保存更改？',
            description: '取消会保留当前页面。',
          });
        }),
        this.button('异步确认', 'data-one-confirm-dialog', () => {
          void oneDialog
            .confirm({
              title: '提交更改？',
              onConfirm: () => {
                this.state.result = '确认结果：true';
                return true;
              },
            })
            .then((confirmed) => {
              this.state.result = `确认结果：${String(confirmed)}`;
            });
        }),
        this.button('受控 Dialog', 'data-one-controlled-dialog', () => {
          this.state.controlledOpen = true;
        }),
        this.button('容器内 Dialog', 'data-one-contained-dialog', () => {
          if (!this.customContainer) {
            return;
          }
          oneDialog.open({
            title: '容器内 Dialog',
            description: '此示例不会锁定 body。',
            container: this.customContainer,
          });
        }),
        {
          tag: 'output',
          props: { 'data-one-dialog-result': '' },
          children: [this.state.result],
        },
        {
          tag: 'div',
          props: {
            className: 'one-docs-dialog-container',
            'data-one-dialog-container': '',
          },
        },
        {
          component: OneDialog,
          props: {
            open: this.state.controlledOpen,
            title: '受控 Dialog',
          },
          emitters: {
            openChange: (open) => {
              this.state.controlledOpen = open as boolean;
            },
          },
        },
      ],
    };
  }

  private button(
    label: string,
    dataAttribute: string,
    onClick: () => void
  ): VNode {
    return {
      tag: 'button',
      props: { type: 'button', [dataAttribute]: '' },
      children: [label],
      listeners: { click: onClick },
    };
  }
}
