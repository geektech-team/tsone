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
  readOneGridBreakpoints,
  resolveOneGridBreakpoint,
  type OneGridBreakpoint,
} from './breakpoints';

export type OneRowAlign =
  | 'start'
  | 'center'
  | 'end'
  | 'baseline'
  | 'stretch';

export type OneRowJustify =
  | 'start'
  | 'center'
  | 'end'
  | 'space-between'
  | 'space-around'
  | 'space-evenly';

export type OneRowGutterValue = number | [number, number];

export interface OneRowProps {
  /** 列间距，数值同时作用于水平和垂直，数组为 [水平, 垂直]，单位 px。 */
  gutter?: OneRowGutterValue;
  /** 交叉轴对齐方式，默认 start。 */
  align?: OneRowAlign;
  /** 主轴分布方式，默认 start。 */
  justify?: OneRowJustify;
  /** 允许列换行，默认 true。 */
  wrap?: boolean;
  children?: Array<VNode | string>;
}

interface OneRowState {
  currentBreakpoint: OneGridBreakpoint;
}

export const ONE_ROW_STYLES: OneNamedStyle[] = [
  {
    name: 'one-row-base',
    selector: '.one-row',
    properties: {
      ...ONE_THEME_TYPOGRAPHY_PROPERTIES,
      display: 'flex',
      flexWrap: 'wrap',
      boxSizing: 'border-box',
    },
  },
];

const ONE_ROW_ALIGN_PROPERTIES: Record<OneRowAlign, string> = {
  start: 'flex-start',
  center: 'center',
  end: 'flex-end',
  baseline: 'baseline',
  stretch: 'stretch',
};

const ONE_ROW_JUSTIFY_PROPERTIES: Record<OneRowJustify, string> = {
  start: 'flex-start',
  center: 'center',
  end: 'flex-end',
  'space-between': 'space-between',
  'space-around': 'space-around',
  'space-evenly': 'space-evenly',
};

function normalizeOneGutterPart(value: unknown): number {
  const part = Math.floor(Number(value));
  return Number.isFinite(part) && part > 0 ? part : 0;
}

export function normalizeOneRowGutter(value: unknown): OneRowGutter {
  if (Array.isArray(value)) {
    return {
      horizontal: normalizeOneGutterPart(value[0]),
      vertical: normalizeOneGutterPart(value[1]),
    };
  }
  const gutter = normalizeOneGutterPart(value);
  return { horizontal: gutter, vertical: gutter };
}

export class OneRow extends Component<OneRowProps, OneRowState> {
  private handleResize = (): void => {
    this.updateBreakpoint();
  };

  protected initState(): OneRowState {
    return { currentBreakpoint: 'xs' };
  }

  protected initStyles(): void {
    ONE_ROW_STYLES.forEach(({ name, ...style }) => {
      this.styleManager.addStyle(name, style);
    });
  }

  protected render(): VNode {
    const gutter = normalizeOneRowGutter(this.props.gutter);
    const align = this.props.align ?? 'start';
    const justify = this.props.justify ?? 'start';
    const wrap = this.props.wrap ?? true;
    const responsive: OneGridResponsiveContext = {
      currentBreakpoint: this.state.currentBreakpoint,
    };

    this.provide(ONE_ROW_GUTTER_KEY, gutter);
    this.provide(ONE_GRID_RESPONSIVE_KEY, responsive);

    const style: Record<string, string> = {
      marginLeft: `${-gutter.horizontal / 2}px`,
      marginRight: `${-gutter.horizontal / 2}px`,
      rowGap: `${gutter.vertical}px`,
      alignItems: ONE_ROW_ALIGN_PROPERTIES[align],
      justifyContent: ONE_ROW_JUSTIFY_PROPERTIES[justify],
    };

    if (!wrap) {
      style.flexWrap = 'nowrap';
    }

    return {
      tag: 'div',
      props: {
        className: 'one-row',
        style,
      },
      children: this.props.children ?? [],
    };
  }

  protected onMounted(): void {
    this.updateBreakpoint();
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', this.handleResize);
    }
  }

  protected onUnmounted(): void {
    if (typeof window !== 'undefined') {
      window.removeEventListener('resize', this.handleResize);
    }
  }

  private updateBreakpoint(): void {
    if (typeof window === 'undefined') return;
    const width = window.innerWidth ?? 0;
    const breakpoints = readOneGridBreakpoints();
    const next = resolveOneGridBreakpoint(width, breakpoints);
    if (next !== this.state.currentBreakpoint) {
      this.state.currentBreakpoint = next;
    }
  }
}
