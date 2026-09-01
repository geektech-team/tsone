# One UI Global Theme Service Design

## Status

Approved in conversation on 2026-09-01. This specification defines a global
theme registry and runtime switching service for `@geektech/one`.

## Goal

Add a built-in default theme, initialization for multiple named custom themes,
and a global `oneTheme.switch()` method. Themes configure semantic colors,
typography, line height, border color/width/style, and small/medium/large corner
radii. Switching must update existing One UI components immediately through
CSS variables without remounting them.

## Non-goals

- Do not support component-local themes, nested theme providers, shadow roots,
  or custom target elements.
- Do not persist the selected theme in `localStorage`, cookies, or another
  storage mechanism.
- Do not follow operating-system color-scheme preferences automatically.
- Do not animate theme transitions or generate colors from one seed color.
- Do not add runtime dependencies or change TSone public APIs.
- Do not modify, format, stage, or commit the existing user-owned change in
  `packages/one/package.json`.

## Architecture

The theme subsystem lives in `packages/one/lib/theme/` and contains:

- `types.ts` for public configuration, resolved-theme, service, and error
  contracts.
- `default-theme.ts` for the immutable nested `ONE_DEFAULT_THEME` value.
- `normalize.ts` for strict validation and deep merging into the default.
- `variables.ts` for the pure resolved-theme-to-CSS-variable mapping.
- `errors.ts` for stable public theme error classes.
- `OneThemeService.ts` for the private browser service implementation and the
  public `oneTheme` singleton.
- `index.ts` for explicit exports.

The design uses these object-oriented relationships:

- Implementation: the private service class implements the public
  `OneThemeService` interface.
- Composition: the service owns its normalized theme registry and current
  theme name.
- Aggregation: `init()` consumes caller-owned readonly definitions but stores
  new resolved records rather than mutating caller data.
- Dependency: the service depends on pure normalization and variable-mapping
  functions plus the browser `document.documentElement` boundary.

The service has one public responsibility: coordinate global One UI theme
registration and selection. Validation and CSS mapping remain separate pure
modules. There is no theme base class, TSone plugin, application-context
provider, or inheritance hierarchy.

## Public API

The package root exports the singleton, built-in theme, error classes, and all
public interfaces shown below. It does not expose an alternative
`switchTheme()` alias.

```ts
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
  colors: Readonly<OneThemeColors>;
  typography: Readonly<OneThemeTypography>;
  border: Readonly<OneThemeBorder>;
  radius: Readonly<OneThemeRadius>;
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
```

The primary usage is:

```ts
import { oneTheme } from '@geektech/one';

oneTheme.init({
  defaultTheme: 'brand',
  themes: {
    brand: {
      colors: { primary: '#5fd956' },
      typography: {
        fontFamily: 'Inter, sans-serif',
        lineHeight: '1.5',
      },
      border: { color: '#d9e8d6', width: '1px', style: 'solid' },
      radius: { sm: '4px', md: '8px', lg: '12px' },
    },
  },
});

oneTheme.switch('default');
console.log(oneTheme.currentTheme);
```

## Built-in Default Theme

The reserved `default` theme is always registered. It preserves the current
One UI visual fallbacks:

- Primary: `#5fd956`; primary hover: `#4bc944`; primary contrast: `#162018`.
- Secondary: `#ffffff`; secondary hover: `#d9e8d6`; secondary contrast:
  `#162018`.
- Danger: `#b83232`; danger hover: `#9f2d2d`; danger contrast: `#ffffff`.
- Info: `#2563eb`; success: `#2f7c39`; warning: `#9a6700`.
- Overlay: `rgba(22, 32, 24, 0.48)`; surface: `#ffffff`; text: `#162018`;
  muted: `#647268`; focus: `#2f7c39`.
- Font family and `12px`, `14px`, `16px` size presets come from the existing
  `ONE_THEME_DEFAULTS`; line height is `1.5`.
- Border color is `#d9e8d6`, width is `1px`, and style is `solid`.
- Radius presets are `4px`, `8px`, and `8px`. Large defaults to the current
  medium radius so adopting the new large semantic token does not change the
  built-in appearance.

`ONE_THEME_DEFAULTS` remains exported with its existing flat keys and values.
`ONE_DEFAULT_THEME` is the new nested public definition. Neither object is
mutated during initialization or switching.

## Initialization and Normalization

`oneTheme` begins with a registry containing only `default`, a
`currentTheme` value of `default`, and no import-time DOM side effects. Existing
component CSS fallbacks therefore remain sufficient before initialization.

`init(options)` performs these steps atomically:

1. Validate the complete options tree without changing service or DOM state.
2. Reject a custom theme named `default` because the built-in name is reserved.
3. Reject empty or whitespace-padded theme names, arrays where records are
   required, unknown nested fields, non-string CSS values, and empty or
   whitespace-only CSS values.
4. Resolve every custom theme independently by deeply merging each group into
   `ONE_DEFAULT_THEME`. Themes do not inherit from other custom themes.
5. Validate that `defaultTheme`, which defaults to `default`, exists in the new
   registry.
6. Resolve `document.documentElement`; fail without mutating state if the
   browser environment is unavailable.
7. Replace the old registry, remove every CSS variable owned by the service,
   apply the selected full theme, set `data-one-theme`, and update
   `currentTheme`.

Calling `init()` again replaces all prior custom themes. Old custom theme names
become unavailable, and variables owned by the previous initialization cannot
remain on the root element.

## Switching

`switch(name)` is also atomic:

1. Validate the exact non-empty name and look it up in the current registry.
2. Resolve the global `document.documentElement`.
3. Write the complete fixed variable set for the target theme.
4. Set `data-one-theme` to the selected name.
5. Update `currentTheme` only after DOM application succeeds.

