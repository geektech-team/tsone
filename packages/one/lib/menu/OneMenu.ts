import { Component, type VNode } from '@geektech/tsone';
import { bindOneFloatingPanel } from '../dropdown';
import type { OneNavigationChangeEvent } from '../navigation';
import {
  ONE_THEME_DEFAULTS,
  ONE_THEME_TYPOGRAPHY_PROPERTIES,
  oneThemeBorder,
  type OneNamedStyle,
} from '../styles/shared';

export interface OneMenuItem {
  value: string;
  label: string;
  disabled?: boolean;
  children?: readonly OneMenuItem[];
}

export type OneMenuMode = 'vertical' | 'horizontal';

export interface OneMenuProps {
  items: readonly OneMenuItem[];
  mode?: OneMenuMode;
  value?: string;
  defaultValue?: string;
  open?: readonly string[];
  defaultOpen?: readonly string[];
  accordion?: boolean;
  ariaLabel?: string;
}

export type OneMenuSelectEvent = OneNavigationChangeEvent<string>;
export type OneMenuOpenChangeEvent = OneNavigationChangeEvent<string[]>;

interface OneMenuState {
  internalValue: string | undefined;
  internalOpen: string[];
}

let menuInstanceId = 0;

function createMenuId(): string {
  menuInstanceId += 1;
  return `one-menu-${menuInstanceId}`;
}

export const ONE_MENU_STYLES: OneNamedStyle[] = [
  {
    name: 'one-menu-base',
    selector: '.one-menu',
    properties: {
      ...ONE_THEME_TYPOGRAPHY_PROPERTIES,
      display: 'flex',
      flexDirection: 'column',
      gap: ONE_THEME_DEFAULTS.spaceXs,
      margin: '0',
      padding: ONE_THEME_DEFAULTS.spaceSm,
      listStyle: 'none',
      border: oneThemeBorder(),
      borderRadius: `var(--one-radius-md, ${ONE_THEME_DEFAULTS.radiusMd})`,
      backgroundColor: `var(--one-color-surface, ${ONE_THEME_DEFAULTS.colorSurface})`,
      color: `var(--one-color-text, ${ONE_THEME_DEFAULTS.colorText})`,
      width: 'fit-content',
      minWidth: '180px',
    },
  },
  {
    name: 'one-menu-horizontal',
    selector: '.one-menu--horizontal',
    properties: {
      flexDirection: 'row',
      alignItems: 'center',
      minWidth: '0',
    },
  },
  {
    name: 'one-menu-item-wrap',
    selector: '.one-menu__item-wrap',
    properties: {
      display: 'flex',
      flexDirection: 'column',
    },
  },
  {
    name: 'one-menu-item',
    selector: '.one-menu__item',
    properties: {
      display: 'flex',
      alignItems: 'center',
      gap: ONE_THEME_DEFAULTS.spaceXs,
      width: '100%',
      padding: `${ONE_THEME_DEFAULTS.spaceSm} ${ONE_THEME_DEFAULTS.spaceMd}`,
      border: '0',
      borderRadius: `var(--one-radius-sm, ${ONE_THEME_DEFAULTS.radiusSm})`,
      backgroundColor: 'transparent',
      color: 'inherit',
      font: 'inherit',
      textAlign: 'left',
      whiteSpace: 'nowrap',
      cursor: 'pointer',
    },
  },
  {
    name: 'one-menu-item-hover',
    selector: '.one-menu__item:not([aria-current="true"]):hover',
    properties: {
      backgroundColor: `var(--one-color-border, ${ONE_THEME_DEFAULTS.colorBorder})`,
    },
  },
  {
    name: 'one-menu-item-selected',
    selector: '.one-menu__item[aria-current="true"]',
    properties: {
      backgroundColor: `var(--one-color-primary, ${ONE_THEME_DEFAULTS.colorPrimary})`,
      color: `var(--one-color-primary-contrast, ${ONE_THEME_DEFAULTS.colorText})`,
    },
  },
  {
    name: 'one-menu-item-disabled',
    selector: '.one-menu__item:disabled',
    properties: {
      color: `var(--one-color-muted, ${ONE_THEME_DEFAULTS.colorMuted})`,
      backgroundColor: 'transparent',
      cursor: 'not-allowed',
    },
  },
  {
    name: 'one-menu-sub',
    selector: '.one-menu__sub',
    properties: {
      display: 'flex',
      flexDirection: 'column',
      gap: ONE_THEME_DEFAULTS.spaceXs,
      margin: '0',
      padding: `${ONE_THEME_DEFAULTS.spaceXs} 0 0 ${ONE_THEME_DEFAULTS.spaceMd}`,
      listStyle: 'none',
      borderLeft: `2px solid var(--one-color-border, ${ONE_THEME_DEFAULTS.colorBorder})`,
    },
  },
  {
    name: 'one-menu-dropdown',
    selector: '.one-menu__dropdown',
    properties: {
      margin: '0',
      padding: `${ONE_THEME_DEFAULTS.spaceXs} 0`,
      listStyle: 'none',
      minWidth: '160px',
      border: oneThemeBorder(),
      borderRadius: `var(--one-radius-md, ${ONE_THEME_DEFAULTS.radiusMd})`,
      backgroundColor: `var(--one-color-surface, ${ONE_THEME_DEFAULTS.colorSurface})`,
      color: `var(--one-color-text, ${ONE_THEME_DEFAULTS.colorText})`,
      boxShadow: ONE_THEME_DEFAULTS.shadowOverlay,
    },
  },
  {
    name: 'one-menu-caret',
    selector: '.one-menu__caret',
    properties: {
      marginLeft: 'auto',
      color: `var(--one-color-muted, ${ONE_THEME_DEFAULTS.colorMuted})`,
      fontSize: `var(--one-font-size-sm, ${ONE_THEME_DEFAULTS.fontSizeSm})`,
    },
  },
  {
    name: 'one-menu-focus-visible',
    selector: '.one-menu__item:focus-visible, .one-menu:focus-visible',
    properties: {
      outline: `2px solid var(--one-color-focus, ${ONE_THEME_DEFAULTS.colorFocus})`,
      outlineOffset: '-2px',
    },
  },
];

