import { Component, type VNode } from '@geektech/tsone';
import {
  ONE_THEME_DEFAULTS,
  ONE_THEME_TYPOGRAPHY_PROPERTIES,
  oneThemeBorder,
  type OneNamedStyle,
} from '../styles/shared';

export interface OneDescriptionsItem {
  label: string;
  value: string;
  span?: number;
}

export interface OneDescriptionsProps {
  title?: string;
  items: OneDescriptionsItem[];
  column?: number;
  bordered?: boolean;
}

export const ONE_DESCRIPTIONS_STYLES: OneNamedStyle[] = [
  {
    name: 'one-descriptions-base',
    selector: '.one-descriptions',
    properties: {
      ...ONE_THEME_TYPOGRAPHY_PROPERTIES,
      boxSizing: 'border-box',
      color: `var(--one-color-text, ${ONE_THEME_DEFAULTS.colorText})`,
    },
  },
  {
    name: 'one-descriptions-title',
    selector: '.one-descriptions__title',
    properties: {
      margin: '0 0 12px',
      fontSize: `var(--one-font-size-md, ${ONE_THEME_DEFAULTS.fontSizeMd})`,
      fontWeight: '600',
    },
  },
  {
    name: 'one-descriptions-grid',
    selector: '.one-descriptions__grid',
    properties: {
      display: 'grid',
      gridTemplateColumns: 'repeat(var(--one-descriptions-column, 1), 1fr)',
      gap: '0',
    },
  },
  {
    name: 'one-descriptions-bordered-grid',
    selector: '.one-descriptions--bordered .one-descriptions__grid',
    properties: {
      border: oneThemeBorder(),
      borderRadius: `var(--one-radius-md, ${ONE_THEME_DEFAULTS.radiusMd})`,
      overflow: 'hidden',
    },
  },
  {
    name: 'one-descriptions-item',
    selector: '.one-descriptions__item',
    properties: {
      display: 'grid',
      gridTemplateColumns: 'minmax(96px, auto) 1fr',
      boxSizing: 'border-box',
    },
  },
  {
    name: 'one-descriptions-bordered-item',
    selector: '.one-descriptions--bordered .one-descriptions__item',
    properties: {
      borderTop: oneThemeBorder(),
      borderRight: oneThemeBorder(),
    },
  },
  {
    name: 'one-descriptions-item-first-row',
    selector:
      '.one-descriptions--bordered .one-descriptions__item:nth-child(-n + var(--one-descriptions-column, 1))',
    properties: { borderTop: '0' },
  },
  {
    name: 'one-descriptions-label',
    selector: '.one-descriptions__label',
    properties: {
      padding: '10px 12px',
      backgroundColor: `var(--one-color-surface, ${ONE_THEME_DEFAULTS.colorSurface})`,
      color: `var(--one-color-muted, ${ONE_THEME_DEFAULTS.colorMuted})`,
      fontSize: `var(--one-font-size-sm, ${ONE_THEME_DEFAULTS.fontSizeSm})`,
      fontWeight: '500',
      lineHeight: '1.5',
    },
  },
  {
    name: 'one-descriptions-value',
    selector: '.one-descriptions__value',
    properties: {
      padding: '10px 12px',
      color: `var(--one-color-text, ${ONE_THEME_DEFAULTS.colorText})`,
      fontSize: `var(--one-font-size-md, ${ONE_THEME_DEFAULTS.fontSizeMd})`,
      lineHeight: '1.5',
      wordBreak: 'break-word',
    },
  },
];

export function normalizeOneDescriptionsColumn(value: unknown): number {
  const column = typeof value === 'number' && Number.isFinite(value) ? value : 1;
  return Math.max(1, Math.min(4, Math.floor(column)));
}

export class OneDescriptions extends Component<
  OneDescriptionsProps,
  Record<string, never>
> {
  protected initState(): Record<string, never> {
    return {};
  }

  protected initStyles(): void {
    ONE_DESCRIPTIONS_STYLES.forEach(({ name, ...style }) => {
      this.styleManager.addStyle(name, style);
    });
  }

  protected render(): VNode {
    const column = normalizeOneDescriptionsColumn(this.props.column);
    const bordered = this.props.bordered === true;

    const items = this.props.items.map((item) => {
      const span = typeof item.span === 'number' && item.span > 0 ? item.span : 1;
      const style: Record<string, string> = {};
      if (span > 1) {
        style.gridColumn = `span ${span}`;
      }
      return {
        tag: 'div',
        props: {
          className: 'one-descriptions__item',
          style: Object.keys(style).length > 0 ? style : undefined,
        },
        children: [
          {
            tag: 'div',
            props: { className: 'one-descriptions__label' },
            children: [item.label],
          },
          {
            tag: 'div',
            props: { className: 'one-descriptions__value' },
            children: [item.value],
          },
        ],
      } as VNode;
    });

    return {
      tag: 'div',
      props: {
        className: [
          'one-descriptions',
          ...(bordered ? ['one-descriptions--bordered'] : []),
        ].join(' '),
        style: { '--one-descriptions-column': String(column) },
      },
      children: [
        ...(this.props.title
          ? [
              {
                tag: 'div',
                props: { className: 'one-descriptions__title' },
                children: [this.props.title],
              } as VNode,
            ]
          : []),
        {
          tag: 'div',
          props: { className: 'one-descriptions__grid' },
          children: items,
        },
      ],
    };
  }
}
