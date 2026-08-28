import { Component, type VNode } from '@geektech/tsone';
import type { OneNamedStyle } from '../styles/shared';
import { normalizeOneSize } from '../styles/shared';
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

export const ONE_BUTTON_STYLES: OneNamedStyle[] = [
  {
    name: 'one-button-base',
    selector: '.one-button',
    properties: {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 'var(--one-button-gap, 0.5rem)',
      border: '1px solid transparent',
      borderRadius: 'var(--one-radius-md, 0.375rem)',
      fontFamily: 'inherit',
      fontWeight: 'var(--one-font-weight-medium, 500)',
      lineHeight: 'var(--one-line-height-normal, 1.5)',
      cursor: 'pointer',
      transition: 'var(--one-transition-fast, 150ms ease)',
    },
  },
  {
    name: 'one-button-primary',
    selector: '.one-button--primary',
    properties: {
      color: 'var(--one-color-primary-contrast, #ffffff)',
      backgroundColor: 'var(--one-color-primary, #2563eb)',
    },
    hover: {
      backgroundColor: 'var(--one-color-primary-hover, #1d4ed8)',
    },
  },
  {
    name: 'one-button-secondary',
    selector: '.one-button--secondary',
    properties: {
      color: 'var(--one-color-secondary-contrast, #1f2937)',
      backgroundColor: 'var(--one-color-secondary, #e5e7eb)',
    },
    hover: {
      backgroundColor: 'var(--one-color-secondary-hover, #d1d5db)',
    },
  },
  {
    name: 'one-button-danger',
    selector: '.one-button--danger',
    properties: {
      color: 'var(--one-color-danger-contrast, #ffffff)',
      backgroundColor: 'var(--one-color-danger, #dc2626)',
    },
    hover: {
      backgroundColor: 'var(--one-color-danger-hover, #b91c1c)',
    },
  },
  {
    name: 'one-button-sm',
    selector: '.one-button--sm',
    properties: {
      minHeight: 'var(--one-button-height-sm, 2rem)',
      padding: 'var(--one-button-padding-sm, 0.25rem 0.75rem)',
      fontSize: 'var(--one-font-size-sm, 0.875rem)',
    },
  },
  {
    name: 'one-button-md',
    selector: '.one-button--md',
    properties: {
      minHeight: 'var(--one-button-height-md, 2.5rem)',
      padding: 'var(--one-button-padding-md, 0.5rem 1rem)',
      fontSize: 'var(--one-font-size-md, 1rem)',
    },
  },
  {
    name: 'one-button-lg',
    selector: '.one-button--lg',
    properties: {
      minHeight: 'var(--one-button-height-lg, 3rem)',
      padding: 'var(--one-button-padding-lg, 0.75rem 1.25rem)',
      fontSize: 'var(--one-font-size-lg, 1.125rem)',
    },
  },
  {
    name: 'one-button-disabled',
    selector: '.one-button:disabled',
    properties: {
      opacity: 'var(--one-disabled-opacity, 0.5)',
      cursor: 'not-allowed',
    },
  },
  {
    name: 'one-button-focus-visible',
    selector: '.one-button:focus-visible',
    properties: {
      outline: 'var(--one-focus-outline, 2px solid #2563eb)',
      outlineOffset: 'var(--one-focus-outline-offset, 2px)',
    },
  },
  {
    name: 'one-button-spinner',
    selector: '.one-button__spinner',
    properties: {
      width: 'var(--one-spinner-size, 1em)',
      height: 'var(--one-spinner-size, 1em)',
      border: 'var(--one-spinner-border-width, 2px) solid currentColor',
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
    const disabled = this.props.disabled === true || this.props.loading === true;

    return {
      tag: 'button',
      props: {
        className: `one-button one-button--${variant} one-button--${size}`,
        type: this.props.type ?? 'button',
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
