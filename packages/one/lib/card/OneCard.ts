import { Component, slot, type VNode } from '@geektech/tsone';
import {
  ONE_THEME_DEFAULTS,
  ONE_THEME_TYPOGRAPHY_PROPERTIES,
  oneThemeBorder,
  type OneNamedStyle,
} from '../styles/shared';

export interface OneCardProps {
  title?: string;
  children?: Array<VNode | string>;
}

export const ONE_CARD_STYLES: OneNamedStyle[] = [
  {
    name: 'one-card-base',
    selector: '.one-card',
    properties: {
      ...ONE_THEME_TYPOGRAPHY_PROPERTIES,
      overflow: 'hidden',
      color: `var(--one-card-color, var(--one-color-text, ${ONE_THEME_DEFAULTS.colorText}))`,
      backgroundColor: `var(--one-card-background, var(--one-color-surface, ${ONE_THEME_DEFAULTS.colorSurface}))`,
      border: oneThemeBorder(
        `var(--one-card-border-color, var(--one-color-border, ${ONE_THEME_DEFAULTS.colorBorder}))`
      ),
      borderRadius: `var(--one-card-radius, var(--one-radius-lg, ${ONE_THEME_DEFAULTS.radiusMd}))`,
      boxShadow: `var(--one-card-shadow, var(--one-shadow-card, ${ONE_THEME_DEFAULTS.shadowCard}))`,
    },
  },
  {
    name: 'one-card-header',
    selector: '.one-card__header',
    properties: {
      padding: `var(--one-card-header-padding, var(--one-space-lg, ${ONE_THEME_DEFAULTS.spaceLg}))`,
      borderBottom: oneThemeBorder(
        `var(--one-card-border-color, var(--one-color-border, ${ONE_THEME_DEFAULTS.colorBorder}))`
      ),
      fontWeight: '500',
    },
  },
  {
    name: 'one-card-body',
    selector: '.one-card__body',
    properties: {
      padding: `var(--one-card-body-padding, var(--one-space-lg, ${ONE_THEME_DEFAULTS.spaceLg}))`,
    },
  },
  {
    name: 'one-card-footer',
    selector: '.one-card__footer',
    properties: {
      padding: `var(--one-card-footer-padding, var(--one-space-lg, ${ONE_THEME_DEFAULTS.spaceLg}))`,
      borderTop: oneThemeBorder(
        `var(--one-card-border-color, var(--one-color-border, ${ONE_THEME_DEFAULTS.colorBorder}))`
      ),
    },
  },
];

function hasNamedSlot(
  children: Array<VNode | string>,
  name: 'header' | 'footer'
): boolean {
  return children.some(
    (child) => typeof child !== 'string' && child.slot === name
  );
}

export class OneCard extends Component<OneCardProps> {
  protected initState(): object {
    return {};
  }

  protected initStyles(): void {
    ONE_CARD_STYLES.forEach(({ name, ...style }) => {
      this.styleManager.addStyle(name, style);
    });
  }

  protected render(): VNode {
    const children = this.props.children ?? [];
    const hasHeaderSlot = hasNamedSlot(children, 'header');
    const hasFooterSlot = hasNamedSlot(children, 'footer');
    const headerChildren = hasHeaderSlot
      ? [slot('header')]
      : this.props.title
        ? [this.props.title]
        : [];

    return {
      tag: 'section',
      props: { className: 'one-card' },
      children: [
        ...(headerChildren.length > 0
          ? [
              {
                tag: 'header',
                props: { className: 'one-card__header' },
                children: headerChildren,
              } as VNode,
            ]
          : []),
        {
          tag: 'div',
          props: { className: 'one-card__body' },
          children: [slot('default')],
        },
        ...(hasFooterSlot
          ? [
              {
                tag: 'footer',
                props: { className: 'one-card__footer' },
                children: [slot('footer')],
              } as VNode,
            ]
          : []),
      ],
    };
  }
}
