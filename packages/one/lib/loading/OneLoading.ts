import { type VNode } from '@geektech/tsone';
import { OneLocalizedComponent } from '../i18n';
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

function ensureOneLoadingKeyframes(): void {
  // 每次挂载都重新检查 head：keyframes 可能被外部清空（如测试清理
  // document.head），缓存"已注入"会让样式永久缺失。
  const hasKeyframes = Array.from(document.querySelectorAll('style')).some(
    (style) =>
      (style.textContent ?? '').includes('@keyframes one-loading-spin')
  );
  if (!hasKeyframes) {
    const style = document.createElement('style');
    style.textContent =
      '@keyframes one-loading-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }';
    document.head.appendChild(style);
  }
}

export interface OneLoadingProps {
  size?: OneComponentSize;
  variant?: OneDataDisplayVariant;
  label?: string;
  children?: Array<VNode | string>;
}

export const ONE_LOADING_STYLES: OneNamedStyle[] = [
  {
    name: 'one-loading-base',
    selector: '.one-loading',
    properties: {
      ...ONE_THEME_TYPOGRAPHY_PROPERTIES,
      display: 'inline-flex',
      alignItems: 'center',
      gap: `var(--one-space-sm, ${ONE_THEME_DEFAULTS.spaceSm})`,
      color: `var(--one-color-muted, ${ONE_THEME_DEFAULTS.colorMuted})`,
    },
  },
  {
    name: 'one-loading-spinner',
    selector: '.one-loading__spinner',
    properties: {
      display: 'inline-block',
      boxSizing: 'border-box',
      borderRadius: '50%',
      border: '2px solid currentColor',
      borderTopColor: 'transparent',
      animation: 'one-loading-spin 1s linear infinite',
    },
  },
  {
    name: 'one-loading-spinner-sm',
    selector: '.one-loading--sm .one-loading__spinner',
    properties: { width: '16px', height: '16px' },
  },
  {
    name: 'one-loading-spinner-md',
    selector: '.one-loading--md .one-loading__spinner',
    properties: { width: '20px', height: '20px' },
  },
  {
    name: 'one-loading-spinner-lg',
    selector: '.one-loading--lg .one-loading__spinner',
    properties: { width: '24px', height: '24px' },
  },
  {
    name: 'one-loading-spinner-neutral',
    selector: '.one-loading__spinner--neutral',
    properties: {
      color: `var(--one-color-muted, ${ONE_THEME_DEFAULTS.colorMuted})`,
    },
  },
  {
    name: 'one-loading-spinner-primary',
    selector: '.one-loading__spinner--primary',
    properties: {
      color: `var(--one-color-primary, ${ONE_THEME_DEFAULTS.colorPrimary})`,
    },
  },
  {
    name: 'one-loading-spinner-success',
    selector: '.one-loading__spinner--success',
    properties: {
      color: `var(--one-color-success, ${ONE_THEME_DEFAULTS.colorSuccess})`,
    },
  },
  {
    name: 'one-loading-spinner-warning',
    selector: '.one-loading__spinner--warning',
    properties: {
      color: `var(--one-color-warning, ${ONE_THEME_DEFAULTS.colorWarning})`,
    },
  },
  {
    name: 'one-loading-spinner-error',
    selector: '.one-loading__spinner--error',
    properties: {
      color: `var(--one-color-danger, ${ONE_THEME_DEFAULTS.colorDanger})`,
    },
  },
];

export class OneLoading extends OneLocalizedComponent<OneLoadingProps> {
  protected initState(): object {
    return {};
  }

  protected initStyles(): void {
    ensureOneLoadingKeyframes();
    ONE_LOADING_STYLES.forEach(({ name, ...style }) => {
      this.styleManager.addStyle(name, style);
    });
  }

  protected render(): VNode {
    const size = normalizeOneSize(this.props.size);
    const variant = normalizeOneDataDisplayVariant(this.props.variant, 'primary');

    return {
      tag: 'span',
      props: {
        className: `one-loading one-loading--${size}`,
        role: 'status',
        'aria-label': this.props.label ?? this.t('one.loading.label'),
      },
      children: [
        {
          tag: 'span',
          props: {
            className: `one-loading__spinner one-loading__spinner--${variant}`,
            'aria-hidden': 'true',
          },
        } as VNode,
        ...(this.props.children ?? []),
      ],
    };
  }
}
