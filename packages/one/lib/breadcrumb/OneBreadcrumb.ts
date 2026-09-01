import { Component, slot, type VNode } from '@geektech/tsone';
import { normalizePositiveInteger } from '../navigation';
import { ONE_THEME_DEFAULTS, type OneNamedStyle } from '../styles/shared';

export interface OneBreadcrumbItem {
  label: string;
  href?: string;
  current?: boolean;
}

export interface OneBreadcrumbClickEvent {
  item: OneBreadcrumbItem;
  index: number;
  originalEvent: MouseEvent;
}

export interface OneBreadcrumbProps {
  items: readonly OneBreadcrumbItem[];
  separator?: string;
  maxItems?: number;
  ariaLabel?: string;
  children?: Array<VNode | string>;
}

interface OneBreadcrumbState {
  expanded: boolean;
}

type BreadcrumbToken =
  | { type: 'item'; item: OneBreadcrumbItem; index: number }
  | { type: 'collapse'; key: string };

export const ONE_BREADCRUMB_STYLES: OneNamedStyle[] = [
  {
    name: 'one-breadcrumb-base',
    selector: '.one-breadcrumb',
    properties: {
      color: `var(--one-color-text, ${ONE_THEME_DEFAULTS.colorText})`,
      fontFamily: `var(--one-font-family, ${ONE_THEME_DEFAULTS.fontFamily})`,
    },
  },
  {
    name: 'one-breadcrumb-list',
    selector: '.one-breadcrumb__list',
    properties: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: ONE_THEME_DEFAULTS.spaceXs,
      alignItems: 'center',
      margin: '0',
      padding: '0',
      listStyle: 'none',
    },
  },
  {
    name: 'one-breadcrumb-token',
    selector: '.one-breadcrumb__item, .one-breadcrumb__collapse',
    properties: {
      display: 'inline-flex',
      gap: ONE_THEME_DEFAULTS.spaceXs,
      alignItems: 'center',
    },
  },
  {
    name: 'one-breadcrumb-link',
    selector: '.one-breadcrumb__link',
    properties: {
      color: `var(--one-color-muted, ${ONE_THEME_DEFAULTS.colorMuted})`,
      textDecoration: 'none',
    },
    hover: {
      color: `var(--one-color-primary, ${ONE_THEME_DEFAULTS.colorPrimary})`,
    },
  },
  {
    name: 'one-breadcrumb-link-focus-visible',
    selector: '.one-breadcrumb__link:focus-visible',
    properties: {
      outline: `2px solid var(--one-color-focus, ${ONE_THEME_DEFAULTS.colorFocus})`,
      outlineOffset: '2px',
    },
  },
  {
    name: 'one-breadcrumb-current',
    selector: '.one-breadcrumb__current',
    properties: { fontWeight: '600' },
  },
  {
    name: 'one-breadcrumb-separator',
    selector: '.one-breadcrumb__separator',
    properties: {
      color: `var(--one-color-muted, ${ONE_THEME_DEFAULTS.colorMuted})`,
      userSelect: 'none',
    },
  },
  {
    name: 'one-breadcrumb-ellipsis',
    selector: '.one-breadcrumb__ellipsis',
    properties: {
      padding: `0 ${ONE_THEME_DEFAULTS.spaceXs}`,
      color: `var(--one-color-muted, ${ONE_THEME_DEFAULTS.colorMuted})`,
      backgroundColor: 'transparent',
      border: '0',
      cursor: 'pointer',
      font: 'inherit',
    },
  },
  {
    name: 'one-breadcrumb-ellipsis-focus-visible',
    selector: '.one-breadcrumb__ellipsis:focus-visible',
    properties: {
      outline: `2px solid var(--one-color-focus, ${ONE_THEME_DEFAULTS.colorFocus})`,
      outlineOffset: '2px',
    },
  },
];

export class OneBreadcrumb extends Component<
  OneBreadcrumbProps,
  OneBreadcrumbState
