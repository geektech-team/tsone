import { Component, type VNode } from '@geektech/tsone';
import {
  normalizeOneDataDisplayVariant,
  type OneDataDisplayVariant,
} from '../data-display';
import {
  normalizeOneSize,
  ONE_THEME_DEFAULTS,
  ONE_THEME_TYPOGRAPHY_PROPERTIES,
  type OneNamedStyle,
} from '../styles/shared';
import type { OneComponentSize } from '../types';

export type OneAvatarShape = 'circle' | 'square';

export interface OneAvatarProps {
  src?: string;
  alt?: string;
  text?: string;
  size?: OneComponentSize;
  shape?: OneAvatarShape;
  variant?: OneDataDisplayVariant;
  ariaLabel?: string;
  children?: Array<VNode | string>;
}

export const ONE_AVATAR_STYLES: OneNamedStyle[] = [
  {
    name: 'one-avatar-base',
    selector: '.one-avatar',
    properties: {
      ...ONE_THEME_TYPOGRAPHY_PROPERTIES,
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
      boxSizing: 'border-box',
      color: `var(--one-color-surface, ${ONE_THEME_DEFAULTS.colorSurface})`,
      backgroundColor: `var(--one-color-muted, ${ONE_THEME_DEFAULTS.colorMuted})`,
      verticalAlign: 'middle',
    },
  },
  {
    name: 'one-avatar-sm',
    selector: '.one-avatar--sm',
    properties: {
      width: '24px',
      height: '24px',
      fontSize: `var(--one-font-size-sm, ${ONE_THEME_DEFAULTS.fontSizeSm})`,
    },
  },
  {
    name: 'one-avatar-md',
    selector: '.one-avatar--md',
    properties: {
      width: '32px',
      height: '32px',
      fontSize: `var(--one-font-size-md, ${ONE_THEME_DEFAULTS.fontSizeMd})`,
    },
  },
  {
    name: 'one-avatar-lg',
    selector: '.one-avatar--lg',
    properties: {
      width: '40px',
      height: '40px',
      fontSize: `var(--one-font-size-lg, ${ONE_THEME_DEFAULTS.fontSizeLg})`,
    },
  },
  {
    name: 'one-avatar-circle',
    selector: '.one-avatar--circle',
    properties: { borderRadius: '50%' },
  },
  {
    name: 'one-avatar-square',
    selector: '.one-avatar--square',
    properties: {
      borderRadius: `var(--one-radius-sm, ${ONE_THEME_DEFAULTS.radiusSm})`,
    },
  },
  {
    name: 'one-avatar-neutral',
    selector: '.one-avatar--neutral',
    properties: {
      backgroundColor: `var(--one-color-muted, ${ONE_THEME_DEFAULTS.colorMuted})`,
    },
  },
  {
    name: 'one-avatar-primary',
    selector: '.one-avatar--primary',
    properties: {
      backgroundColor: `var(--one-color-primary, ${ONE_THEME_DEFAULTS.colorPrimary})`,
    },
  },
  {
    name: 'one-avatar-success',
    selector: '.one-avatar--success',
    properties: {
      backgroundColor: `var(--one-color-success, ${ONE_THEME_DEFAULTS.colorSuccess})`,
    },
  },
  {
    name: 'one-avatar-warning',
    selector: '.one-avatar--warning',
    properties: {
      backgroundColor: `var(--one-color-warning, ${ONE_THEME_DEFAULTS.colorWarning})`,
    },
  },
  {
    name: 'one-avatar-error',
    selector: '.one-avatar--error',
    properties: {
      backgroundColor: `var(--one-color-danger, ${ONE_THEME_DEFAULTS.colorDanger})`,
    },
  },
  {
    name: 'one-avatar-img',
    selector: '.one-avatar__img',
    properties: {
      width: '100%',
      height: '100%',
      objectFit: 'cover',
    },
  },
  {
    name: 'one-avatar-fallback',
    selector: '.one-avatar__fallback',
    properties: {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: `0 ${ONE_THEME_DEFAULTS.spaceXs}`,
      lineHeight: '1',
    },
  },
];

function normalizeOneAvatarShape(value: unknown): OneAvatarShape {
  return value === 'square' ? 'square' : 'circle';
}

export class OneAvatar extends Component<OneAvatarProps> {
  protected initState(): object {
    return {};
  }

  protected initStyles(): void {
    ONE_AVATAR_STYLES.forEach(({ name, ...style }) => {
      this.styleManager.addStyle(name, style);
    });
  }

  protected render(): VNode {
    const size = normalizeOneSize(this.props.size);
    const shape = normalizeOneAvatarShape(this.props.shape);
    const variant = normalizeOneDataDisplayVariant(this.props.variant);
    const hasImage = Boolean(this.props.src);
    const fallback =
      this.props.children && this.props.children.length > 0
        ? this.props.children
        : this.props.text
          ? [this.props.text]
          : [];

    return {
      tag: 'span',
      props: {
        className: `one-avatar one-avatar--${size} one-avatar--${shape} one-avatar--${variant}`,
        role: this.props.ariaLabel ? 'img' : undefined,
        'aria-label': this.props.ariaLabel,
      },
      children: hasImage
        ? [
            {
              tag: 'img',
              props: {
                className: 'one-avatar__img',
                src: this.props.src,
                alt: this.props.alt,
              },
            } as VNode,
          ]
        : [
            {
              tag: 'span',
              props: { className: 'one-avatar__fallback' },
              children: fallback,
            } as VNode,
          ],
    };
  }
}
