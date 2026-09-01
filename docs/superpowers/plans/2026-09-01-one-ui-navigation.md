# One UI Navigation Components Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add complete, accessible `OneTabs`, `OneBreadcrumb`, and `OnePagination` components, publish them under a new navigation category, and document them with real interactive demos.

**Architecture:** Each public component independently extends TSone `Component<Props, State>` and owns its native semantic DOM, state, styles, and event emission. A small internal `navigation` module provides shared finite-integer normalization and a generic value-change event shape; no navigation base class or router dependency is introduced.

**Tech Stack:** Bun workspace, strict TypeScript, TSone class components and VNodes, `bun:test`, Happy DOM preload, typed documentation content, Bun documentation builder.

**Spec:** `docs/superpowers/specs/2026-09-01-one-ui-navigation-design.md`

## Global Constraints

- Work in the current checkout and preserve unrelated dirty work.
- Never edit, stage, format, or commit the existing user-owned `packages/one/package.json` change.
- Keep `@geektech/one` browser runtime dependency-free and do not change TSone public APIs.
- Add exactly `OneTabs`, `OneBreadcrumb`, and `OnePagination` under the new `navigation` category.
- Breadcrumbs use native `href` and events; do not import or depend on `RouterLink`.
- Do not add a shared navigation component base class.
- Use strict TypeScript without new `any`; normalize invalid runtime values deterministically.
- Use stable emitter handler references in demos whenever a handler updates parent state.
- Add exactly four documentation routes so the total becomes 25.
- Preserve collapsible demo source and the shared `24px` `[data-one-demo]` padding.
- Use TDD for every behavior: observe the new test fail for the intended missing behavior before implementation.
- Use Bun commands and explicit `git add` paths for every commit.

---

### Task 1: Add Internal Navigation Normalization Primitives

**Files:**

- Create: `packages/one/lib/navigation/types.ts`
- Create: `packages/one/lib/navigation/normalize.ts`
- Create: `packages/one/lib/navigation/index.ts`
- Create: `packages/one/tests/navigation-normalize.test.ts`

**Interfaces:**

- Consumes: only JavaScript finite-number semantics.
- Produces:
  - `OneNavigationChangeEvent<TValue> { value: TValue; originalEvent: Event }`
  - `normalizeNonNegativeInteger(value: unknown, fallback: number): number`
  - `normalizePositiveInteger(value: unknown, fallback: number): number`
  - `normalizePositiveIntegerList(values: unknown, fallback: readonly number[]): number[]`

- [ ] **Step 1: Write failing normalization tests**

Create `packages/one/tests/navigation-normalize.test.ts`:

```ts
import { describe, expect, it } from 'bun:test';
import {
  normalizeNonNegativeInteger,
  normalizePositiveInteger,
  normalizePositiveIntegerList,
} from '../lib/navigation';

describe('navigation normalization', () => {
  it('normalizes finite integer bounds without leaking NaN', () => {
    expect(normalizeNonNegativeInteger(2.9, 1)).toBe(2);
    expect(normalizeNonNegativeInteger(-1, 1)).toBe(1);
    expect(normalizeNonNegativeInteger(Number.NaN, 3)).toBe(3);
    expect(normalizePositiveInteger(5.8, 10)).toBe(5);
    expect(normalizePositiveInteger(0, 10)).toBe(10);
    expect(normalizePositiveInteger(Number.POSITIVE_INFINITY, 10)).toBe(10);
  });

  it('deduplicates positive integer lists while preserving order', () => {
    expect(normalizePositiveIntegerList([20, 10, 20, -1, 50.9], [10])).toEqual([
      20, 10, 50,
    ]);
    expect(normalizePositiveIntegerList('invalid', [10, 20])).toEqual([10, 20]);
  });
});
```

- [ ] **Step 2: Run the new test to verify RED**

Run: `bun test packages/one/tests/navigation-normalize.test.ts`

Expected: FAIL because `../lib/navigation` does not exist.

- [ ] **Step 3: Implement the shared types and pure normalizers**

Create `types.ts`:

```ts
export interface OneNavigationChangeEvent<TValue> {
  value: TValue;
  originalEvent: Event;
}
```

Create `normalize.ts`:

```ts
export function normalizeNonNegativeInteger(
  value: unknown,
  fallback: number
): number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0
    ? Math.floor(value)
    : Math.max(0, Math.floor(fallback));
}

export function normalizePositiveInteger(
  value: unknown,
  fallback: number
): number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0
    ? Math.floor(value)
    : Math.max(1, Math.floor(fallback));
}

export function normalizePositiveIntegerList(
  values: unknown,
  fallback: readonly number[]
): number[] {
  const source = Array.isArray(values) ? values : fallback;
  return [
    ...new Set(
      source
        .filter(
          (value): value is number =>
            typeof value === 'number' && Number.isFinite(value) && value > 0
        )
        .map(Math.floor)
    ),
  ];
}
```

Create `index.ts` with explicit exports for the interface and three functions.

- [ ] **Step 4: Run focused tests and typecheck**

Run:

```sh
bun test packages/one/tests/navigation-normalize.test.ts
bunx tsc --noEmit
```

Expected: 2 tests pass and TypeScript exits 0.

- [ ] **Step 5: Commit the primitives**

```sh
git add packages/one/lib/navigation packages/one/tests/navigation-normalize.test.ts
git diff --cached --check
git commit -m "feat(one): add navigation primitives"
```

---

### Task 2: Implement OneTabs

**Files:**

- Create: `packages/one/lib/tabs/OneTabs.ts`
- Create: `packages/one/lib/tabs/index.ts`
- Create: `packages/one/tests/tabs.test.ts`

**Interfaces:**

- Consumes: TSone `Component`, `slot`, `VNode`; internal `OneNavigationChangeEvent`.
- Produces: `OneTabItem`, `OneTabsProps`, `OneTabsChangeEvent`, `ONE_TABS_STYLES`, and `OneTabs`.