export function normalizeOneMenuMode(value: unknown): OneMenuMode {
  return value === 'horizontal' ? 'horizontal' : 'vertical';
}

interface NormalizedMenuItem extends OneMenuItem {
  children: NormalizedMenuItem[];
}

function normalizeMenuItems(
  items: readonly OneMenuItem[] | undefined
): NormalizedMenuItem[] {
  if (!Array.isArray(items)) {
    return [];
  }
  const values = new Set<string>();
  return items.flatMap((item) => {
    if (
      !item ||
      typeof item.value !== 'string' ||
      item.value.length === 0 ||
      typeof item.label !== 'string' ||
      values.has(item.value)
    ) {
      return [];
    }
    values.add(item.value);
    return [
      {
        ...item,
        disabled: item.disabled === true,
        children: normalizeMenuItems(item.children),
      },
    ];
  });
}

function submenuTriggers(items: readonly NormalizedMenuItem[]): Set<string> {
  const triggers = new Set<string>();
  items.forEach((item) => {
    if (item.children.length > 0) {
      triggers.add(item.value);
    }
  });
  return triggers;
}

function normalizeOpenValues(
  values: readonly string[] | undefined,
  triggers: Set<string>
): string[] {
  if (!Array.isArray(values)) {
    return [];
  }
  return [...new Set(values)].filter((value) => triggers.has(value));
}

export class OneMenu extends Component<OneMenuProps, OneMenuState> {
  private readonly idPrefix = createMenuId();
  private floatingCleanup: (() => void) | null = null;

  protected initState(): OneMenuState {
    return {
      internalValue: this.props.defaultValue,
      internalOpen: normalizeOpenValues(
        this.props.defaultOpen,
        submenuTriggers(this.normalizedItems())
      ),
    };
  }

