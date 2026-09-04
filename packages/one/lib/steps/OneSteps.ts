import { Component, type VNode } from '@geektech/tsone';
import {
  ONE_THEME_DEFAULTS,
  ONE_THEME_TYPOGRAPHY_PROPERTIES,
  oneThemeBorder,
  type OneNamedStyle,
} from '../styles/shared';

export type OneStepsStatus = 'wait' | 'process' | 'finish' | 'error';
export type OneStepsDirection = 'horizontal' | 'vertical';

export interface OneStepsItem {
  title: string;
  description?: string;
  status?: OneStepsStatus;
}

export interface OneStepsProps {
  current?: number;
  items: OneStepsItem[];
  direction?: OneStepsDirection;
  onChange?: (current: number) => void;
}

export const ONE_STEPS_STYLES: OneNamedStyle[] = [
  {
    name: 'one-steps-base',
    selector: '.one-steps',
    properties: {
      ...ONE_THEME_TYPOGRAPHY_PROPERTIES,
      display: 'flex',
      boxSizing: 'border-box',
      margin: '0',
      padding: '0',
      listStyle: 'none',
      color: `var(--one-color-text, ${ONE_THEME_DEFAULTS.colorText})`,
    },
  },
  {
    name: 'one-steps-vertical',
    selector: '.one-steps--vertical',
    properties: { flexDirection: 'column' },
  },
  {
    name: 'one-steps-item',
    selector: '.one-steps__item',
    properties: {
      position: 'relative',
      display: 'flex',
      flex: '1 1 0%',
      flexDirection: 'column',
      alignItems: 'center',
      minWidth: '0',
    },
  },
  {
    name: 'one-steps-item-vertical',
    selector: '.one-steps--vertical .one-steps__item',
    properties: {
      flex: 'none',
      flexDirection: 'row',
      alignItems: 'flex-start',
      paddingBottom: '24px',
    },
  },
  {
    name: 'one-steps-tail',
    selector: '.one-steps__tail',
    properties: {
      position: 'absolute',
      top: '14px',
      left: 'calc(50% + 14px)',
      width: 'calc(100% - 28px)',
      borderTop: `var(--one-border-width, 1px) var(--one-border-style, solid) var(--one-color-border, ${ONE_THEME_DEFAULTS.colorBorder})`,
    },
  },
  {
    name: 'one-steps-item-vertical-tail',
    selector: '.one-steps--vertical .one-steps__tail',
    properties: {
      top: '26px',
      left: '12px',
      width: 'auto',
      height: 'calc(100% - 26px)',
      borderTop: '0',
      borderLeft: `var(--one-border-width, 1px) var(--one-border-style, solid) var(--one-color-border, ${ONE_THEME_DEFAULTS.colorBorder})`,
    },
  },
  {
    name: 'one-steps-tail-finish',
    selector: '.one-steps__item--finish > .one-steps__tail',
    properties: {
      borderTopColor: `var(--one-color-primary, ${ONE_THEME_DEFAULTS.colorPrimary})`,
    },
  },
  {
    name: 'one-steps-item-vertical-tail-finish',
    selector: '.one-steps--vertical .one-steps__item--finish > .one-steps__tail',
    properties: {
      borderLeftColor: `var(--one-color-primary, ${ONE_THEME_DEFAULTS.colorPrimary})`,
    },
  },
  {
    name: 'one-steps-icon',
    selector: '.one-steps__icon',
    properties: {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: '0',
      boxSizing: 'border-box',
      width: '28px',
      height: '28px',
      borderRadius: '50%',
      border: oneThemeBorder(
        `var(--one-color-border, ${ONE_THEME_DEFAULTS.colorBorder})`
      ),
      backgroundColor: `var(--one-color-surface, ${ONE_THEME_DEFAULTS.colorSurface})`,
      fontSize: `var(--one-font-size-sm, ${ONE_THEME_DEFAULTS.fontSizeSm})`,
      fontWeight: '600',
    },
  },
  {
    name: 'one-steps-icon-process',
    selector: '.one-steps__item--process .one-steps__icon',
    properties: {
      color: `var(--one-color-primary-contrast, ${ONE_THEME_DEFAULTS.colorSurface})`,
      backgroundColor: `var(--one-color-primary, ${ONE_THEME_DEFAULTS.colorPrimary})`,
      borderColor: `var(--one-color-primary, ${ONE_THEME_DEFAULTS.colorPrimary})`,
    },
  },
  {
    name: 'one-steps-icon-finish',
    selector: '.one-steps__item--finish .one-steps__icon',
    properties: {
      color: `var(--one-color-primary-contrast, ${ONE_THEME_DEFAULTS.colorSurface})`,
      backgroundColor: `var(--one-color-primary, ${ONE_THEME_DEFAULTS.colorPrimary})`,
      borderColor: `var(--one-color-primary, ${ONE_THEME_DEFAULTS.colorPrimary})`,
    },
  },
  {
    name: 'one-steps-icon-error',
    selector: '.one-steps__item--error .one-steps__icon',
    properties: {
      color: `var(--one-color-danger-contrast, #ffffff)`,
      backgroundColor: `var(--one-color-danger, ${ONE_THEME_DEFAULTS.colorDanger})`,
      borderColor: `var(--one-color-danger, ${ONE_THEME_DEFAULTS.colorDanger})`,
    },
  },
  {
    name: 'one-steps-content',
    selector: '.one-steps__content',
    properties: {
      display: 'inline-flex',
      flexDirection: 'column',
      alignItems: 'center',
      marginTop: '8px',
      textAlign: 'center',
      minWidth: '0',
    },
  },
  {
    name: 'one-steps-content-vertical',
    selector: '.one-steps--vertical .one-steps__content',
    properties: {
      alignItems: 'flex-start',
      marginTop: '0',
      marginLeft: '12px',
      textAlign: 'left',
    },
  },
  {
    name: 'one-steps-title',
    selector: '.one-steps__title',
    properties: {
      fontSize: `var(--one-font-size-md, ${ONE_THEME_DEFAULTS.fontSizeMd})`,
      fontWeight: '600',
      lineHeight: '1.4',
    },
  },
  {
    name: 'one-steps-description',
    selector: '.one-steps__description',
    properties: {
      marginTop: '4px',
      fontSize: `var(--one-font-size-sm, ${ONE_THEME_DEFAULTS.fontSizeSm})`,
      color: `var(--one-color-muted, ${ONE_THEME_DEFAULTS.colorMuted})`,
      lineHeight: '1.5',
    },
  },
  {
    name: 'one-steps-disabled',
    selector: '.one-steps__item--wait .one-steps__title, .one-steps__item--wait .one-steps__description',
    properties: { color: `var(--one-color-muted, ${ONE_THEME_DEFAULTS.colorMuted})` },
  },
];

