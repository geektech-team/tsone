import { Component, slot, type VNode } from '@geektech/tsone';
import { ONE_THEME_DEFAULTS, type OneNamedStyle } from '../styles/shared';
import { OneDialogFocusManager } from './focus-manager';
import { lockOneDialogBody } from './scroll-lock';
import type { OneDialogCloseReason, OneDialogProps } from './types';

export interface DialogOverlayProps extends OneDialogProps {
  id: string;
  lockBody: boolean;
  confirmText?: string;
  cancelText?: string;
  content?: VNode | string;
  isTop(): boolean;
  requestClose(reason: OneDialogCloseReason): void;
}

export const ONE_DIALOG_STYLES: OneNamedStyle[] = [
  {
    name: 'one-dialog-backdrop',
    selector: '.one-dialog__backdrop',
    properties: {
      position: 'fixed',
      inset: '0',
      zIndex: `var(--one-z-index-dialog, ${ONE_THEME_DEFAULTS.zIndexDialog})`,
      display: 'grid',
      placeItems: 'center',
      boxSizing: 'border-box',
      padding: `var(--one-space-lg, ${ONE_THEME_DEFAULTS.spaceLg})`,
      backgroundColor: `var(--one-color-overlay, ${ONE_THEME_DEFAULTS.colorOverlay})`,
    },
  },
  {
    name: 'one-dialog-backdrop-contained',
    selector: '.one-dialog__backdrop--contained',
    properties: { position: 'absolute' },
  },
  {
    name: 'one-dialog-panel',
    selector: '.one-dialog',
    properties: {
      width: 'min(520px, 100%)',
      maxHeight: 'calc(100vh - 32px)',
      overflow: 'auto',
      color: `var(--one-color-text, ${ONE_THEME_DEFAULTS.colorText})`,
      backgroundColor: `var(--one-color-surface, ${ONE_THEME_DEFAULTS.colorSurface})`,
      border: `1px solid var(--one-color-border, ${ONE_THEME_DEFAULTS.colorBorder})`,
      borderRadius: `var(--one-radius-md, ${ONE_THEME_DEFAULTS.radiusMd})`,
      boxShadow: `var(--one-shadow-overlay, ${ONE_THEME_DEFAULTS.shadowOverlay})`,
    },
  },
  {
    name: 'one-dialog-header',
    selector: '.one-dialog__header',
    properties: {
      padding: `var(--one-space-lg, ${ONE_THEME_DEFAULTS.spaceLg})`,
      fontSize: '18px',
      fontWeight: '600',
      borderBottom: `1px solid var(--one-color-border, ${ONE_THEME_DEFAULTS.colorBorder})`,
    },
  },
  {
    name: 'one-dialog-body',
    selector: '.one-dialog__body',
    properties: {
      padding: `var(--one-space-lg, ${ONE_THEME_DEFAULTS.spaceLg})`,
      color: `var(--one-color-muted, ${ONE_THEME_DEFAULTS.colorMuted})`,
    },
  },
  {
    name: 'one-dialog-footer',
    selector: '.one-dialog__footer',
    properties: {
      display: 'flex',
      justifyContent: 'flex-end',
      gap: `var(--one-space-sm, ${ONE_THEME_DEFAULTS.spaceSm})`,
      padding: `var(--one-space-md, ${ONE_THEME_DEFAULTS.spaceMd}) var(--one-space-lg, ${ONE_THEME_DEFAULTS.spaceLg})`,
      borderTop: `1px solid var(--one-color-border, ${ONE_THEME_DEFAULTS.colorBorder})`,
    },
  },
  {
    name: 'one-dialog-button',
    selector: '.one-dialog__cancel, .one-dialog__confirm',
    properties: {
      minHeight: '36px',
      padding: '0 14px',
      border: `1px solid var(--one-color-border, ${ONE_THEME_DEFAULTS.colorBorder})`,
      borderRadius: `var(--one-radius-md, ${ONE_THEME_DEFAULTS.radiusMd})`,
      cursor: 'pointer',
    },
  },
  {
    name: 'one-dialog-confirm',
    selector: '.one-dialog__confirm',
    properties: {
      color: '#ffffff',
      backgroundColor: `var(--one-color-primary, ${ONE_THEME_DEFAULTS.colorPrimary})`,
      borderColor: `var(--one-color-primary, ${ONE_THEME_DEFAULTS.colorPrimary})`,
    },
  },
];

interface DialogOverlayState {}

function hasSlot(
  children: Array<VNode | string>,
  name: 'default' | 'header' | 'footer'
): boolean {
  return children.some((child) => {
    if (typeof child === 'string') {
      return name === 'default';
    }
    return (child.slot ?? 'default') === name;
  });
}

export class DialogOverlay extends Component<
  DialogOverlayProps,
  DialogOverlayState
