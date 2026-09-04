import { Component, type VNode } from '@geektech/tsone';
import {
  ONE_THEME_DEFAULTS,
  ONE_THEME_TYPOGRAPHY_PROPERTIES,
  oneThemeBorder,
  type OneNamedStyle,
} from '../styles/shared';

export type OneTimelineColor = 'primary' | 'success' | 'warning' | 'danger' | 'muted';

export interface OneTimelineItem {
  title: string;
  content?: string;
  time?: string;
  color?: OneTimelineColor;
}

export interface OneTimelineProps {
  items: OneTimelineItem[];
}

const ONE_TIMELINE_COLOR_CLASSES: Record<OneTimelineColor, string> = {
  primary: 'one-timeline__dot--primary',
  success: 'one-timeline__dot--success',
  warning: 'one-timeline__dot--warning',
  danger: 'one-timeline__dot--danger',
  muted: 'one-timeline__dot--muted',
};

export const ONE_TIMELINE_STYLES: OneNamedStyle[] = [
  {
    name: 'one-timeline-base',
    selector: '.one-timeline',
    properties: {
      ...ONE_THEME_TYPOGRAPHY_PROPERTIES,
      boxSizing: 'border-box',
      margin: '0',
      padding: '0',
      listStyle: 'none',
      color: `var(--one-color-text, ${ONE_THEME_DEFAULTS.colorText})`,
    },
  },
  {
    name: 'one-timeline-item',
    selector: '.one-timeline__item',
    properties: {
      position: 'relative',
      display: 'flex',
      gap: '12px',
      paddingBottom: '20px',
    },
  },
  {
    name: 'one-timeline-item-last',
    selector: '.one-timeline__item:last-child',
    properties: { paddingBottom: '0' },
  },
  {
    name: 'one-timeline-rail',
    selector: '.one-timeline__rail',
    properties: {
      position: 'absolute',
      top: '18px',
      left: '5px',
      bottom: '-4px',
      width: '1px',
      backgroundColor: `var(--one-color-border, ${ONE_THEME_DEFAULTS.colorBorder})`,
    },
  },
  {
    name: 'one-timeline-rail-last',
    selector: '.one-timeline__item:last-child .one-timeline__rail',
    properties: { display: 'none' },
  },
  {
    name: 'one-timeline-dot',
    selector: '.one-timeline__dot',
    properties: {
      position: 'relative',
      zIndex: '1',
      flexShrink: '0',
      boxSizing: 'border-box',
      width: '11px',
      height: '11px',
      marginTop: '3px',
      borderRadius: '50%',
      border: oneThemeBorder(),
      backgroundColor: `var(--one-color-surface, ${ONE_THEME_DEFAULTS.colorSurface})`,
    },
  },
  {
    name: 'one-timeline-dot-primary',
    selector: '.one-timeline__dot--primary',
    properties: {
      borderColor: `var(--one-color-primary, ${ONE_THEME_DEFAULTS.colorPrimary})`,
    },
  },
  {
    name: 'one-timeline-dot-success',
    selector: '.one-timeline__dot--success',
    properties: {
      borderColor: `var(--one-color-success, ${ONE_THEME_DEFAULTS.colorSuccess})`,
    },
  },
  {
    name: 'one-timeline-dot-warning',
    selector: '.one-timeline__dot--warning',
    properties: {
      borderColor: `var(--one-color-warning, ${ONE_THEME_DEFAULTS.colorWarning})`,
    },
  },
  {
    name: 'one-timeline-dot-danger',
    selector: '.one-timeline__dot--danger',
    properties: {
      borderColor: `var(--one-color-danger, ${ONE_THEME_DEFAULTS.colorDanger})`,
    },
  },
  {
    name: 'one-timeline-dot-muted',
    selector: '.one-timeline__dot--muted',
    properties: {
      borderColor: `var(--one-color-border, ${ONE_THEME_DEFAULTS.colorBorder})`,
    },
  },
  {
    name: 'one-timeline-content',
    selector: '.one-timeline__content',
    properties: {
      flex: '1',
      minWidth: '0',
      paddingBottom: '2px',
    },
  },
  {
    name: 'one-timeline-title',
    selector: '.one-timeline__title',
    properties: {
      fontSize: `var(--one-font-size-md, ${ONE_THEME_DEFAULTS.fontSizeMd})`,
      fontWeight: '600',
      lineHeight: '1.5',
    },
  },
  {
    name: 'one-timeline-time',
    selector: '.one-timeline__time',
    properties: {
      marginLeft: '8px',
      fontSize: `var(--one-font-size-sm, ${ONE_THEME_DEFAULTS.fontSizeSm})`,
      color: `var(--one-color-muted, ${ONE_THEME_DEFAULTS.colorMuted})`,
      fontWeight: '400',
    },
  },
  {
    name: 'one-timeline-desc',
    selector: '.one-timeline__desc',
    properties: {
      marginTop: '4px',
      fontSize: `var(--one-font-size-sm, ${ONE_THEME_DEFAULTS.fontSizeSm})`,
      color: `var(--one-color-muted, ${ONE_THEME_DEFAULTS.colorMuted})`,
      lineHeight: '1.5',
    },
  },
];

export function normalizeOneTimelineColor(value: unknown): OneTimelineColor {
  return value === 'primary' ||
    value === 'success' ||
    value === 'warning' ||
    value === 'danger' ||
    value === 'muted'
    ? value
    : 'primary';
}

export class OneTimeline extends Component<
  OneTimelineProps,
  Record<string, never>
> {
  protected initState(): Record<string, never> {
    return {};
  }

  protected initStyles(): void {
    ONE_TIMELINE_STYLES.forEach(({ name, ...style }) => {
      this.styleManager.addStyle(name, style);
    });
  }

  protected render(): VNode {
    const items = this.props.items.map((item) => {
      const color = normalizeOneTimelineColor(item.color);
      return {
        tag: 'li',
        props: { className: 'one-timeline__item' },
        children: [
          {
            tag: 'div',
            props: { className: 'one-timeline__rail' },
            children: [],
          },
          {
            tag: 'div',
            props: {
              className: `one-timeline__dot ${ONE_TIMELINE_COLOR_CLASSES[color]}`,
            },
            children: [],
          },
          {
            tag: 'div',
            props: { className: 'one-timeline__content' },
            children: [
              {
                tag: 'div',
                props: { className: 'one-timeline__title' },
                children: [
                  item.title,
                  ...(item.time
                    ? [
                        {
                          tag: 'span',
                          props: { className: 'one-timeline__time' },
                          children: [item.time],
                        } as VNode,
                      ]
                    : []),
                ],
              },
              ...(item.content
                ? [
                    {
                      tag: 'div',
                      props: { className: 'one-timeline__desc' },
                      children: [item.content],
                    } as VNode,
                  ]
                : []),
            ],
          },
        ],
      };
    });

    return {
      tag: 'ul',
      props: { className: 'one-timeline' },
      children: items as Array<VNode | string>,
    };
  }
}
