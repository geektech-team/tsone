import { Component, slot, type VNode } from '@geektech/tsone';
import type { OneFeedbackVariant } from '../overlay';
import { ONE_THEME_DEFAULTS, type OneNamedStyle } from '../styles/shared';

export interface OneAlertProps {
  title?: string;
  description?: string;
  variant?: OneFeedbackVariant;
  closable?: boolean;
  children?: Array<VNode | string>;
}

interface OneAlertState {
  visible: boolean;
}

const VARIANTS: readonly OneFeedbackVariant[] = [
  'info',
  'success',
  'warning',
  'error',
];

const DEFAULT_ICONS: Record<OneFeedbackVariant, string> = {
  info: 'i',
  success: '✓',
  warning: '!',
  error: '×',
};

export const ONE_ALERT_STYLES: OneNamedStyle[] = [
  {
    name: 'one-alert-base',
    selector: '.one-alert',
    properties: {
      display: 'grid',
      gridTemplateColumns: 'auto minmax(0, 1fr) auto',
      gap: `var(--one-alert-gap, var(--one-space-sm, ${ONE_THEME_DEFAULTS.spaceSm}))`,
      alignItems: 'start',
      padding: `var(--one-alert-padding, var(--one-space-md, ${ONE_THEME_DEFAULTS.spaceMd}))`,
      color: `var(--one-alert-color, var(--one-color-text, ${ONE_THEME_DEFAULTS.colorText}))`,
      backgroundColor: `var(--one-alert-background, var(--one-color-surface, ${ONE_THEME_DEFAULTS.colorSurface}))`,
      border: `1px solid var(--one-alert-border-color, var(--one-color-border, ${ONE_THEME_DEFAULTS.colorBorder}))`,
      borderRadius: `var(--one-alert-radius, var(--one-radius-md, ${ONE_THEME_DEFAULTS.radiusMd}))`,
    },
  },
  {
    name: 'one-alert-info',
    selector: '.one-alert--info',
    properties: {
      borderColor: `var(--one-color-info, ${ONE_THEME_DEFAULTS.colorInfo})`,
    },
  },
  {
    name: 'one-alert-success',
    selector: '.one-alert--success',
    properties: {
      borderColor: `var(--one-color-success, ${ONE_THEME_DEFAULTS.colorSuccess})`,
    },
  },
  {
    name: 'one-alert-warning',
    selector: '.one-alert--warning',
    properties: {
      borderColor: `var(--one-color-warning, ${ONE_THEME_DEFAULTS.colorWarning})`,
    },
  },
  {
    name: 'one-alert-error',
    selector: '.one-alert--error',
    properties: {
      borderColor: `var(--one-color-danger, ${ONE_THEME_DEFAULTS.colorDanger})`,
    },
  },
  {
    name: 'one-alert-icon',
    selector: '.one-alert__icon',
    properties: {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      minWidth: '20px',
      fontWeight: '700',
    },
  },
  {
    name: 'one-alert-title',
    selector: '.one-alert__title',
    properties: { fontWeight: '600' },
  },
  {
    name: 'one-alert-description',
    selector: '.one-alert__description',
    properties: {
      marginTop: `var(--one-space-xs, ${ONE_THEME_DEFAULTS.spaceXs})`,
      color: `var(--one-color-muted, ${ONE_THEME_DEFAULTS.colorMuted})`,
    },
  },
  {
    name: 'one-alert-actions',
    selector: '.one-alert__actions',
    properties: { alignSelf: 'center' },
  },
  {
    name: 'one-alert-controls',
    selector: '.one-alert__controls',
    properties: {
      display: 'inline-flex',
      gap: `var(--one-space-sm, ${ONE_THEME_DEFAULTS.spaceSm})`,
      alignItems: 'center',
    },
  },
  {
    name: 'one-alert-close',
    selector: '.one-alert__close',
    properties: {
      padding: '2px',
      color: 'inherit',
      backgroundColor: 'transparent',
      border: '0',
      cursor: 'pointer',
    },
  },
];

function normalizeVariant(value: unknown): OneFeedbackVariant {
  return VARIANTS.includes(value as OneFeedbackVariant)
    ? (value as OneFeedbackVariant)
    : 'info';
}

function hasNamedSlot(
  children: Array<VNode | string>,
  name: 'icon' | 'actions'
): boolean {
  return children.some(
    (child) => typeof child !== 'string' && child.slot === name
  );
}

function hasDefaultSlot(children: Array<VNode | string>): boolean {
  return children.some(
    (child) => typeof child === 'string' || child.slot === undefined
  );
}

export class OneAlert extends Component<OneAlertProps, OneAlertState> {
  protected initState(): OneAlertState {
    return { visible: true };
  }

  protected initStyles(): void {
    ONE_ALERT_STYLES.forEach(({ name, ...style }) => {
      this.styleManager.addStyle(name, style);
    });
  }

  protected render(): VNode {
    if (!this.state.visible) {
      return {
        tag: 'span',
        props: { hidden: true, 'data-one-alert-anchor': '' },
      };
    }

    const variant = normalizeVariant(this.props.variant);
    const children = this.props.children ?? [];
    const customIcon = hasNamedSlot(children, 'icon');
    const customActions = hasNamedSlot(children, 'actions');
    const customDescription = hasDefaultSlot(children);

    return {
      tag: 'section',
      props: {
        className: `one-alert one-alert--${variant}`,
        role: variant === 'warning' || variant === 'error' ? 'alert' : 'status',
      },
      children: [
        {
          tag: 'div',
          props: { className: 'one-alert__icon', 'aria-hidden': 'true' },
          children: customIcon ? [slot('icon')] : [DEFAULT_ICONS[variant]],
        },
        {
          tag: 'div',
          props: { className: 'one-alert__content' },
          children: [
            ...(this.props.title
              ? [
                  {
                    tag: 'div',
                    props: { className: 'one-alert__title' },
                    children: [this.props.title],
                  } as VNode,
                ]
              : []),
            ...(customDescription || this.props.description
              ? [
                  {
                    tag: 'div',
                    props: { className: 'one-alert__description' },
                    children: customDescription
                      ? [slot('default')]
                      : [this.props.description ?? ''],
                  } as VNode,
                ]
              : []),
          ],
        },
        ...(customActions || this.props.closable
          ? [
              {
                tag: 'div',
                props: { className: 'one-alert__controls' },
                children: [
                  ...(customActions
                    ? [
                        {
                          tag: 'div',
                          props: { className: 'one-alert__actions' },
                          children: [slot('actions')],
                        } as VNode,
                      ]
                    : []),
                  ...(this.props.closable
                    ? [
                        {
                          tag: 'button',
                          props: {
                            type: 'button',
                            className: 'one-alert__close',
                            'aria-label': '关闭提示',
                          },
                          children: ['×'],
                          listeners: { click: () => this.close() },
                        } as VNode,
                      ]
                    : []),
                ],
              } as VNode,
            ]
          : []),
      ],
    };
  }

  private close(): void {
    if (!this.state.visible) {
      return;
    }
    this.emit('close');
    this.state.visible = false;
  }
}
