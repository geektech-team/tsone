import { Component, type VNode } from '@geektech/tsone';
import {
  normalizeOneSize,
  ONE_THEME_DEFAULTS,
  ONE_THEME_TYPOGRAPHY_PROPERTIES,
  oneThemeBorder,
  type OneNamedStyle,
} from '../styles/shared';
import type { OneComponentSize } from '../types';

export type OneButtonVariant = 'primary' | 'secondary' | 'danger';

export interface OneButtonProps {
  variant?: OneButtonVariant;
  size?: OneComponentSize;
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
  loading?: boolean;
  children?: Array<VNode | string>;
}

const ONE_BUTTON_VARIANTS: readonly OneButtonVariant[] = [
  'primary',
  'secondary',
  'danger',
];

const ONE_BUTTON_TYPES: readonly NonNullable<OneButtonProps['type']>[] = [
  'button',
  'submit',
  'reset',
];

export const ONE_BUTTON_STYLES: OneNamedStyle[] = [
  {
    name: 'one-button-base',
    selector: '.one-button',
    properties: {
      ...ONE_THEME_TYPOGRAPHY_PROPERTIES,
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: `var(--one-button-gap, var(--one-space-sm, ${ONE_THEME_DEFAULTS.spaceSm}))`,
      border: oneThemeBorder('transparent'),
      borderRadius: `var(--one-radius-md, ${ONE_THEME_DEFAULTS.radiusMd})`,
      fontWeight: '500',
      cursor: 'pointer',
      transition: '150ms ease',
    },
  },
  {
    name: 'one-button-primary',
    selector: '.one-button--primary',
    properties: {
      color: `var(--one-color-primary-contrast, ${ONE_THEME_DEFAULTS.colorText})`,
      backgroundColor: `var(--one-color-primary, ${ONE_THEME_DEFAULTS.colorPrimary})`,
    },
    hover: {
      backgroundColor: `var(--one-color-primary-hover, ${ONE_THEME_DEFAULTS.colorPrimaryHover})`,
    },
  },
  {
    name: 'one-button-secondary',
    selector: '.one-button--secondary',
    properties: {
      color: `var(--one-color-secondary-contrast, ${ONE_THEME_DEFAULTS.colorText})`,
      backgroundColor: `var(--one-color-secondary, ${ONE_THEME_DEFAULTS.colorSurface})`,
    },
    hover: {
      backgroundColor: `var(--one-color-secondary-hover, ${ONE_THEME_DEFAULTS.colorBorder})`,
    },
  },
  {
    name: 'one-button-danger',
    selector: '.one-button--danger',
    properties: {
      color: `var(--one-color-danger-contrast, ${ONE_THEME_DEFAULTS.colorSurface})`,
      backgroundColor: `var(--one-color-danger, ${ONE_THEME_DEFAULTS.colorDanger})`,
    },
    hover: {
      backgroundColor: `var(--one-color-danger-hover, ${ONE_THEME_DEFAULTS.colorDangerHover})`,
    },
  },
  {
    name: 'one-button-sm',
    selector: '.one-button--sm',
    properties: {
      minHeight: '32px',
      padding: `var(--one-button-padding-sm, ${ONE_THEME_DEFAULTS.spaceXs} ${ONE_THEME_DEFAULTS.spaceMd})`,
      fontSize: `var(--one-font-size-sm, ${ONE_THEME_DEFAULTS.fontSizeSm})`,
    },
  },
  {
    name: 'one-button-md',
    selector: '.one-button--md',
    properties: {
      minHeight: '40px',
      padding: `var(--one-button-padding-md, ${ONE_THEME_DEFAULTS.spaceSm} ${ONE_THEME_DEFAULTS.spaceLg})`,
      fontSize: `var(--one-font-size-md, ${ONE_THEME_DEFAULTS.fontSizeMd})`,
    },
  },
  {
    name: 'one-button-lg',
    selector: '.one-button--lg',
    properties: {
      minHeight: '48px',
      padding: `var(--one-button-padding-lg, ${ONE_THEME_DEFAULTS.spaceMd} ${ONE_THEME_DEFAULTS.spaceLg})`,
      fontSize: `var(--one-font-size-lg, ${ONE_THEME_DEFAULTS.fontSizeLg})`,
    },
  },
  {
    name: 'one-button-disabled',
    selector: '.one-button:disabled',
    properties: {
      opacity: '0.5',
      cursor: 'not-allowed',
    },
  },
  {
    name: 'one-button-focus-visible',
    selector: '.one-button:focus-visible',
    properties: {
      outline: `2px solid var(--one-color-focus, ${ONE_THEME_DEFAULTS.colorFocus})`,
      outlineOffset: '2px',
    },
  },
  {
    name: 'one-button-spinner',
    selector: '.one-button__spinner',
    properties: {
      width: '1em',
      height: '1em',
      border: '2px solid currentColor',
      borderRightColor: 'transparent',
      borderRadius: '50%',
    },
  },
];

export function normalizeButtonVariant(value: unknown): OneButtonVariant {
  return ONE_BUTTON_VARIANTS.includes(value as OneButtonVariant)
    ? (value as OneButtonVariant)
    : 'primary';
}

function normalizeButtonType(
  value: unknown
): NonNullable<OneButtonProps['type']> {
  return ONE_BUTTON_TYPES.includes(value as NonNullable<OneButtonProps['type']>)
    ? (value as NonNullable<OneButtonProps['type']>)
    : 'button';
}

export class OneButton extends Component<OneButtonProps> {
  protected initState(): object {
    return {};
  }

  protected initStyles(): void {
    ONE_BUTTON_STYLES.forEach(({ name, ...style }) => {
      this.styleManager.addStyle(name, style);
    });
  }

  protected render(): VNode {
    const variant = normalizeButtonVariant(this.props.variant);
    const size = normalizeOneSize(this.props.size);
    const disabled =
      this.props.disabled === true || this.props.loading === true;

    return {
      tag: 'button',
      props: {
        className: `one-button one-button--${variant} one-button--${size}`,
        type: normalizeButtonType(this.props.type),
        disabled,
        'aria-busy': this.props.loading === true ? 'true' : undefined,
      },
      listeners: {
        click: (event) => {
          if (!disabled && event instanceof MouseEvent) {
            this.emit('click', event);
          }
        },
      },
      children: [
        ...(this.props.loading
          ? [
              {
                tag: 'span',
                props: {
                  className: 'one-button__spinner',
                  'aria-hidden': 'true',
                },
              } as VNode,
            ]
          : []),
        ...(this.props.children ?? []),
      ],
    };
  }
}
