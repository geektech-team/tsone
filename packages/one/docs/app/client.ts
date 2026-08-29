import { createApp, type ComponentConstructor } from '@geektech/tsone';
import { ButtonDemo } from './demos/ButtonDemo';
import { CardDemo } from './demos/CardDemo';
import { CheckboxDemo } from './demos/CheckboxDemo';
import { FormDemo } from './demos/FormDemo';
import { InputDemo } from './demos/InputDemo';
import { SelectDemo } from './demos/SelectDemo';
import { SwitchDemo } from './demos/SwitchDemo';

type DemoName =
  | 'button'
  | 'input'
  | 'card'
  | 'form'
  | 'select'
  | 'checkbox'
  | 'switch';
type DemoConstructor = ComponentConstructor<Record<string, never>, object>;

const DEMOS: Record<DemoName, DemoConstructor> = {
  button: ButtonDemo,
  input: InputDemo,
  card: CardDemo,
  form: FormDemo,
  select: SelectDemo,
  checkbox: CheckboxDemo,
  switch: SwitchDemo,
};
const mountedDemoRoots = new WeakSet<HTMLElement>();

export function mountOneDocsClient(): void {
  const roots = document.querySelectorAll<HTMLElement>('[data-one-demo]');

  roots.forEach((root, index) => {
    if (mountedDemoRoots.has(root)) {
      return;
    }

    const demoName = root.dataset.oneDemo;
    if (!isDemoName(demoName)) {
      return;
    }

    const id = ensureUniqueRootId(root, index);
    const app = createApp({
      root: DEMOS[demoName] as unknown as ComponentConstructor,
      rootElement: `#${id}`,
    });
    app.mount();
    if (app.isRunning()) {
      mountedDemoRoots.add(root);
    }
  });
}

function isDemoName(value: string | undefined): value is DemoName {
  return (
    value === 'button' ||
    value === 'input' ||
    value === 'card' ||
    value === 'form' ||
    value === 'select' ||
    value === 'checkbox' ||
    value === 'switch'
  );
}

function ensureUniqueRootId(root: HTMLElement, index: number): string {
  if (
    root.id &&
    /^[A-Za-z_][A-Za-z0-9_-]*$/.test(root.id) &&
    document.querySelectorAll(`#${root.id}`).length === 1
  ) {
    return root.id;
  }

  const prefix = `one-docs-demo-${index + 1}`;
  let id = prefix;
  let suffix = 1;
  while (document.getElementById(id)) {
    id = `${prefix}-${suffix}`;
    suffix += 1;
  }
  root.id = id;
  return id;
}

mountOneDocsClient();
