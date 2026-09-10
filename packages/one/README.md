# One UI

One UI (`@geektech/one`) is a lightweight, zero-runtime-dependency UI
component library for the TSone class-component framework. TSone is a peer
dependency and must be installed by the consuming application.

**Documentation:** <https://geektech-team.github.io/tsone/one/>

## Installation

```bash
bun add @geektech/tsone @geektech/one
```

## Quick start

```ts
import {
  Component,
  createApp,
  createComponent,
  type VNode,
} from '@geektech/tsone';
import { OneButton, OneCard, OneInput } from '@geektech/one';

class App extends Component {
  protected initState(): object {
    return {};
  }

  protected initStyles(): void {}

  protected render(): VNode {
    return {
      tag: 'main',
      children: [
        createComponent(OneButton, {}, ['Save']),
        createComponent(OneInput, {
          placeholder: 'Project name',
          ariaLabel: 'Project name',
        }),
        createComponent(OneCard, { title: 'One UI' }, [
          'Lightweight components for TSone.',
        ]),
      ],
    };
  }
}

createApp({ root: App }).mount();
```

## Component categories

- Basic: `OneButton`, `OneSpace`
- Layout: `OneDivider`, `OneRow`, `OneCol`
- Form: `OneForm`, `OneFormItem`, `OneInput`, `OneTextarea`, `OneSelect`, `OneCascader`,
  `OneTimePicker`, `OneCheckbox`, `OneCheckboxGroup`, `OneRadio`,
  `OneRadioGroup`, `OneSwitch`, `OneSlider`, `OneRate`, `OneUpload`
- Navigation: `OneTabs`, `OneSteps`, `OneBreadcrumb`, `OnePagination`
- Data display: `OneCard`, `OneTag`, `OneBadge`, `OneAvatar`, `OneProgress`,
  `OneEmpty`, `OneTable`, `OneCollapse`, `OneSkeleton`, `OneDescriptions`,
  `OneTimeline`
- Feedback and overlays: `OneAlert`, `OneMessage`, `OneDialog`, `OneTooltip`,
  `OnePopover`, `OneLoading`

## Grid

`OneRow` and `OneCol` divide the available width into 24 columns. Give each
column a `span` (1-24) and combine them freely; `offset` shifts a column right,
and `gutter` sets the horizontal/vertical spacing.

```ts
import { OneRow, OneCol } from '@geektech/one';

new OneRow({
  gutter: [16, 16],
  children: [
    { component: OneCol, props: { span: 12 }, children: ['12'] },
    { component: OneCol, props: { span: 12 }, children: ['12'] },
  ],
});

new OneRow({
  gutter: [16, 16],
  children: [
    {
      component: OneCol,
      props: { span: 8, offset: 8 },
      children: ['8 + offset 8'],
    },
  ],
});
```

`OneCol` also supports responsive breakpoints `xs` / `sm` / `md` / `lg` / `xl` /
`xxl`. Each accepts a number (span only) or `{ span, offset }`; smaller
breakpoint values cascade to larger ones until overridden.

```ts
new OneRow({
  gutter: [16, 16],
  children: [
    { component: OneCol, props: { xs: 24, md: 12 }, children: ['A'] },
    { component: OneCol, props: { xs: 24, md: 12 }, children: ['B'] },
  ],
});
```

Default breakpoints: xs < 576px, sm >= 576px, md >= 768px, lg >= 992px,
xl >= 1200px, xxl >= 1600px. Override them with theme CSS variables
`--one-grid-breakpoint-sm` / `md` / `lg` / `xl` / `xxl`.

## Navigation

Use tabs for parallel views, breadcrumbs for a hierarchy, and pagination for a
long collection. All three components support controlled state or cancellable
events where native navigation is involved.