export function normalizeOneStepsStatus(value: unknown): OneStepsStatus {
  return value === 'process' ||
    value === 'finish' ||
    value === 'error' ||
    value === 'wait'
    ? value
    : 'wait';
}

export function resolveOneStepsStatus(
  item: OneStepsItem,
  current: number,
  index: number
): OneStepsStatus {
  if (item.status !== undefined) {
    return normalizeOneStepsStatus(item.status);
  }
  if (index < current) {
    return 'finish';
  }
  if (index === current) {
    return 'process';
  }
  return 'wait';
}

export class OneSteps extends Component<
  OneStepsProps,
  Record<string, never>
> {
  protected initState(): Record<string, never> {
    return {};
  }

  protected initStyles(): void {
    ONE_STEPS_STYLES.forEach(({ name, ...style }) => {
      this.styleManager.addStyle(name, style);
    });
  }

  protected render(): VNode {
    const direction = this.props.direction ?? 'horizontal';
    const current = this.props.current ?? 0;

    const items = this.props.items.map((item, index) => {
      const status = resolveOneStepsStatus(item, current, index);
      const icon =
        status === 'finish'
          ? '✓'
          : status === 'error'
            ? '!'
            : String(index + 1);
      return {
        tag: 'li',
        props: {
          className: `one-steps__item one-steps__item--${status}`,
        },
        children: [
          {
            tag: 'div',
            props: { className: 'one-steps__tail' },
            children: [],
          },
          {
            tag: 'div',
            props: {
              className: 'one-steps__icon',
              'aria-hidden': 'true',
            },
            children: [icon],
          },
          {
            tag: 'div',
            props: { className: 'one-steps__content' },
            children: [
              {
                tag: 'div',
                props: { className: 'one-steps__title' },
                children: [item.title],
              },
              ...(item.description
                ? [
                    {
                      tag: 'div',
                      props: { className: 'one-steps__description' },
                      children: [item.description],
                    } as VNode,
                  ]
                : []),
            ],
          },
        ],
      };
    });

    return {
      tag: 'ol',
      props: {
        className: `one-steps one-steps--${direction}`,
      },
      children: items as Array<VNode | string>,
    };
  }
}
