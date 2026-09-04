import { Component, type VNode } from '@geektech/tsone';
import {
  ONE_THEME_DEFAULTS,
  ONE_THEME_TYPOGRAPHY_PROPERTIES,
  type OneNamedStyle,
} from '../styles/shared';

export type OneDividerDirection = 'horizontal' | 'vertical';
export type OneDividerTextAlign = 'left' | 'center' | 'right';

export interface OneDividerProps {
  direction?: OneDividerDirection;
  text?: string;
  textAlign?: OneDividerTextAlign;
}

export const ONE_DIVIDER_STYLES: OneNamedStyle[] = [
  {
    name: 'one-divider-base',
    selector: '.one-divider',
    properties: {
      ...ONE_THEME_TYPOGRAPHY_PROPERTIES,
      boxSizing: 'border-box',
      margin: '0',
      color: `var(--one-color-muted, ${ONE_THEME_DEFAULTS.colorMuted})`,
      borderTop: `var(--one-border-width, 1px) var(--one-border-style, solid) var(--one-color-border, ${ONE_THEME_DEFAULTS.colorBorder})`,
    },
  },
  {
    name: 'one-divider-vertical',
    selector: '.one-divider--vertical',
    properties: {
      display: 'inline-block',
      width: '1px',
      height: '1em',
      verticalAlign: 'middle',
      borderTop: '0',
      borderLeft: `var(--one-border-width, 1px) var(--one-border-style, solid) var(--one-color-border, ${ONE_THEME_DEFAULTS.colorBorder})`,
    },
  },
  {
    name: 'one-divider-with-text',
    selector: '.one-divider--with-text',
    properties: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      whiteSpace: 'nowrap',
      borderTop: '0',
    },
  },
  {
    name: 'one-divider-line',
    selector: '.one-divider__line',
    properties: {
      flex: '1 1 auto',
      borderTop: `var(--one-border-width, 1px) var(--one-border-style, solid) var(--one-color-border, ${ONE_THEME_DEFAULTS.colorBorder})`,
    },
  },
  {
    name: 'one-divider-text',
    selector: '.one-divider__text',
    properties: {
      color: `var(--one-color-text, ${ONE_THEME_DEFAULTS.colorText})`,
      fontSize: `var(--one-font-size-md, ${ONE_THEME_DEFAULTS.fontSizeMd})`,
    },
  },
  {
    name: 'one-divider-text-left',
    selector: '.one-divider--text-left .one-divider__line:first-child',
    properties: { flex: '0 0 48px' },
  },
  {
    name: 'one-divider-text-right',
    selector: '.one-divider--text-right .one-divider__line:last-child',
    properties: { flex: '0 0 48px' },
  },
];

export function normalizeOneDividerDirection(
  value: unknown
): OneDividerDirection {
  return value === 'vertical' ? 'vertical' : 'horizontal';
}

export class OneDivider extends Component<
  OneDividerProps,
  Record<string, never>
> {
  protected initState(): Record<string, never> {
    return {};
  }

  protected initStyles(): void {
    ONE_DIVIDER_STYLES.forEach(({ name, ...style }) => {
      this.styleManager.addStyle(name, style);
    });
  }

  protected render(): VNode {
    const direction = normalizeOneDividerDirection(this.props.direction);
    if (direction === 'vertical') {
      return {
        tag: 'span',
        props: {
          className: 'one-divider one-divider--vertical',
          'aria-hidden': 'true',
        },
        children: [],
      };
    }

    const text = this.props.text ?? '';
    if (!text) {
      return {
        tag: 'div',
        props: { className: 'one-divider' },
        children: [],
      };
    }

    const align = this.props.textAlign ?? 'center';
    return {
      tag: 'div',
      props: {
        className: `one-divider one-divider--with-text one-divider--text-${align}`,
      },
      children: [
        { tag: 'span', props: { className: 'one-divider__line' }, children: [] },
        { tag: 'span', props: { className: 'one-divider__text' }, children: [text] },
        { tag: 'span', props: { className: 'one-divider__line' }, children: [] },
      ],
    };
  }
}
