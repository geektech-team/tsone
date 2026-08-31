import { Component, type VNode } from '@geektech/tsone';
import {
  oneMessage,
  type OneMessageOptions,
  type OneOverlayHandle,
} from '../../../lib';

export class MessageDemo extends Component<Record<string, never>> {
  private latest: OneOverlayHandle<OneMessageOptions> | undefined;

  protected initState(): object {
    return {};
  }

  protected initStyles(): void {}

  protected beforeUnmount(): void {
    oneMessage.closeAll();
    this.latest = undefined;
  }

  protected render(): VNode {
    return {
      tag: 'div',
      props: { className: 'one-docs-feedback-actions' },
      children: [
        this.button('成功消息', 'data-one-open-message', () => {
          this.latest = oneMessage.success('保存成功', { duration: 0 });
        }),
        this.button('警告消息', 'data-one-open-warning', () => {
          this.latest = oneMessage.warning('请检查输入', { duration: 0 });
        }),
        this.button('更新最近消息', 'data-one-update-message', () => {
          this.latest?.update({ content: '内容已更新' });
        }),
        this.button('关闭全部', 'data-one-close-messages', () => {
          oneMessage.closeAll();
          this.latest = undefined;
        }),
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
