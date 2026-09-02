import { Component, type VNode } from '@geektech/tsone';
import {
  normalizeOneDataDisplayVariant,
  type OneDataDisplayVariant,
} from '../data-display';
import {
  ONE_THEME_DEFAULTS,
  ONE_THEME_TYPOGRAPHY_PROPERTIES,
  type OneNamedStyle,
} from '../styles/shared';

export interface OneProgressProps {
  percent?: number;
  variant?: OneDataDisplayVariant;
  showText?: boolean;
  ariaLabel?: string;
}

export const ONE_PROGRESS_STYLES: OneNamedStyle[] = [
  {
    name: 'one-progress-base',
    selector: '.one-progress',
    properties: {
      ...ONE_THEME_TYPOGRAPHY_PROPERTIES,
      display: 'flex',
      alignItems: 'center',
      gap: `var(--one-space-sm, ${ONE_THEME_DEFAULTS.spaceSm})`,
    },
  },
  {
    name: 'one-progress-track',
    selector: '.one-progress__track',
    properties: {
      flex: '1',
      height: '8px',
      overflow: 'hidden',
      borderRadius: '999px',
      backgroundColor: `var(--one-color-border, ${ONE_THEME_DEFAULTS.colorBorder})`,
    },
  },
  {
    name: 'one-progress-bar',
    selector: '.one-progress__bar',
    properties: {
      height: '100%',
      borderRadius: '999px',
      backgroundColor: `var(--one-color-primary, ${ONE_THEME_DEFAULTS.colorPrimary})`,
      transition: 'width 150ms ease',
    },
  },
  {
    name: 'one-progress-neutral',
    selector: '.one-progress__bar--neutral',
    properties: {
      backgroundColor: `var(--one-color-muted, ${ONE_THEME_DEFAULTS.colorMuted})`,
    },
  },
  {
    name: 'one-progress-primary',
    selector: '.one-progress__bar--primary',
    properties: {
      backgroundColor: `var(--one-color-primary, ${ONE_THEME_DEFAULTS.colorPrimary})`,
    },
  },
  {
    name: 'one-progress-success',
    selector: '.one-progress__bar--success',
    properties: {
      backgroundColor: `var(--one-color-success, ${ONE_THEME_DEFAULTS.colorSuccess})`,
    },
  },
  {
    name: 'one-progress-warning',
    selector: '.one-progress__bar--warning',
    properties: {
      backgroundColor: `var(--one-color-warning, ${ONE_THEME_DEFAULTS.colorWarning})`,
    },
  },
  {
    name: 'one-progress-error',
    selector: '.one-progress__bar--error',
    properties: {
      backgroundColor: `var(--one-color-danger, ${ONE_THEME_DEFAULTS.colorDanger})`,
    },
  },
  {
    name: 'one-progress-text',
    selector: '.one-progress__text',
    properties: {
      minWidth: '3em',
      textAlign: 'right',
      fontSize: `var(--one-font-size-sm, ${ONE_THEME_DEFAULTS.fontSizeSm})`,
      color: `var(--one-color-muted, ${ONE_THEME_DEFAULTS.colorMuted})`,
    },
  },
];

function normalizePercent(value: unknown): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return 0;
  return Math.min(100, Math.max(0, value));
}

export class OneProgress extends Component<OneProgressProps> {
  protected initState(): object {
    return {};
  }

  protected initStyles(): void {
    ONE_PROGRESS_STYLES.forEach(({ name, ...style }) => {
      this.styleManager.addStyle(name, style);
    });
  }

  protected render(): VNode {
    const percent = normalizePercent(this.props.percent);
    const rounded = Math.round(percent);
    const variant = normalizeOneDataDisplayVariant(
      this.props.variant,
      'primary'
    );

    return {
      tag: 'div',
      props: {
        className: 'one-progress',
        role: 'progressbar',
        'aria-valuemin': '0',
        'aria-valuemax': '100',
        'aria-valuenow': String(rounded),
        'aria-valuetext': `${rounded}%`,
        'aria-label': this.props.ariaLabel,
      },
      children: [
        {
          tag: 'div',
          props: { className: 'one-progress__track' },
          children: [
            {
              tag: 'div',
              props: {
                className: `one-progress__bar one-progress__bar--${variant}`,
                style: { width: `${percent}%` },
              },
            } as VNode,
          ],
        } as VNode,
        ...(this.props.showText
          ? [
              {
                tag: 'span',
                props: { className: 'one-progress__text' },
                children: [`${rounded}%`],
              } as VNode,
            ]
          : []),
      ],
    };
  }
}
