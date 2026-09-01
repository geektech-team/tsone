import { createApp, type ComponentConstructor } from '@geektech/tsone';
import { ButtonDemo } from './demos/ButtonDemo';
import { BadgeDemo } from './demos/BadgeDemo';
import { CardDemo } from './demos/CardDemo';
import { CheckboxDemo } from './demos/CheckboxDemo';
import { EmptyDemo } from './demos/EmptyDemo';
import { FormDemo } from './demos/FormDemo';
import { InputDemo } from './demos/InputDemo';
import { SelectDemo } from './demos/SelectDemo';
import { SwitchDemo } from './demos/SwitchDemo';
import { TagDemo } from './demos/TagDemo';
import { AlertDemo } from './demos/AlertDemo';
import { DialogDemo } from './demos/DialogDemo';
import { MessageDemo } from './demos/MessageDemo';
import { TooltipDemo } from './demos/TooltipDemo';
import { TabsDemo } from './demos/TabsDemo';
import { BreadcrumbDemo } from './demos/BreadcrumbDemo';
import { PaginationDemo } from './demos/PaginationDemo';

type DemoName =
  | 'button'
  | 'input'
  | 'card'
  | 'tag'
  | 'badge'
  | 'empty'
  | 'form'
  | 'select'
  | 'checkbox'
  | 'switch'
  | 'alert'
  | 'message'
  | 'dialog'
  | 'tooltip'
  | 'tabs'
  | 'breadcrumb'
  | 'pagination';
type DemoConstructor = ComponentConstructor<Record<string, never>, object>;

const DEMOS: Record<DemoName, DemoConstructor> = {
  button: ButtonDemo,
  input: InputDemo,
  card: CardDemo,
  tag: TagDemo,
  badge: BadgeDemo,
  empty: EmptyDemo,
  form: FormDemo,
  select: SelectDemo,
  checkbox: CheckboxDemo,
  switch: SwitchDemo,
  alert: AlertDemo,
  message: MessageDemo,
  dialog: DialogDemo,
  tooltip: TooltipDemo,
  tabs: TabsDemo,
  breadcrumb: BreadcrumbDemo,
  pagination: PaginationDemo,
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
    value === 'tag' ||
    value === 'badge' ||
    value === 'empty' ||
    value === 'form' ||
    value === 'select' ||
    value === 'checkbox' ||
    value === 'switch' ||
    value === 'alert' ||
    value === 'message' ||
    value === 'dialog' ||
    value === 'tooltip' ||
    value === 'tabs' ||
    value === 'breadcrumb' ||
    value === 'pagination'
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
