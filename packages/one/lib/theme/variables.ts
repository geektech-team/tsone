import type { OneResolvedTheme } from './types';

type OneThemeVariableReader = (theme: OneResolvedTheme) => string;
type OneThemeVariable = readonly [string, OneThemeVariableReader];

const THEME_VARIABLES: readonly OneThemeVariable[] = [
  ['--one-color-primary', (theme) => theme.colors.primary],
  ['--one-color-primary-hover', (theme) => theme.colors.primaryHover],
  ['--one-color-primary-contrast', (theme) => theme.colors.primaryContrast],
  ['--one-color-secondary', (theme) => theme.colors.secondary],
  ['--one-color-secondary-hover', (theme) => theme.colors.secondaryHover],
  ['--one-color-secondary-contrast', (theme) => theme.colors.secondaryContrast],
  ['--one-color-danger', (theme) => theme.colors.danger],
  ['--one-color-danger-hover', (theme) => theme.colors.dangerHover],
  ['--one-color-danger-contrast', (theme) => theme.colors.dangerContrast],
  ['--one-color-info', (theme) => theme.colors.info],
  ['--one-color-success', (theme) => theme.colors.success],
  ['--one-color-warning', (theme) => theme.colors.warning],
  ['--one-color-overlay', (theme) => theme.colors.overlay],
  ['--one-color-surface', (theme) => theme.colors.surface],
  ['--one-color-text', (theme) => theme.colors.text],
  ['--one-color-muted', (theme) => theme.colors.muted],
  ['--one-color-focus', (theme) => theme.colors.focus],
  ['--one-color-border', (theme) => theme.border.color],
  ['--one-font-family', (theme) => theme.typography.fontFamily],
  ['--one-font-size-sm', (theme) => theme.typography.fontSizeSm],
  ['--one-font-size-md', (theme) => theme.typography.fontSizeMd],
  ['--one-font-size-lg', (theme) => theme.typography.fontSizeLg],
  ['--one-line-height', (theme) => theme.typography.lineHeight],
  ['--one-border-width', (theme) => theme.border.width],
  ['--one-border-style', (theme) => theme.border.style],
  ['--one-radius-sm', (theme) => theme.radius.sm],
  ['--one-radius-md', (theme) => theme.radius.md],
  ['--one-radius-lg', (theme) => theme.radius.lg],
] as const;

export const ONE_THEME_VARIABLES: readonly OneThemeVariable[] =
  Object.freeze(THEME_VARIABLES);

export function oneThemeToVariables(
  theme: OneResolvedTheme
): ReadonlyArray<readonly [string, string]> {
  return ONE_THEME_VARIABLES.map(([name, readValue]) => [
    name,
    readValue(theme),
  ]);
}