> {
  protected initState(): OneBreadcrumbState {
    return { expanded: false };
  }

  protected initStyles(): void {
    ONE_BREADCRUMB_STYLES.forEach(({ name, ...style }) => {
      this.styleManager.addStyle(name, style);
    });
  }

  protected render(): VNode {
    const items = this.normalizedItems();
    const currentIndex = this.currentIndex(items);
    const tokens = this.tokens(items, currentIndex);

    return {
      tag: 'nav',
      props: {
        className: 'one-breadcrumb',
        'aria-label': this.props.ariaLabel ?? '面包屑',
      },
      children: [
        {
          tag: 'ol',
          props: { className: 'one-breadcrumb__list' },
          children: tokens.map((token, tokenIndex) =>
            this.renderToken(
              token,
              tokenIndex < tokens.length - 1,
              currentIndex
            )
          ),
        },
      ],
    };
  }

  private normalizedItems(): OneBreadcrumbItem[] {
    const items = Array.isArray(this.props.items) ? this.props.items : [];
    return items.flatMap((item) =>
      item && typeof item.label === 'string' ? [{ ...item }] : []
    );
  }

  private currentIndex(items: readonly OneBreadcrumbItem[]): number {
    const explicit = items.findIndex((item) => item.current === true);
    return explicit >= 0 ? explicit : items.length - 1;
  }

  private tokens(
    items: readonly OneBreadcrumbItem[],
    currentIndex: number
  ): BreadcrumbToken[] {
    const limit = Math.max(
      3,
      normalizePositiveInteger(this.props.maxItems, items.length || 3)
    );
    if (this.state.expanded || items.length <= limit) {
      return items.map((item, index) => ({ type: 'item', item, index }));
    }

    const visible = new Set([0, currentIndex, items.length - 1]);
    const candidates = items
      .map((_, index) => index)
      .filter((index) => !visible.has(index))
      .sort(
        (left, right) =>
          Math.abs(left - currentIndex) - Math.abs(right - currentIndex) ||
          left - right
      );
    candidates.slice(0, Math.max(0, limit - visible.size)).forEach((index) => {
      visible.add(index);
    });

    const result: BreadcrumbToken[] = [];
    let hiddenStart = -1;
    items.forEach((item, index) => {
      if (!visible.has(index)) {
        if (hiddenStart < 0) hiddenStart = index;
        return;
      }
      if (hiddenStart >= 0) {
        result.push({ type: 'collapse', key: `${hiddenStart}-${index - 1}` });
        hiddenStart = -1;
      }
      result.push({ type: 'item', item, index });
    });
    if (hiddenStart >= 0) {
      result.push({
        type: 'collapse',
        key: `${hiddenStart}-${items.length - 1}`,
      });
    }
    return result;
  }

  private renderToken(
    token: BreadcrumbToken,
    hasSeparator: boolean,
    currentIndex: number
  ): VNode {
    const content =
      token.type === 'collapse'
        ? this.renderCollapse()
        : this.renderItem(
            token.item,
            token.index,
            token.index === currentIndex
          );
    return {
      tag: 'li',
      props: {
        className:
          token.type === 'item'
            ? 'one-breadcrumb__item'
            : 'one-breadcrumb__collapse',
      },
      children: [content, ...(hasSeparator ? [this.renderSeparator()] : [])],
    };
  }

  private renderItem(
    item: OneBreadcrumbItem,
    index: number,
    current: boolean
  ): VNode {
    if (current || !item.href) {
      return {
        tag: 'span',
        props: {
          className: current
            ? 'one-breadcrumb__current'
            : 'one-breadcrumb__label',
          'aria-current': current ? 'page' : undefined,
        },
        children: [item.label],
      };
    }
    return {
      tag: 'a',
      props: { className: 'one-breadcrumb__link', href: item.href },
      listeners: { click: (event) => this.handleItemClick(event, item, index) },
      children: [item.label],
    };
  }

  private renderCollapse(): VNode {
    return {
      tag: 'button',
      props: {
        className: 'one-breadcrumb__ellipsis',
        type: 'button',
        'aria-label': '展开面包屑',
        'aria-expanded': 'false',
      },
      listeners: { click: () => (this.state.expanded = true) },
      children: ['…'],
    };
  }

  private renderSeparator(): VNode {
    return {
      tag: 'span',
      props: { className: 'one-breadcrumb__separator', 'aria-hidden': 'true' },
      children: [
        this.hasSlot('separator')
          ? slot('separator')
          : (this.props.separator ?? '/'),
      ],
    };
  }

  private handleItemClick(
    event: Event,
    item: OneBreadcrumbItem,
    index: number
  ): void {
    if (!(event instanceof MouseEvent)) return;
    this.emit('itemClick', {
      item,
      index,
      originalEvent: event,
    } satisfies OneBreadcrumbClickEvent);
  }

  private hasSlot(name: string): boolean {
    return (
      this.props.children?.some(
        (child) => typeof child !== 'string' && child.slot === name
      ) ?? false
    );
  }
}
