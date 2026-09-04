import { Component, type VNode } from '@geektech/tsone';
import {
  ONE_THEME_DEFAULTS,
  ONE_THEME_TYPOGRAPHY_PROPERTIES,
  type OneNamedStyle,
} from '../styles/shared';
import type { OneComponentSize } from '../types';

export type OneSpaceDirection = 'horizontal' | 'vertical';
export type OneSpaceSize = OneComponentSize | number;
export type OneSpaceAlign = 'start' | 'center' | 'end' | 'baseline' | 'stretch';

export interface OneSpaceProps {
  direction?: OneSpaceDirection;
  size?: OneSpaceSize;
  wrap?: boolean;
  align?: OneSpaceAlign;
  children?: Array<VNode | string>;
}

const ONE_SPACE_SIZE_TOKENS: Record<OneComponentSize, string> = {
  sm: `var(--one-space-sm, ${ONE_THEME_DEFAULTS.spaceSm})`,
  md: `var(--one-space-md, ${ONE_THEME_DEFAULTS.spaceMd})`,
  lg: `var(--one-space-lg, ${ONE_THEME_DEFAULTS.spaceLg})`,
};

const ONE_SPACE_ALIGN_PROPERTIES: Record<
  OneSpaceAlign,
  Record<string, string>
> = {
  start: { alignItems: 'flex-start' },
  center: { alignItems: 'center' },
  end: { alignItems: 'flex-end' },
  baseline: { alignItems: 'baseline' },
  stretch: { alignItems: 'stretch' },
};

export const ONE_SPACE_STYLES: OneNamedStyle[] = [
  {
    name: 'one-space-base',
    selector: '.one-space',
    properties: {
      ...ONE_THEME_TYPOGRAPHY_PROPERTIES,
      display: 'inline-flex',
      boxSizing: 'border-box',
    },
  },
  {
    name: 'one-space-vertical',
    selector: '.one-space--vertical',
    properties: { flexDirection: 'column' },
  },
  {
    name: 'one-space-wrap',
    selector: '.one-space--wrap',
    properties: { flexWrap: 'wrap' },
  },
  {
    name: 'one-space-item',
    selector: '.one-space__item',
    properties: { display: 'inline-flex', maxWidth: '100%' },
  },
];

export function normalizeOneSpaceSize(value: unknown): string {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return `${value}px`;
  }
  return (
    ONE_SPACE_SIZE_TOKENS[value as OneComponentSize] ??
    ONE_SPACE_SIZE_TOKENS.md
  );
}

export class OneSpace extends Component<OneSpaceProps, Record<string, never>> {
  protected initState(): Record<string, never> {
    return {};
  }

  protected initStyles(): void {
    ONE_SPACE_STYLES.forEach(({ name, ...style }) => {
      this.styleManager.addStyle(name, style);
    });
  }

  protected render(): VNode {
    const direction = this.props.direction ?? 'horizontal';
    const align = this.props.align ?? 'start';
    const className = [
      'one-space',
      `one-space--${direction}`,
      ...(this.props.wrap ? ['one-space--wrap'] : []),
    ].join(' ');

    const style: Record<string, string> = {
      gap: normalizeOneSpaceSize(this.props.size),
      ...ONE_SPACE_ALIGN_PROPERTIES[align],
    };

    const children = (this.props.children ?? []).map(
      (child) =>
        ({
          tag: 'div',
          props: { className: 'one-space__item' },
          children: [child],
        }) as VNode
    );

    return {
      tag: 'div',
      props: {
        className,
        style: cssProperties(style),
      },
      children,
    };
  }
}

function cssProperties(
  properties: Record<string, string>
): Record<string, string> {
  return properties;
}
