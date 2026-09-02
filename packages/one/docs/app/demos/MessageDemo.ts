import { Component, type VNode } from '@geektech/tsone';
import {
  OneButton,
  oneMessage,
  type OneMessageOptions,
  type OneOverlayHandle,
} from '../../../lib';
import { pick } from './locale';

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
        this.button(pick('成功消息', 'Success message'), () => {
          this.latest = oneMessage.success(
            pick('保存成功', 'Saved successfully'),
            { duration: 0 }
          );
        }),
        this.button(pick('警告消息', 'Warning message'), () => {
          this.latest = oneMessage.warning(
            pick('请检查输入', 'Please check your input'),
            { duration: 0 }
          );
        }),
        this.button(pick('更新最近消息', 'Update latest message'), () => {
          this.latest?.update({
            content: pick('内容已更新', 'Content updated'),
          });
        }),
        this.button(pick('关闭全部', 'Close all'), () => {
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