- [ ] **Step 1: Write failing OneTabs behavior tests**

Create a Happy DOM mount harness matching existing component tests, then add
these cases with real DOM events:

```ts
it('renders stable tab and panel relationships with dynamic slots', () => {
  component = new OneTabs({
    id: 'account',
    defaultValue: 'profile',
    ariaLabel: '账户设置',
    items: [
      { value: 'profile', label: '资料' },
      { value: 'security', label: '安全' },
    ],
    children: [
      { tag: 'p', slot: 'profile', children: ['资料内容'] },
      { tag: 'p', slot: 'security', children: ['安全内容'] },
    ],
  });
  component.mount(container);

  const tabs = container.querySelectorAll('[role="tab"]');
  const panels = container.querySelectorAll('[role="tabpanel"]');
  expect(tabs).toHaveLength(2);
  expect(panels).toHaveLength(2);
  expect(tabs[0].getAttribute('aria-controls')).toBe('account-panel-0');
  expect(panels[0].getAttribute('aria-labelledby')).toBe('account-tab-0');
  expect(panels[0].hasAttribute('hidden')).toBe(false);
  expect(panels[1].hasAttribute('hidden')).toBe(true);
});

it('updates uncontrolled state and only requests controlled changes', () => {
  component = new OneTabs({
    defaultValue: 'a',
    items: [
      { value: 'a', label: 'A' },
      { value: 'b', label: 'B' },
    ],
  });
  const values: string[] = [];
  component.on('change', (payload) => {
    values.push((payload as OneTabsChangeEvent).value);
  });
  component.mount(container);
  (container.querySelectorAll('[role="tab"]')[1] as HTMLButtonElement).click();
  expect(values).toEqual(['b']);
  expect(
    container.querySelector('[role="tab"][aria-selected="true"]')?.textContent
  ).toBe('B');

  component.setProps({ value: 'a' });
  (container.querySelectorAll('[role="tab"]')[1] as HTMLButtonElement).click();
  expect(values).toEqual(['b', 'b']);
  expect(
    container.querySelector('[role="tab"][aria-selected="true"]')?.textContent
  ).toBe('A');
});

it('deduplicates values and skips disabled tabs with automatic keyboard activation', () => {
  component = new OneTabs({
    defaultValue: 'missing',
    items: [
      { value: 'a', label: 'A' },
      { value: 'disabled', label: 'Disabled', disabled: true },
      { value: 'b', label: 'B' },
      { value: 'a', label: 'Duplicate A' },
    ],
  });
  component.mount(container);
  expect(container.querySelectorAll('[role="tab"]')).toHaveLength(3);
  const first = container.querySelector('[role="tab"]') as HTMLButtonElement;
  first.dispatchEvent(
    new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true })
  );
  expect(
    container.querySelector('[role="tab"][aria-selected="true"]')?.textContent
  ).toBe('B');
  expect(document.activeElement?.textContent).toBe('B');
});
```

Add this second keyboard and boundary case:

```ts
it('supports Home, End and wrapping while suppressing disabled activation', () => {
  component = new OneTabs({
    items: [
      { value: 'a', label: 'A' },
      { value: 'b', label: 'B', disabled: true },
      { value: 'c', label: 'C' },
    ],
  });
  let changes = 0;
  component.on('change', () => {
    changes += 1;
  });
  component.mount(container);
  const tabs = container.querySelectorAll('[role="tab"]');
  tabs[0].dispatchEvent(
    new KeyboardEvent('keydown', { key: 'End', bubbles: true })
  );
  expect(document.activeElement?.textContent).toBe('C');
  tabs[2].dispatchEvent(
    new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true })
  );
  expect(document.activeElement?.textContent).toBe('A');
  tabs[0].dispatchEvent(
    new KeyboardEvent('keydown', { key: 'Home', bubbles: true })
  );
  (tabs[1] as HTMLButtonElement).click();
  expect(changes).toBe(2);

  component.setProps({
    items: [{ value: 'disabled', label: 'Disabled', disabled: true }],
  });
  expect(container.querySelector('[aria-selected="true"]')).toBeNull();
});
```

- [ ] **Step 2: Run the Tabs test to verify RED**

Run: `bun test packages/one/tests/tabs.test.ts`

Expected: FAIL because `../lib/tabs` does not exist.

- [ ] **Step 3: Implement public types, normalization, state, and IDs**

Use these exact public types:

```ts
export interface OneTabItem {
  value: string;
  label: string;
  disabled?: boolean;
}

export type OneTabsChangeEvent = OneNavigationChangeEvent<string>;

export interface OneTabsProps {
  items: readonly OneTabItem[];
  value?: string;
  defaultValue?: string;
  id?: string;
  ariaLabel?: string;
  children?: Array<VNode | string>;
}
```

Keep a module-local monotonic instance counter for generated ID prefixes.
Normalize caller IDs to `[A-Za-z_][A-Za-z0-9_-]*`; fall back to the generated
prefix if invalid. Use normalized item indices for tab and panel ID suffixes so
arbitrary public values never enter DOM IDs. Deduplicate item values with a
`Set<string>`, retaining the first item. Store only `internalValue` in component
state.

- [ ] **Step 4: Implement semantic rendering and automatic activation**

Render `.one-tabs`, a horizontal `.one-tabs__list[role=tablist]`, native tab
buttons, and one panel per normalized item. Use `slot(item.value)` inside each
panel and `hidden` on inactive panels.

Implement these methods with explicit signatures:

```ts
private normalizedItems(): OneTabItem[];
private effectiveValue(items: readonly OneTabItem[]): string | undefined;
private activate(item: OneTabItem, index: number, event: Event): void;
private handleKeydown(event: Event, currentIndex: number): void;
private enabledIndices(items: readonly OneTabItem[]): number[];
private focusTab(index: number): void;
```