  protected initStyles(): void {
    ONE_MENU_STYLES.forEach(({ name, ...style }) => {
      this.styleManager.addStyle(name, style);
    });
  }

  protected onMounted(): void {
    this.syncFloating();
  }

  protected onUpdated(): void {
    this.syncFloating();
  }

  protected onUnmounted(): void {
    this.floatingCleanup?.();
    this.floatingCleanup = null;
  }

  protected render(): VNode {
    const mode = normalizeOneMenuMode(this.props.mode);
    const items = this.normalizedItems();
    const value = this.effectiveValue();
    const open = this.effectiveOpen();

    return {
      tag: 'ul',
      props: {
        className: `one-menu one-menu--${mode}`,
        role: 'list',
        'aria-label': this.props.ariaLabel ?? '菜单',
        tabindex: 0,
      },
      listeners: {
        keydown: (event) => this.handleKeydown(event),
      },
      children: items.map((item, index) =>
        this.renderItem(item, mode, value, open, [index])
      ),
    };
  }

  private renderItem(
    item: NormalizedMenuItem,
    mode: OneMenuMode,
    value: string | undefined,
    open: string[],
    path: number[]
  ): VNode {
    const hasChildren = item.children.length > 0;
    const expanded = hasChildren && open.includes(item.value);
    const selected = !hasChildren && item.value === value;
    const subId = `${this.idPrefix}-sub-${path.join('-')}`;

    return {
      tag: 'li',
      props: { className: 'one-menu__item-wrap', role: 'none' },
      children: [
        {
          tag: 'button',
          props: {
            className: 'one-menu__item',
            type: 'button',
            disabled: item.disabled,
            'aria-current': selected ? 'true' : undefined,
            'aria-expanded': hasChildren
              ? expanded
                ? 'true'
                : 'false'
              : undefined,
            'aria-controls': hasChildren ? subId : undefined,
          },
          listeners: {
            click: (event) => {
              if (hasChildren) {
                this.toggleSubmenu(item.value, event);
              } else {
                this.select(item.value, event);
              }
            },
          },
          children: [
            item.label,
            ...(hasChildren
              ? [
                  {
                    tag: 'span',
                    props: {
                      className: 'one-menu__caret',
                      'aria-hidden': 'true',
                    },
                    children: [expanded ? '▾' : '▸'],
                  } as VNode,
                ]
              : []),
          ],
        },
        ...(hasChildren && expanded
          ? [
              mode === 'vertical'
                ? {
                    tag: 'ul',
                    props: {
                      className: 'one-menu__sub',
                      id: subId,
                      role: 'group',
                    },
                    children: item.children.map((child, childIndex) =>
                      this.renderItem(child, mode, value, open, [
                        ...path,
                        childIndex,
                      ])
                    ),
                  }
                : {
                    tag: 'div',
                    props: {
                      className: 'one-menu__dropdown',
                      id: subId,
                      role: 'group',
                    },
                    children: [
                      {
                        tag: 'ul',
                        props: {
                          className: 'one-menu__list',
                          role: 'list',
                        },
                        children: item.children.map((child, childIndex) =>
                          this.renderItem(child, mode, value, open, [
                            ...path,
                            childIndex,
                          ])
                        ),
                      },
                    ],
                  },
            ]
          : []),
      ],
    };
  }

  /** 横向模式仅支持一级子菜单：顶层项保留 children，孙子项清空。 */
  private normalizedItems(): NormalizedMenuItem[] {
    const items = normalizeMenuItems(this.props.items);
    if (normalizeOneMenuMode(this.props.mode) !== 'horizontal') {
      return items;
    }
    return items.map((item) => ({
      ...item,
      children: item.children.map((child) => ({ ...child, children: [] })),
    }));
  }

  private effectiveValue(): string | undefined {
    return this.props.value ?? this.state.internalValue;
  }

  private effectiveOpen(): string[] {
    const triggers = submenuTriggers(this.normalizedItems());
    const values = this.props.open ?? this.state.internalOpen;
    return normalizeOpenValues(values, triggers);
  }

