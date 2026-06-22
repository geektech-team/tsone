import { searchEntries } from './content';
import { SearchBox } from './components/SearchBox';
import { ThemeToggle } from './components/ThemeToggle';

export function mountDocsClient(): void {
  const searchRoot = document.querySelector('[data-doc-search-root]');
  if (searchRoot instanceof HTMLElement) {
    searchRoot.textContent = '';
    new SearchBox({ entries: searchEntries }).mount(searchRoot);
  }

  const themeRoot = document.querySelector('[data-doc-theme-root]');
  if (themeRoot instanceof HTMLElement) {
    themeRoot.textContent = '';
    new ThemeToggle().mount(themeRoot);
  }
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mountDocsClient, {
      once: true,
    });
  } else {
    mountDocsClient();
  }
}