`activate` must emit one `change` payload satisfying `OneTabsChangeEvent` and
only mutate `internalValue` when `props.value` is undefined. Keyboard movement
wraps over enabled indices. Activating the already effective value only focuses
the tab and does not emit a redundant change. `handleKeydown` calls `focusTab`
before activation; `focusTab` queries the current root's `[role="tab"]` list by
normalized index and calls the target button's native `focus()` method. This
works in both controlled and uncontrolled modes without waiting for a rerender.

- [ ] **Step 5: Add named styles**

Define `ONE_TABS_STYLES` with these selectors:

- `.one-tabs`: One font and text color.
- `.one-tabs__list`: flex, bottom border, horizontal overflow.
- `.one-tabs__tab`: relative native button reset, `8px 14px` padding.
- `.one-tabs__tab[aria-selected="true"]`: primary text color.
- `.one-tabs__tab[aria-selected="true"]::after`: 2px bottom indicator.
- `.one-tabs__tab:disabled`: muted color and not-allowed cursor.
- `.one-tabs__tab:focus-visible`: 2px focus outline.
- `.one-tabs__panel`: `16px 0` padding.

Every color, radius, font, and spacing value must use the existing public token
fallback pattern.

- [ ] **Step 6: Export and verify OneTabs**

Create `lib/tabs/index.ts` exporting the constructor, style constant, and three
public types. Run:

```sh
bun test packages/one/tests/tabs.test.ts
bunx tsc --noEmit
bunx prettier --check packages/one/lib/tabs packages/one/tests/tabs.test.ts
```

Expected: all Tabs tests pass, TypeScript and formatting exit 0.

- [ ] **Step 7: Commit OneTabs**

```sh
git add packages/one/lib/tabs packages/one/tests/tabs.test.ts
git diff --cached --check
git commit -m "feat(one): add tabs component"
```

---

### Task 3: Implement OneBreadcrumb

**Files:**

- Create: `packages/one/lib/breadcrumb/OneBreadcrumb.ts`
- Create: `packages/one/lib/breadcrumb/index.ts`
- Create: `packages/one/tests/breadcrumb.test.ts`

**Interfaces:**

- Consumes: TSone `Component`, `slot`, `VNode`; internal positive-integer normalization.
- Produces: `OneBreadcrumbItem`, `OneBreadcrumbProps`, `OneBreadcrumbClickEvent`, `ONE_BREADCRUMB_STYLES`, and `OneBreadcrumb`.

- [ ] **Step 1: Write failing Breadcrumb behavior tests**

Use a Happy DOM mount harness and add these complete behavior groups:

```ts
it('renders native hierarchy, one current item and default separators', () => {
  component = new OneBreadcrumb({
    ariaLabel: '项目路径',
    items: [
      { label: '首页', href: '/' },
      { label: '项目', href: '/projects', current: true },
      { label: '详情', current: true },
    ],
  });
  component.mount(container);
  expect(container.querySelector('nav')?.getAttribute('aria-label')).toBe(
    '项目路径'
  );
  expect(container.querySelectorAll('ol > li')).toHaveLength(3);
  expect(container.querySelectorAll('[aria-current="page"]')).toHaveLength(1);
  expect(container.querySelector('[aria-current="page"]')?.textContent).toBe(
    '项目'
  );
  expect(container.querySelectorAll('.one-breadcrumb__separator')).toHaveLength(
    2
  );
});

it('emits a cancellable itemClick before native navigation', () => {
  component = new OneBreadcrumb({
    items: [{ label: '首页', href: '/home' }, { label: '当前' }],
  });
  let received: OneBreadcrumbClickEvent | undefined;
  component.on('itemClick', (payload) => {
    received = payload as OneBreadcrumbClickEvent;
    received.originalEvent.preventDefault();
  });
  component.mount(container);
  const event = new MouseEvent('click', { bubbles: true, cancelable: true });
  container.querySelector('a')?.dispatchEvent(event);
  expect(received?.item.label).toBe('首页');
  expect(received?.index).toBe(0);
  expect(event.defaultPrevented).toBe(true);
});

it('keeps first, current and last items and expands every hidden range', () => {
  component = new OneBreadcrumb({
    maxItems: 3,
    items: [
      { label: '一', href: '/1' },
      { label: '二', href: '/2' },
      { label: '三', current: true },
      { label: '四', href: '/4' },
      { label: '五' },
    ],
  });
  component.mount(container);
  expect(container.querySelectorAll('.one-breadcrumb__item')).toHaveLength(3);
  expect(container.querySelectorAll('.one-breadcrumb__ellipsis')).toHaveLength(
    2
  );
  expect(container.textContent).toContain('一');
  expect(container.textContent).toContain('三');
  expect(container.textContent).toContain('五');
  (
    container.querySelector('.one-breadcrumb__ellipsis') as HTMLButtonElement
  ).click();
  expect(container.querySelectorAll('.one-breadcrumb__item')).toHaveLength(5);
  expect(container.querySelector('.one-breadcrumb__ellipsis')).toBeNull();
});
```

Add this normalization and separator case:

```ts
it('falls back to the last current item and prefers a separator slot', () => {
  component = new OneBreadcrumb({
    maxItems: 1,
    separator: '>',
    items: [
      { label: '一', href: '/1' },
      { label: '二', href: '/2' },
      { label: '三' },
      { label: '四' },
    ],
    children: [{ tag: 'span', slot: 'separator', children: ['→'] }],
  });
  component.mount(container);
  expect(container.querySelector('[aria-current="page"]')?.textContent).toBe(
    '四'
  );
  expect(container.querySelectorAll('.one-breadcrumb__item')).toHaveLength(3);
  expect(
    container.querySelector('.one-breadcrumb__separator')?.textContent
  ).toBe('→');
  expect(container.textContent).not.toContain('>');
});

it('renders one item without a separator', () => {
  component = new OneBreadcrumb({ items: [{ label: '当前' }] });
  component.mount(container);
  expect(container.querySelectorAll('.one-breadcrumb__item')).toHaveLength(1);
  expect(container.querySelector('.one-breadcrumb__separator')).toBeNull();
});
```

