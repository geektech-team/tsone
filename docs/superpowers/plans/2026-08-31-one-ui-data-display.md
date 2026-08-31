# One UI Data Display Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add `OneTag`, `OneBadge`, and `OneEmpty`, publish and document them, reuse One controls inside documentation demos, and give every interactive demo root `24px` padding.

**Architecture:** Each public component independently extends TSone `Component<Props, State>` and depends only on a small shared data-display variant module; there is no data-display base class. Typed content owns documentation metadata and source examples, `DocArticle` owns static rendering, and the docs client maps demo names to isolated demo components.

**Tech Stack:** Bun workspace, strict TypeScript, TSone class components and VNodes, `bun:test`, typed documentation content, Bun documentation builder.

**Spec:** `docs/superpowers/specs/2026-08-31-one-ui-data-display-design.md`

## Global Constraints

- Work in the current checkout; do not create a worktree unless the user explicitly requests one.
- Preserve and never edit, stage, format, or commit the user's existing `packages/one/package.json` change.
- Preserve the existing uncommitted demo-source disclosure work in `DocArticle.ts`, content types, styles, tests, and `demo-examples.ts`.
- Keep `@geektech/one` browser runtime dependency-free and do not modify TSone public APIs.
- Use strict TypeScript with no new `any`; prefer explicit interfaces, generics, `unknown`, and runtime normalization.
- Public classes are `OneTag`, `OneBadge`, and `OneEmpty`; shared variant is exactly `OneDataDisplayVariant`.
- Keep existing `/components/card/`; add exactly four documentation routes so the total becomes 21.
- Interactive `[data-one-demo]` roots use exactly `24px` padding and `box-sizing: border-box`.
- Use TDD for new behavior: observe the new test fail for the expected missing behavior before implementing it.
- Use Bun commands and commit only task-related files with explicit `git add` paths.

---

### Task 1: Checkpoint the Existing Demo Source Disclosure

**Files:**

- Existing: `packages/one/docs/app/components/DocArticle.ts`
- Existing: `packages/one/docs/app/content/demo-examples.ts`
- Existing: `packages/one/docs/app/content/types.ts`
- Existing: `packages/one/docs/app/styles.ts`
- Existing tests: `packages/one/tests/docs-app.test.ts`
- Existing tests: `packages/one/tests/docs-content.test.ts`

**Interfaces:**

- Consumes: the already implemented `OneDocDemoSource`, `oneDocDemoExamples`, and native `<details>` disclosure.
- Produces: a clean commit boundary for source disclosure before data-display work touches the same files.

- [ ] **Step 1: Confirm the workspace contains only the expected task changes plus the protected manifest**

Run:

```sh
git status --short
git diff -- packages/one/docs/app/components/DocArticle.ts packages/one/docs/app/content/types.ts packages/one/docs/app/styles.ts packages/one/tests/docs-app.test.ts packages/one/tests/docs-content.test.ts
```

Expected: the six tracked documentation files are modified, `demo-examples.ts` is untracked, and `packages/one/package.json` is modified but remains outside every later staging command.

- [ ] **Step 2: Re-run the focused disclosure verification**

Run:

```sh
bun test packages/one/tests/docs-app.test.ts packages/one/tests/docs-content.test.ts
bunx tsc --noEmit
git diff --check
```

Expected: 24 documentation tests pass, TypeScript exits 0, and diff check reports no whitespace errors.

- [ ] **Step 3: Commit only the completed disclosure feature**

```sh
git add packages/one/docs/app/components/DocArticle.ts packages/one/docs/app/content/demo-examples.ts packages/one/docs/app/content/types.ts packages/one/docs/app/styles.ts packages/one/tests/docs-app.test.ts packages/one/tests/docs-content.test.ts
git diff --cached --check
git commit -m "docs(one): add collapsible demo source"
```

Expected: `packages/one/package.json` remains modified and unstaged after the commit.

---

### Task 2: Add Shared Data-Display Types and OneTag

**Files:**

- Create: `packages/one/lib/data-display/types.ts`
- Create: `packages/one/lib/data-display/index.ts`
- Create: `packages/one/lib/tag/OneTag.ts`
- Create: `packages/one/lib/tag/index.ts`
- Create: `packages/one/tests/tag.test.ts`

**Interfaces:**

- Consumes: `Component`, `VNode`, `OneComponentSize`, `normalizeOneSize`, `ONE_THEME_DEFAULTS`, and `OneNamedStyle`.
- Produces: `OneDataDisplayVariant`, `normalizeOneDataDisplayVariant(value): OneDataDisplayVariant`, `OneTagProps`, `ONE_TAG_STYLES`, and `OneTag`.

- [ ] **Step 1: Write failing OneTag behavior tests**

Create `packages/one/tests/tag.test.ts` with a Happy DOM mount harness and these exact cases:

