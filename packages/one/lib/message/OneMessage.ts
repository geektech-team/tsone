import { Component, type VNode } from '@geektech/tsone';
import {
  getDefaultOneOverlayHost,
  OneOverlayMountController,
  type OneOverlayFactoryContext,
} from '../overlay';
import { MessageOverlay } from './MessageOverlay';
import { normalizeOneMessageOptions } from './normalize';
import type { OneMessageOptions, OneMessageProps } from './types';

interface OneMessageState {
  internalOpen: boolean;
}

export class OneMessage extends Component<OneMessageProps, OneMessageState> {
  private controller: OneOverlayMountController<OneMessageOptions> | undefined;
  private viewMounted = false;

  protected initState(): OneMessageState {
    return { internalOpen: this.props.defaultOpen === true };
  }

  protected initStyles(): void {}

  protected onMounted(): void {
    const options = normalizeOneMessageOptions(this.props);
    this.controller = new OneOverlayMountController<OneMessageOptions>(
      getDefaultOneOverlayHost(),
      'message',
      (context) => this.createOverlay(context),
      options.placement
    );
    this.synchronizeOverlay();
  }

  protected beforeUpdate(): void {
    this.synchronizeOverlay();
  }

  protected beforeUnmount(): void {
    this.controller?.close();
    this.controller = undefined;
  }

  protected render(): VNode {
    return {
      tag: 'span',
      props: { hidden: true, 'data-one-message-anchor': '' },
    };
  }

  private createOverlay(context: OneOverlayFactoryContext) {
    const options = normalizeOneMessageOptions(this.props);
    const overlay = new MessageOverlay({
      ...options,
      requestClose: () => this.requestClose(),
    });
    overlay.mount(context.slot);
    this.viewMounted = true;
    return {
      update: (next: Partial<OneMessageOptions>) => {
        const normalized = normalizeOneMessageOptions({
          ...options,
          ...next,
        });
        overlay.setProps({ ...normalized });
      },
      destroy: () => {
        overlay.unmount();
        if (this.viewMounted) {
          this.viewMounted = false;
          this.emit('afterClose');
        }
      },
    };
  }

  private synchronizeOverlay(): void {
    if (!this.controller) {
      return;
    }
    const open =
      this.props.open === undefined
        ? this.state.internalOpen
        : this.props.open === true;
    if (!open) {
      this.controller.close();
      return;
    }
    const options = normalizeOneMessageOptions(this.props);
    this.controller.open(options.container);
    this.controller.update(options);
  }

  private requestClose(): void {
    this.emit('openChange', false);
    this.emit('close');
    if (this.props.open !== undefined) {
      return;
    }
    this.state.internalOpen = false;
    this.controller?.close();
  }
}
