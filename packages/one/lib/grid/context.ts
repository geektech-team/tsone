import type { InjectionKey } from '@geektech/tsone';
import type { OneGridBreakpoint } from './breakpoints';

export interface OneRowGutter {
  horizontal: number;
  vertical: number;
}

export interface OneGridResponsiveContext {
  currentBreakpoint: OneGridBreakpoint;
}

export const ONE_ROW_GUTTER_KEY = Symbol('one-row-gutter') as InjectionKey<OneRowGutter>;

export const ONE_GRID_RESPONSIVE_KEY = Symbol(
  'one-grid-responsive'
) as InjectionKey<OneGridResponsiveContext>;
