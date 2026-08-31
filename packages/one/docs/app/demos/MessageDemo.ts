import { Component, type VNode } from '@geektech/tsone';
import {
  OneButton,
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
        this.button('成功消息', () => {
          this.latest = oneMessage.success('保存成功', { duration: 0 });
        }),
        this.button('警告消息', () => {
          this.latest = oneMessage.warning('请检查输入', { duration: 0 });
        }),
        this.button('更新最近消息', () => {
          this.latest?.update({ content: '内容已更新' });
        }),
        this.button('关闭全部', () => {
          oneMessage.closeAll();
          this.latest = undefined;
        }),
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