The method performs no component rerender because all component styles consume
the variables dynamically. Calling `switch('default')` works even before
`init()` because the default registry entry always exists.

DOM application snapshots the previous values of every owned variable and the
theme data attribute. If a write unexpectedly throws, it restores that
snapshot before propagating the error. Service state changes only after the
complete DOM write succeeds.

## CSS Variable Mapping

Every resolved theme maps to this fixed owned set:

- Colors: `--one-color-primary`, `--one-color-primary-hover`,
  `--one-color-primary-contrast`, `--one-color-secondary`,
  `--one-color-secondary-hover`, `--one-color-secondary-contrast`,
  `--one-color-danger`, `--one-color-danger-hover`,
  `--one-color-danger-contrast`, `--one-color-info`,
  `--one-color-success`, `--one-color-warning`, `--one-color-overlay`,
  `--one-color-surface`, `--one-color-text`, `--one-color-muted`,
  `--one-color-focus`, and `--one-color-border`.
- Typography: `--one-font-family`, `--one-font-size-sm`,
  `--one-font-size-md`, `--one-font-size-lg`, and `--one-line-height`.
- Border: `--one-border-width` and `--one-border-style`; border color maps to
  the existing `--one-color-border` variable.
- Radius: `--one-radius-sm`, `--one-radius-md`, and `--one-radius-lg`.

Spacing, shadows, z-index values, component-level override variables, and
tooltip positioning variables remain outside theme definitions. The existing
public CSS-variable customization surface remains valid.

## Component Style Integration

All normal One UI component borders currently expressed as `1px solid` must
use the shared border-width and border-style variables while preserving their
existing color-variable precedence. Component-level border-color overrides,
such as `--one-input-border-color`, remain higher priority than the global
theme border color.

Decorative or state-specific strokes are not global borders and remain fixed:

- The `OneEmpty` illustration's `2px` decorative stroke.
- The `OneButton` loading spinner's `2px` current-color stroke.
- Intentionally borderless icon, tab, and action buttons.

Component base styles use `--one-font-family` and `--one-line-height` with
built-in fallbacks. Native controls that use `font: inherit` continue to inherit
both values. Existing compact internal elements with intentional
`line-height: 1`, such as badge content and icon buttons, retain that local
override.

The new radius semantics are:

- `sm` for compact controls and floating hints.
- `md` for standard controls and inline feedback.
- `lg` for cards and dialogs. Its built-in value matches the old medium radius,
  so the default appearance remains stable while custom themes can distinguish
  large surfaces.

All selectors remain scoped under `.one-*`; the theme service writes variables
and `data-one-theme` only and does not inject unscoped component CSS.

## Errors and Atomicity

The package root exports three stable error classes:

- `OneThemeConfigError` for invalid names, definitions, fields, values, or
  default-theme references.
- `OneThemeNotFoundError` when `switch()` receives a valid name that is not in
  the current registry.
- `OneThemeEnvironmentError` when a mutating theme operation has no browser
  document root.

Failed initialization leaves the previous registry, current name, root
variables, and `data-one-theme` unchanged. Failed switching leaves the current
theme and DOM unchanged. The service never silently falls back after a failed
operation.

## Documentation

Update both package READMEs and `/guide/theming/` with:

- The built-in `default` theme.
- Multiple named theme initialization.
- Partial override and default inheritance rules.
- Every colors, typography, border, and radius field.
- `oneTheme.init()`, `oneTheme.switch()`, and `currentTheme` examples.
- Error behavior, global-only scope, and the explicit lack of persistence.

The documentation's switch example uses `OneButton` for controls. It must not
show `switchTheme()`, a local theme target, or a storage option. No new
documentation route is required.

## Testing Strategy

Use TDD and add focused coverage for:

- Exact built-in default values and immutability.
- Partial custom-theme inheritance and multiple named themes.
- Initialization, switching to custom and default themes, current-name state,
  root variables, and `data-one-theme`.
- Reinitialization replacing custom themes and clearing owned variables.
- Strict invalid configuration and unknown-theme errors with atomic state and
  DOM preservation.
- Import safety and operation errors without a browser environment.
- The pure CSS-variable mapping and fixed owned-variable set.
- Component borders, typography, line height, radius mapping, scoped CSS, and
  existing component-level override precedence.
- Root exports, compile-time public interfaces, generated declarations, packed
  ESM consumption, README examples, and typed documentation content.

Run focused theme and style tests first, then the complete One package suite,
typecheck, One build, 25-page documentation build, dry-run pack, and formatting
checks. The protected peer-range mismatch in `package-contract.test.ts` remains
an existing baseline unless separately authorized.

## Acceptance Criteria

- `oneTheme.init()` registers multiple partial themes and immediately applies
  the configured default theme globally.
- `oneTheme.switch()` changes existing One components without rerendering and
  updates `currentTheme` plus `data-one-theme`.
- `switchTheme()` is absent from runtime exports, type declarations, tests, and
  documentation.
- The immutable built-in `default` theme is always available and cannot be
  overridden.
- Colors, font family, font sizes, line height, border color/width/style, and
  small/medium/large radii all map to documented CSS variables.
- Normal borders and component typography consume the new global variables
  while the current default appearance remains stable.
- Invalid initialization and switching are strict and atomic.
- Importing the package remains safe outside a browser; mutating theme calls
  fail with the documented environment error.
- Documentation and both READMEs use only real package-root exports and the
  exact `init()` / `switch()` method names.
- Focused theme, style, docs, type, build, and package-smoke checks pass, with
  the existing protected peer-range baseline reported separately.