```ts
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { OneTag } from '../lib/tag';

describe('OneTag', () => {
  let container: HTMLElement;
  let component: OneTag;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    component?.unmount();
    container.remove();
  });

  it('normalizes variant and size classes', () => {
    component = new OneTag({
      variant: 'success',
      size: 'lg',
      children: ['已发布'],
    });
    component.mount(container);
    expect(container.querySelector('.one-tag--success')).toBeTruthy();
    expect(container.querySelector('.one-tag--lg')?.textContent).toContain(
      '已发布'
    );
  });

  it('emits close once and leaves a stable hidden anchor', () => {
    component = new OneTag({ closable: true, children: ['可关闭'] });
    let closes = 0;
    component.on('close', () => {
      closes += 1;
    });
    component.mount(container);
    const close = container.querySelector(
      '.one-tag__close'
    ) as HTMLButtonElement;
    expect(close.getAttribute('aria-label')).toBe('关闭标签');
    close.click();
    close.click();
    expect(closes).toBe(1);
    expect(container.querySelector('[data-one-tag-anchor]')).toBeTruthy();
  });

  it('falls back from invalid runtime values', () => {
    component = new OneTag({
      variant: 'unknown' as 'neutral',
      size: 'xl' as 'md',
      children: ['回退'],
    });
    component.mount(container);
    expect(
      container.querySelector('.one-tag--neutral.one-tag--md')
    ).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run the Tag test to verify RED**

Run: `bun test packages/one/tests/tag.test.ts`

Expected: FAIL because `../lib/tag` does not exist.

- [ ] **Step 3: Implement the shared type and normalizer**

Create `packages/one/lib/data-display/types.ts`:

```ts
export type OneDataDisplayVariant =
  | 'neutral'
  | 'primary'
  | 'success'
  | 'warning'
  | 'error';

const VARIANTS: readonly OneDataDisplayVariant[] = [
  'neutral',
  'primary',
  'success',
  'warning',
  'error',
];

export function normalizeOneDataDisplayVariant(
  value: unknown,
  fallback: OneDataDisplayVariant = 'neutral'
): OneDataDisplayVariant {
  return VARIANTS.includes(value as OneDataDisplayVariant)
    ? (value as OneDataDisplayVariant)
    : fallback;
}
```

Create `packages/one/lib/data-display/index.ts`:

```ts
export { normalizeOneDataDisplayVariant } from './types';
export type { OneDataDisplayVariant } from './types';
```

- [ ] **Step 4: Implement OneTag with independent state and named styles**

Create `OneTagProps` and `OneTagState` exactly as follows:

```ts
export interface OneTagProps {
  variant?: OneDataDisplayVariant;
  size?: OneComponentSize;
  closable?: boolean;
  children?: Array<VNode | string>;
}

interface OneTagState {
  visible: boolean;
}
```

`OneTag.render()` must return the stable anchor when hidden and otherwise render a `span` plus the optional close button:

```ts
if (!this.state.visible) {
  return { tag: 'span', props: { hidden: true, 'data-one-tag-anchor': '' } };
}

const variant = normalizeOneDataDisplayVariant(this.props.variant);
const size = normalizeOneSize(this.props.size);
return {
  tag: 'span',
  props: { className: `one-tag one-tag--${variant} one-tag--${size}` },
  children: [
    ...(this.props.children ?? []),
    ...(this.props.closable
      ? [
          {
            tag: 'button',
            props: {
              className: 'one-tag__close',
              type: 'button',
              'aria-label': '关闭标签',
            },
            listeners: { click: () => this.close() },
            children: ['×'],
          } as VNode,
        ]
      : []),
  ],
};
```

`close()` must guard `visible`, call `this.emit('close')`, and set `visible` to false. Define `ONE_TAG_STYLES` with these selectors and properties:

```ts
const variantColors = {
  neutral: [
    'var(--one-color-text)',
    'var(--one-color-surface)',
    'var(--one-color-border)',
  ],
  primary: [
    'var(--one-color-primary-contrast)',
    'var(--one-color-primary)',
    'var(--one-color-primary)',
  ],
  success: [
    'var(--one-color-success)',
    'var(--one-color-surface)',
    'var(--one-color-success)',
  ],
  warning: [
    'var(--one-color-warning)',
    'var(--one-color-surface)',
    'var(--one-color-warning)',
  ],
  error: [
    'var(--one-color-danger)',
    'var(--one-color-surface)',
    'var(--one-color-danger)',
  ],
} as const;
```

`.one-tag` is `inline-flex`, centered, `gap: 4px`, `border: 1px solid`, rounded with `radiusSm`, and uses the One font. Size modifiers use `fontSizeSm/Md/Lg` with padding `2px 6px`, `4px 8px`, and `6px 10px`. `.one-tag__close` is a transparent borderless button; its focus-visible rule uses `colorFocus` with a 2px outline.

- [ ] **Step 5: Run Tag tests and typecheck**

Run:

```sh
bun test packages/one/tests/tag.test.ts
bunx tsc --noEmit
```

Expected: 3 tests pass and TypeScript exits 0.

- [ ] **Step 6: Commit OneTag**

```sh
git add packages/one/lib/data-display packages/one/lib/tag packages/one/tests/tag.test.ts
git commit -m "feat(one): add tag component"
```

---

### Task 3: Add OneBadge

**Files:**

- Create: `packages/one/lib/badge/OneBadge.ts`
- Create: `packages/one/lib/badge/index.ts`
- Create: `packages/one/tests/badge.test.ts`

**Interfaces:**

- Consumes: `OneDataDisplayVariant`, `normalizeOneDataDisplayVariant`, `ONE_THEME_DEFAULTS`, and `OneNamedStyle`.
- Produces: `OneBadgeProps`, `ONE_BADGE_STYLES`, and `OneBadge`.

- [ ] **Step 1: Write failing OneBadge behavior tests**

Create `packages/one/tests/badge.test.ts` with tests that mount independent instances and assert:

```ts
it('formats counts and supports a custom maximum', () => {
  component = new OneBadge({ value: 120, children: ['收件箱'] });
  component.mount(container);
  expect(container.querySelector('.one-badge__content')?.textContent).toBe(
    '99+'
  );
  component.setProps({ value: 11, max: 10, children: ['收件箱'] });
  expect(container.querySelector('.one-badge__content')?.textContent).toBe(
    '10+'
  );
});

