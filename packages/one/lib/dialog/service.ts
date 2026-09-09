import type { VNode } from '@geektech/tsone';
import {
  getDefaultOneOverlayHost,
  type OneOverlayHandle,
  type OneOverlayHost,
} from '../overlay';
import { DialogOverlay } from './DialogOverlay';
import type { OneDialogCloseReason, OneDialogProps } from './types';

export interface OneDialogServiceOptions
  extends Omit<OneDialogProps, 'open' | 'defaultOpen'> {
  content?: VNode | string;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => boolean | void | Promise<boolean | void>;
  onCancel?: () => void;
  onError?: (error: unknown) => void;
}

type OneDialogSettlement = (result: boolean) => void;

export class OneDialogService {
  public constructor(private readonly suppliedHost?: OneOverlayHost) {}

  public open(
    options: OneDialogServiceOptions
  ): OneOverlayHandle<OneDialogServiceOptions> {
    return this.openInternal(options);
  }

  public confirm(options: OneDialogServiceOptions): Promise<boolean> {
    return new Promise<boolean>((resolve) => {
      this.openInternal(options, resolve);
    });
  }

  public close(id: string): void {
    (this.suppliedHost ?? getDefaultOneOverlayHost()).close(id);
  }

  public closeAll(): void {
    (this.suppliedHost ?? getDefaultOneOverlayHost()).closeAll('dialog');
  }

  private openInternal(
    options: OneDialogServiceOptions,
    settle?: OneDialogSettlement
  ): OneOverlayHandle<OneDialogServiceOptions> {
    const host = this.suppliedHost ?? getDefaultOneOverlayHost();
    let current = { ...options };
    let pending = false;
    let settled = false;
    const hostHandle = host.open<OneDialogServiceOptions>({
      kind: 'dialog',
      container: current.container,
      factory: ({ id, slot, requestClose, isTop }) => {
        const hostContainer = slot.parentElement?.parentElement;
        const overlay = new DialogOverlay({
          ...current,
          id,
          lockBody: hostContainer === slot.ownerDocument.body,
          isTop,
          requestClose: (reason) => {
            void handleClose(reason);
          },
        });

        const updateOverlay = (): void => {
          overlay.setProps({
            ...current,
            confirmLoading: pending || current.confirmLoading === true,
          });
        };

        const finish = (result: boolean): void => {
          if (settled) {
            return;
          }
          settled = true;
          requestClose();
          settle?.(result);
        };

        const handleClose = async (
          reason: OneDialogCloseReason
        ): Promise<void> => {
          if (settled || pending) {
            return;
          }
          if (reason !== 'confirm') {
            try {
              current.onCancel?.();
            } catch (error) {
              current.onError?.(error);
            }
            if (settle) {
              finish(false);
            } else {
              requestClose();
            }
            return;
          }

          pending = true;
          updateOverlay();
          try {
            const result = await current.onConfirm?.();
            if (result === false) {
              pending = false;
              updateOverlay();
              // 确认被拒绝：保持对话框打开，但将本次确认结算为 false，
              // 调用方无需等待后续关闭即可感知拒绝结果。
              settle?.(false);
              return;
            }
            if (settle) {
              finish(true);
            } else {
              requestClose();
            }
          } catch (error) {
            pending = false;
            updateOverlay();
            current.onError?.(error);
          }
        };

        overlay.mount(slot);
        return {
          update: (next) => {
            current = { ...current, ...next };
            updateOverlay();
          },
          destroy: () => {
            overlay.unmount();
            if (settle && !settled) {
              settled = true;
              settle(false);
            }
          },
        };
      },
    });

    return {
      id: hostHandle.id,
      update: (next) => hostHandle.update(next),
      close: () => hostHandle.close(),
    };
  }
}

export function createOneDialogService(
  host?: OneOverlayHost
): OneDialogService {
  return new OneDialogService(host);
}

export const oneDialog = createOneDialogService();
