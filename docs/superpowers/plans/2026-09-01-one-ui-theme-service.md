# One UI Global Theme Service Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a global, type-safe theme service to One UI that initializes multiple themes, inherits omitted values from the built-in default theme, and switches the active theme through `oneTheme.switch()`.

**Architecture:** Keep theme normalization independent from the DOM, then let a single service own the normalized registry and atomically project one resolved theme onto `document.documentElement` as CSS custom properties. Existing components consume those variables with fallbacks, so importing the library stays side-effect free and applications that never initialize the service retain the current appearance.

**Tech Stack:** TypeScript, Bun, `bun:test`, TSone class components, CSS custom properties.

**Spec:** `docs/superpowers/specs/2026-09-01-one-ui-theme-service-design.md`

## Global Constraints

- Preserve the existing `ONE_THEME_DEFAULTS` export and values.
- Export `oneTheme.init()`, `oneTheme.switch()`, and `oneTheme.currentTheme`; do not add a `switchTheme()` alias.
- Themes are global and always target `document.documentElement`; do not add local theme containers.
- Importing `@geektech/one` must not access `document`.
- The built-in `default` theme is always present and cannot be overridden.
- Custom themes deeply inherit omitted fields from the built-in default.
- Reject unknown fields and blank CSS values rather than silently accepting typos.
- Do not persist theme selection or follow the operating-system color scheme.
- Keep the package free of new runtime dependencies.
- Do not modify `packages/one/package.json`; its current change belongs to the user.

---

## Task 1: Add the theme domain model and strict normalization

**Files:**

- Create: `packages/one/lib/theme/types.ts`
- Create: `packages/one/lib/theme/errors.ts`
- Create: `packages/one/lib/theme/default-theme.ts`
- Create: `packages/one/lib/theme/normalize.ts`
- Create: `packages/one/lib/theme/index.ts`
- Test: `packages/one/tests/theme-normalize.test.ts`

- [ ] **Step 1: Write failing tests for the built-in theme**

Test that `ONE_DEFAULT_THEME` contains the exact resolved values from the design and is deeply frozen:

```ts
import { describe, expect, test } from 'bun:test';
import { ONE_DEFAULT_THEME } from '../lib/theme/default-theme';

describe('ONE_DEFAULT_THEME', () => {
  test('contains the complete resolved default theme', () => {
    expect(ONE_DEFAULT_THEME.colors.primary).toBe('#5fd956');
    expect(ONE_DEFAULT_THEME.typography.lineHeight).toBe('1.5');
    expect(ONE_DEFAULT_THEME.border).toEqual({
      color: '#d9e8d6',
      width: '1px',
      style: 'solid',
    });
    expect(ONE_DEFAULT_THEME.radius).toEqual({
      sm: '4px',
      md: '8px',
      lg: '8px',
    });
  });

  test('is deeply frozen', () => {
    expect(Object.isFrozen(ONE_DEFAULT_THEME)).toBe(true);
    expect(Object.isFrozen(ONE_DEFAULT_THEME.colors)).toBe(true);
  });
});
```

- [ ] **Step 2: Run the test and confirm it fails**

Run: `bun test packages/one/tests/theme-normalize.test.ts`

Expected: FAIL because the theme modules do not exist.

- [ ] **Step 3: Define the public theme types**

