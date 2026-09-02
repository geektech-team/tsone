import { Component, type VNode } from '@geektech/tsone';
import { OneButton, OneDialog, oneDialog } from '../../../lib';
import { pick } from './locale';

interface DialogDemoState {
  controlledOpen: boolean;
  result: string;
}

export class DialogDemo extends Component<
  Record<string, never>,
  DialogDemoState
> {
  private customContainer: HTMLElement | undefined;
  private readonly openDialog = (): void => {
    oneDialog.open({
      title: pick('保存更改？', 'Save changes?'),
      description: pick('取消会保留当前页面。', 'Canceling keeps the current page.'),
    });
  };
  private readonly confirmDialog = (): void => {
    void oneDialog
      .confirm({
        title: pick('提交更改？', 'Submit changes?'),
        onConfirm: () => {
          this.setState({
            result: pick('确认结果：true', 'Confirmation result: true'),
          });
          return true;
        },
      })
      .then((confirmed) => {
        this.setState({
          result: pick(
            `确认结果：${String(confirmed)}`,
            `Confirmation result: ${String(confirmed)}`
          ),
        });
      });
  };
  private readonly openControlledDialog = (): void => {
    this.setState({ controlledOpen: true });
  };
  private readonly openContainedDialog = (): void => {
    if (!this.customContainer) {
      return;
    }
    oneDialog.open({
      title: pick('容器内 Dialog', 'In-container dialog'),
      description: pick('此示例不会锁定 body。', 'This example does not lock the body.'),
      container: this.customContainer,
    });
  };
  private readonly handleControlledOpenChange = (open: unknown): void => {
    this.setState({ controlledOpen: open as boolean });
  };

  protected initState(): DialogDemoState {
    return {
      controlledOpen: false,
      result: pick('尚未确认', 'Not confirmed yet'),
    };
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
        this.button(pick('打开 Dialog', 'Open dialog'), this.openDialog),
        this.button(pick('异步确认', 'Async confirm'), this.confirmDialog),
        this.button(pick('受控 Dialog', 'Controlled dialog'), this.openControlledDialog),
        this.button(pick('容器内 Dialog', 'In-container dialog'), this.openContainedDialog),
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
            title: pick('受控 Dialog', 'Controlled dialog'),
          },
          emitters: { openChange: this.handleControlledOpenChange },
        },
      ],
    };
  }

  private button(label: string, onClick: () => void): VNode {
    return {
      component: OneButton,
      props: { variant: 'secondary' },
      children: [label],
      emitters: { click: onClick },
    };
  }
}
