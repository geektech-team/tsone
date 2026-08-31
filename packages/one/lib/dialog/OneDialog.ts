import { Component, type VNode } from '@geektech/tsone';
import {
  getDefaultOneOverlayHost,
  OneOverlayMountController,
  resolveOneOverlayContainer,
  type OneOverlayFactoryContext,
} from '../overlay';
import { DialogOverlay } from './DialogOverlay';
import type { OneDialogCloseReason, OneDialogProps } from './types';

interface OneDialogState {
  internalOpen: boolean;
}

export class OneDialog extends Component<OneDialogProps, OneDialogState> {
  private controller: OneOverlayMountController<OneDialogProps> | undefined;
  private lockBody = true;
  private viewMounted = false;

  protected initState(): OneDialogState {
    return { internalOpen: this.props.defaultOpen === true };
  }

  protected initStyles(): void {}

  protected onMounted(): void {
    this.controller = new OneOverlayMountController<OneDialogProps>(
      getDefaultOneOverlayHost(),
      'dialog',
      (context) => this.createOverlay(context)
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
      props: { hidden: true, 'data-one-dialog-anchor': '' },
    };
  }

  private createOverlay(context: OneOverlayFactoryContext) {
    const overlay = new DialogOverlay({
      ...this.props,
      id: context.id,
      lockBody: this.lockBody,
      isTop: context.isTop,
      requestClose: (reason) => this.requestClose(reason),
    });
    overlay.mount(context.slot);
    this.viewMounted = true;
    return {
      update: (next: Partial<OneDialogProps>) => overlay.setProps(next),
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
    const resolved = resolveOneOverlayContainer(this.props.container);
    this.lockBody = resolved === resolved.ownerDocument.body;
    this.controller.open(resolved);
    this.controller.update(this.props);
  }

  private requestClose(reason: OneDialogCloseReason): void {
    if (reason === 'confirm') {
      this.emit('confirm');
    } else {
      this.emit('cancel', reason);
    }
    this.emit('openChange', false);
    if (this.props.open !== undefined) {
      return;
    }
    this.state.internalOpen = false;
    this.controller?.close();
  }
}
