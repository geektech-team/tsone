export interface OneThemeColors {
  primary: string;
  primaryHover: string;
  primaryContrast: string;
  secondary: string;
  secondaryHover: string;
  secondaryContrast: string;
  danger: string;
  dangerHover: string;
  dangerContrast: string;
  info: string;
  success: string;
  warning: string;
  overlay: string;
  surface: string;
  text: string;
  muted: string;
  focus: string;
}

export interface OneThemeTypography {
  fontFamily: string;
  fontSizeSm: string;
  fontSizeMd: string;
  fontSizeLg: string;
  lineHeight: string;
}

export interface OneThemeBorder {
  color: string;
  width: string;
  style: string;
}

export interface OneThemeRadius {
  sm: string;
  md: string;
  lg: string;
}

export interface OneThemeDefinition {
  colors?: Partial<OneThemeColors>;
  typography?: Partial<OneThemeTypography>;
  border?: Partial<OneThemeBorder>;
  radius?: Partial<OneThemeRadius>;
}

export interface OneResolvedTheme {
  readonly colors: Readonly<OneThemeColors>;
  readonly typography: Readonly<OneThemeTypography>;
  readonly border: Readonly<OneThemeBorder>;
  readonly radius: Readonly<OneThemeRadius>;
}

export interface OneThemeInitOptions {
  themes?: Readonly<Record<string, OneThemeDefinition>>;
  defaultTheme?: string;
}

export interface OneThemeService {
  readonly currentTheme: string;
  init(options?: OneThemeInitOptions): void;
  switch(name: string): void;
}