> {
  private readonly focusManager = new OneDialogFocusManager();
  private releaseScrollLock: (() => void) | undefined;
  private targetDocument: Document | undefined;

  public mount(container: HTMLElement): void {
    super.mount(container);
    const panel = this.getPanel();
    if (panel) {
      this.focusManager.activate(panel, this.props.isTop);
    }
  }

  protected initState(): DialogOverlayState {
    return {};
  }

  protected initStyles(): void {
    ONE_DIALOG_STYLES.forEach(({ name, ...style }) => {
      this.styleManager.addStyle(name, style);
    });
  }

  protected onMounted(): void {
    const panel = this.getPanel();
    const targetDocument = panel?.ownerDocument;
    if (!panel || !targetDocument) {
      return;
    }
    this.targetDocument = targetDocument;
    if (this.props.lockBody) {
      this.releaseScrollLock = lockOneDialogBody(targetDocument);
    }
    targetDocument.addEventListener('keydown', this.handleEscape);
  }

  protected onUnmounted(): void {
    this.targetDocument?.removeEventListener('keydown', this.handleEscape);
    this.focusManager.deactivate();
    this.releaseScrollLock?.();
    this.releaseScrollLock = undefined;
    this.targetDocument = undefined;
  }

  protected render(): VNode {
    const children = this.props.children ?? [];
    const customHeader = hasSlot(children, 'header');
    const customBody = hasSlot(children, 'default');
    const customFooter = hasSlot(children, 'footer');
    const titleId = `${this.props.id}-title`;
    const descriptionId = `${this.props.id}-description`;
    const hasHeader = customHeader || Boolean(this.props.title);
    const hasBody =
      customBody ||
      this.props.content !== undefined ||
      Boolean(this.props.description);

    return {
      tag: 'div',
      props: {
        className: [
          'one-dialog__backdrop',
          ...(!this.props.lockBody ? ['one-dialog__backdrop--contained'] : []),
        ].join(' '),
      },
      children: [
        {
          tag: 'section',
          props: {
            className: 'one-dialog',
            role: 'dialog',
            tabindex: '-1',
            'aria-modal': 'true',
            'aria-labelledby': hasHeader ? titleId : undefined,
            'aria-describedby': hasBody ? descriptionId : undefined,
          },
          children: [
            ...(hasHeader
              ? [
                  {
                    tag: 'header',
                    props: { className: 'one-dialog__header', id: titleId },
                    children: customHeader
                      ? [slot('header')]
                      : [this.props.title ?? ''],
                  } as VNode,
                ]
              : []),
            ...(hasBody
              ? [
                  {
                    tag: 'div',
                    props: { className: 'one-dialog__body', id: descriptionId },
                    children: customBody
                      ? [slot('default')]
                      : [this.props.content ?? this.props.description ?? ''],
                  } as VNode,
                ]
              : []),
            {
              tag: 'footer',
              props: { className: 'one-dialog__footer' },
              children: customFooter
                ? [slot('footer')]
                : [
                    {
                      tag: 'button',
                      props: {
                        type: 'button',
                        className: 'one-dialog__cancel',
                        disabled: this.props.confirmLoading === true,
                      },
                      children: [this.props.cancelText ?? '取消'],
                      listeners: {
                        click: () => this.requestClose('cancel'),
                      },
                    },
                    {
                      tag: 'button',
                      props: {
                        type: 'button',
                        className: 'one-dialog__confirm',
                        disabled: this.props.confirmLoading === true,
                        'aria-busy': this.props.confirmLoading
                          ? 'true'
                          : undefined,
                      },
                      children: [
                        this.props.confirmLoading
                          ? '处理中…'
                          : (this.props.confirmText ?? '确认'),
                      ],
                      listeners: {
                        click: () => this.requestClose('confirm'),
                      },
                    },
                  ],
            },
          ],
        },
      ],
      listeners: {
        click: (event) => {
          if (event.target === event.currentTarget) {
            this.requestClose('overlay');
          }
        },
      },
    };
  }

  private readonly handleEscape = (event: KeyboardEvent): void => {
    if (event.key === 'Escape') {
      this.requestClose('escape');
    }
  };

  private requestClose(reason: OneDialogCloseReason): void {
    if (!this.props.isTop() || this.props.confirmLoading) {
      return;
    }
    if (reason === 'overlay' && this.props.closeOnOverlay === false) {
      return;
    }
    if (reason === 'escape' && this.props.closeOnEscape === false) {
      return;
    }
    this.props.requestClose(reason);
  }

  private getPanel(): HTMLElement | null {
    const element = this.getElement();
    return element instanceof HTMLElement
      ? element.querySelector<HTMLElement>('.one-dialog')
      : null;
  }
}
