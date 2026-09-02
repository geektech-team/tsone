import { createApp, type ComponentConstructor } from '@geektech/tsone';
import type { OneDocLocale } from './content';
import { setDemoLocale } from './demos/locale';
import {
  isOneDocsTheme,
  ONE_DOCS_THEME_KEY,
  type OneDocsTheme,
} from './theme';
import { ButtonDemo } from './demos/ButtonDemo';
import { BadgeDemo } from './demos/BadgeDemo';
import { CardDemo } from './demos/CardDemo';
import { CheckboxDemo } from './demos/CheckboxDemo';
import { EmptyDemo } from './demos/EmptyDemo';
import { FormDemo } from './demos/FormDemo';
import { InputDemo } from './demos/InputDemo';
import { SelectDemo } from './demos/SelectDemo';
import { SwitchDemo } from './demos/SwitchDemo';
import { RadioDemo } from './demos/RadioDemo';
import { TimePickerDemo } from './demos/TimePickerDemo';
import { TagDemo } from './demos/TagDemo';
import { AvatarDemo } from './demos/AvatarDemo';
import { ProgressDemo } from './demos/ProgressDemo';
import { AlertDemo } from './demos/AlertDemo';
import { DialogDemo } from './demos/DialogDemo';
import { MessageDemo } from './demos/MessageDemo';
import { TooltipDemo } from './demos/TooltipDemo';
import { LoadingDemo } from './demos/LoadingDemo';
import { TabsDemo } from './demos/TabsDemo';
import { BreadcrumbDemo } from './demos/BreadcrumbDemo';
import { PaginationDemo } from './demos/PaginationDemo';
import { SliderDemo } from './demos/SliderDemo';
import { RateDemo } from './demos/RateDemo';
import { UploadDemo } from './demos/UploadDemo';
import { TableDemo } from './demos/TableDemo';
import { CollapseDemo } from './demos/CollapseDemo';
import { SkeletonDemo } from './demos/SkeletonDemo';

type DemoName =
  | 'button'
  | 'input'
  | 'card'
  | 'tag'
  | 'badge'
  | 'empty'
  | 'avatar'
  | 'progress'
  | 'form'
  | 'select'
  | 'checkbox'
  | 'switch'
  | 'radio'
  | 'time-picker'
  | 'alert'
  | 'message'
  | 'dialog'
  | 'tooltip'
  | 'loading'
  | 'tabs'
  | 'breadcrumb'
  | 'pagination'
  | 'slider'
  | 'rate'
  | 'upload'
  | 'table'
  | 'collapse'
  | 'skeleton';
type DemoConstructor = ComponentConstructor<Record<string, never>, object>;

const DEMOS: Record<DemoName, DemoConstructor> = {
  button: ButtonDemo,
  input: InputDemo,
  card: CardDemo,
  tag: TagDemo,
  badge: BadgeDemo,
  empty: EmptyDemo,
  avatar: AvatarDemo,
  progress: ProgressDemo,
  form: FormDemo,
  select: SelectDemo,
  checkbox: CheckboxDemo,
  switch: SwitchDemo,
  radio: RadioDemo,
  'time-picker': TimePickerDemo,
  alert: AlertDemo,
  message: MessageDemo,
  dialog: DialogDemo,
  tooltip: TooltipDemo,
  loading: LoadingDemo,
  tabs: TabsDemo,
  breadcrumb: BreadcrumbDemo,
  pagination: PaginationDemo,
  slider: SliderDemo,
  rate: RateDemo,
  upload: UploadDemo,
  table: TableDemo,
  collapse: CollapseDemo,
  skeleton: SkeletonDemo,
};
const mountedDemoRoots = new WeakSet<HTMLElement>();

const handledThemeToggles = new WeakSet<HTMLElement>();

export function mountOneDocsClient(): void {
  setDemoLocale(resolveLocale());
  initThemeController();

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

function resolveLocale(): OneDocLocale {
  return document.documentElement.lang.startsWith('en') ? 'en' : 'zh';
}

function initThemeController(): void {
  const saved = readSavedTheme();
  if (saved !== undefined) {
    applyTheme(saved);
  } else {
    syncThemeSwitch();
  }
  bindThemeSwitch();
}

function bindThemeSwitch(): void {
  const toggle = document.querySelector<HTMLElement>('[data-one-theme-toggle]');
  if (!toggle || handledThemeToggles.has(toggle)) {
    return;
  }
  handledThemeToggles.add(toggle);

  const input = toggle.querySelector<HTMLInputElement>('.one-switch__input');
  input?.addEventListener('change', () => {
    applyTheme(input.checked ? 'dark' : 'default');
  });
}

function readSavedTheme(): OneDocsTheme | undefined {
  try {
    const saved = localStorage.getItem(ONE_DOCS_THEME_KEY);
    return isOneDocsTheme(saved) ? saved : undefined;
  } catch {
    // 存储不可用（隐私模式等）时保持默认主题。
    return undefined;
  }
}

function applyTheme(theme: OneDocsTheme): void {
  document.documentElement.setAttribute('data-one-theme', theme);
  syncThemeSwitch(theme);
  try {
    localStorage.setItem(ONE_DOCS_THEME_KEY, theme);
  } catch {
    // 存储不可用时不阻断主题切换。
  }
}

function syncThemeSwitch(theme: OneDocsTheme = currentDocsTheme()): void {
  const toggle = document.querySelector<HTMLElement>('[data-one-theme-toggle]');
  const input = toggle?.querySelector<HTMLInputElement>('.one-switch__input');
  const label = toggle?.querySelector<HTMLElement>('.one-switch');
  if (!(input instanceof HTMLInputElement) || !(label instanceof HTMLElement)) {
    return;
  }
  const checked = theme === 'dark';
  input.checked = checked;
  label.setAttribute('aria-checked', checked ? 'true' : 'false');
}

function currentDocsTheme(): OneDocsTheme {
  const value = document.documentElement.getAttribute('data-one-theme');
  return isOneDocsTheme(value) ? value : 'default';
}

function isDemoName(value: string | undefined): value is DemoName {
  return (
    value === 'button' ||
    value === 'input' ||
    value === 'card' ||
    value === 'tag' ||
    value === 'badge' ||
    value === 'empty' ||
    value === 'avatar' ||
    value === 'progress' ||
    value === 'form' ||
    value === 'select' ||
    value === 'checkbox' ||
    value === 'switch' ||
    value === 'radio' ||
    value === 'time-picker' ||
    value === 'alert' ||
    value === 'message' ||
    value === 'dialog' ||
    value === 'tooltip' ||
    value === 'loading' ||
    value === 'tabs' ||
    value === 'breadcrumb' ||
    value === 'pagination' ||
    value === 'slider' ||
    value === 'rate' ||
    value === 'upload' ||
    value === 'table' ||
    value === 'collapse' ||
    value === 'skeleton'
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