- [ ] **Step 2: Run the Breadcrumb test to verify RED**

Run: `bun test packages/one/tests/breadcrumb.test.ts`

Expected: FAIL because `../lib/breadcrumb` does not exist.

- [ ] **Step 3: Implement public types and retained-item calculation**

Use the exact interfaces from the spec. Store `{ expanded: false }` in state.
Implement:

```ts
private currentIndex(): number;
private retainedIndices(currentIndex: number, maxItems: number): number[];
private renderItem(item: OneBreadcrumbItem, index: number, current: boolean): VNode;
private renderSeparator(): VNode;
```

`retainedIndices` starts with first, current, and last indices, then fills
remaining capacity by increasing distance from the current index, breaking ties
toward the earlier source index. Sort the result before rendering. Each gap
larger than one source index inserts one ellipsis button. Activating an ellipsis
sets `expanded` true.

- [ ] **Step 4: Implement semantic rendering and events**

Render `nav.one-breadcrumb > ol.one-breadcrumb__list > li`. Current items are
spans with `aria-current="page"`; non-current href items are anchors; remaining
items are spans. Anchor listeners emit:

```ts
{
  item,
  index,
  originalEvent: event,
} satisfies OneBreadcrumbClickEvent
```

Do not call `preventDefault`. Render separators between every visible item or
ellipsis token, never before the first or after the last token. Use
`slot('separator')` when a separator slot exists; otherwise render the normalized
separator text.

- [ ] **Step 5: Add named styles**

Define styles for the exact selectors in the spec. The list is inline-flex,
wraps, removes list decoration, and has a small gap. Links use the primary color.
Current text and separators use muted color. The ellipsis is a borderless native
button. Links and ellipsis buttons use the 2px focus token outline.

- [ ] **Step 6: Export, verify, and commit Breadcrumb**

Run:

```sh
bun test packages/one/tests/breadcrumb.test.ts
bunx tsc --noEmit
bunx prettier --check packages/one/lib/breadcrumb packages/one/tests/breadcrumb.test.ts
```

Then commit only these files:

```sh
git add packages/one/lib/breadcrumb packages/one/tests/breadcrumb.test.ts
git diff --cached --check
git commit -m "feat(one): add breadcrumb component"
```

---

### Task 4: Implement OnePagination

**Files:**

- Create: `packages/one/lib/pagination/tokens.ts`
- Create: `packages/one/lib/pagination/OnePagination.ts`
- Create: `packages/one/lib/pagination/index.ts`
- Create: `packages/one/tests/pagination.test.ts`

**Interfaces:**

- Consumes: TSone `Component`, `VNode`; internal navigation integer and list normalizers.
- Produces: `OnePaginationProps`, `OnePaginationChangeEvent`, `OnePaginationToken`, `createOnePaginationTokens`, `ONE_PAGINATION_STYLES`, and `OnePagination`.

- [ ] **Step 1: Write failing page-token tests**

Start `pagination.test.ts` with pure algorithm coverage:

```ts
import { createOnePaginationTokens } from '../lib/pagination';

it('creates stable first, sibling, ellipsis and last page tokens', () => {
  expect(createOnePaginationTokens(10, 5, 1)).toEqual([
    1,
    'ellipsis-start',
    4,
    5,
    6,
    'ellipsis-end',
    10,
  ]);
  expect(createOnePaginationTokens(5, 3, 1)).toEqual([1, 2, 3, 4, 5]);
  expect(createOnePaginationTokens(1, 1, 1)).toEqual([1]);
});
```

- [ ] **Step 2: Run the token test to verify RED**

Run: `bun test packages/one/tests/pagination.test.ts`

Expected: FAIL because `../lib/pagination` does not exist.

- [ ] **Step 3: Implement the pure page-token algorithm**

Define:

```ts
export type OnePaginationToken = number | 'ellipsis-start' | 'ellipsis-end';

export function createOnePaginationTokens(
  pageCount: number,
  page: number,
  siblingCount: number
): OnePaginationToken[];
```

Normalize inputs with Task 1 helpers. Build a sorted numeric set containing 1,
`pageCount`, and the clamped `page ± siblingCount` range. When adjacent retained
numbers differ by 2, insert the missing number. For a larger gap, insert the
side-specific ellipsis token.

- [ ] **Step 4: Write failing Pagination component tests**

Extend the same test file with a Happy DOM mount harness and these cases:

