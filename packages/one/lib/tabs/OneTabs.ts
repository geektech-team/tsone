import { Component, slot, type VNode } from '@geektech/tsone';
import type { OneNavigationChangeEvent } from '../navigation';
import {
  ONE_THEME_DEFAULTS,
  ONE_THEME_TYPOGRAPHY_PROPERTIES,
  oneThemeBorder,
  type OneNamedStyle,
} from '../styles/shared';

export interface OneTabItem {
  value: string;
  label: string;
  disabled?: boolean;
}

export type OneTabsChangeEvent = OneNavigationChangeEvent<string>;

export interface OneTabsProps {
  items: readonly OneTabItem[];
  value?: string;
  defaultValue?: string;
  id?: string;
  ariaLabel?: string;
  children?: Array<VNode | string>;
}

interface OneTabsState {
  internalValue: string | undefined;
}

let tabsInstanceId = 0;

function createTabsId(): string {
  tabsInstanceId += 1;
  return `one-tabs-${tabsInstanceId}`;
}

function normalizeId(value: unknown): string {
  return typeof value === 'string' && /^[A-Za-z_][A-Za-z0-9_-]*$/.test(value)
    ? value
    : createTabsId();
}

export const ONE_TABS_STYLES: OneNamedStyle[] = [
  {
    name: 'one-tabs-base',
    selector: '.one-tabs',
    properties: {
      ...ONE_THEME_TYPOGRAPHY_PROPERTIES,
      color: `var(--one-color-text, ${ONE_THEME_DEFAULTS.colorText})`,
    },
  },
  {
    name: 'one-tabs-list',
    selector: '.one-tabs__list',
    properties: {
      display: 'flex',
      overflowX: 'auto',
      borderBottom: oneThemeBorder(),
    },
  },
  {
    name: 'one-tabs-tab',
    selector: '.one-tabs__tab',
    properties: {
      position: 'relative',
      flex: '0 0 auto',
      padding: `${ONE_THEME_DEFAULTS.spaceSm} ${ONE_THEME_DEFAULTS.spaceMd}`,
      color: 'inherit',
      backgroundColor: 'transparent',
      border: '0',
      cursor: 'pointer',
      font: 'inherit',
    },
    hover: {
      color: `var(--one-color-primary, ${ONE_THEME_DEFAULTS.colorPrimary})`,
    },
  },
  {
    name: 'one-tabs-tab-selected',
    selector: '.one-tabs__tab[aria-selected="true"]',
    properties: {
      color: `var(--one-color-primary, ${ONE_THEME_DEFAULTS.colorPrimary})`,
    },
  },
  {
    name: 'one-tabs-tab-selected-indicator',
    selector: '.one-tabs__tab[aria-selected="true"]::after',
    properties: {
      position: 'absolute',
      right: '0',
      bottom: '-1px',
      left: '0',
      height: '2px',
      backgroundColor: `var(--one-color-primary, ${ONE_THEME_DEFAULTS.colorPrimary})`,
      content: '""',
    },
  },
  {
    name: 'one-tabs-tab-disabled',
    selector: '.one-tabs__tab:disabled',
    properties: {
      color: `var(--one-color-muted, ${ONE_THEME_DEFAULTS.colorMuted})`,
      cursor: 'not-allowed',
    },
  },
  {
    name: 'one-tabs-tab-focus-visible',
    selector: '.one-tabs__tab:focus-visible',
    properties: {
      outline: `2px solid var(--one-color-focus, ${ONE_THEME_DEFAULTS.colorFocus})`,
      outlineOffset: '-2px',
    },
  },
  {
    name: 'one-tabs-panel',
    selector: '.one-tabs__panel',
    properties: {
      padding: `${ONE_THEME_DEFAULTS.spaceLg} 0`,
    },
  },
];

export class OneTabs extends Component<OneTabsProps, OneTabsState> {
  private readonly idPrefix = normalizeId(this.props.id);

  protected initState(): OneTabsState {
    return { internalValue: this.props.defaultValue };
  }

