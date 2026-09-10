import { Component, type VNode } from '@geektech/tsone';
import {
  ONE_THEME_TYPOGRAPHY_PROPERTIES,
  type OneNamedStyle,
} from '../styles/shared';
import {
  ONE_GRID_RESPONSIVE_KEY,
  ONE_ROW_GUTTER_KEY,
  type OneGridResponsiveContext,
  type OneRowGutter,
} from './context';
import {
  ONE_GRID_BREAKPOINT_ORDER,
  type OneGridBreakpoint,
} from './breakpoints';

export const ONE_GRID_COLUMNS = 24;

export interface OneColResponsiveValue {
  span?: number;
  offset?: number;
}

export type OneColBreakpointProp = number | OneColResponsiveValue;

export interface OneColProps {
  /** 占用的栅格数，1-24。不传时按内容自适应宽度。 */
  span?: number;
  /** 向右偏移的栅格数，0-23。 */
  offset?: number;
  /** < 576px 断点的 span/offset，可传数字（仅 span）或 { span, offset }。 */
  xs?: OneColBreakpointProp;
  /** >= 576px 断点的 span/offset。 */
  sm?: OneColBreakpointProp;
  /** >= 768px 断点的 span/offset。 */
  md?: OneColBreakpointProp;
  /** >= 992px 断点的 span/offset。 */
  lg?: OneColBreakpointProp;
  /** >= 1200px 断点的 span/offset。 */
  xl?: OneColBreakpointProp;
  /** >= 1600px 断点的 span/offset。 */
  xxl?: OneColBreakpointProp;
  children?: Array<VNode | string>;
}

export const ONE_COL_STYLES: OneNamedStyle[] = [
  {
    name: 'one-col-base',
    selector: '.one-col',
    properties: {
      ...ONE_THEME_TYPOGRAPHY_PROPERTIES,
      boxSizing: 'border-box',
      flex: '0 0 auto',
      minWidth: '0',
    },
  },
];

export function normalizeOneColSpan(value: unknown): number | undefined {
  const span = Math.floor(Number(value));
  if (!Number.isFinite(span) || span < 1) {
    return undefined;
  }
  return Math.min(ONE_GRID_COLUMNS, span);
}

export function normalizeOneColOffset(value: unknown): number {
  const offset = Math.floor(Number(value));
  if (!Number.isFinite(offset) || offset < 1) {
    return 0;
  }
  return Math.min(ONE_GRID_COLUMNS - 1, offset);
}

function normalizeResponsiveValue(
  value: unknown
): OneColResponsiveValue | undefined {
  if (value === undefined || value === null) return undefined;
  if (typeof value === 'number') {
    const span = normalizeOneColSpan(value);
    return span === undefined ? undefined : { span };
  }
  if (typeof value === 'object') {
    const result: OneColResponsiveValue = {};
    const raw = value as Record<string, unknown>;
    if (raw.span !== undefined) {
      const span = normalizeOneColSpan(raw.span);
      if (span !== undefined) result.span = span;
    }
    if (raw.offset !== undefined) {
      result.offset = normalizeOneColOffset(raw.offset);
    }
    return Object.keys(result).length > 0 ? result : undefined;
  }
  return undefined;
}

interface ResolvedColLayout {
  span?: number;
  offset: number;
}

export function resolveOneColLayout(
  props: OneColProps,
  currentBreakpoint: OneGridBreakpoint
): ResolvedColLayout {
  const index = ONE_GRID_BREAKPOINT_ORDER.indexOf(currentBreakpoint);
  for (let i = index; i >= 0; i--) {
    const bp = ONE_GRID_BREAKPOINT_ORDER[i];
    const value = normalizeResponsiveValue(props[bp]);
    if (value) {
      return {
        span: value.span ?? normalizeOneColSpan(props.span),
        offset: value.offset ?? normalizeOneColOffset(props.offset),
      };
    }
  }
  return {
    span: normalizeOneColSpan(props.span),
    offset: normalizeOneColOffset(props.offset),
  };
}

export class OneCol extends Component<OneColProps, Record<string, never>> {
  protected initState(): Record<string, never> {
    return {};
  }

  protected initStyles(): void {
    ONE_COL_STYLES.forEach(({ name, ...style }) => {
      this.styleManager.addStyle(name, style);
    });
  }

  protected render(): VNode {
    const responsive = this.inject<OneGridResponsiveContext>(
      ONE_GRID_RESPONSIVE_KEY,
      { currentBreakpoint: 'xs' }
    );
    const layout = resolveOneColLayout(this.props, responsive.currentBreakpoint);
    const gutter = this.inject<OneRowGutter>(ONE_ROW_GUTTER_KEY, {
      horizontal: 0,
      vertical: 0,
    });

    const style: Record<string, string> = {
      paddingLeft: `${gutter.horizontal / 2}px`,
      paddingRight: `${gutter.horizontal / 2}px`,
    };

    if (layout.span !== undefined) {
      style.width = `calc(100% * ${layout.span} / ${ONE_GRID_COLUMNS})`;
    }
    if (layout.offset > 0) {
      style.marginLeft = `calc(100% * ${layout.offset} / ${ONE_GRID_COLUMNS})`;
    }

    return {
      tag: 'div',
      props: {
        className: 'one-col',
        style,
      },
      children: this.props.children ?? [],
    };
  }
}
