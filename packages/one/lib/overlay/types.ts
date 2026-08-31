export type OneFeedbackVariant = 'info' | 'success' | 'warning' | 'error';

export type OneOverlayContainer = HTMLElement | (() => HTMLElement | null);

export type OneOverlayPlacement =
  | 'top-start'
  | 'top'
  | 'top-end'
  | 'right-start'
  | 'right'
  | 'right-end'
  | 'bottom-start'
  | 'bottom'
  | 'bottom-end'
  | 'left-start'
  | 'left'
  | 'left-end';

export type OneOverlayKind = 'message' | 'dialog' | 'tooltip';

export interface OneOverlayHandle<TOptions extends object> {
  readonly id: string;
  update(options: Partial<TOptions>): void;
  close(): void;
}

export interface OneManagedOverlay<TOptions extends object> {
  update(options: Partial<TOptions>): void;
  destroy(): void;
}

export interface OneOverlayFactoryContext {
  id: string;
  slot: HTMLElement;
  requestClose(): void;
  isTop(): boolean;
}

export type OneOverlayFactory<TOptions extends object> = (
  context: OneOverlayFactoryContext
) => OneManagedOverlay<TOptions>;

export interface OneOverlayOpenRequest<TOptions extends object> {
  kind: OneOverlayKind;
  group?: string;
  container?: OneOverlayContainer;
  factory: OneOverlayFactory<TOptions>;
}

export interface OneOverlayHost {
  open<TOptions extends object>(
    request: OneOverlayOpenRequest<TOptions>
  ): OneOverlayHandle<TOptions>;
  close(id: string): void;
  closeAll(kind?: OneOverlayKind): void;
  isTop(id: string): boolean;
}