it('handles zero, dot and hidden values deterministically', () => {
  component = new OneBadge({ value: 0, children: ['通知'] });
  component.mount(container);
  expect(container.querySelector('.one-badge__content')).toBeNull();
  component.setProps({ value: 0, showZero: true, children: ['通知'] });
  expect(container.querySelector('.one-badge__content')?.textContent).toBe('0');
  component.setProps({ dot: true, ariaLabel: '有新通知', children: ['通知'] });
  expect(
    container
      .querySelector('.one-badge__content--dot')
      ?.getAttribute('aria-label')
  ).toBe('有新通知');
});

it('renders standalone text and falls back from invalid props', () => {
  component = new OneBadge({
    value: 'NEW',
    max: Number.NaN,
    variant: 'unknown' as 'primary',
  });
  component.mount(container);
  expect(
    container.querySelector('.one-badge--standalone.one-badge--primary')
  ).toBeTruthy();
  expect(container.querySelector('.one-badge__content')?.textContent).toBe(
    'NEW'
  );
});
```

Include the same `beforeEach`/`afterEach` mount harness used by `tag.test.ts`.

- [ ] **Step 2: Run the Badge test to verify RED**

Run: `bun test packages/one/tests/badge.test.ts`

Expected: FAIL because `../lib/badge` does not exist.

- [ ] **Step 3: Implement OneBadge derived rendering**

Use this public interface:

```ts
export interface OneBadgeProps {
  value?: number | string;
  max?: number;
  dot?: boolean;
  showZero?: boolean;
  variant?: OneDataDisplayVariant;
  ariaLabel?: string;
  children?: Array<VNode | string>;
}
```

Implement pure helpers with these exact contracts:

```ts
function normalizeMax(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0
    ? Math.floor(value)
    : 99;
}

function displayValue(props: OneBadgeProps): string | undefined {
  if (props.dot) return '';
  if (props.value === undefined || props.value === '') return undefined;
  if (props.value === 0 && props.showZero !== true) return undefined;
  if (typeof props.value === 'number' && !Number.isFinite(props.value))
    return undefined;
  if (typeof props.value === 'number') {
    const max = normalizeMax(props.max);
    return props.value > max ? `${max}+` : String(props.value);
  }
  return props.value;
}
```

Render a `.one-badge` span, include default children first, and include `.one-badge__content` only when dot is true or `displayValue()` is defined. Add `one-badge--standalone` when there are no children. Normalize the variant with `normalizeOneDataDisplayVariant(this.props.variant, 'primary')`. Add `aria-label` from props; add `aria-hidden="true"` only for a dot with no aria label.

Define styles with these exact layout rules:

```ts
// .one-badge
{ position: 'relative', display: 'inline-flex', verticalAlign: 'middle' }
// .one-badge__content
{ position: 'absolute', top: '0', right: '0', minWidth: '18px', height: '18px', padding: '0 5px', borderRadius: '999px', transform: 'translate(50%, -50%)' }
// .one-badge--standalone .one-badge__content
{ position: 'static', transform: 'none' }
// .one-badge__content--dot
{ width: '8px', minWidth: '8px', height: '8px', padding: '0' }
```

Add five variant selectors. Neutral uses text/surface/border, primary uses primary with primary contrast, success uses success with surface text, warning uses warning with surface text, and error uses danger with surface text.

- [ ] **Step 4: Run Badge tests and typecheck**

Run:

```sh
bun test packages/one/tests/badge.test.ts
bunx tsc --noEmit
```

Expected: 3 tests pass and TypeScript exits 0.

- [ ] **Step 5: Commit OneBadge**

```sh
git add packages/one/lib/badge packages/one/tests/badge.test.ts
git commit -m "feat(one): add badge component"
```

---

### Task 4: Add OneEmpty

**Files:**

- Create: `packages/one/lib/empty/OneEmpty.ts`
- Create: `packages/one/lib/empty/index.ts`
- Create: `packages/one/tests/empty.test.ts`

**Interfaces:**

- Consumes: TSone `Component`, `slot`, `VNode`, `ONE_THEME_DEFAULTS`, and `OneNamedStyle`.
- Produces: `OneEmptyProps`, `ONE_EMPTY_STYLES`, and `OneEmpty`.

- [ ] **Step 1: Write failing OneEmpty slot tests**

Create `packages/one/tests/empty.test.ts` with the standard mount harness and these exact cases:

```ts
it('renders a decorative default image and default description', () => {
  component = new OneEmpty();
  component.mount(container);
  expect(
    container.querySelector('.one-empty__image')?.getAttribute('aria-hidden')
  ).toBe('true');
  expect(container.querySelector('.one-empty__description')?.textContent).toBe(
    '暂无数据'
  );
  expect(container.querySelector('.one-empty__actions')).toBeNull();
});

