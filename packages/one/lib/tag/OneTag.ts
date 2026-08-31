import { Component, type VNode } from '@geektech/tsone';
import {
  normalizeOneDataDisplayVariant,
  type OneDataDisplayVariant,
} from '../data-display';
import {
  normalizeOneSize,
  ONE_THEME_DEFAULTS,
  type OneNamedStyle,
} from '../styles/shared';
import type { OneComponentSize } from '../types';

export interface OneTagProps {
  variant?: OneDataDisplayVariant;
  size?: OneComponentSize;
  closable?: boolean;
  children?: Array<VNode | string>;
}

interface OneTagState {
  visible: boolean;
}

export const ONE_TAG_STYLES: OneNamedStyle[] = [
  {
    name: 'one-tag-base',
    selector: '.one-tag',
    properties: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: ONE_THEME_DEFAULTS.spaceXs,
      border: `1px solid var(--one-color-border, ${ONE_THEME_DEFAULTS.colorBorder})`,
      borderRadius: `var(--one-radius-sm, ${ONE_THEME_DEFAULTS.radiusSm})`,
      fontFamily: `var(--one-font-family, ${ONE_THEME_DEFAULTS.fontFamily})`,
      lineHeight: '1.5',
    },
  },
  {
    name: 'one-tag-neutral',
    selector: '.one-tag--neutral',
    properties: {
      color: `var(--one-color-text, ${ONE_THEME_DEFAULTS.colorText})`,
      backgroundColor: `var(--one-color-surface, ${ONE_THEME_DEFAULTS.colorSurface})`,
      borderColor: `var(--one-color-border, ${ONE_THEME_DEFAULTS.colorBorder})`,
    },
  },
  {
    name: 'one-tag-primary',
    selector: '.one-tag--primary',
    properties: {
      color: `var(--one-color-primary-contrast, ${ONE_THEME_DEFAULTS.colorText})`,
      backgroundColor: `var(--one-color-primary, ${ONE_THEME_DEFAULTS.colorPrimary})`,
      borderColor: `var(--one-color-primary, ${ONE_THEME_DEFAULTS.colorPrimary})`,
    },
  },
  {
    name: 'one-tag-success',
    selector: '.one-tag--success',
    properties: {
      color: `var(--one-color-success, ${ONE_THEME_DEFAULTS.colorSuccess})`,
      backgroundColor: `var(--one-color-surface, ${ONE_THEME_DEFAULTS.colorSurface})`,
      borderColor: `var(--one-color-success, ${ONE_THEME_DEFAULTS.colorSuccess})`,
    },
  },
  {
    name: 'one-tag-warning',
    selector: '.one-tag--warning',
    properties: {
      color: `var(--one-color-warning, ${ONE_THEME_DEFAULTS.colorWarning})`,
      backgroundColor: `var(--one-color-surface, ${ONE_THEME_DEFAULTS.colorSurface})`,
      borderColor: `var(--one-color-warning, ${ONE_THEME_DEFAULTS.colorWarning})`,
    },
  },
  {
    name: 'one-tag-error',
    selector: '.one-tag--error',
    properties: {
      color: `var(--one-color-danger, ${ONE_THEME_DEFAULTS.colorDanger})`,
      backgroundColor: `var(--one-color-surface, ${ONE_THEME_DEFAULTS.colorSurface})`,
      borderColor: `var(--one-color-danger, ${ONE_THEME_DEFAULTS.colorDanger})`,
    },
  },
  {
    name: 'one-tag-sm',
    selector: '.one-tag--sm',
    properties: {
      padding: '2px 6px',
      fontSize: `var(--one-font-size-sm, ${ONE_THEME_DEFAULTS.fontSizeSm})`,
    },
  },
  {
    name: 'one-tag-md',
    selector: '.one-tag--md',
    properties: {
      padding: '4px 8px',
      fontSize: `var(--one-font-size-md, ${ONE_THEME_DEFAULTS.fontSizeMd})`,
    },
  },
  {
    name: 'one-tag-lg',
    selector: '.one-tag--lg',
    properties: {
      padding: '6px 10px',
      fontSize: `var(--one-font-size-lg, ${ONE_THEME_DEFAULTS.fontSizeLg})`,
    },
  },
  {
    name: 'one-tag-close',
    selector: '.one-tag__close',
    properties: {
      display: 'inline-grid',
      placeItems: 'center',
      padding: '0',
      color: 'inherit',
      backgroundColor: 'transparent',
      border: '0',
      cursor: 'pointer',
      font: 'inherit',
      lineHeight: '1',
    },
  },
  {
    name: 'one-tag-close-focus-visible',
    selector: '.one-tag__close:focus-visible',
    properties: {
      outline: `2px solid var(--one-color-focus, ${ONE_THEME_DEFAULTS.colorFocus})`,
      outlineOffset: '2px',
    },
  },
];

export class OneTag extends Component<OneTagProps, OneTagState> {
  protected initState(): OneTagState {
    return { visible: true };
  }

  protected initStyles(): void {
    ONE_TAG_STYLES.forEach(({ name, ...style }) => {
      this.styleManager.addStyle(name, style);
    });
  }

  protected render(): VNode {
    if (!this.state.visible) {
      return {
        tag: 'span',
        props: { hidden: true, 'data-one-tag-anchor': '' },
      };
    }

    const variant = normalizeOneDataDisplayVariant(this.props.variant);
    const size = normalizeOneSize(this.props.size);

    return {
      tag: 'span',
      props: {
        className: `one-tag one-tag--${variant} one-tag--${size}`,
      },
      children: [
        ...(this.props.children ?? []),
        ...(this.props.closable
          ? [
              {
                tag: 'button',
                props: {
                  className: 'one-tag__close',
                  type: 'button',
                  'aria-label': '关闭标签',
                },
                listeners: { click: () => this.close() },
                children: ['×'],
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