```ts
it('updates uncontrolled pages and emits the final page state once', () => {
  component = new OnePagination({ total: 100, defaultPage: 5 });
  const changes: OnePaginationChangeEvent[] = [];
  component.on('change', (payload) => {
    changes.push(payload as OnePaginationChangeEvent);
  });
  component.mount(container);
  (
    container.querySelector('[aria-label="下一页"]') as HTMLButtonElement
  ).click();
  expect(changes.map(({ page, pageSize }) => [page, pageSize])).toEqual([
    [6, 10],
  ]);
  expect(container.querySelector('[aria-current="page"]')?.textContent).toBe(
    '6'
  );
});

it('requests controlled changes without overriding controlled props', () => {
  component = new OnePagination({ total: 100, page: 2, pageSize: 20 });
  let change: OnePaginationChangeEvent | undefined;
  component.on('change', (payload) => {
    change = payload as OnePaginationChangeEvent;
  });
  component.mount(container);
  (
    container.querySelector('[aria-label="下一页"]') as HTMLButtonElement
  ).click();
  expect(change?.page).toBe(3);
  expect(change?.pageSize).toBe(20);
  expect(container.querySelector('[aria-current="page"]')?.textContent).toBe(
    '2'
  );
});

it('clamps page after changing page size and emits once', () => {
  component = new OnePagination({ total: 95, defaultPage: 10 });
  const changes: OnePaginationChangeEvent[] = [];
  component.on('change', (payload) => {
    changes.push(payload as OnePaginationChangeEvent);
  });
  component.mount(container);
  const size = container.querySelector(
    '[aria-label="每页条数"]'
  ) as HTMLSelectElement;
  size.value = '20';
  size.dispatchEvent(new Event('change', { bubbles: true }));
  expect(changes.map(({ page, pageSize }) => [page, pageSize])).toEqual([
    [5, 20],
  ]);
});

it('submits and clears quick jump without double-emitting on blur', () => {
  component = new OnePagination({
    total: 100,
    showQuickJumper: true,
  });
  let changes = 0;
  component.on('change', () => {
    changes += 1;
  });
  component.mount(container);
  const input = container.querySelector(
    '[aria-label="快速跳转页码"]'
  ) as HTMLInputElement;
  input.value = '99';
  input.dispatchEvent(new Event('input', { bubbles: true }));
  input.dispatchEvent(
    new KeyboardEvent('keydown', { key: 'Enter', bubbles: true })
  );
  input.dispatchEvent(new FocusEvent('blur', { bubbles: true }));
  expect(changes).toBe(1);
  expect(input.value).toBe('');
  expect(container.querySelector('[aria-current="page"]')?.textContent).toBe(
    '10'
  );
});
```

Add these normalization and disabled cases:

```ts
it('normalizes invalid runtime values and inserts the active page size', () => {
  component = new OnePagination({
    total: Number.NaN,
    defaultPage: -1,
    defaultPageSize: 30,
    pageSizeOptions: [20, 20, -1] as number[],
    siblingCount: -2,
    ariaLabel: '结果分页',
  });
  component.mount(container);
  expect(container.querySelector('nav')?.getAttribute('aria-label')).toBe(
    '结果分页'
  );
  expect(container.querySelector('[aria-current="page"]')?.textContent).toBe(
    '1'
  );
  expect(
    [...container.querySelectorAll('option')].map((option) => option.value)
  ).toEqual(['20', '30']);
  expect(
    (container.querySelector('[aria-label="上一页"]') as HTMLButtonElement)
      .disabled
  ).toBe(true);
  expect(
    (container.querySelector('[aria-label="下一页"]') as HTMLButtonElement)
      .disabled
  ).toBe(true);
});

it('suppresses disabled controls and ignores invalid quick jumps', () => {
  component = new OnePagination({
    total: 100,
    disabled: true,
    showQuickJumper: true,
  });
  let changes = 0;
  component.on('change', () => {
    changes += 1;
  });
  component.mount(container);
  const input = container.querySelector(
    '[aria-label="快速跳转页码"]'
  ) as HTMLInputElement;
  expect(input.disabled).toBe(true);
  expect(container.querySelectorAll('button:not(:disabled)')).toHaveLength(0);
  component.setProps({ disabled: false });
  const enabledInput = container.querySelector(
    '[aria-label="快速跳转页码"]'
  ) as HTMLInputElement;
  enabledInput.value = 'not-a-page';
  enabledInput.dispatchEvent(new Event('input', { bubbles: true }));
  enabledInput.dispatchEvent(new FocusEvent('blur'));
  expect(changes).toBe(0);
});
```

- [ ] **Step 5: Implement Pagination state and normalization**

Use the exact public props and event interface from the spec. State contains:

```ts
interface OnePaginationState {
  internalPage: number;
  internalPageSize: number;
  jumpValue: string;
}
```

Implement these exact private methods:

```ts
private effectivePageSize(): number;
private pageCount(pageSize?: number): number;
private effectivePage(pageSize?: number): number;
private sizeOptions(): number[];
private requestChange(page: number, pageSize: number, event: Event): void;
private submitJump(event: Event): void;
```

`requestChange` clamps both values, updates only uncontrolled dimensions, and
emits one `OnePaginationChangeEvent`. `submitJump` trims `jumpValue`, ignores
empty or non-finite values, calls `requestChange`, and then clears `jumpValue`.

- [ ] **Step 6: Implement semantic rendering**

Render `nav.one-pagination` with default `aria-label="分页"`. Render previous,
numeric, and next native buttons with explicit labels. Ellipsis tokens are
non-interactive spans. Render a native select labeled `每页条数` from normalized
options. Conditionally render a text input labeled `快速跳转页码` and submit it
on Enter or blur. Set every interactive control disabled when `props.disabled`
is true.

- [ ] **Step 7: Add named styles**

Define every selector from the spec. The root and page group are flex containers
that wrap. Buttons are compact square native controls with border, surface,
current-primary, disabled, hover, and 2px focus-visible rules. Size and jumper
controls use the same public border, radius, font, and focus tokens.

- [ ] **Step 8: Export, verify, and commit Pagination**

Run:

```sh
bun test packages/one/tests/pagination.test.ts
bunx tsc --noEmit
bunx prettier --check packages/one/lib/pagination packages/one/tests/pagination.test.ts
```

Then commit:

```sh
git add packages/one/lib/pagination packages/one/tests/pagination.test.ts
git diff --cached --check
git commit -m "feat(one): add pagination component"
```

---

### Task 5: Publish the Navigation Category and Public API

**Files:**

- Modify: `packages/one/lib/categories.ts`
- Modify: `packages/one/lib/index.ts`
- Modify: `packages/one/tests/categories.test.ts`
- Modify: `packages/one/tests/component-types.test.ts`
- Modify: `packages/one/tests/style-contract.test.ts`
- Modify: `packages/one/tests/package-smoke.test.ts`

**Interfaces:**