it('prefers image, default and actions slots over fallback content', () => {
  component = new OneEmpty({
    description: '后备说明',
    children: [
      { tag: 'span', slot: 'image', children: ['自定义图片'] },
      { tag: 'strong', children: ['自定义说明'] },
      { tag: 'button', slot: 'actions', children: ['创建数据'] },
    ],
  });
  component.mount(container);
  expect(container.querySelector('.one-empty__image')?.textContent).toBe(
    '自定义图片'
  );
  expect(container.querySelector('.one-empty__description')?.textContent).toBe(
    '自定义说明'
  );
  expect(container.querySelector('.one-empty__actions')?.textContent).toBe(
    '创建数据'
  );
  expect(container.textContent).not.toContain('后备说明');
});
```

- [ ] **Step 2: Run the Empty test to verify RED**

Run: `bun test packages/one/tests/empty.test.ts`

Expected: FAIL because `../lib/empty` does not exist.

- [ ] **Step 3: Implement OneEmpty with explicit slot priority**

Use this public interface:

```ts
export interface OneEmptyProps {
  description?: string;
  children?: Array<VNode | string>;
}
```

Use `hasNamedSlot(children, 'image' | 'actions')` and `hasDefaultSlot(children)` helpers. Render `.one-empty` with image and description sections always present, and actions only when supplied:

```ts
children: [
  {
    tag: 'div',
    props: {
      className: 'one-empty__image',
      'aria-hidden': customImage ? undefined : 'true',
    },
    children: customImage
      ? [slot('image')]
      : [{ tag: 'span', props: { className: 'one-empty__illustration' } }],
  },
  {
    tag: 'div',
    props: { className: 'one-empty__description' },
    children: customDescription
      ? [slot('default')]
      : [this.props.description ?? '暂无数据'],
  },
  ...(customActions
    ? [
        {
          tag: 'div',
          props: { className: 'one-empty__actions' },
          children: [slot('actions')],
        } as VNode,
      ]
    : []),
];
```

Define styles with these exact responsibilities:

```ts
// .one-empty
{ display: 'grid', justifyItems: 'center', gap: '12px', padding: '24px', textAlign: 'center' }
// .one-empty__image
{ display: 'grid', placeItems: 'center', minHeight: '56px' }
// .one-empty__illustration
{ width: '48px', height: '36px', border: '2px solid var(--one-color-border)', borderRadius: '8px' }
// .one-empty__description
{ color: 'var(--one-color-muted)', fontSize: 'var(--one-font-size-md)' }
// .one-empty__actions
{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '8px' }
```

Use `ONE_THEME_DEFAULTS` as every CSS variable fallback. Do not use external SVG, image, or icon packages.

- [ ] **Step 4: Run Empty tests and typecheck**

Run:

```sh
bun test packages/one/tests/empty.test.ts
bunx tsc --noEmit
```

Expected: 2 tests pass and TypeScript exits 0.

- [ ] **Step 5: Commit OneEmpty**

```sh
git add packages/one/lib/empty packages/one/tests/empty.test.ts
git commit -m "feat(one): add empty component"
```

---

### Task 5: Publish Components and Update the Stable Category

**Files:**

- Modify: `packages/one/lib/index.ts`
- Modify: `packages/one/lib/categories.ts`
- Modify: `packages/one/tests/categories.test.ts`
- Modify: `packages/one/tests/component-types.test.ts`
- Modify: `packages/one/tests/style-contract.test.ts`
- Modify: `packages/one/tests/package-smoke.test.ts`

**Interfaces:**

- Consumes: `OneTag`, `OneBadge`, `OneEmpty`, their props, and `OneDataDisplayVariant`.
- Produces: root named exports and the exact data-display category `['OneCard', 'OneTag', 'OneBadge', 'OneEmpty']`.

- [ ] **Step 1: Extend public-contract tests before root exports**

Update the expected category in `categories.test.ts` to:

```ts
{
  id: 'data-display',
  label: '数据展示',
  components: ['OneCard', 'OneTag', 'OneBadge', 'OneEmpty'],
}
```

In `component-types.test.ts`, import the three constructors plus `OneTagProps`, `OneBadgeProps`, `OneEmptyProps`, and `OneDataDisplayVariant`. Add valid assignments and an invalid variant check:

```ts
const tagProps: OneTagProps = {
  variant: 'success',
  size: 'sm',
  closable: true,
};
const badgeProps: OneBadgeProps = { value: 120, max: 99, variant: 'error' };
const emptyProps: OneEmptyProps = { description: '暂无结果' };
const displayVariant: OneDataDisplayVariant = 'neutral';
// @ts-expect-error unsupported data-display variant
const invalidTag: OneTagProps = { variant: 'info' };
```

Assert each constructor is a function and each valid prop is retained. Extend `style-contract.test.ts` to mount all three components and assert emitted CSS contains `.one-tag`, `.one-badge__content`, and `.one-empty`. Extend the package smoke consumer source to import and instantiate all three components and use their public prop types.

- [ ] **Step 2: Run public tests to verify RED**

Run:

```sh
bun test packages/one/tests/categories.test.ts packages/one/tests/component-types.test.ts packages/one/tests/style-contract.test.ts packages/one/tests/package-smoke.test.ts
```

Expected: FAIL because the root package does not export the new APIs and the category is unchanged.

- [ ] **Step 3: Add root exports and category names**

Append these exports in `packages/one/lib/index.ts` near `OneCard`:

```ts
export type { OneDataDisplayVariant } from './data-display';
export { OneTag } from './tag';
export type { OneTagProps } from './tag';
export { OneBadge } from './badge';
export type { OneBadgeProps } from './badge';
export { OneEmpty } from './empty';
export type { OneEmptyProps } from './empty';
```

Update only the data-display entry in `categories.ts`. Do not modify `packages/one/package.json`; its root export already publishes the generated root bundle and declarations.

- [ ] **Step 4: Run public tests and build**

Run:

```sh
bun test packages/one/tests/categories.test.ts packages/one/tests/component-types.test.ts packages/one/tests/style-contract.test.ts packages/one/tests/package-smoke.test.ts
bun run --cwd packages/one build
```

Expected: focused tests pass and the package build exits 0.

- [ ] **Step 5: Commit the public API**

```sh
git add packages/one/lib/index.ts packages/one/lib/categories.ts packages/one/tests/categories.test.ts packages/one/tests/component-types.test.ts packages/one/tests/style-contract.test.ts packages/one/tests/package-smoke.test.ts
git commit -m "feat(one): publish data display components"
```

---

### Task 6: Add Typed Content, Static Previews, and Source Examples

**Files:**

- Create: `packages/one/docs/app/content/data-display.ts`
- Modify: `packages/one/docs/app/content/index.ts`
- Modify: `packages/one/docs/app/content/demo-examples.ts`
- Modify: `packages/one/docs/app/components/DocArticle.ts`
- Modify: `packages/one/docs/app/content/form.ts`
- Modify: `packages/one/docs/app/content/feedback.ts`
- Modify: `packages/one/tests/docs-content.test.ts`
- Modify: `packages/one/tests/docs-app.test.ts`

**Interfaces:**

- Consumes: new public components, `OneDocDemoName`, `oneDocDemoExamples`, and `OneDocPage` helpers.
- Produces: four routes, three new demo names, static previews, API tables, and copyable TypeScript examples.

- [ ] **Step 1: Write failing 21-page content and static-preview tests**

Change the route fixture in `docs-content.test.ts` from 17 to these additional ordered routes after `/components/card/`:

```ts
'/components/data-display/',
'/components/data-display/tag/',
'/components/data-display/badge/',
'/components/data-display/empty/',
```

Assert the data-display pages contain demo blocks for `tag`, `badge`, and `empty`, and assert the API text includes:

```ts
expect(pageText('/components/data-display/tag/')).toContain(
  'OneDataDisplayVariant'
);
expect(pageText('/components/data-display/badge/')).toContain(
  'showZero?: boolean'
);
expect(pageText('/components/data-display/empty/')).toContain('actions');
```

In `docs-app.test.ts`, assert rendered HTML contains `.one-tag`, `.one-badge__content`, `.one-empty`, the three `data-one-demo` roots, and the collapsible source blocks for the three names.

- [ ] **Step 2: Run content and app tests to verify RED**

Run:

```sh
bun test packages/one/tests/docs-content.test.ts packages/one/tests/docs-app.test.ts
```

Expected: FAIL because the routes and demo names do not exist.

- [ ] **Step 3: Add the typed data-display pages**

Create `data-display.ts` exporting `dataDisplayPages: OneDocPage[]` with orders 3–6:

- `/components/data-display/`: overview table for Card, Tag, Badge, Empty and a representative Tag demo.
- `/components/data-display/tag/`: description, `demo('tag')`, variant/size/close guidance, API table.
- `/components/data-display/badge/`: description, `demo('badge')`, count/dot/ARIA guidance, API table.
- `/components/data-display/empty/`: description, `demo('empty')`, slot priority guidance, API table.

Use exact public signatures from Tasks 2–4. Import and spread `dataDisplayPages` in content `index.ts` immediately after `componentPages`. Shift form page orders from 3–7 to 7–11 and feedback page orders from 8–12 to 12–16 so navigation remains deterministic.

- [ ] **Step 4: Extend demo names and source examples**

Add `'tag' | 'badge' | 'empty'` to `OneDocDemoName`. Add non-empty `language: 'ts'` source entries using only root public imports:

```ts
tag: {
  language: 'ts',
  code: "new OneTag({ variant: 'success', closable: true, children: ['已发布'] });",
},
badge: {
  language: 'ts',
  code: "new OneBadge({ value: 120, max: 99, children: ['消息'] });",
},
empty: {
  language: 'ts',
  code: "new OneEmpty({ description: '暂无搜索结果' });",
},
```

Also update Card and Tooltip source examples to use these component VNodes rather than raw buttons, including the required `OneButton` import in each source string:

```ts
{ component: OneButton, slot: 'footer', children: ['继续'] }
{ component: OneButton, children: ['复制'] }
```

- [ ] **Step 5: Render static previews with public components**

Import `OneTag`, `OneBadge`, and `OneEmpty` in `DocArticle.ts`. Add exhaustive switch cases:

- Tag: success closable, neutral, warning, and three sizes.
- Badge: wrapped count `8`, capped count `120`, dot with aria label, and standalone `NEW`.
- Empty: default description plus an actions slot containing `OneButton`.

Use `OneButton` for the Tooltip static trigger. Keep Dialog's internal cancel/confirm markup unchanged because it previews Dialog's own DOM contract.

- [ ] **Step 6: Run content/app tests and typecheck**

Run:

```sh
bun test packages/one/tests/docs-content.test.ts packages/one/tests/docs-app.test.ts
bunx tsc --noEmit
```

Expected: focused tests pass and TypeScript exits 0.

- [ ] **Step 7: Commit typed documentation content**

```sh
git add packages/one/docs/app/content/data-display.ts packages/one/docs/app/content/index.ts packages/one/docs/app/content/demo-examples.ts packages/one/docs/app/content/form.ts packages/one/docs/app/content/feedback.ts packages/one/docs/app/components/DocArticle.ts packages/one/tests/docs-content.test.ts packages/one/tests/docs-app.test.ts
git commit -m "docs(one): add data display reference pages"
```

---

### Task 7: Add Interactive Tag, Badge, and Empty Demos

**Files:**

- Create: `packages/one/docs/app/demos/TagDemo.ts`
- Create: `packages/one/docs/app/demos/BadgeDemo.ts`
- Create: `packages/one/docs/app/demos/EmptyDemo.ts`
- Modify: `packages/one/docs/app/client.ts`
- Modify: `packages/one/tests/docs-client.test.ts`

**Interfaces:**

- Consumes: public `OneTag`, `OneBadge`, `OneEmpty`, `OneButton`, and the docs `DemoConstructor` map.
- Produces: mountable `tag`, `badge`, and `empty` demo constructors with observable interactions.

- [ ] **Step 1: Write failing docs-client tests**

Add three roots to the all-demo fixture and assert their component classes mount. Add exact interaction tests:

```ts
it('closes a Tag and reports the close count', () => {
  document.body.innerHTML = '<div data-one-demo="tag"></div>';
  mountOneDocsClient();
  (document.querySelector('.one-tag__close') as HTMLButtonElement).click();
  expect(document.querySelector('[data-one-tag-result]')?.textContent).toBe(
    '已关闭 1 个标签'
  );
});

