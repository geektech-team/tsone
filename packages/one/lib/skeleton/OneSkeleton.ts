import { Component, type VNode } from '@geektech/tsone';
import {
  ONE_THEME_DEFAULTS,
  ONE_THEME_TYPOGRAPHY_PROPERTIES,
  type OneNamedStyle,
} from '../styles/shared';

export interface OneSkeletonProps {
  rows?: number;
  title?: boolean;
  avatar?: boolean;
  animated?: boolean;
  widths?: readonly string[];
  ariaLabel?: string;
}

export const ONE_SKELETON_STYLES: OneNamedStyle[] = [
  {
    name: 'one-skeleton-base',
    selector: '.one-skeleton',
    properties: {
      ...ONE_THEME_TYPOGRAPHY_PROPERTIES,
      display: 'flex',
      flexDirection: 'column',
      gap: `var(--one-space-sm, ${ONE_THEME_DEFAULTS.spaceSm})`,
      width: '100%',
    },
  },
  {
    name: 'one-skeleton-avatar',
    selector: '.one-skeleton__avatar',
    properties: {
      width: '40px',
      height: '40px',
      flexShrink: '0',
      borderRadius: '50%',
      backgroundColor: `var(--one-color-border, ${ONE_THEME_DEFAULTS.colorBorder})`,
    },
  },
  {
    name: 'one-skeleton-title',
    selector: '.one-skeleton__title',
    properties: {
      width: '40%',
      height: '16px',
      borderRadius: `var(--one-radius-sm, ${ONE_THEME_DEFAULTS.radiusSm})`,
      backgroundColor: `var(--one-color-border, ${ONE_THEME_DEFAULTS.colorBorder})`,
    },
  },
  {
    name: 'one-skeleton-line',
    selector: '.one-skeleton__line',
    properties: {
      height: '12px',
      borderRadius: `var(--one-radius-sm, ${ONE_THEME_DEFAULTS.radiusSm})`,
      backgroundColor: `var(--one-color-border, ${ONE_THEME_DEFAULTS.colorBorder})`,
    },
  },
  {
    name: 'one-skeleton-line-spacing',
    selector: '.one-skeleton__line + .one-skeleton__line',
    properties: { marginTop: `var(--one-space-xs, ${ONE_THEME_DEFAULTS.spaceXs})` },
  },
  {
    name: 'one-skeleton-animated',
    selector:
      '.one-skeleton--animated .one-skeleton__avatar, .one-skeleton--animated .one-skeleton__title, .one-skeleton--animated .one-skeleton__line',
    properties: {
      animation: 'one-skeleton-pulse 1.5s ease-in-out infinite',
    },
  },
];

export class OneSkeleton extends Component<OneSkeletonProps> {
  protected initState(): object {
    return {};
  }

  protected initStyles(): void {
    ONE_SKELETON_STYLES.forEach(({ name, ...style }) => {
      this.styleManager.addStyle(name, style);
    });
  }

  protected render(): VNode {
    const rows =
      typeof this.props.rows === 'number' && this.props.rows >= 0
        ? Math.floor(this.props.rows)
        : 3;
    const showTitle = this.props.title !== false;
    const showAvatar = this.props.avatar === true;
    const animated = this.props.animated !== false;
    const widths = this.props.widths ?? ['100%', '92%', '60%'];
    const decorative = { 'aria-hidden': 'true' } as const;

    return {
      tag: 'div',
      props: {
        className: [
          'one-skeleton',
          ...(animated ? ['one-skeleton--animated'] : []),
        ].join(' '),
        role: 'status',
        'aria-busy': 'true',
        'aria-label': this.props.ariaLabel ?? '加载中',
      },
      children: [
        ...(showAvatar
          ? [
              {
                tag: 'div',
                props: { className: 'one-skeleton__avatar', ...decorative },
              } as VNode,
            ]
          : []),
        ...(showTitle
          ? [
              {
                tag: 'div',
                props: { className: 'one-skeleton__title', ...decorative },
              } as VNode,
            ]
          : []),
        ...(rows > 0
          ? [
              {
                tag: 'div',
                props: { className: 'one-skeleton__paragraph', ...decorative },
                children: Array.from({ length: rows }, (_, index) => ({
                  tag: 'div',
                  props: {
                    className: 'one-skeleton__line',
                    style: { width: widths[index % widths.length] },
                  },
                })),
              } as VNode,
            ]
          : []),
      ],
    };
  }
}