- Consumes: public constructors, props, events, and item types from Tasks 2-4.
- Produces: stable root imports and category discovery for all three components.

- [ ] **Step 1: Add failing category and type-contract assertions**

Update `categories.test.ts` to expect exactly:

```ts
{
  id: 'navigation',
  label: '导航',
  components: ['OneTabs', 'OneBreadcrumb', 'OnePagination'],
}
```

Update `component-types.test.ts` to import every new constructor and public type,
instantiate valid props, and add compile-time failures:

```ts
const tabsProps: OneTabsProps = {
  items: [{ value: 'overview', label: '概览' }],
  defaultValue: 'overview',
};
const breadcrumbProps: OneBreadcrumbProps = {
  items: [{ label: '首页', href: '/' }, { label: '详情' }],
  maxItems: 3,
};
const paginationProps: OnePaginationProps = {
  total: 100,
  defaultPage: 2,
  showQuickJumper: true,
};

// @ts-expect-error tab item values must be strings
const invalidTabs: OneTabsProps = { items: [{ value: 1, label: '错误' }] };
// @ts-expect-error total is required
const invalidPagination: OnePaginationProps = {};
```

- [ ] **Step 2: Add failing style and package-smoke assertions**

Add these instances to the existing style-contract component list and require
generated CSS to stay under component-scoped selectors with token fallbacks:

```ts
new OneTabs({ items: [{ value: 'a', label: 'A' }] }),
new OneBreadcrumb({ items: [{ label: '当前' }] }),
new OnePagination({ total: 100 }),
```

```ts
expect(css).toContain('.one-tabs__tab');
expect(css).toContain('.one-breadcrumb__link');
expect(css).toContain('.one-pagination__button');
expect(css).not.toMatch(/(^|})\s*(button|a|nav)\s*\{/);
```

Extend the packed consumer program in `package-smoke.test.ts` with package-root
imports and instances equivalent to:

```ts
const tabs = new OneTabs({
  items: [{ value: 'overview', label: 'Overview' } satisfies OneTabItem],
});
const breadcrumb = new OneBreadcrumb({
  items: [{ label: 'Home', href: '/' } satisfies OneBreadcrumbItem],
});
const pagination = new OnePagination({ total: 100 });
const tabsProps: OneTabsProps = { items: [] };
const breadcrumbProps: OneBreadcrumbProps = { items: [] };
const paginationProps: OnePaginationProps = { total: 0 };
const tabsChange: OneTabsChangeEvent | undefined = undefined;
const breadcrumbClick: OneBreadcrumbClickEvent | undefined = undefined;
const paginationChange: OnePaginationChangeEvent | undefined = undefined;
void [
  tabs,
  breadcrumb,
  pagination,
  tabsProps,
  breadcrumbProps,
  paginationProps,
  tabsChange,
  breadcrumbClick,
  paginationChange,
];
```

Extend the runtime constructor catalog assertion with `OneTabs`,
`OneBreadcrumb`, and `OnePagination` equal to `function`.

- [ ] **Step 3: Run contracts to verify RED**

Run:

```sh
bun test packages/one/tests/categories.test.ts packages/one/tests/component-types.test.ts packages/one/tests/style-contract.test.ts packages/one/tests/package-smoke.test.ts
```

Expected: failures show the navigation category and root exports are missing.

- [ ] **Step 4: Publish category and root exports**

Add `'navigation'` to `OneComponentCategory`, insert the approved category after
`form`, and export all approved constructors and types from `lib/index.ts`.
Keep `ONE_NAME` and `ONE_VERSION` unchanged.

- [ ] **Step 5: Run contracts, build, and pack smoke**

Run:

```sh
bun test packages/one/tests/categories.test.ts packages/one/tests/component-types.test.ts packages/one/tests/style-contract.test.ts packages/one/tests/package-smoke.test.ts
bunx tsc --noEmit
bun run --cwd packages/one build
```

Expected: all four contract files pass, TypeScript exits 0, and One builds two
artifacts.

- [ ] **Step 6: Commit the public API**

```sh
git add packages/one/lib/categories.ts packages/one/lib/index.ts packages/one/tests/categories.test.ts packages/one/tests/component-types.test.ts packages/one/tests/style-contract.test.ts packages/one/tests/package-smoke.test.ts
git diff --cached --check
git commit -m "feat(one): publish navigation components"
```

---

### Task 6: Add Navigation Documentation Pages and Static Previews

**Files:**

- Create: `packages/one/docs/app/content/navigation.ts`
- Modify: `packages/one/docs/app/content/index.ts`
- Modify: `packages/one/docs/app/content/demo-examples.ts`
- Modify: `packages/one/docs/app/content/data-display.ts`
- Modify: `packages/one/docs/app/content/form.ts`
- Modify: `packages/one/docs/app/content/feedback.ts`
- Modify: `packages/one/docs/app/components/DocArticle.ts`
- Modify: `packages/one/tests/docs-content.test.ts`
- Modify: `packages/one/tests/docs-app.test.ts`
- Modify: `packages/one/tests/docs-build.test.ts`

**Interfaces:**

- Consumes: public navigation constructors and exact APIs from Tasks 2-5.
- Produces: four typed routes, static previews, source examples, API tables, and a 25-page build contract.

- [ ] **Step 1: Add failing route, content, preview, and build assertions**

Update the route contract to exactly 25 paths by inserting:

```ts
'/components/navigation/',
'/components/navigation/tabs/',
'/components/navigation/breadcrumb/',
'/components/navigation/pagination/',
```

Add a docs-content test requiring every navigation page to contain an
interactive demo, TypeScript source, props API, event signatures, keyboard or
ARIA guidance, and every public type name. Update `docs-app.test.ts` to require
the static classes and demo roots for `tabs`, `breadcrumb`, and `pagination`.
Update `docs-build.test.ts` test name and `pagesBuilt` expectation from 21 to 25.