```ts
import {
  OneBreadcrumb,
  OnePagination,
  OneTabs,
  type OneBreadcrumbClickEvent,
  type OnePaginationChangeEvent,
  type OneTabsChangeEvent,
} from '@geektech/one';

const tabs = new OneTabs({
  value: 'overview',
  items: [
    { value: 'overview', label: 'Overview' },
    { value: 'security', label: 'Security' },
  ],
  children: [
    { tag: 'p', slot: 'overview', children: ['Overview content'] },
    { tag: 'p', slot: 'security', children: ['Security content'] },
  ],
});
tabs.on('change', (payload) => {
  const event = payload as OneTabsChangeEvent;
  tabs.setProps({ value: event.value });
});

const breadcrumb = new OneBreadcrumb({
  maxItems: 3,
  separator: '/',
  items: [
    { label: 'Home', href: '/' },
    { label: 'Projects', href: '/projects' },
    { label: 'Details', current: true },
  ],
});
breadcrumb.on('itemClick', (payload) => {
  const event = payload as OneBreadcrumbClickEvent;
  console.log(event.item, event.index);
});

const basicPagination = new OnePagination({ total: 95 });
const pagination = new OnePagination({
  total: 95,
  page: 1,
  pageSize: 10,
  pageSizeOptions: [10, 20, 50],
  showQuickJumper: true,
});
pagination.on('change', (payload) => {
  const event = payload as OnePaginationChangeEvent;
  pagination.setProps({ page: event.page, pageSize: event.pageSize });
});
void basicPagination;
```

## Data display

Use tags for compact status, badges for counts, avatars for identity, progress
bars for completion, empty states when a view has no content, tables for row
data, collapsible panels for grouped detail, and skeletons while content loads.
`OneEmpty` accepts an `actions` slot for the next useful action.

```ts
import { OneBadge, OneButton, OneEmpty, OneTag } from '@geektech/one';

new OneTag({ variant: 'success', closable: true });
new OneBadge({ value: 120, max: 99 });
const actions = [
  {
    component: OneButton,
    slot: 'actions',
    children: ['Create project'],
  },
];
new OneEmpty({ description: 'No results', children: actions });
```

```ts
import { OneAvatar, OneProgress } from '@geektech/one';

new OneAvatar({ text: 'M', variant: 'primary' });
new OneAvatar({ src: '/avatar.png', alt: 'Avatar', shape: 'square' });
new OneProgress({ percent: 65, showText: true });
new OneProgress({ percent: 30, variant: 'success' });
```

```ts
import { OneTable, OneCollapse, OneSkeleton } from '@geektech/one';

new OneTable({
  data: [
    { name: 'Eve Lin', role: 'Design' },
    { name: 'Ben Su', role: 'Frontend' },
  ],
  columns: [
    { key: 'name', title: 'Name' },
    { key: 'role', title: 'Role' },
  ],
});
new OneCollapse({
  accordion: true,
  defaultActive: ['basic'],
  items: [
    { value: 'basic', title: 'Basic usage', children: ['Content'] },
    { value: 'advanced', title: 'Advanced usage', children: ['More content'] },
  ],
});
new OneSkeleton({ rows: 3, title: true, avatar: true });
```

## Feedback and overlays

Use `OneAlert` for persistent inline feedback, `OneTooltip` for a short
description attached to one trigger element, and `OneLoading` for an
in-progress indicator:

```ts
import { OneAlert, OneButton, OneLoading, OneTooltip } from '@geektech/one';

const alert = new OneAlert({
  title: 'Saved',
  variant: 'success',
  closable: true,
});

const tooltip = new OneTooltip({
  content: 'Copy link',
  placement: 'bottom-end',
  children: [{ component: OneButton, children: ['Copy'] }],
});

const loading = new OneLoading({ size: 'md', label: 'Loading' });
```

Use the imperative services for transient messages and confirmation flows:

```ts
import { oneDialog, oneMessage } from '@geektech/one';

oneMessage.success('Saved');

const confirmed = await oneDialog.confirm({
  title: 'Delete item?',
  description: 'This action cannot be undone.',
});
```