  private select(value: string, event: Event): void {
    if (value === this.effectiveValue()) {
      return;
    }
    if (this.props.value === undefined) {
      this.setState({ internalValue: value });
    }
    this.emit('select', {
      value,
      originalEvent: event,
    } satisfies OneMenuSelectEvent);
    if (normalizeOneMenuMode(this.props.mode) !== 'vertical') {
      this.collapseOpen(event);
    }
  }

  private toggleSubmenu(value: string, event: Event): void {
    const current = this.effectiveOpen();
    const opening = !current.includes(value);
    const next = !opening
      ? current.filter((item) => item !== value)
      : normalizeOneMenuMode(this.props.mode) === 'horizontal' ||
          this.props.accordion === true
        ? [value]
        : [...current, value];
    if (this.props.open === undefined) {
      this.setState({ internalOpen: next });
    }
    this.emit('openChange', {
      value: next,
      originalEvent: event,
    } satisfies OneMenuOpenChangeEvent);
  }

  private collapseOpen(event: Event): void {
    if (this.effectiveOpen().length === 0) {
      return;
    }
    if (this.props.open === undefined) {
      this.setState({ internalOpen: [] });
    }
    this.emit('openChange', {
      value: [],
      originalEvent: event,
    } satisfies OneMenuOpenChangeEvent);
  }

  private closeSubmenu(value: string, event: Event): void {
    const next = this.effectiveOpen().filter((item) => item !== value);
    if (this.props.open === undefined) {
      this.setState({ internalOpen: next });
    }
    this.emit('openChange', {
      value: next,
      originalEvent: event,
    } satisfies OneMenuOpenChangeEvent);
  }

  private handleKeydown(event: Event): void {
    if (!(event instanceof KeyboardEvent)) {
      return;
    }
    let direction: 'first' | 'last' | 'next' | 'prev' | null = null;
    if (event.key === 'ArrowDown' || event.key === 'ArrowRight') {
      direction = 'next';
    } else if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') {
      direction = 'prev';
    } else if (event.key === 'Home') {
      direction = 'first';
    } else if (event.key === 'End') {
      direction = 'last';
    } else {
      return;
    }
    event.preventDefault();
    this.moveFocus(direction);
  }

  private moveFocus(direction: 'first' | 'last' | 'next' | 'prev'): void {
    const root = this.getElement();
    if (!(root instanceof HTMLElement)) {
      return;
    }
    const buttons = [
      ...root.querySelectorAll<HTMLButtonElement>('.one-menu__item'),
    ].filter((button) => !button.disabled);
    if (buttons.length === 0) {
      return;
    }
    const currentIndex = buttons.indexOf(
      document.activeElement as HTMLButtonElement
    );
    const nextIndex =
      direction === 'first'
        ? 0
        : direction === 'last'
          ? buttons.length - 1
          : direction === 'next'
            ? (currentIndex + 1) % buttons.length
            : (currentIndex - 1 + buttons.length) % buttons.length;
    buttons[nextIndex].focus();
  }

  private syncFloating(): void {
    this.floatingCleanup?.();
    this.floatingCleanup = null;
    const root = this.getElement();
    if (!(root instanceof HTMLElement)) {
      return;
    }
    const open = this.effectiveOpen();
    if (
      normalizeOneMenuMode(this.props.mode) === 'vertical' ||
      open.length === 0
    ) {
      return;
    }
    const value = open[0];
    const panelId = `${this.idPrefix}-sub-${this.pathForValue(value)}`;
    const panel = root.querySelector<HTMLElement>(`#${panelId}`);
    const trigger = root.querySelector<HTMLElement>(
      `.one-menu__item[aria-controls="${panelId}"]`
    );
    if (!trigger || !panel) {
      return;
    }
    this.floatingCleanup = bindOneFloatingPanel({
      trigger,
      panel,
      onOutside: () => this.closeSubmenu(value, new Event('one-menu:outside')),
    });
  }

  private pathForValue(value: string): string {
    const index = this.normalizedItems().findIndex(
      (item) => item.value === value
    );
    return String(Math.max(0, index));
  }
}
