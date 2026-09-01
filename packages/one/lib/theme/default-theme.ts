import { ONE_THEME_DEFAULTS } from '../styles/shared';
import type { OneResolvedTheme } from './types';

export const ONE_DEFAULT_THEME: OneResolvedTheme = Object.freeze({
  colors: Object.freeze({
    primary: ONE_THEME_DEFAULTS.colorPrimary,
    primaryHover: ONE_THEME_DEFAULTS.colorPrimaryHover,
    primaryContrast: ONE_THEME_DEFAULTS.colorText,
    secondary: ONE_THEME_DEFAULTS.colorSurface,
    secondaryHover: ONE_THEME_DEFAULTS.colorBorder,
    secondaryContrast: ONE_THEME_DEFAULTS.colorText,
    danger: ONE_THEME_DEFAULTS.colorDanger,
    dangerHover: ONE_THEME_DEFAULTS.colorDangerHover,
    dangerContrast: ONE_THEME_DEFAULTS.colorSurface,
    info: ONE_THEME_DEFAULTS.colorInfo,
    success: ONE_THEME_DEFAULTS.colorSuccess,
    warning: ONE_THEME_DEFAULTS.colorWarning,
    overlay: ONE_THEME_DEFAULTS.colorOverlay,
    surface: ONE_THEME_DEFAULTS.colorSurface,
    text: ONE_THEME_DEFAULTS.colorText,
    muted: ONE_THEME_DEFAULTS.colorMuted,
    focus: ONE_THEME_DEFAULTS.colorFocus,
  }),
  typography: Object.freeze({
    fontFamily: ONE_THEME_DEFAULTS.fontFamily,
    fontSizeSm: ONE_THEME_DEFAULTS.fontSizeSm,
    fontSizeMd: ONE_THEME_DEFAULTS.fontSizeMd,
    fontSizeLg: ONE_THEME_DEFAULTS.fontSizeLg,
    lineHeight: '1.5',
  }),
  border: Object.freeze({
    color: ONE_THEME_DEFAULTS.colorBorder,
    width: '1px',
    style: 'solid',
  }),
  radius: Object.freeze({
    sm: ONE_THEME_DEFAULTS.radiusSm,
    md: ONE_THEME_DEFAULTS.radiusMd,
    lg: ONE_THEME_DEFAULTS.radiusMd,
  }),
});
