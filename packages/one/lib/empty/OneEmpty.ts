import { Component, slot, type VNode } from '@geektech/tsone';
import {
  ONE_THEME_DEFAULTS,
  ONE_THEME_TYPOGRAPHY_PROPERTIES,
  type OneNamedStyle,
} from '../styles/shared';

export interface OneEmptyProps {
  description?: string;
  children?: Array<VNode | string>;
}

export const ONE_EMPTY_STYLES: OneNamedStyle[] = [
  {
    name: 'one-empty-base',
    selector: '.one-empty',
    properties: {
      ...ONE_THEME_TYPOGRAPHY_PROPERTIES,
      display: 'grid',
      justifyItems: 'center',
      gap: ONE_THEME_DEFAULTS.spaceMd,
      padding: '24px',
      color: `var(--one-color-text, ${ONE_THEME_DEFAULTS.colorText})`,
      textAlign: 'center',
    },
  },
  {
    name: 'one-empty-image',
    selector: '.one-empty__image',
    properties: {
      display: 'grid',
      placeItems: 'center',
      minHeight: '56px',
    },
  },
  {
    name: 'one-empty-illustration',
    selector: '.one-empty__illustration',
    properties: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '4px',
      width: '48px',
      height: '36px',
      boxSizing: 'border-box',
      backgroundColor: `var(--one-color-surface, ${ONE_THEME_DEFAULTS.colorSurface})`,
      border: `2px solid var(--one-color-border, ${ONE_THEME_DEFAULTS.colorBorder})`,
      borderRadius: `var(--one-radius-md, ${ONE_THEME_DEFAULTS.radiusMd})`,
    },
  },
  {
    name: 'one-empty-illustration-line',
    selector: '.one-empty__illustration-line',
    properties: {
      display: 'block',
      width: '20px',
      height: '3px',
      borderRadius: '999px',
      backgroundColor: `var(--one-color-border, ${ONE_THEME_DEFAULTS.colorBorder})`,
    },
  },
  {
    name: 'one-empty-illustration-line-short',
    selector: '.one-empty__illustration-line--short',
    properties: { width: '12px' },
  },
  {
    name: 'one-empty-description',
    selector: '.one-empty__description',
    properties: {
      color: `var(--one-color-muted, ${ONE_THEME_DEFAULTS.colorMuted})`,
      fontSize: `var(--one-font-size-md, ${ONE_THEME_DEFAULTS.fontSizeMd})`,
    },
  },
  {
    name: 'one-empty-actions',
    selector: '.one-empty__actions',
    properties: {
      display: 'flex',
      flexWrap: 'wrap',
      justifyContent: 'center',
      gap: ONE_THEME_DEFAULTS.spaceSm,
    },
  },
];

function hasNamedSlot(
  children: Array<VNode | string>,
  name: 'image' | 'actions'
): boolean {
  return children.some(
    (child) => typeof child !== 'string' && child.slot === name
  );
}

function hasDefaultSlot(children: Array<VNode | string>): boolean {
  return children.some(
    (child) => typeof child === 'string' || child.slot === undefined
  );
}

export class OneEmpty extends Component<OneEmptyProps> {
  protected initState(): object {
    return {};
  }

  protected initStyles(): void {
    ONE_EMPTY_STYLES.forEach(({ name, ...style }) => {
      this.styleManager.addStyle(name, style);
    });
  }

  protected render(): VNode {
    const children = this.props.children ?? [];
    const customImage = hasNamedSlot(children, 'image');
    const customDescription = hasDefaultSlot(children);
    const customActions = hasNamedSlot(children, 'actions');

    return {
      tag: 'section',
      props: { className: 'one-empty' },
      children: [
        {
          tag: 'div',
          props: {
            className: 'one-empty__image',
            'aria-hidden': customImage ? undefined : 'true',
          },
          children: customImage
            ? [slot('image')]
            : [
                {
                  tag: 'span',
                  props: { className: 'one-empty__illustration' },
                  children: [
                    {
                      tag: 'span',
                      props: { className: 'one-empty__illustration-line' },
                    },
                    {
                      tag: 'span',
                      props: {
                        className:
                          'one-empty__illustration-line one-empty__illustration-line--short',
                      },
                    },
                  ],
                },
              ],
        },
        {
          tag: 'div',
          props: { className: 'one-empty__description' },
          children: customDescription
            ? [slot('default')]
            : [this.props.description ?? '暂无数据'],
        },
        ...(customActions
          ? [
              {
                tag: 'div',
                props: { className: 'one-empty__actions' },
                children: [slot('actions')],
              } as VNode,
            ]
          : []),
      ],
    };
  }
}
