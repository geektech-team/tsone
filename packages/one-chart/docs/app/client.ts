import { createApp, type ComponentConstructor } from '@geektech/tsone';
import type { OneChartDocLocale } from './content';
import { readOneChartDocBaseFromDocument, setOneChartDocBasePath } from './base';
import { setDemoLocale } from './demos/locale';
import {
  isOneChartDocsTheme,
  ONE_CHART_DOCS_THEME_KEY,
  type OneChartDocsTheme,
} from './theme';
import { LangSwitcher } from './components/LangSwitcher';
import { BarChartDemo } from './demos/BarChartDemo';
import { FunnelChartDemo } from './demos/FunnelChartDemo';
import { LineChartDemo } from './demos/LineChartDemo';
import { PieChartDemo } from './demos/PieChartDemo';
import { RadarChartDemo } from './demos/RadarChartDemo';
import { ScatterChartDemo } from './demos/ScatterChartDemo';

type DemoName = 'bar' | 'line' | 'pie' | 'radar' | 'scatter' | 'funnel';
type DemoConstructor = ComponentConstructor<Record<string, never>, object>;

const DEMOS: Record<DemoName, DemoConstructor> = {
  bar: BarChartDemo,
  line: LineChartDemo,
  pie: PieChartDemo,
  radar: RadarChartDemo,
  scatter: ScatterChartDemo,
  funnel: FunnelChartDemo,
};

const mountedDemoRoots = new WeakSet<HTMLElement>();
const handledThemeToggles = new WeakSet<HTMLElement>();

/**
 * SSR 输出的语言下拉是静态 HTML，事件需要在客户端重新挂载组件后才生效：
 * 清空根节点，用 createApp 挂载 LangSwitcher 组件实例。
 */
function mountLanguageSwitcher(): void {
  const langRoot = document.querySelector<HTMLElement>('[data-one-chart-lang]');
  if (!langRoot) {
    return;
  }

  langRoot.textContent = '';
  const langApp = createApp({
    root: LangSwitcher as unknown as ComponentConstructor,
    rootElement: langRoot,
    rootProps: {
      path: langRoot.dataset.oneChartLangPath ?? '/',
      locale: resolveLocale(),
    },
  });
  langApp.mount();
}

export function mountOneChartDocsClient(): void {
  setOneChartDocBasePath(readOneChartDocBaseFromDocument(document));
  setDemoLocale(resolveLocale());
  initThemeController();
  mountLanguageSwitcher();

  const roots = document.querySelectorAll<HTMLElement>(
    '[data-one-chart-demo]'
  );

  roots.forEach((root, index) => {
    if (mountedDemoRoots.has(root)) {
      return;
    }

    const demoName = root.dataset.oneChartDemo;
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

function resolveLocale(): OneChartDocLocale {
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
  const toggle = document.querySelector<HTMLElement>(
    '[data-one-chart-theme-toggle]'
  );
  if (!toggle || handledThemeToggles.has(toggle)) {
    return;
  }
  handledThemeToggles.add(toggle);

  const input = toggle.querySelector<HTMLInputElement>('input[type="checkbox"]');
  input?.addEventListener('change', () => {
    applyTheme(input.checked ? 'dark' : 'default');
  });
}

function readSavedTheme(): OneChartDocsTheme | undefined {
  try {
    const saved = localStorage.getItem(ONE_CHART_DOCS_THEME_KEY);
    return isOneChartDocsTheme(saved) ? saved : undefined;
  } catch {
    // 存储不可用（隐私模式等）时保持默认主题。
    return undefined;
  }
}

function applyTheme(theme: OneChartDocsTheme): void {
  document.documentElement.setAttribute('data-one-chart-theme', theme);
  syncThemeSwitch(theme);
  try {
    localStorage.setItem(ONE_CHART_DOCS_THEME_KEY, theme);
  } catch {
    // 存储不可用时不阻断主题切换。
  }
}

function syncThemeSwitch(theme: OneChartDocsTheme = currentDocsTheme()): void {
  const toggle = document.querySelector<HTMLElement>(
    '[data-one-chart-theme-toggle]'
  );
  const input = toggle?.querySelector<HTMLInputElement>(
    'input[type="checkbox"]'
  );
  if (!(input instanceof HTMLInputElement)) {
    return;
  }
  input.checked = theme === 'dark';
}

function currentDocsTheme(): OneChartDocsTheme {
  const value = document.documentElement.getAttribute('data-one-chart-theme');
  return isOneChartDocsTheme(value) ? value : 'default';
}

function isDemoName(value: string | undefined): value is DemoName {
  return (
    value === 'bar' ||
    value === 'line' ||
    value === 'pie' ||
    value === 'radar' ||
    value === 'scatter' ||
    value === 'funnel'
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

  const prefix = `one-chart-docs-demo-${index + 1}`;
  let id = prefix;
  let suffix = 1;
  while (document.getElementById(id)) {
    id = `${prefix}-${suffix}`;
    suffix += 1;
  }
  root.id = id;
  return id;
}

mountOneChartDocsClient();
