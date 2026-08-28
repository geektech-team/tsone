import { createApp, type OneApp } from '../../lib';
import { DocsPage, type DocsPageProps } from './components/DocsPage';
import { LocaleSwitcher } from './components/LocaleSwitcher';
import { SearchBox } from './components/SearchBox';
import { ThemeToggle } from './components/ThemeToggle';
import {
  docCatalogs,
  localizeDocPath,
  parseLocalizedDocPath,
  type DocLocale,
  type DocLocaleMessages,
  type DocPage,
  type SearchEntry,
} from './content';
import { docsStyles } from './styles';

type DocsPageApp = OneApp<object, object, DocsPageProps>;

export function createDocsPageApp(
  locale: DocLocale,
  page: DocPage,
  pages?: DocPage[]
): DocsPageApp;
export function createDocsPageApp(
  page: DocPage,
  pages?: DocPage[]
): DocsPageApp;
export function createDocsPageApp(
  localeOrPage: DocLocale | DocPage,
  pageOrPages?: DocPage | DocPage[],
  providedPages?: DocPage[]
): DocsPageApp {
  const locale = typeof localeOrPage === 'string' ? localeOrPage : 'zh';
  const catalog = docCatalogs[locale];
  const page =
    typeof localeOrPage === 'string' ? (pageOrPages as DocPage) : localeOrPage;
  const pages =
    typeof localeOrPage === 'string'
      ? (providedPages ?? catalog.pages)
      : Array.isArray(pageOrPages)
        ? pageOrPages
        : catalog.pages;
  const messages = catalog.config.messages;
  const rootProps = { locale, page, pages, messages };

  return createApp({
    root: DocsPage,
    rootProps,
    document: {
      lang: catalog.config.htmlLang,
      title: `${page.title} - TSone Docs`,
      description: page.description,
      head: [
        {
          tag: 'link',
          attributes: {
            rel: 'alternate',
            hreflang: 'zh-CN',
            href: localizeDocPath('zh', page.path),
          },
        },
        {
          tag: 'link',
          attributes: {
            rel: 'alternate',
            hreflang: 'en',
            href: localizeDocPath('en', page.path),
          },
        },
        {
          tag: 'script',
          attributes: { src: '/assets/docs-locale.js' },
        },
      ],
      body: {
        component: DocsPage,
        props: rootProps,
      },
      styles: docsStyles,
      scripts: [{ type: 'module', src: '/assets/docs-client.js' }],
    },
  });
}

export function createDocsSearchApp(
  entries: SearchEntry[] = docCatalogs.zh.searchEntries,
  messages: DocLocaleMessages = docCatalogs.zh.config.messages
) {
  return createApp({
    root: SearchBox,
    rootProps: { entries, messages },
    rootElement: '[data-doc-search-root]',
  });
}

export function createDocsThemeApp(
  messages: DocLocaleMessages = docCatalogs.zh.config.messages
) {
  return createApp({
    root: ThemeToggle,
    rootProps: { messages },
    rootElement: '[data-doc-theme-root]',
  });
}

export function createDocsLocaleApp(
  locale: DocLocale,
  logicalPath: string,
  messages: DocLocaleMessages
) {
  return createApp({
    root: LocaleSwitcher,
    rootProps: { locale, logicalPath, messages },
    rootElement: '[data-doc-locale-root]',
  });
}

export function mountDocsClient(): void {
  const { locale, logicalPath } = parseLocalizedDocPath(location.pathname);
  const catalog = docCatalogs[locale];
  const messages = catalog.config.messages;

  createDocsSearchApp(catalog.searchEntries, messages).mount();
  createDocsThemeApp(messages).mount();
  createDocsLocaleApp(locale, logicalPath, messages).mount();
}
