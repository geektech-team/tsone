import { type VNode } from '@geektech/tsone';
import { OneLocalizedComponent } from '../i18n';
import type { OneFeedbackVariant } from '../overlay';
import {
  ONE_THEME_DEFAULTS,
  ONE_THEME_TYPOGRAPHY_PROPERTIES,
  oneThemeBorder,
  type OneNamedStyle,
} from '../styles/shared';
import type { OneMessageOptions, OneMessagePlacement } from './types';
import { OneMessageTimer } from './timer';

export interface MessageOverlayProps
  extends Omit<OneMessageOptions, 'container'> {
  variant: OneFeedbackVariant;
  duration: number;
  placement: OneMessagePlacement;
  requestClose(): void;
}

export const ONE_MESSAGE_STYLES: OneNamedStyle[] = [
  {
    name: 'one-message-group',
    selector: '.one-overlay-group--message',
    properties: {
      position: 'fixed',
      zIndex: `var(--one-z-index-message, ${ONE_THEME_DEFAULTS.zIndexMessage})`,
      display: 'flex',
      flexDirection: 'column',
      gap: `var(--one-space-sm, ${ONE_THEME_DEFAULTS.spaceSm})`,
      width: 'min(420px, calc(100vw - 32px))',
      pointerEvents: 'none',
    },
  },
  {
    name: 'one-message-group-top',
    selector: '.one-overlay-group--message[data-one-message-placement^="top"]',
    properties: { top: '16px' },
  },
  {
    name: 'one-message-group-bottom',
    selector:
      '.one-overlay-group--message[data-one-message-placement^="bottom"]',
    properties: { bottom: '16px', flexDirection: 'column-reverse' },
  },
  {
    name: 'one-message-group-center',
    selector:
      '.one-overlay-group--message[data-one-message-placement="top"], .one-overlay-group--message[data-one-message-placement="bottom"]',
    properties: { left: '50%', transform: 'translateX(-50%)' },
  },
  {
    name: 'one-message-group-start',
    selector:
      '.one-overlay-group--message[data-one-message-placement$="start"]',
    properties: { left: '16px' },
  },
  {
    name: 'one-message-group-end',
    selector: '.one-overlay-group--message[data-one-message-placement$="end"]',
    properties: { right: '16px' },
  },
  {
    name: 'one-message-base',
    selector: '.one-message',
    properties: {
      ...ONE_THEME_TYPOGRAPHY_PROPERTIES,
      display: 'grid',
      gridTemplateColumns: 'minmax(0, 1fr) auto',
      alignItems: 'center',
      gap: `var(--one-space-sm, ${ONE_THEME_DEFAULTS.spaceSm})`,
      boxSizing: 'border-box',
      padding: `var(--one-space-md, ${ONE_THEME_DEFAULTS.spaceMd}) var(--one-space-lg, ${ONE_THEME_DEFAULTS.spaceLg})`,
      color: `var(--one-color-text, ${ONE_THEME_DEFAULTS.colorText})`,
      backgroundColor: `var(--one-color-surface, ${ONE_THEME_DEFAULTS.colorSurface})`,
      border: oneThemeBorder(),
      borderRadius: `var(--one-radius-md, ${ONE_THEME_DEFAULTS.radiusMd})`,
      boxShadow: `var(--one-shadow-overlay, ${ONE_THEME_DEFAULTS.shadowOverlay})`,
      pointerEvents: 'auto',
    },
  },
  {
    name: 'one-message-info',
    selector: '.one-message--info',
    properties: {
      borderColor: `var(--one-color-info, ${ONE_THEME_DEFAULTS.colorInfo})`,
    },
  },
  {
    name: 'one-message-success',
    selector: '.one-message--success',
    properties: {
      borderColor: `var(--one-color-success, ${ONE_THEME_DEFAULTS.colorSuccess})`,
    },
  },
  {
    name: 'one-message-warning',
    selector: '.one-message--warning',
    properties: {
      borderColor: `var(--one-color-warning, ${ONE_THEME_DEFAULTS.colorWarning})`,
    },
  },
  {
    name: 'one-message-error',
    selector: '.one-message--error',
    properties: {
      borderColor: `var(--one-color-danger, ${ONE_THEME_DEFAULTS.colorDanger})`,
    },
  },
  {
    name: 'one-message-close',
    selector: '.one-message__close',
    properties: {
      padding: '2px',
      color: 'inherit',
      backgroundColor: 'transparent',
      border: '0',
      cursor: 'pointer',
    },
  },
];

interface MessageOverlayState {}

export class MessageOverlay extends OneLocalizedComponent<
  MessageOverlayProps,
  MessageOverlayState
> {
  private timer: OneMessageTimer | undefined;

  public mount(container: HTMLElement): void {
    super.mount(container);
    this.decorateGroup();
  }

  protected initState(): MessageOverlayState {
    return {};
  }

  protected initStyles(): void {
    ONE_MESSAGE_STYLES.forEach(({ name, ...style }) => {
      this.styleManager.addStyle(name, style);
    });
  }

  protected onMounted(): void {
    this.timer = new OneMessageTimer(this.props.duration, undefined, () => {
      this.props.requestClose();
    });
  }

  protected onUnmounted(): void {
    this.timer?.dispose();
    this.timer = undefined;
  }

  public setProps(props: Partial<MessageOverlayProps>): void {
    const durationChanged =
      props.duration !== undefined && props.duration !== this.props.duration;
    super.setProps(props);
    if (durationChanged) {
      this.timer?.reset(this.props.duration);
    }
  }

  protected render(): VNode {
    const urgent =
      this.props.variant === 'warning' || this.props.variant === 'error';
    return {
      tag: 'div',
      props: {
        className: `one-message one-message--${this.props.variant}`,
        role: urgent ? 'alert' : 'status',
        'data-one-message-placement': this.props.placement,
      },
      children: [
        {
          tag: 'div',
          props: { className: 'one-message__content' },
          children: [this.props.content],
        },
        ...(this.props.closable
          ? [
              {
                tag: 'button',
                props: {
                  type: 'button',
                  className: 'one-message__close',
                  'aria-label': this.t('one.message.close'),
                },
                children: ['×'],
                listeners: { click: () => this.props.requestClose() },
              } as VNode,
            ]
          : []),
      ],
      listeners: {
        mouseenter: () => this.timer?.pause(),
        mouseleave: () => this.timer?.resume(),
      },
    };
  }

  private decorateGroup(): void {
    const element = this.getElement();
    if (!(element instanceof HTMLElement)) {
      return;
    }
    const group = element.parentElement?.parentElement;
    if (group?.dataset.oneOverlayKind !== 'message') {
      return;
    }
    group.classList.add('one-overlay-group', 'one-overlay-group--message');
    group.dataset.oneMessagePlacement = this.props.placement;
  }
}
