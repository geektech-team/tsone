import type { CliDocLocale } from './content';
import { readCliDocBaseFromDocument, setCliDocBasePath } from './base';
import { localeHref } from './locale';

function resolveLocale(): CliDocLocale {
  return document.documentElement.lang.startsWith('en') ? 'en' : 'zh';
}

export function mountCliDocsClient(): void {
  setCliDocBasePath(readCliDocBaseFromDocument(document));
  mountLanguageSwitcher();
}

function mountLanguageSwitcher(): void {
  document
    .querySelectorAll<HTMLElement>('[data-cli-lang]')
    .forEach((langRoot) => {
      const path = langRoot.dataset.cliLangPath ?? '/';
      const select = langRoot.querySelector<HTMLSelectElement>('select');
      if (!select) {
        return;
      }

      const current = resolveLocale();
      select.addEventListener('change', () => {
        const next: CliDocLocale =
          select.value === 'en' ? 'en' : 'zh';
        if (next === current) {
          return;
        }
        const target = localeHref(path, next);
        if (window.location.pathname + window.location.search !== target) {
          window.location.assign(target);
        }
      });
    });
}

if (typeof document !== 'undefined') {
  mountCliDocsClient();
}