Implement the exact public interfaces from the design:

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
```

- [ ] **Step 4: Add errors and the built-in resolved theme**

Create `OneThemeConfigError`, `OneThemeNotFoundError`, and `OneThemeEnvironmentError`. Build and deeply freeze `ONE_DEFAULT_THEME` with all values defined in the design spec.

- [ ] **Step 5: Add failing normalization tests**

Cover these cases:

- no options returns a registry containing only `default`;
- multiple named themes are accepted;
- every omitted nested field inherits from `ONE_DEFAULT_THEME`;
- the returned registry and resolved themes are deeply frozen;
- `defaultTheme` must exist after normalization;
- `default`, blank, and whitespace-containing custom names are rejected;
- non-record theme definitions and nested groups are rejected;
- unknown top-level and nested properties are rejected;
- every supplied token must be a non-blank string.

Use `as unknown as OneThemeInitOptions` only in negative tests that deliberately bypass compile-time checking.

- [ ] **Step 6: Implement strict normalization**

Add an internal `normalizeOneThemeOptions()` that returns a frozen registry plus selected default name. Use explicit allowlists for top-level groups and nested keys; do not use `any` or silently discard unknown values.

- [ ] **Step 7: Run and format the domain tests**

Run:

```sh
bun test packages/one/tests/theme-normalize.test.ts
bunx prettier --check packages/one/lib/theme packages/one/tests/theme-normalize.test.ts
```

Expected: all tests pass and formatting is clean.

- [ ] **Step 8: Commit the domain model**

```sh
git add packages/one/lib/theme packages/one/tests/theme-normalize.test.ts
git commit -m "feat(one): add theme domain model"
```

---

## Task 2: Implement the global theme service and atomic DOM projection

**Files:**

- Create: `packages/one/lib/theme/variables.ts`
- Create: `packages/one/lib/theme/OneThemeService.ts`
- Modify: `packages/one/lib/theme/index.ts`
- Test: `packages/one/tests/theme.test.ts`

- [ ] **Step 1: Write failing tests for CSS variable projection**

Define the fixed mapping and assert exact writes for a custom active theme, including:

```ts
expect(root.style.getPropertyValue('--one-color-primary')).toBe('#112233');
expect(root.style.getPropertyValue('--one-line-height')).toBe('1.7');
expect(root.style.getPropertyValue('--one-border-width')).toBe('2px');
expect(root.style.getPropertyValue('--one-border-style')).toBe('dashed');
expect(root.style.getPropertyValue('--one-radius-lg')).toBe('12px');
expect(root.dataset.oneTheme).toBe('night');
```

The mapping must cover the full set from the design:

- colors: primary, primary-hover, primary-contrast, secondary, secondary-hover, secondary-contrast, danger, danger-hover, danger-contrast, info, success, warning, overlay, surface, text, muted, focus, border;
- typography: font-family, font-size-sm, font-size-md, font-size-lg, line-height;
- border: border-width, border-style;
- radius: radius-sm, radius-md, radius-lg.

- [ ] **Step 2: Write failing service-state tests**

Cover:

- initial `currentTheme` is `default`;
- `switch('default')` works before `init()`;
- `init()` registers themes and activates `defaultTheme`;
- `switch()` changes both DOM variables and `currentTheme`;
- unknown names throw `OneThemeNotFoundError` without changing state;
- a later `init()` replaces, rather than merges, the previous custom registry;
- invalid reinitialization leaves the prior registry, DOM, and current name intact;
- DOM write failure rolls back all touched properties and `data-one-theme`;
- when no document exists, `init()` and `switch()` throw `OneThemeEnvironmentError` while module import remains safe.

- [ ] **Step 3: Implement the variable mapper**

Export an internal immutable list of `[cssVariable, readValue]` mappings. Keep the mapping deterministic so rollback snapshots and tests use the same finite token set.

- [ ] **Step 4: Implement the service through dependency injection**

Implement an internal `DomOneThemeService` whose constructor accepts a root resolver. The public singleton uses a resolver that reads `document.documentElement` only when `init()` or `switch()` is invoked.

The service algorithm is:

1. normalize into local candidate state;
2. resolve the candidate active theme;
3. resolve the document root or throw an environment error;
4. snapshot every managed CSS property and the existing `data-one-theme` value;
5. write all variables and then the data attribute;
6. on any failure, restore the complete snapshot and rethrow;
7. only after successful DOM projection, publish registry and `currentTheme`.

- [ ] **Step 5: Export the singleton**

In the theme barrel, export `oneTheme` typed as `OneThemeService`. Do not export `DomOneThemeService`, root resolvers, variable maps, or normalizers from the package root.

- [ ] **Step 6: Run service tests and formatting**

```sh
bun test packages/one/tests/theme.test.ts packages/one/tests/theme-normalize.test.ts
bunx prettier --check packages/one/lib/theme packages/one/tests/theme*.test.ts
```

Expected: all tests pass.

- [ ] **Step 7: Commit the service**

```sh
git add packages/one/lib/theme packages/one/tests/theme.test.ts
git commit -m "feat(one): add global theme service"
```

---

## Task 3: Connect all One components to the new theme tokens

**Files:**

- Modify: `packages/one/lib/styles/shared.ts`
- Modify: component style files under `packages/one/lib/components/**`
- Modify: `packages/one/tests/style-contract.test.ts`

- [ ] **Step 1: Add failing shared-style contract tests**

Require the shared helpers to expose theme-aware typography and border declarations:

```ts
export const ONE_THEME_TYPOGRAPHY_PROPERTIES = Object.freeze({
  fontFamily: `var(--one-font-family, ${ONE_THEME_DEFAULTS.fontFamily})`,
  lineHeight: 'var(--one-line-height, 1.5)',
});

export function oneThemeBorder(
  color = `var(--one-color-border, ${ONE_THEME_DEFAULTS.colorBorder})`
): string {
  return `var(--one-border-width, 1px) var(--one-border-style, solid) ${color}`;
}
```

- [ ] **Step 2: Add failing component contract assertions**

For each semantic component root, assert a theme font family and line height:

```text
.one-alert
.one-badge
.one-breadcrumb
.one-button
.one-card
.one-checkbox
.one-checkbox-group
.one-dialog
.one-empty
.one-form
.one-form-item
.one-input
.one-message
.one-pagination
.one-select
.one-switch
.one-tabs
.one-tag
.one-tooltip__bubble
```

Also assert that normal component borders use `--one-border-width` and `--one-border-style`, and that cards/dialogs use `--one-radius-lg`.

- [ ] **Step 3: Implement shared typography integration**

Apply `ONE_THEME_TYPOGRAPHY_PROPERTIES` to the semantic roots. Preserve intentional control-level `line-height: 1` declarations such as badge content and icon-only close controls.

- [ ] **Step 4: Implement border integration**

Replace ordinary `1px solid` component borders with `oneThemeBorder()`, preserving component-specific color-variable precedence. Do not change:

- OneEmpty's decorative `2px` border;
- the button loading spinner's `2px` ring;
- deliberate `border: 0` declarations.

Use `var(--one-radius-lg, 8px)` for card and dialog outer radii. Existing medium/small radius behavior remains compatible.

- [ ] **Step 5: Run style tests and component regressions**

```sh
bun test packages/one/tests/style-contract.test.ts
bun test packages/one/tests/components.test.ts packages/one/tests/advanced-components.test.ts
bunx prettier --check packages/one/lib/styles packages/one/lib/components packages/one/tests/style-contract.test.ts
```

If the repository uses different component test filenames, resolve them with `rg --files packages/one/tests` and run the nearest existing suites; do not invent empty tests.

- [ ] **Step 6: Commit component integration**

```sh
git add packages/one/lib/styles packages/one/lib/components packages/one/tests/style-contract.test.ts
git commit -m "feat(one): connect components to theme tokens"
```

---

## Task 4: Publish the theme API from `@geektech/one`

**Files:**

- Modify: `packages/one/lib/index.ts`
- Modify: `packages/one/tests/component-types.test.ts`
- Modify: `packages/one/tests/package-smoke.test.ts`

- [ ] **Step 1: Add failing public type tests**

Import and type-check:

```ts
import {
  ONE_DEFAULT_THEME,
  OneThemeConfigError,
  OneThemeEnvironmentError,
  OneThemeNotFoundError,
  oneTheme,
  type OneResolvedTheme,
  type OneThemeBorder,
  type OneThemeColors,
  type OneThemeDefinition,
  type OneThemeInitOptions,
  type OneThemeRadius,
  type OneThemeService,
  type OneThemeTypography,
} from '../lib';
```

Add a compile-time use of a multi-theme init object and `oneTheme.switch('brand')`. Assert that `oneTheme.switchTheme` is a type error with `@ts-expect-error`.

- [ ] **Step 2: Add failing package smoke assertions**

The packed package must:

- import successfully with no `document` global;
- expose `oneTheme.init` and `oneTheme.switch` as functions;
- report `oneTheme.currentTheme === 'default'` before initialization;
- not expose `switchTheme`;
- expose `ONE_DEFAULT_THEME.colors.primary === '#5fd956'`.

- [ ] **Step 3: Export the public API**

Re-export the singleton, built-in resolved theme, error classes, and all public types from `packages/one/lib/index.ts`. Do not export internal normalization, DOM implementation, or variable-map helpers.

- [ ] **Step 4: Run public-contract checks**

```sh
bun test packages/one/tests/component-types.test.ts packages/one/tests/package-smoke.test.ts
bunx tsc --noEmit
```

Expected: theme checks pass. If the package smoke suite reports only the pre-existing `packages/one/package.json` peer-range mismatch, record it as user-owned baseline and do not edit that manifest.

- [ ] **Step 5: Commit public exports**

```sh
git add packages/one/lib/index.ts packages/one/tests/component-types.test.ts packages/one/tests/package-smoke.test.ts
git commit -m "feat(one): publish theme service"
```

---

## Task 5: Document initialization, switching, and new tokens

**Files:**

- Modify: `packages/one/README.md`
- Modify: `packages/one/README-zh.md`
- Modify: `packages/one/docs/app/content/theme-tokens.ts`
- Modify: `packages/one/docs/app/content/guide.ts`
- Modify: relevant docs content tests under `packages/one/tests/`

- [ ] **Step 1: Extend failing documentation contracts**

Require both READMEs and the theming guide to mention:

- `oneTheme.init()`;
- multiple named themes;
- `defaultTheme`;
- `oneTheme.switch()`;
- `oneTheme.currentTheme`;
- deep inheritance from the built-in default;
- global-only application to the document root;
- no implicit persistence;
- invalid configuration and unknown-theme errors.

Explicitly reject `switchTheme(` in user-facing examples.

- [ ] **Step 2: Extend the token catalog**

Add the new token rows for:

- `--one-line-height`;
- `--one-border-width`;
- `--one-border-style`;
- `--one-radius-lg`.

Keep the existing token source and dynamic token-count tests synchronized.

- [ ] **Step 3: Update bilingual READMEs**

Add a concise global-theme example using the exact public API. Keep existing manual CSS-variable override guidance because it remains supported.

- [ ] **Step 4: Update the typed theming guide**

Show a complete two-theme initialization and use One UI's own `OneButton` controls to switch themes. Explain that initialization and switching update `document.documentElement`, custom values inherit from `default`, and applications own persistence.

Keep the existing docs route at `/guide/theming/`; do not add a duplicate route. Preserve the current 25-route contract unless the source count has legitimately changed for another reason.

- [ ] **Step 5: Run docs tests and builds**

```sh
bun test packages/one/tests/public-api-docs.test.ts packages/one/tests/docs-content.test.ts packages/one/tests/docs-server.test.ts
bun run --cwd packages/one docs:build
bunx prettier --check packages/one/README.md packages/one/README-zh.md packages/one/docs/app/content
```

If a named docs test does not exist, locate the current equivalent with `rg --files packages/one/tests` and run it.

- [ ] **Step 6: Commit documentation**

```sh
git add packages/one/README.md packages/one/README-zh.md packages/one/docs/app/content packages/one/tests
git commit -m "docs(one): document global themes"
```

Before committing, inspect `git diff --cached --name-only` and unstage unrelated tests or the user-owned package manifest if they were accidentally included.

---

## Task 6: Run release-level verification

**Files:** No intended source changes.

- [ ] **Step 1: Run focused theme and contract suites**

```sh
bun test packages/one/tests/theme-normalize.test.ts packages/one/tests/theme.test.ts packages/one/tests/style-contract.test.ts packages/one/tests/component-types.test.ts packages/one/tests/public-api-docs.test.ts packages/one/tests/package-smoke.test.ts
```

- [ ] **Step 2: Run type checking, lint, and builds**

```sh
bunx tsc --noEmit
bun run lint
bun run build
bun run --cwd packages/one docs:build
```

- [ ] **Step 3: Verify the packed package**

```sh
bun pm pack --cwd packages/one --dry-run
```

Confirm theme source/declarations are included through the existing package build and exports, with no generated artifacts staged.

- [ ] **Step 4: Run the full One suite**

```sh
bun test packages/one --timeout 15000
```

Expected: all newly added tests pass. The only acceptable known baseline is the existing peer-range assertion caused by the user's unstaged `packages/one/package.json` change; do not repair it as part of this task.

- [ ] **Step 5: Inspect repository hygiene**

```sh
git diff --check
git status --short
git log --oneline -6
```

Expected final working-tree state: no task-related changes remain after commits; `packages/one/package.json` may remain modified as the preserved user-owned change.

- [ ] **Step 6: Report completion**

Summarize the API, component token integration, documentation changes, exact verification commands and outcomes, and any remaining baseline failure. Do not claim the full suite is clean if the preserved manifest mismatch still fails.
