import { Component, slot, type VNode } from '@geektech/tsone';
import type { OneNamedStyle } from '../styles/shared';

export interface OneCardProps {
  title?: string;
  children?: Array<VNode | string>;
}

export const ONE_CARD_STYLES: OneNamedStyle[] = [
  {
    name: 'one-card-base',
    selector: '.one-card',
    properties: {
      overflow: 'hidden',
      color: 'var(--one-card-color, var(--one-color-text, #1f2937))',
      backgroundColor:
        'var(--one-card-background, var(--one-color-surface, #ffffff))',
      border:
        '1px solid var(--one-card-border-color, var(--one-color-border, #e5e7eb))',
      borderRadius: 'var(--one-card-radius, var(--one-radius-md, 0.375rem))',
      boxShadow:
        'var(--one-card-shadow, var(--one-shadow-sm, 0 1px 2px 0 rgb(0 0 0 / 0.05)))',
    },
  },
  {
    name: 'one-card-header',
    selector: '.one-card__header',
    properties: {
      padding: 'var(--one-card-header-padding, var(--one-spacing-md, 1rem))',
      borderBottom:
        '1px solid var(--one-card-border-color, var(--one-color-border, #e5e7eb))',
      fontWeight:
        'var(--one-card-header-font-weight, var(--one-font-weight-medium, 500))',
    },
  },
  {
    name: 'one-card-body',
    selector: '.one-card__body',
    properties: {
      padding: 'var(--one-card-body-padding, var(--one-spacing-md, 1rem))',
    },
  },
  {
    name: 'one-card-footer',
    selector: '.one-card__footer',
    properties: {
      padding: 'var(--one-card-footer-padding, var(--one-spacing-md, 1rem))',
      borderTop:
        '1px solid var(--one-card-border-color, var(--one-color-border, #e5e7eb))',
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