## Button variants, sizes, loading and events

`OneButton` supports `primary`, `secondary`, and `danger` variants and `sm`,
`md`, and `lg` sizes. Loading buttons are disabled and expose `aria-busy`.

```ts
import { OneButton } from '@geektech/one';

const button = new OneButton({
  variant: 'danger',
  size: 'lg',
  loading: false,
  children: ['Delete'],
});

button.on('click', (event) => {
  console.log('clicked', event);
  button.setProps({ loading: true });
});
button.mount(document.querySelector('#actions') as HTMLElement);
```

## Controlled and uncontrolled inputs

Pass `value` for a controlled input and accept emitted values through
`setProps`. Pass `defaultValue` when One UI should maintain the value.

```ts
import { OneInput, type OneInputValueEvent } from '@geektech/one';

const controlled = new OneInput({
  value: 'one',
  ariaLabel: 'Controlled project name',
});
controlled.on('input', (payload) => {
  const event = payload as OneInputValueEvent;
  controlled.setProps({ value: event.value });
});

const uncontrolled = new OneInput({
  defaultValue: 'draft',
  ariaLabel: 'Draft project name',
});
uncontrolled.on('change', (payload) => {
  const event = payload as OneInputValueEvent;
  console.log(event.value, event.originalEvent);
});
```

## Multi-line textarea

`OneTextarea` shares the same controlled/uncontrolled boundary as `OneInput`
and adds `rows` for the visible line count; combined with `OneFormItem` it
participates in form validation.

```ts
import { OneTextarea, type OneTextareaValueEvent } from '@geektech/one';

const textarea = new OneTextarea({
  rows: 5,
  placeholder: 'Type additional notes',
  ariaLabel: 'Additional notes',
});
textarea.on('input', (payload) => {
  const event = payload as OneTextareaValueEvent;
  console.log(event.value);
});
```

## Selection and time

Radio buttons pick one option out of several. Time pickers offer an editable
text input plus a click-to-open hour/minute/second dropdown. Both support
controlled and uncontrolled modes.

```ts
import {
  OneRadio,
  OneRadioGroup,
  OneTimePicker,
  type OneFieldValueEvent,
} from '@geektech/one';

const radio = new OneRadio({ value: 'design', defaultChecked: true });
const group = new OneRadioGroup({
  defaultValue: 'weekly',
  ariaLabel: 'Frequency',
  options: [
    { value: 'daily', label: 'Daily' },
    { value: 'weekly', label: 'Weekly' },
  ],
});
group.on('change', (payload) => {
  const event = payload as OneFieldValueEvent<string>;
  console.log(event.value);
});

new OneTimePicker({ defaultValue: '09:30', ariaLabel: 'Start time' });
```

## Sliders, ratings and uploads

Sliders pick a number within a range, ratings express a star score, and uploads
collect local file metadata. All three support controlled and uncontrolled
modes.

```ts
import {
  OneSlider,
  OneRate,
  OneUpload,
  type OneSliderValueEvent,
  type OneRateValueEvent,
  type OneUploadChangeEvent,
} from '@geektech/one';

const slider = new OneSlider({ defaultValue: 60, showValue: true });
slider.on('change', (payload) => {
  const event = payload as OneSliderValueEvent;
  console.log(event.value);
});

const rating = new OneRate({ defaultValue: 4, allowClear: true });
rating.on('change', (payload) => {
  const event = payload as OneRateValueEvent;
  console.log(event.value);
});

const upload = new OneUpload({ multiple: true, ariaLabel: 'Attachments' });
upload.on('change', (payload) => {
  const event = payload as OneUploadChangeEvent;
  console.log(event.files.map((file) => file.name));
});
```

## Card slots

Children with `slot: 'header'` or `slot: 'footer'` fill the named regions;
children without a slot fill the default body.

