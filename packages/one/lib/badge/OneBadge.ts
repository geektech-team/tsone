import { Component, type VNode } from '@geektech/tsone';
import {
  normalizeOneDataDisplayVariant,
  type OneDataDisplayVariant,
} from '../data-display';
import {
  ONE_THEME_DEFAULTS,
  ONE_THEME_TYPOGRAPHY_PROPERTIES,
  oneThemeBorder,
  type OneNamedStyle,
} from '../styles/shared';

export interface OneBadgeProps {
  value?: number | string;
  max?: number;
  dot?: boolean;
  showZero?: boolean;
  variant?: OneDataDisplayVariant;
  ariaLabel?: string;
  children?: Array<VNode | string>;
}

export const ONE_BADGE_STYLES: OneNamedStyle[] = [
  {
    name: 'one-badge-base',
    selector: '.one-badge',
    properties: {
      ...ONE_THEME_TYPOGRAPHY_PROPERTIES,
      position: 'relative',
      display: 'inline-flex',
      verticalAlign: 'middle',
    },
  },
  {
    name: 'one-badge-content',
    selector: '.one-badge__content',
    properties: {
      position: 'absolute',
      top: '0',
      right: '0',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      boxSizing: 'border-box',
      minWidth: '18px',
      height: '18px',
      padding: '0 5px',
      borderRadius: '999px',
      fontFamily: `var(--one-font-family, ${ONE_THEME_DEFAULTS.fontFamily})`,
      fontSize: `var(--one-font-size-sm, ${ONE_THEME_DEFAULTS.fontSizeSm})`,
      lineHeight: '1',
      transform: 'translate(50%, -50%)',
    },
  },
  {
    name: 'one-badge-standalone-content',
    selector: '.one-badge--standalone .one-badge__content',
    properties: {
      position: 'static',
      transform: 'none',
    },
  },
  {
    name: 'one-badge-dot',
    selector: '.one-badge__content--dot',
    properties: {
      width: '8px',
      minWidth: '8px',
      height: '8px',
      padding: '0',
    },
  },
  {
    name: 'one-badge-neutral',
    selector: '.one-badge--neutral .one-badge__content',
    properties: {
      color: `var(--one-color-text, ${ONE_THEME_DEFAULTS.colorText})`,
      backgroundColor: `var(--one-color-surface, ${ONE_THEME_DEFAULTS.colorSurface})`,
      border: oneThemeBorder(),
    },
  },
  {
    name: 'one-badge-primary',
    selector: '.one-badge--primary .one-badge__content',
    properties: {
      color: `var(--one-color-primary-contrast, ${ONE_THEME_DEFAULTS.colorText})`,
      backgroundColor: `var(--one-color-primary, ${ONE_THEME_DEFAULTS.colorPrimary})`,
    },
  },
  {
    name: 'one-badge-success',
    selector: '.one-badge--success .one-badge__content',
    properties: {
      color: `var(--one-color-surface, ${ONE_THEME_DEFAULTS.colorSurface})`,
      backgroundColor: `var(--one-color-success, ${ONE_THEME_DEFAULTS.colorSuccess})`,
    },
  },
  {
    name: 'one-badge-warning',
    selector: '.one-badge--warning .one-badge__content',
    properties: {
      color: `var(--one-color-surface, ${ONE_THEME_DEFAULTS.colorSurface})`,
      backgroundColor: `var(--one-color-warning, ${ONE_THEME_DEFAULTS.colorWarning})`,
    },
  },
  {
    name: 'one-badge-error',
    selector: '.one-badge--error .one-badge__content',
    properties: {
      color: `var(--one-color-surface, ${ONE_THEME_DEFAULTS.colorSurface})`,
      backgroundColor: `var(--one-color-danger, ${ONE_THEME_DEFAULTS.colorDanger})`,
    },
  },
];

function normalizeMax(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0
    ? Math.floor(value)
    : 99;
}

function displayValue(props: OneBadgeProps): string | undefined {
  if (props.dot) {
    return '';
  }
  if (props.value === undefined || props.value === '') {
    return undefined;
  }
  if (props.value === 0 && props.showZero !== true) {
    return undefined;
  }
  if (typeof props.value === 'number' && !Number.isFinite(props.value)) {
    return undefined;
  }
  if (typeof props.value === 'number') {
    const max = normalizeMax(props.max);
    return props.value > max ? `${max}+` : String(props.value);
  }
  return props.value;
}

export class OneBadge extends Component<OneBadgeProps> {
  protected initState(): object {
    return {};
  }

  protected initStyles(): void {
    ONE_BADGE_STYLES.forEach(({ name, ...style }) => {
      this.styleManager.addStyle(name, style);
    });
  }

  protected render(): VNode {
    const children = this.props.children ?? [];
    const standalone = children.length === 0;
    const variant = normalizeOneDataDisplayVariant(
      this.props.variant,
      'primary'
    );
    const value = displayValue(this.props);
    const showContent = this.props.dot === true || value !== undefined;

    return {
      tag: 'span',
      props: {
        className: [
          'one-badge',
          `one-badge--${variant}`,
          ...(standalone ? ['one-badge--standalone'] : []),
        ].join(' '),
      },
      children: [
        ...children,
        ...(showContent
          ? [
              {
                tag: 'span',
                props: {
                  className: [
                    'one-badge__content',
                    ...(this.props.dot ? ['one-badge__content--dot'] : []),
                  ].join(' '),
                  'aria-label': this.props.ariaLabel,
                  'aria-hidden':
                    this.props.dot && !this.props.ariaLabel
                      ? 'true'
                      : undefined,
                },
                children: value ? [value] : [],
              } as VNode,
            ]
          : []),
      ],
    };
  }
}