- [ ] **Step 2: Run docs tests to verify RED**

Run:

```sh
bun test packages/one/tests/docs-content.test.ts packages/one/tests/docs-app.test.ts packages/one/tests/docs-build.test.ts
```

Expected: failures report four missing routes, three missing demos, and an
expected page-count mismatch.

- [ ] **Step 3: Create typed navigation content**

Create `content/navigation.ts` exporting `navigationPages: OneDocPage[]` with:

- Overview page explaining Tabs, Breadcrumb, and Pagination selection.
- OneTabs page documenting items, controlled state, dynamic slots, `change`,
  keyboard activation, and ARIA relationships.
- OneBreadcrumb page documenting item normalization, native href, `itemClick`,
  separator slot, collapse expansion, and ARIA.
- OnePagination page documenting every prop, unified `change`, token behavior,
  page-size clamping, quick jump, disabled state, and ARIA.

Use the existing typed helper functions and table structures; do not introduce
unsupported Markdown. Import and spread `navigationPages` in `content/index.ts`.
Shift later page order numbers only as needed to preserve stable navigation.

- [ ] **Step 4: Add exact demo source records**

Extend `OneDocDemoName` with `tabs`, `breadcrumb`, and `pagination`. Add
copyable source using only package-root exports. Tabs source must show dynamic
slot names; Breadcrumb source must show href/current/maxItems; Pagination source
must show total/defaultPage/pageSizeOptions/showQuickJumper.

- [ ] **Step 5: Render static One component previews**

Import the three constructors in `DocArticle.ts` and add cases:

- Tabs: two items and two matching panel slots.
- Breadcrumb: three items with the last current.
- Pagination: 95 total records, page 3, page size 10.

The static render must contain real `.one-*` component markup before client
hydration roots and retain the existing code disclosure after the demo.

- [ ] **Step 6: Run docs contracts, typecheck, format, and commit**

Run:

```sh
bun test packages/one/tests/docs-content.test.ts packages/one/tests/docs-app.test.ts packages/one/tests/docs-build.test.ts
bunx tsc --noEmit
bunx prettier --check packages/one/docs/app packages/one/tests/docs-content.test.ts packages/one/tests/docs-app.test.ts packages/one/tests/docs-build.test.ts
```

Then stage and commit all explicit Task 6 files with:

```sh
git add packages/one/docs/app/content/navigation.ts packages/one/docs/app/content/index.ts packages/one/docs/app/content/demo-examples.ts packages/one/docs/app/content/data-display.ts packages/one/docs/app/content/form.ts packages/one/docs/app/content/feedback.ts packages/one/docs/app/components/DocArticle.ts packages/one/tests/docs-content.test.ts packages/one/tests/docs-app.test.ts packages/one/tests/docs-build.test.ts
git diff --cached --check
git commit -m "docs(one): add navigation reference pages"
```

Before committing, inspect `git status --short` and verify
`packages/one/package.json` is not staged.

---

### Task 7: Add Interactive Navigation Demos

**Files:**

- Create: `packages/one/docs/app/demos/TabsDemo.ts`
- Create: `packages/one/docs/app/demos/BreadcrumbDemo.ts`
- Create: `packages/one/docs/app/demos/PaginationDemo.ts`
- Modify: `packages/one/docs/app/client.ts`
- Modify: `packages/one/tests/docs-client.test.ts`

**Interfaces:**

- Consumes: the three public navigation components and their event payloads.
- Produces: client demo registration and verifiable real interactions for every new docs page.

- [ ] **Step 1: Add failing client-demo tests**

Extend the all-demo fixture with `tabs`, `breadcrumb`, and `pagination` roots.
Require `.one-tabs`, `.one-breadcrumb`, and `.one-pagination` after mounting.
Add these interactions:

- Tabs: click `安全`, assert the controlled output becomes `当前标签：security`
  and the security panel is visible.
- Breadcrumb: mount collapsed, click an ellipsis, assert all five items render;
  click a link and assert output `点击：首页` while preventing navigation.
- Pagination: click next, assert output `第 2 页，每页 10 条`; change page size to
  20; submit quick jump `99`; assert the final output is clamped to page 5.

Use visible labels, roles, and accessible names rather than demo-only attributes
for buttons and links. Output elements may use stable `data-one-*-result`
attributes.

The interaction assertions must include this concrete sequence:

```ts
getButton('安全').click();
expect(document.querySelector('[data-one-tabs-result]')?.textContent).toBe(
  '当前标签：security'
);

(
  document.querySelector('[aria-label="展开面包屑"]') as HTMLButtonElement
).click();
expect(document.querySelectorAll('.one-breadcrumb__item')).toHaveLength(5);
(document.querySelector('.one-breadcrumb__link') as HTMLAnchorElement).click();
expect(
  document.querySelector('[data-one-breadcrumb-result]')?.textContent
).toBe('点击：首页');

(document.querySelector('[aria-label="下一页"]') as HTMLButtonElement).click();
expect(
  document.querySelector('[data-one-pagination-result]')?.textContent
).toBe('第 2 页，每页 10 条');
const pageSize = document.querySelector(
  '[aria-label="每页条数"]'
) as HTMLSelectElement;
pageSize.value = '20';
pageSize.dispatchEvent(new Event('change', { bubbles: true }));
const jumper = document.querySelector(
  '[aria-label="快速跳转页码"]'
) as HTMLInputElement;
jumper.value = '99';
jumper.dispatchEvent(new Event('input', { bubbles: true }));
jumper.dispatchEvent(
  new KeyboardEvent('keydown', { key: 'Enter', bubbles: true })
);
expect(
  document.querySelector('[data-one-pagination-result]')?.textContent
).toBe('第 5 页，每页 20 条');
```

- [ ] **Step 2: Run the client test to verify RED**

Run: `bun test packages/one/tests/docs-client.test.ts`