```ts
import { createComponent } from '@geektech/tsone';
import { OneButton, OneCard } from '@geektech/one';

const card = createComponent(OneCard, {}, [
  { tag: 'h2', slot: 'header', children: ['Account'] },
  { tag: 'p', children: ['Default slot content'] },
  { component: OneButton, slot: 'footer', children: ['Continue'] },
]);
```

## Global themes

The immutable `default` theme is always available. Register any number of
partial themes; omitted colors, typography, border, and radius values inherit
from `ONE_DEFAULT_THEME`.

```ts
import { ONE_DEFAULT_THEME, oneTheme } from '@geektech/one';

oneTheme.init({
  defaultTheme: 'brand',
  themes: {
    brand: {
      colors: { primary: '#326bff' },
      typography: { fontFamily: 'Inter, sans-serif', lineHeight: '1.6' },
      border: { color: '#cbd5e1', width: '1px', style: 'solid' },
      radius: { sm: '4px', md: '8px', lg: '12px' },
    },
    night: { colors: { surface: '#101510', text: '#f4f8f4' } },
  },
});

oneTheme.switch('default');
console.log(oneTheme.currentTheme, ONE_DEFAULT_THEME.colors.primary);
```

The service writes to `document.documentElement` only. It does not create local
themes, persist the selected name, or follow the operating-system scheme.
Invalid configuration throws `OneThemeConfigError`; unknown theme names throw
`OneThemeNotFoundError`.

## Internationalization (i18n)

One UI ships built-in `zh-CN` and `en` message dictionaries for component
defaults: placeholders, aria labels, validation messages, pagination text and
empty states. The global `oneI18n` singleton starts in `zh-CN`. Switch the
locale at runtime and mounted components update automatically.

```ts
import { oneI18n } from '@geektech/one';

oneI18n.setLocale('en');

// Defaults now render in English:
// <OneEmpty /> → "No data", <OnePagination /> → "Previous / Next",
// form validation → "This field is required".
```

Components that can show built-in text extend `OneLocalizedComponent` and
resolve defaults through `this.t()`. Explicit props always take precedence
over translated defaults:

```ts
import { OneEmpty, oneI18n } from '@geektech/one';

const empty = new OneEmpty(); // renders "暂无数据"
const custom = new OneEmpty({ description: 'No results' }); // prop wins
oneI18n.setLocale('en'); // both components re-render; the prop stays
```

Translate your own messages by merging into the built-in dictionary, or create
a fully isolated instance:

```ts
import { createOneI18n, oneI18n } from '@geektech/one';

oneI18n.mergeMessages({
  'zh-CN': { 'app.greeting': '你好，{name}！' },
  en: { 'app.greeting': 'Hello, {name}!' },
});
console.log(oneI18n.t('app.greeting', { name: 'One' }));

const custom = createOneI18n({ locale: 'en' }); // isolated instance
```

Lookup order is `locale → fallbackLocale (default zh-CN) → key`; messages use
`{placeholder}` interpolation. `OneLocalizedComponent` instances subscribe on
their first `t()` call and unsubscribe after unmount, so locale changes
re-render only live components. Form validation messages are resolved at
validation time — re-validate after a locale switch to see updated messages.

## CSS variable overrides

One UI styles are scoped to `.one-*` selectors. Override public CSS variables
on an application container or `:root`:

```css
.my-app {
  --one-color-primary: #326bff;
  --one-radius-md: 12px;
}
```

The matching fallback values are also available from
`ONE_THEME_DEFAULTS`.

## Development

```bash
bun install
bun test packages/one
bunx tsc --noEmit --project packages/one/tsconfig.json
bun run --cwd packages/one build
```

Run the complete publish verification from the repository root:

```bash
bun test packages/one/tests/package-contract.test.ts packages/one/tests/component-types.test.ts packages/one/tests/style-contract.test.ts packages/one/tests/package-smoke.test.ts && bunx tsc --noEmit --project packages/one/tsconfig.json && bun run --cwd packages/one build && bun pm pack --cwd packages/one --dry-run
```