it('increments the interactive Badge count', () => {
  document.body.innerHTML = '<div data-one-demo="badge"></div>';
  mountOneDocsClient();
  const increment = [
    ...document.querySelectorAll<HTMLButtonElement>('.one-button'),
  ].find((button) => button.textContent === '增加数量');
  increment?.click();
  expect(
    document.querySelector('[data-one-badge-result]')?.textContent
  ).toContain('100');
  expect(document.querySelector('.one-badge__content')?.textContent).toBe(
    '99+'
  );
});

it('runs the Empty action with OneButton', () => {
  document.body.innerHTML = '<div data-one-demo="empty"></div>';
  mountOneDocsClient();
  const create = [
    ...document.querySelectorAll<HTMLButtonElement>('.one-button'),
  ].find((button) => button.textContent === '创建项目');
  create?.click();
  expect(document.querySelector('[data-one-empty-result]')?.textContent).toBe(
    '已请求创建项目'
  );
});
```

- [ ] **Step 2: Run docs-client tests to verify RED**

Run: `bun test packages/one/tests/docs-client.test.ts`

Expected: FAIL because the demo constructors and names do not exist.

- [ ] **Step 3: Implement the three demo components**

Implement these exact states and observable children:

```ts
interface TagDemoState { closedCount: number }
// Render five OneTag variants. The success tag is closable and its close emitter
// increments closedCount. Render:
{ tag: 'output', props: { 'data-one-tag-result': '' }, children: [`已关闭 ${this.state.closedCount} 个标签`] }

