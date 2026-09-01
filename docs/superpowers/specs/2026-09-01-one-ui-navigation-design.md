# One UI Navigation Components Design

## Status

Approved in conversation on 2026-09-01. This specification defines the next
One UI component batch: `OneTabs`, `OneBreadcrumb`, and `OnePagination`.

## Goal

Add a new navigation category to `@geektech/one` with three complete,
accessible, dependency-free class components:

- `OneTabs` for switching among related content panels.
- `OneBreadcrumb` for hierarchical location and navigation.
- `OnePagination` for moving through paged collections.

The components must follow the existing TSone class-component, VNode, style,
controlled-state, documentation, and release-contract patterns.

## Non-goals

- Do not couple any component to `RouterLink`, `createRouter`, or a specific
  routing strategy.
- Do not add a shared navigation component base class.
- Do not add vertical tabs, closable tabs, drag sorting, editable breadcrumbs,
  cursor pagination, server fetching, or URL synchronization in this batch.
- Do not add runtime dependencies or change TSone public APIs.
- Do not modify, format, stage, or commit the existing user-owned change in
  `packages/one/package.json`.

## Architecture

The three components are independent subclasses of TSone `Component`. Each
class owns only its component state, styles, rendering, normalization, and
event emission. They do not inherit from one another and do not share mutable
state.

The design uses these OOP relationships:

- Inheritance: each public class extends `Component<Props, State>`.
- Aggregation: each component consumes readonly item or option records supplied
  by its caller but does not own their lifecycle.
- Dependency: each component depends on TSone VNodes and One UI style helpers.
- Composition: each component owns the native DOM controls it renders.

Small pure helpers may live under `lib/navigation/` for integer normalization,
stable item filtering, and page token generation. Public component interfaces
remain in their component directories. This keeps responsibilities isolated
and avoids a base class that would force unrelated behavior together.

## Public Category and Exports

Extend `OneComponentCategory` with `navigation` and add this stable category:

```ts
{
  id: 'navigation',
  label: '导航',
  components: ['OneTabs', 'OneBreadcrumb', 'OnePagination'],
}
```

The package root exports all three constructors and these public types:

- `OneTabItem`, `OneTabsProps`, `OneTabsChangeEvent`
- `OneBreadcrumbItem`, `OneBreadcrumbProps`, `OneBreadcrumbClickEvent`
- `OnePaginationProps`, `OnePaginationChangeEvent`

## OneTabs

### Public API

```ts
export interface OneTabItem {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface OneTabsChangeEvent {
  value: string;
  originalEvent: Event;
}

export interface OneTabsProps {
  items: readonly OneTabItem[];
  value?: string;
  defaultValue?: string;
  id?: string;
  ariaLabel?: string;
  children?: Array<VNode | string>;
}
```

Content is supplied through dynamic named slots. A child with `slot: 'profile'`
is the panel for the tab whose `value` is `profile`. All normalized panels are
rendered so their tab and panel IDs remain stable; inactive panels use the
native `hidden` attribute.

The optional `id` becomes the accessible ID prefix. When omitted, the
component generates a stable instance-local prefix that does not change during
updates.

### State and value rules

- `value` selects controlled mode. The component emits `change` but does not
  overwrite the controlled value.
- Without `value`, `defaultValue` initializes internal state.
- Duplicate item values retain the first occurrence and ignore later ones.
- A selected value that is absent or disabled falls back to the first enabled
  item for rendering.
- If no enabled item exists, no tab is selected and every panel is hidden.

### Interaction and accessibility

- The root navigation strip uses `role="tablist"` and horizontal orientation.
- Each tab is a native button with `role="tab"`, `aria-selected`,
  `aria-controls`, and roving `tabindex`.
- Each panel uses `role="tabpanel"` and `aria-labelledby`.
- Click activates the enabled tab.
- ArrowLeft and ArrowRight wrap through enabled items.
- Home and End move to the first and last enabled items.
- Keyboard movement automatically focuses and activates the destination.
- Disabled items use the native `disabled` property and are skipped.
- Each successful user activation emits one `change` event.

## OneBreadcrumb

### Public API