  protected initStyles(): void {
    ONE_TABS_STYLES.forEach(({ name, ...style }) => {
      this.styleManager.addStyle(name, style);
    });
  }

  protected render(): VNode {
    const items = this.normalizedItems();
    const value = this.effectiveValue(items);

    return {
      tag: 'section',
      props: { className: 'one-tabs' },
      children: [
        {
          tag: 'div',
          props: {
            className: 'one-tabs__list',
            role: 'tablist',
            'aria-label': this.props.ariaLabel,
            'aria-orientation': 'horizontal',
          },
          children: items.map((item, index) => {
            const selected = item.value === value;
            return {
              tag: 'button',
              props: {
                className: 'one-tabs__tab',
                type: 'button',
                id: `${this.idPrefix}-tab-${index}`,
                role: 'tab',
                disabled: item.disabled === true,
                tabindex: selected ? 0 : -1,
                'aria-selected': selected ? 'true' : 'false',
                'aria-controls': `${this.idPrefix}-panel-${index}`,
              },
              listeners: {
                click: (event) => this.activate(item, index, event),
                keydown: (event) => this.handleKeydown(event, index),
              },
              children: [item.label],
            };
          }),
        },
        ...items.map((item, index) => ({
          tag: 'div',
          props: {
            className: 'one-tabs__panel',
            id: `${this.idPrefix}-panel-${index}`,
            role: 'tabpanel',
            hidden: item.value === value ? undefined : true,
            tabindex: 0,
            'aria-labelledby': `${this.idPrefix}-tab-${index}`,
          },
          children: [slot(item.value)],
        })),
      ],
    };
  }

  private normalizedItems(): OneTabItem[] {
    const items = Array.isArray(this.props.items) ? this.props.items : [];
    const values = new Set<string>();
    return items.flatMap((item) => {
      if (
        !item ||
        typeof item.value !== 'string' ||
        typeof item.label !== 'string' ||
        values.has(item.value)
      ) {
        return [];
      }
      values.add(item.value);
      return [{ ...item, disabled: item.disabled === true }];
    });
  }

  private effectiveValue(items: readonly OneTabItem[]): string | undefined {
    const candidate = this.props.value ?? this.state.internalValue;
    const selected = items.find(
      (item) => item.value === candidate && !item.disabled
    );
    return selected?.value ?? items.find((item) => !item.disabled)?.value;
  }

  private activate(item: OneTabItem, index: number, event: Event): void {
    if (item.disabled) {
      return;
    }
    this.focusTab(index);
    if (item.value === this.effectiveValue(this.normalizedItems())) {
      return;
    }
    if (this.props.value === undefined) {
      this.state.internalValue = item.value;
    }
    this.emit('change', {
      value: item.value,
      originalEvent: event,
    } satisfies OneTabsChangeEvent);
  }

  private handleKeydown(event: Event, currentIndex: number): void {
    if (!(event instanceof KeyboardEvent)) {
      return;
    }
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) {
      return;
    }
    const items = this.normalizedItems();
    const enabled = this.enabledIndices(items);
    if (enabled.length === 0) {
      return;
    }
    event.preventDefault();
    const currentPosition = Math.max(0, enabled.indexOf(currentIndex));
    const nextPosition =
      event.key === 'Home'
        ? 0
        : event.key === 'End'
          ? enabled.length - 1
          : event.key === 'ArrowRight'
            ? (currentPosition + 1) % enabled.length
            : (currentPosition - 1 + enabled.length) % enabled.length;
    const nextIndex = enabled[nextPosition];
    this.focusTab(nextIndex);
    this.activate(items[nextIndex], nextIndex, event);
  }

  private enabledIndices(items: readonly OneTabItem[]): number[] {
    return items.flatMap((item, index) => (item.disabled ? [] : [index]));
  }

  private focusTab(index: number): void {
    const element = this.getElement();
    if (!(element instanceof HTMLElement)) {
      return;
    }
    const tab =
      element.querySelectorAll<HTMLButtonElement>('[role="tab"]')[index];
    tab?.focus();
  }
}
