import type { BackOneDocLocale } from './content';
import { localeHref } from './locale';
import { readBackOneDocBaseFromDocument, setBackOneDocBasePath } from './base';
import {
  BACKONE_DOCS_THEME_KEY,
  isBackOneDocsTheme,
  type BackOneDocsTheme,
} from './theme';

const handledThemeToggles = new WeakSet<HTMLElement>();
const handledLangSelects = new WeakSet<HTMLSelectElement>();

export function mountBackOneDocsClient(): void {
  setBackOneDocBasePath(readBackOneDocBaseFromDocument(document));
  initThemeController();
  bindLanguageSwitcher();
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
    '[data-backone-theme-toggle]'
  );
  if (!toggle || handledThemeToggles.has(toggle)) {
    return;
  }
  handledThemeToggles.add(toggle);

  const input = toggle.querySelector<HTMLInputElement>(
    '.backone-docs-theme-input'
  );
  input?.addEventListener('change', () => {
    applyTheme(input.checked ? 'dark' : 'default');
  });
}

function bindLanguageSwitcher(): void {
  const select = document.querySelector<HTMLSelectElement>(
    '[data-backone-lang]'
  );
  if (!select || handledLangSelects.has(select)) {
    return;
  }
  handledLangSelects.add(select);

  const container = select.closest<HTMLElement>('[data-backone-lang-path]');
  const path = container?.dataset.backoneLangPath ?? '/';

  select.addEventListener('change', () => {
    const next: BackOneDocLocale = select.value === 'en' ? 'en' : 'zh';
    const target = localeHref(path, next);
    if (window.location.pathname + window.location.search !== target) {
      window.location.assign(target);
    }
  });
}

function readSavedTheme(): BackOneDocsTheme | undefined {
  try {
    const saved = localStorage.getItem(BACKONE_DOCS_THEME_KEY);
    return isBackOneDocsTheme(saved) ? saved : undefined;
  } catch {
    // 存储不可用（隐私模式等）时保持默认主题。
    return undefined;
  }
}

function applyTheme(theme: BackOneDocsTheme): void {
  document.documentElement.setAttribute('data-backone-theme', theme);
  syncThemeSwitch(theme);
  try {
    localStorage.setItem(BACKONE_DOCS_THEME_KEY, theme);
  } catch {
    // 存储不可用时不阻断主题切换。
  }
}

function syncThemeSwitch(theme: BackOneDocsTheme = currentDocsTheme()): void {
  const toggle = document.querySelector<HTMLElement>(
    '[data-backone-theme-toggle]'
  );
  const input = toggle?.querySelector<HTMLInputElement>(
    '.backone-docs-theme-input'
  );
  if (!(input instanceof HTMLInputElement)) {
    return;
  }
  input.checked = theme === 'dark';
}

function currentDocsTheme(): BackOneDocsTheme {
  const value = document.documentElement.getAttribute('data-backone-theme');
  return isBackOneDocsTheme(value) ? value : 'default';
}

mountBackOneDocsClient();