```ts
export interface OneBreadcrumbItem {
  label: string;
  href?: string;
  current?: boolean;
}

export interface OneBreadcrumbClickEvent {
  item: OneBreadcrumbItem;
  index: number;
  originalEvent: MouseEvent;
}

export interface OneBreadcrumbProps {
  items: readonly OneBreadcrumbItem[];
  separator?: string;
  maxItems?: number;
  ariaLabel?: string;
  children?: Array<VNode | string>;
}
```

The `separator` text defaults to `/`. A child assigned to the named
`separator` slot replaces the text separator everywhere. Breadcrumb content is
otherwise driven only by the `items` records.

### Current item and links

- The first item marked `current` is the only current item.
- If no item is marked current, the last item is current.
- Current items render as text with `aria-current="page"`, even if they also
  contain an `href`.
- Non-current items with `href` render as native anchors.
- Non-current items without `href` render as plain text.
- Anchor clicks emit `itemClick` before native navigation. The component does
  not call `preventDefault`; consumers may cancel through `originalEvent`.

### Collapse behavior

- With no `maxItems`, all items render.
- A supplied `maxItems` is normalized to an integer of at least 3.
- `maxItems` limits retained breadcrumb items; separators and ellipsis buttons
  do not count toward that limit.
- When the item count exceeds the limit, the retained set always includes the
  first, current, and last items. Remaining capacity is filled with the nearest
  items around the current item, preserving source order.
- Each hidden contiguous range becomes one ellipsis button. Therefore a
  current item in the middle may produce ellipses on both sides.
- Ellipsis buttons have accessible labels and `aria-expanded="false"`.
- Activating either ellipsis expands the full breadcrumb; expansion is
  internal and intentionally has no controlled API.
- Empty and one-item lists render valid navigation markup without separators.

The component renders `nav > ol > li`, with `ariaLabel` defaulting to
`面包屑`.

## OnePagination

### Public API

```ts
export interface OnePaginationChangeEvent {
  page: number;
  pageSize: number;
  originalEvent: Event;
}

export interface OnePaginationProps {
  total: number;
  page?: number;
  defaultPage?: number;
  pageSize?: number;
  defaultPageSize?: number;
  pageSizeOptions?: readonly number[];
  siblingCount?: number;
  showQuickJumper?: boolean;
  disabled?: boolean;
  ariaLabel?: string;
}
```

`page` and `pageSize` are independently controlled. If either controlled prop
is absent, the corresponding internal state is initialized from its default.
Every successful page or page-size action emits exactly one `change` event with
the final clamped page and page size.

### Normalization

- `total` is a finite non-negative integer; invalid values become 0.
- Page size is a finite positive integer and defaults to 10.
- Page is a finite positive integer and defaults to 1.
- `siblingCount` is a finite non-negative integer and defaults to 1.
- `pageSizeOptions` defaults to `[10, 20, 50, 100]`; invalid and duplicate
  entries are removed while preserving order.
- The active page size is included in the selector even when absent from the
  supplied option list.
- Page count is at least 1, including when `total` is 0.
- The effective page is always clamped into `1..pageCount`.

### Page tokens

The page window always includes page 1, the last page, and the current page
plus `siblingCount` neighbors. Tokens are sorted and gaps are handled as
follows:

- A one-page gap renders the missing numeric page.
- A larger gap renders one non-interactive ellipsis token.
- No duplicate numeric page or ellipsis token is produced.

### Interaction and accessibility

- The component root is a `nav` with a configurable accessible label.
- Previous, next, and numeric pages are native buttons.
- The active numeric button has `aria-current="page"`.
- Previous and next are disabled at their boundaries or when the component is
  disabled.
- The page-size selector is a native `select` with an explicit accessible
  label. It renders when normalized options are non-empty.
- Changing page size recalculates page count and clamps the current page before
  emitting one event.
- The quick-jump input renders only when `showQuickJumper` is true. Enter or
  blur submits a finite integer, clamps it, emits one event, and clears the
  field. Clearing after Enter ensures the following blur cannot emit twice.
- Empty or non-numeric quick-jump input is ignored.
- All controls respect `disabled` and retain native keyboard behavior.

## Styling

