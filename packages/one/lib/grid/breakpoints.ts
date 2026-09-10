export type OneGridBreakpoint = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl';

export const ONE_GRID_BREAKPOINT_ORDER: OneGridBreakpoint[] = [
  'xs',
  'sm',
  'md',
  'lg',
  'xl',
  'xxl',
];

export type OneGridBreakpointValue = Exclude<OneGridBreakpoint, 'xs'>;

export const ONE_GRID_BREAKPOINT_DEFAULTS: Record<OneGridBreakpointValue, number> = {
  sm: 576,
  md: 768,
  lg: 992,
  xl: 1200,
  xxl: 1600,
};

export const ONE_GRID_BREAKPOINT_VARS: Record<OneGridBreakpointValue, string> = {
  sm: '--one-grid-breakpoint-sm',
  md: '--one-grid-breakpoint-md',
  lg: '--one-grid-breakpoint-lg',
  xl: '--one-grid-breakpoint-xl',
  xxl: '--one-grid-breakpoint-xxl',
};

export function readOneGridBreakpoints(): Record<OneGridBreakpointValue, number> {
  const result = { ...ONE_GRID_BREAKPOINT_DEFAULTS };
  if (typeof window === 'undefined' || !window.getComputedStyle) {
    return result;
  }
  const style = window.getComputedStyle(document.documentElement);
  for (const key of Object.keys(ONE_GRID_BREAKPOINT_VARS) as OneGridBreakpointValue[]) {
    const raw = style.getPropertyValue(ONE_GRID_BREAKPOINT_VARS[key]).trim();
    const value = parseInt(raw, 10);
    if (Number.isFinite(value) && value > 0) {
      result[key] = value;
    }
  }
  return result;
}

export function resolveOneGridBreakpoint(
  width: number,
  breakpoints: Record<OneGridBreakpointValue, number>
): OneGridBreakpoint {
  let current: OneGridBreakpoint = 'xs';
  for (const key of ONE_GRID_BREAKPOINT_ORDER) {
    if (key === 'xs') continue;
    if (width >= breakpoints[key]) {
      current = key;
    }
  }
  return current;
}