interface BadgeDemoState { count: number }
// initState returns { count: 99 }. Render wrapped, dot, and standalone OneBadge
// instances, plus this action and output:
{
  component: OneButton,
  props: { variant: 'secondary', size: 'sm' },
  emitters: { click: () => { this.state.count += 1; } },
  children: ['增加数量'],
}
{ tag: 'output', props: { 'data-one-badge-result': '' }, children: [`当前数量：${this.state.count}`] }

interface EmptyDemoState { requested: boolean }
// initState returns { requested: false }. Put a OneButton labeled 创建项目 in the
// OneEmpty actions slot; its click emitter sets requested = true. Render:
{
  tag: 'output',
  props: { 'data-one-empty-result': '' },
  children: [this.state.requested ? '已请求创建项目' : '尚未操作'],
}
```

All OneButton interactions use component `emitters.click`; do not create raw action buttons.

- [ ] **Step 4: Register demo constructors exhaustively**

Import the three demo classes in `client.ts`, add names to `DemoName`, add records to `DEMOS`, and add exact comparisons to `isDemoName`.

- [ ] **Step 5: Run docs-client tests and typecheck**

Run:

```sh
bun test packages/one/tests/docs-client.test.ts
bunx tsc --noEmit
```

Expected: all docs-client tests pass and TypeScript exits 0.

- [ ] **Step 6: Commit interactive demos**

```sh
git add packages/one/docs/app/demos/TagDemo.ts packages/one/docs/app/demos/BadgeDemo.ts packages/one/docs/app/demos/EmptyDemo.ts packages/one/docs/app/client.ts packages/one/tests/docs-client.test.ts
git commit -m "docs(one): add interactive data display demos"
```

---

### Task 8: Reuse One Controls Across Docs and Normalize Demo Padding

**Files:**

- Modify: `packages/one/docs/app/demos/AlertDemo.ts`
- Modify: `packages/one/docs/app/demos/MessageDemo.ts`
- Modify: `packages/one/docs/app/demos/DialogDemo.ts`
- Modify: `packages/one/docs/app/demos/TooltipDemo.ts`
- Modify: `packages/one/docs/app/styles.ts`
- Modify: `packages/one/tests/docs-client.test.ts`
- Modify: `packages/one/tests/docs-app.test.ts`

**Interfaces:**

- Consumes: public `OneButton`, `OneSelect`, and `OneFieldValueEvent<string>`.
- Produces: docs actions rendered through One components and one shared interactive-root padding rule.

- [ ] **Step 1: Write failing reuse and spacing tests**

In `docs-client.test.ts`, update feedback interaction helpers to locate `.one-button` by text and assert:

```ts
expect(
  document.querySelector('[data-one-demo="message"] .one-button')
).toBeTruthy();
expect(
  document.querySelector('[data-one-demo="dialog"] .one-button')
).toBeTruthy();
expect(
  document.querySelector('[data-one-demo="tooltip"] .one-select')
).toBeTruthy();
```

In `docs-app.test.ts`, assert generated CSS contains:

```ts
expect(html).toContain('[data-one-demo] {');
expect(html).toContain('box-sizing: border-box;');
expect(html).toContain('padding: 24px;');
```

Assert the generated CSS no longer contains the former padded stack block:

```ts
expect(html).not.toContain(
  '.one-docs-feedback-stack {\n  display: grid;\n  gap: 12px;\n  padding: 24px;'
);
```

- [ ] **Step 2: Run docs tests to verify RED**

Run:

```sh
bun test packages/one/tests/docs-client.test.ts packages/one/tests/docs-app.test.ts
```

Expected: FAIL because feedback demos still render raw controls and the shared root has no padding.

- [ ] **Step 3: Replace raw docs action buttons with OneButton**

Use component VNodes with emitters:

```ts
{
  component: OneButton,
  props: { variant: 'secondary', size: 'sm' },
  emitters: { click: onClick },
  children: [label],
}
```

Apply this to Alert actions, Message actions, Dialog actions, Tooltip trigger/manual buttons, and Tooltip manual-mode trigger. Tests must locate them by visible text or accessible attributes rather than public `data-*` passthrough props.

- [ ] **Step 4: Replace Tooltip placement select with OneSelect**

Build options with `placements.map((placement) => ({ value: placement, label: placement }))`. Use a controlled `OneSelect` with `ariaLabel: '首选位置'` and this emitter:

```ts
change: (payload) => {
  const event = payload as OneFieldValueEvent<string>;
  this.state.placement = event.value as OneOverlayPlacement;
};
```

Update the tooltip client test to open `[role="combobox"]` and click the desired `[role="option"]` instead of mutating an HTMLSelectElement.

- [ ] **Step 5: Move padding to the shared demo root**

Change the `[data-one-demo]` style to:

```ts
properties: {
  borderTop: '1px dashed var(--one-docs-border)',
  boxSizing: 'border-box',
  minHeight: '1px',
  padding: '24px',
}
```

Remove only the outer `padding: '24px'` declarations from `.one-docs-feedback-stack`, `.one-docs-feedback-actions`, `.one-docs-dialog-demo`, and `.one-docs-tooltip-demo`. Keep internal gap, display, and the tooltip edge padding unchanged.

- [ ] **Step 6: Run docs tests and build**

Run:

```sh
bun test packages/one/tests/docs-client.test.ts packages/one/tests/docs-app.test.ts packages/one/tests/docs-build.test.ts packages/one/tests/docs-server.test.ts
bun run --cwd packages/one docs:build
```

Expected: docs tests pass and all 21 pages build.

- [ ] **Step 7: Commit docs control reuse and spacing**

```sh
git add packages/one/docs/app/demos/AlertDemo.ts packages/one/docs/app/demos/MessageDemo.ts packages/one/docs/app/demos/DialogDemo.ts packages/one/docs/app/demos/TooltipDemo.ts packages/one/docs/app/styles.ts packages/one/tests/docs-client.test.ts packages/one/tests/docs-app.test.ts
git commit -m "docs(one): reuse One controls in demos"
```

---

### Task 9: Synchronize READMEs and Complete Release Verification

**Files:**

- Modify: `packages/one/README.md`
- Modify: `packages/one/README-zh.md`
- Modify: `packages/one/tests/docs-content.test.ts`

**Interfaces:**

- Consumes: all public APIs, category names, routes, demos, and build scripts from prior tasks.
- Produces: bilingual public usage guidance and final evidence for tests, build, docs, and package contents.

- [ ] **Step 1: Add failing README contract assertions**

Extend `docs-content.test.ts` with this exact bilingual contract:

```ts
for (const [readme, emptyDescription] of [
  ['README.md', 'No results'],
  ['README-zh.md', '暂无结果'],
] as const) {
  const markdown = readFileSync(join(packageRoot, readme), 'utf8');
  for (const name of ['OneTag', 'OneBadge', 'OneEmpty']) {
    expect(markdown).toContain(name);
  }
  expect(markdown).toContain("new OneTag({ variant: 'success'");
  expect(markdown).toContain('new OneBadge({ value: 120, max: 99');
  expect(markdown).toContain(
    `new OneEmpty({ description: '${emptyDescription}'`
  );
}
```

- [ ] **Step 2: Run the README contract to verify RED**

Run: `bun test packages/one/tests/docs-content.test.ts`

Expected: FAIL because the READMEs do not mention the new components.

- [ ] **Step 3: Document the new category and minimum examples**

Update both READMEs with:

- Data display category containing Card, Tag, Badge, Empty.
- OneTag success + closable example.
- OneBadge capped count example.
- OneEmpty description + actions slot example using `OneButton`.
- Existing Bun-first install, build, and docs commands unchanged.

Do not change package name, package version, peer dependency, exports map, or files list.

- [ ] **Step 4: Run focused tests and formatting**

Run:

```sh
bun test packages/one/tests/tag.test.ts packages/one/tests/badge.test.ts packages/one/tests/empty.test.ts packages/one/tests/categories.test.ts packages/one/tests/component-types.test.ts packages/one/tests/docs-content.test.ts packages/one/tests/docs-app.test.ts packages/one/tests/docs-client.test.ts packages/one/tests/docs-build.test.ts packages/one/tests/docs-server.test.ts packages/one/tests/style-contract.test.ts packages/one/tests/package-smoke.test.ts
bunx prettier --check packages/one/lib/data-display packages/one/lib/tag packages/one/lib/badge packages/one/lib/empty packages/one/docs/app packages/one/tests packages/one/README.md packages/one/README-zh.md docs/superpowers/specs/2026-08-31-one-ui-data-display-design.md docs/superpowers/plans/2026-08-31-one-ui-data-display.md
```

Expected: all focused tests and formatting checks pass. If Prettier reports task-owned files, run `bunx prettier --write` only on those explicit paths and repeat the check; never format `packages/one/package.json`.

- [ ] **Step 5: Run full type, build, docs, and pack verification**

Run:

```sh
bunx tsc --noEmit
bun run --cwd packages/one build
bun run --cwd packages/one docs:build
bun pm pack --cwd packages/one --dry-run
git diff --check
```

Expected: every command exits 0, the docs builder reports 21 pages through its tests, and pack output includes the root ESM bundle and declarations for the three components.

- [ ] **Step 6: Run the package test suite and classify the protected baseline**

Run: `bun test packages/one --timeout 15000`

Expected: all task-related tests pass. If the only failure is `package-contract.test.ts` expecting `>=0.0.2 <0.1.0` while the protected manifest contains `>=0.1.0 <0.2.0`, record it as the pre-existing user-owned peer-range mismatch and do not edit either file without explicit user direction.

- [ ] **Step 7: Commit documentation and inspect final scope**

```sh
git add packages/one/README.md packages/one/README-zh.md packages/one/tests/docs-content.test.ts
git diff --cached --check
git commit -m "docs(one): document data display components"
git status --short
git log --oneline -10
```

Expected: task files are committed; `packages/one/package.json` remains the only protected user-owned modification. Report exact test counts, build/pack results, and any baseline failure.
