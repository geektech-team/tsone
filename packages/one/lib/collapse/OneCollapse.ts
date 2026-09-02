import { Component, type VNode } from '@geektech/tsone';
import {
  ONE_THEME_DEFAULTS,
  ONE_THEME_TYPOGRAPHY_PROPERTIES,
  oneThemeBorder,
  type OneNamedStyle,
} from '../styles/shared';

export interface OneCollapseItem {
  value: string;
  title: string;
  children?: Array<VNode | string>;
  disabled?: boolean;
}

export interface OneCollapseChangeEvent {
  value: string[];
  originalEvent: Event;
}

export interface OneCollapseProps {
  items?: readonly OneCollapseItem[];
  defaultActive?: readonly string[];
  active?: readonly string[];
  accordion?: boolean;
  ariaLabel?: string;
}

interface OneCollapseState {
  internalActive: string[];
}

export const ONE_COLLAPSE_STYLES: OneNamedStyle[] = [
  {
    name: 'one-collapse-base',
    selector: '.one-collapse',
    properties: {
      ...ONE_THEME_TYPOGRAPHY_PROPERTIES,
      border: oneThemeBorder(),
      borderRadius: `var(--one-radius-md, ${ONE_THEME_DEFAULTS.radiusMd})`,
      overflow: 'hidden',
      backgroundColor: `var(--one-color-surface, ${ONE_THEME_DEFAULTS.colorSurface})`,
      color: `var(--one-color-text, ${ONE_THEME_DEFAULTS.colorText})`,
    },
  },
  {
    name: 'one-collapse-item',
    selector: '.one-collapse__item',
    properties: {
      borderBottom: oneThemeBorder(),
    },
  },
  {
    name: 'one-collapse-item-last',
    selector: '.one-collapse__item:last-child',
    properties: { borderBottom: 'none' },
  },
  {
    name: 'one-collapse-header',
    selector: '.one-collapse__header',
    properties: {
      display: 'flex',
      width: '100%',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: `var(--one-space-sm, ${ONE_THEME_DEFAULTS.spaceSm})`,
      padding: `${ONE_THEME_DEFAULTS.spaceSm} ${ONE_THEME_DEFAULTS.spaceMd}`,
      backgroundColor: 'transparent',
      border: '0',
      color: `var(--one-color-text, ${ONE_THEME_DEFAULTS.colorText})`,
      cursor: 'pointer',
      font: 'inherit',
      textAlign: 'left',
    },
  },
  {
    name: 'one-collapse-header-hover',
    selector: '.one-collapse__header:hover:not(:disabled)',
    properties: {
      color: `var(--one-color-primary, ${ONE_THEME_DEFAULTS.colorPrimary})`,
    },
  },
  {
    name: 'one-collapse-header-icon',
    selector: '.one-collapse__header-icon',
    properties: {
      flexShrink: '0',
      color: `var(--one-color-muted, ${ONE_THEME_DEFAULTS.colorMuted})`,
      transition: 'transform 150ms ease',
    },
  },
  {
    name: 'one-collapse-item-open-icon',
    selector: '.one-collapse__item--open .one-collapse__header-icon',
    properties: { transform: 'rotate(180deg)' },
  },
  {
    name: 'one-collapse-panel',
    selector: '.one-collapse__panel',
    properties: {
      padding: `0 ${ONE_THEME_DEFAULTS.spaceMd} ${ONE_THEME_DEFAULTS.spaceMd}`,
      borderTop: oneThemeBorder(),
      color: `var(--one-color-text, ${ONE_THEME_DEFAULTS.colorText})`,
    },
  },
  {
    name: 'one-collapse-disabled',
    selector: '.one-collapse__item--disabled .one-collapse__header',
    properties: {
      opacity: '0.5',
      cursor: 'not-allowed',
    },
  },
];

export class OneCollapse extends Component<OneCollapseProps, OneCollapseState> {
  protected initState(): OneCollapseState {
    return { internalActive: [...(this.props.defaultActive ?? [])] };
  }

  protected initStyles(): void {
    ONE_COLLAPSE_STYLES.forEach(({ name, ...style }) => {
      this.styleManager.addStyle(name, style);
    });
  }

  protected render(): VNode {
    const active = this.getActive();
    const items = this.props.items ?? [];

    return {
      tag: 'div',
      props: {
        className: 'one-collapse',
        'aria-label': this.props.ariaLabel,
      },
      children: items.map((item) => {
        const open = active.includes(item.value);
        const disabled = item.disabled === true;
        const panelId = `one-collapse-panel-${item.value}`;
        const headerId = `one-collapse-header-${item.value}`;
        return {
          tag: 'div',
          props: {
            className: [
              'one-collapse__item',
              ...(open ? ['one-collapse__item--open'] : []),
              ...(disabled ? ['one-collapse__item--disabled'] : []),
            ].join(' '),
          },
          children: [
            {
              tag: 'button',
              props: {
                type: 'button',
                id: headerId,
                className: 'one-collapse__header',
                'aria-expanded': open ? 'true' : 'false',
                'aria-controls': panelId,
                disabled: disabled || undefined,
              },
              listeners: {
                click: (event) => this.toggle(item.value, event),
              },
              children: [
                {
                  tag: 'span',
                  props: { className: 'one-collapse__header-title' },
                  children: [item.title],
                },
                {
                  tag: 'span',
                  props: {
                    className: 'one-collapse__header-icon',
                    'aria-hidden': 'true',
                  },
                  children: ['▾'],
                },
              ],
            },
            {
              tag: 'section',
              props: {
                id: panelId,
                className: 'one-collapse__panel',
                role: 'region',
                'aria-labelledby': headerId,
                hidden: open ? undefined : true,
              },
              children: item.children ?? [],
            },
          ],
        };
      }),
    };
  }

  private getActive(): readonly string[] {
    return this.props.active ?? this.state.internalActive;
  }

  private toggle(value: string, event: Event): void {
    const item = (this.props.items ?? []).find(
      (candidate) => candidate.value === value
    );
    if (item?.disabled === true) return;
    const current = this.getActive();
    let next: string[];
    if (this.props.accordion === true) {
      next = current.includes(value) ? [] : [value];
    } else if (current.includes(value)) {
      next = current.filter((candidate) => candidate !== value);
    } else {
      next = [...current, value];
    }
    if (this.props.active === undefined) {
      this.setState({ internalActive: next });
    }
    this.emit('change', {
      value: next,
      originalEvent: event,
    } satisfies OneCollapseChangeEvent);
  }
}
