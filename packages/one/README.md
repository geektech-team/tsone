# One UI

One UI (`@geektech/one`) is a lightweight, zero-runtime-dependency UI
component library for the TSone class-component framework. TSone is a peer
dependency and must be installed by the consuming application.

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
        createComponent(OneInput, { placeholder: 'Project name' }),
        createComponent(OneCard, { title: 'One UI' }, [
          'Lightweight components for TSone.',
        ]),
      ],
    };
  }
}

createApp({ root: App }).mount();
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

const controlled = new OneInput({ value: 'one' });
controlled.on('input', (payload) => {
  const event = payload as OneInputValueEvent;
  controlled.setProps({ value: event.value });
});

const uncontrolled = new OneInput({ defaultValue: 'draft' });
uncontrolled.on('change', (payload) => {
  const event = payload as OneInputValueEvent;
  console.log(event.value, event.originalEvent);
});
```

## Card slots

Children with `slot: 'header'` or `slot: 'footer'` fill the named regions;
children without a slot fill the default body.

```ts
import { createComponent } from '@geektech/tsone';
import { OneCard } from '@geektech/one';

const card = createComponent(OneCard, {}, [
  { tag: 'h2', slot: 'header', children: ['Account'] },
  { tag: 'p', children: ['Default slot content'] },
  { tag: 'button', slot: 'footer', children: ['Continue'] },
]);
```

## Theme overrides

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