All selectors are scoped under `.one-*`, use named styles, and include public
token fallbacks from `ONE_THEME_DEFAULTS`.

### Tabs

- `.one-tabs`, `.one-tabs__list`, `.one-tabs__tab`, and
  `.one-tabs__panel` are the primary selectors.
- The active tab uses the primary color and a bottom indicator.
- Disabled, hover, and focus-visible states are explicit.

### Breadcrumb

- `.one-breadcrumb`, `.one-breadcrumb__list`, `.one-breadcrumb__item`,
  `.one-breadcrumb__link`, `.one-breadcrumb__separator`, and
  `.one-breadcrumb__ellipsis` are the primary selectors.
- The list is inline, wraps safely, and uses muted separators.
- Links and the ellipsis button have focus-visible treatment.

### Pagination

- `.one-pagination`, `.one-pagination__pages`, `.one-pagination__button`,
  `.one-pagination__ellipsis`, `.one-pagination__size`, and
  `.one-pagination__jumper` are the primary selectors.
- Current, hover, disabled, and focus-visible states are explicit.
- Controls may wrap on narrow containers without losing order or labels.

## Documentation

Add four typed-content routes, increasing the One documentation total from 21
to 25:

- `/components/navigation/`
- `/components/navigation/tabs/`
- `/components/navigation/breadcrumb/`
- `/components/navigation/pagination/`

Each component page includes:

- Purpose and selection guidance.
- A static server-rendered preview.
- A real interactive client demo.
- Collapsible TypeScript source.
- Complete props, events, item types, slots, keyboard behavior, and ARIA tables.

The interactive demos must use stable emitter handler references whenever the
handler updates parent state. Documentation controls outside the navigation
components continue to prefer One UI components where their public semantics
are sufficient. Every `[data-one-demo]` root retains the shared 24px padding.

Update both package READMEs with the navigation category and minimum examples
for all three components. Examples must use only real public exports.

## Testing Strategy

Use TDD for every new behavior: add a focused failing test, observe the expected
failure, then implement the smallest behavior that passes.

### Component tests

- `tabs.test.ts`: controlled and uncontrolled selection, duplicate and invalid
  values, disabled items, dynamic panels, click, ArrowLeft/ArrowRight,
  Home/End, focus, emitted payload, and ARIA relationships.
- `breadcrumb.test.ts`: current-item normalization, native href behavior,
  cancellable click events, separators and separator slot, collapsed and
  expanded rendering, minimum limit normalization, and ARIA markup.
- `pagination.test.ts`: normalization, page-window tokens, controlled and
  uncontrolled updates, boundaries, page-size changes, quick jump, disabled
  behavior, single event emission, and ARIA markup.

### Contract tests

Update category, component type, style, root export, package smoke, bilingual
README, documentation content, static app, interactive client, and docs-build
contracts. The docs builder must assert exactly 25 pages.

### Final verification

Run focused navigation and documentation tests first, then:

```sh
bunx tsc --noEmit
bun run --cwd packages/one build
bun run --cwd packages/one docs:build
bun pm pack --cwd packages/one --dry-run
bun test packages/one --timeout 15000
git diff --check
```

The existing protected peer-range mismatch between
`packages/one/package.json` and `package-contract.test.ts` remains a known
baseline unless the user explicitly authorizes changing it. All navigation,
documentation, build, and package-smoke checks must pass independently of that
baseline.

## Acceptance Criteria

- The package exports the three constructors and all approved public types.
- The navigation category lists exactly the three new component names.
- Tabs support controlled/uncontrolled state, disabled items, automatic
  keyboard activation, and dynamic content panels.
- Breadcrumbs support links, one current item, custom separators, and
  accessible expansion.
- Pagination supports controlled/uncontrolled page and page size, page-window
  ellipses, previous/next, quick jump, and page-size selection.
- Invalid runtime values normalize deterministically without throwing.
- Documentation contains exactly 25 routes and real interactive demos with
  collapsible source.
- Both READMEs document the navigation category and valid examples.
- Focused tests, typecheck, build, docs build, package smoke, dry-run pack, and
  diff checks pass.
- The user-owned `packages/one/package.json` modification remains untouched and
  unstaged.