Expected: the client rejects the three unknown demo names and assertions find no
navigation components.

- [ ] **Step 3: Implement TabsDemo with stable controlled handlers**

Use parent state `{ value: 'overview' }`, pass it as controlled `value`, and
provide two dynamic slot children. Define `handleChange` as a readonly class
field so the emitter reference is stable across parent updates. Render an output
with `data-one-tabs-result`.

- [ ] **Step 4: Implement BreadcrumbDemo with prevented native navigation**

Render five items, `maxItems: 3`, and a stable `itemClick` handler that calls
`originalEvent.preventDefault()` before updating output state. The component
owns expansion; the demo only records link clicks.

- [ ] **Step 5: Implement PaginationDemo with one controlled state object**

Store `{ page: 1, pageSize: 10 }`, pass controlled props, enable quick jump, and
use one stable `change` handler to update both values. Render a live output with
`data-one-pagination-result`.

- [ ] **Step 6: Register demos and verify**

Import each demo in `client.ts`, extend `DemoName`, `DEMOS`, and `isDemoName`,
then run:

```sh
bun test packages/one/tests/docs-client.test.ts packages/one/tests/docs-app.test.ts
bunx tsc --noEmit
bun run --cwd packages/one docs:build
```

Expected: all client and static docs tests pass and all 25 pages build.

- [ ] **Step 7: Format and commit demos**

```sh
bunx prettier --check packages/one/docs/app/demos/TabsDemo.ts packages/one/docs/app/demos/BreadcrumbDemo.ts packages/one/docs/app/demos/PaginationDemo.ts packages/one/docs/app/client.ts packages/one/tests/docs-client.test.ts
git add packages/one/docs/app/demos/TabsDemo.ts packages/one/docs/app/demos/BreadcrumbDemo.ts packages/one/docs/app/demos/PaginationDemo.ts packages/one/docs/app/client.ts packages/one/tests/docs-client.test.ts
git diff --cached --check
git commit -m "docs(one): add interactive navigation demos"
```

---

### Task 8: Synchronize READMEs and Complete Release Verification

**Files:**

- Modify: `packages/one/README.md`
- Modify: `packages/one/README-zh.md`
- Modify: `packages/one/tests/docs-content.test.ts`

**Interfaces:**

- Consumes: all public APIs, category names, routes, demos, and build scripts from prior tasks.
- Produces: bilingual usage guidance and final release evidence.

- [ ] **Step 1: Add failing bilingual README contracts**

Extend `docs-content.test.ts` to read both READMEs and require all three names,
the navigation category, and these API fragments:

```ts
expect(markdown).toContain('new OneTabs({');
expect(markdown).toContain("value: 'overview'");
expect(markdown).toContain('new OneBreadcrumb({');
expect(markdown).toContain("href: '/projects'");
expect(markdown).toContain('new OnePagination({ total: 95');
```

- [ ] **Step 2: Run README contracts to verify RED**

Run: `bun test packages/one/tests/docs-content.test.ts`

Expected: FAIL because neither README contains the navigation category or
minimum examples.

- [ ] **Step 3: Document the navigation category and minimum examples**

Update both READMEs with:

- Navigation category listing Tabs, Breadcrumb, and Pagination.
- Tabs item records, controlled value, change handling, and dynamic slots.
- Breadcrumb native href, current item, separator, and maxItems.
- Pagination total, controlled page, page-size options, quick jump, and change.

Keep Bun-first install, build, docs, and publish commands unchanged. Use only
real public exports and do not edit the package manifest.

- [ ] **Step 4: Run focused tests and formatting**

Run:

```sh
bun test packages/one/tests/navigation-normalize.test.ts packages/one/tests/tabs.test.ts packages/one/tests/breadcrumb.test.ts packages/one/tests/pagination.test.ts packages/one/tests/categories.test.ts packages/one/tests/component-types.test.ts packages/one/tests/docs-content.test.ts packages/one/tests/docs-app.test.ts packages/one/tests/docs-client.test.ts packages/one/tests/docs-build.test.ts packages/one/tests/docs-server.test.ts packages/one/tests/style-contract.test.ts packages/one/tests/package-smoke.test.ts
bunx prettier --check packages/one/lib/navigation packages/one/lib/tabs packages/one/lib/breadcrumb packages/one/lib/pagination packages/one/docs/app packages/one/tests packages/one/README.md packages/one/README-zh.md docs/superpowers/specs/2026-09-01-one-ui-navigation-design.md docs/superpowers/plans/2026-09-01-one-ui-navigation.md
```

Expected: all focused tests and formatting pass. If Prettier reports task-owned
files, write only those explicit paths and never format `packages/one/package.json`.

- [ ] **Step 5: Run type, build, docs, and pack verification**

Run:

```sh
bunx tsc --noEmit
bun run --cwd packages/one build
bun run --cwd packages/one docs:build
bun pm pack --cwd packages/one --dry-run
git diff --check
```

Expected: every command exits 0, docs build 25 pages, and pack output includes
the root ESM bundle plus declarations for Tabs, Breadcrumb, and Pagination.

- [ ] **Step 6: Run the complete One package suite and classify the baseline**

Run: `bun test packages/one --timeout 15000`

Expected: all navigation and documentation tests pass. If the only failure is
`package-contract.test.ts` expecting `>=0.0.2 <0.1.0` while the protected
manifest contains `>=0.1.0 <0.2.0`, record the user-owned peer-range mismatch
as the existing baseline and do not change either file without authorization.

- [ ] **Step 7: Commit public documentation and inspect final scope**

```sh
git add packages/one/README.md packages/one/README-zh.md packages/one/tests/docs-content.test.ts
git diff --cached --check
git commit -m "docs(one): document navigation components"
git status --short
git log --oneline -10
```

Expected: all task files are committed and `packages/one/package.json` remains
the only protected user-owned modification.
