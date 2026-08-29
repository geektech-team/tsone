import { createApp, type ComponentConstructor } from '@geektech/tsone';
import { ButtonDemo } from './demos/ButtonDemo';
import { CardDemo } from './demos/CardDemo';
import { InputDemo } from './demos/InputDemo';

type DemoName = 'button' | 'input' | 'card';
type DemoConstructor = ComponentConstructor<Record<string, never>, object>;

const DEMOS: Record<DemoName, DemoConstructor> = {
  button: ButtonDemo,
  input: InputDemo,
  card: CardDemo,
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
  return value === 'button' || value === 'input' || value === 'card';
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
