import {
  getDefaultOneOverlayHost,
  type OneOverlayHandle,
  type OneOverlayHost,
} from '../overlay';
import { MessageOverlay } from './MessageOverlay';
import { normalizeOneMessageOptions } from './normalize';
import type { OneMessageOptions } from './types';

type OneMessageShortcutOptions = Omit<OneMessageOptions, 'content' | 'variant'>;

export class OneMessageService {
  public constructor(private readonly suppliedHost?: OneOverlayHost) {}

  public open(options: OneMessageOptions): OneOverlayHandle<OneMessageOptions> {
    const host = this.suppliedHost ?? getDefaultOneOverlayHost();
    let current = normalizeOneMessageOptions(options);
    const hostHandle = host.open<OneMessageOptions>({
      kind: 'message',
      group: current.placement,
      container: current.container,
      factory: ({ slot, requestClose }) => {
        const overlay = new MessageOverlay({
          ...current,
          requestClose,
        });
        overlay.mount(slot);
        return {
          update: (next) => {
            current = normalizeOneMessageOptions({ ...current, ...next });
            overlay.setProps({ ...current });
          },
          destroy: () => overlay.unmount(),
        };
      },
    });
    return {
      id: hostHandle.id,
      update: (next) => hostHandle.update(next),
      close: () => hostHandle.close(),
    };
  }

  public info(
    content: string,
    options: OneMessageShortcutOptions = {}
  ): OneOverlayHandle<OneMessageOptions> {
    return this.open({ ...options, content, variant: 'info' });
  }

  public success(
    content: string,
    options: OneMessageShortcutOptions = {}
  ): OneOverlayHandle<OneMessageOptions> {
    return this.open({ ...options, content, variant: 'success' });
  }

  public warning(
    content: string,
    options: OneMessageShortcutOptions = {}
  ): OneOverlayHandle<OneMessageOptions> {
    return this.open({ ...options, content, variant: 'warning' });
  }

  public error(
    content: string,
    options: OneMessageShortcutOptions = {}
  ): OneOverlayHandle<OneMessageOptions> {
    return this.open({ ...options, content, variant: 'error' });
  }

  public close(id: string): void {
    (this.suppliedHost ?? getDefaultOneOverlayHost()).close(id);
  }

  public closeAll(): void {
    (this.suppliedHost ?? getDefaultOneOverlayHost()).closeAll('message');
  }
}

export function createOneMessageService(
  host?: OneOverlayHost
): OneMessageService {
  return new OneMessageService(host);
}

export const oneMessage = createOneMessageService();
