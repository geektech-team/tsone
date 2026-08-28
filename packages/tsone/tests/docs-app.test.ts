import { beforeEach, describe, expect, it } from 'bun:test';
import {
  createDocsLocaleApp,
  createDocsPageApp,
  createDocsSearchApp,
  createDocsThemeApp,
  mountDocsClient,
} from '../docs/app/app';
import { applyDocLocaleSelection } from '../docs/app/components/LocaleSwitcher';
import { docCatalogs } from '../docs/app/content';

describe('docs app', () => {
  beforeEach(() => {
    history.replaceState({}, '', '/');
    document.body.innerHTML = '';
    document.documentElement.removeAttribute('data-theme');
    localStorage.clear();
  });

  it('renders English navigation, links, metadata, and widget roots', () => {
    const catalog = docCatalogs.en;
    const page = catalog.pages.find((item) => item.path === '/');
    if (!page) throw new Error('Missing English home page');

    const html = createDocsPageApp(
      'en',
      page,
      catalog.pages
    ).renderHtmlDocument();

    expect(html).toContain('<!doctype html>');
    expect(html).toContain('<html lang="en">');
    expect(html).toContain(`<title>${page.title} - TSone Docs</title>`);
    expect(html).toContain('data-tsone-docs-locale="en"');
    expect(html).toContain('data-tsone-docs-page="/"');
    expect(html).toContain('href="/en/"');
    expect(html).toContain('href="/en/api/app/"');
    expect(html).toContain('aria-label="Documentation"');
    expect(html).toContain('data-doc-search-root');
    expect(html).toContain('data-doc-theme-root');
    expect(html).toContain('data-doc-locale-root');
    expect(html).toContain('/assets/docs-client.js');
  });

  it('renders localized English API table headings', () => {
    const catalog = docCatalogs.en;
    const page = catalog.pages.find((item) => item.path === '/api/app/');
    if (!page) throw new Error('Missing English App API page');

    const html = createDocsPageApp(
      'en',
      page,
      catalog.pages
    ).renderHtmlDocument();

    expect(html).toContain('>Name</th>');
    expect(html).toContain('>Signature</th>');
    expect(html).toContain('>Description</th>');
  });

  it('persists a manual selection and navigates to the same logical page', () => {
    const values = new Map<string, string>();
    let destination = '';

    applyDocLocaleSelection(
      'en',
      '/api/app/',
      { setItem: (key, value) => values.set(key, value) },
      (href) => {
        destination = href;
      }
    );

    expect(values.get('tsone-docs-locale')).toBe('en');
    expect(destination).toBe('/en/api/app/');
  });

  it('still navigates when locale persistence fails', () => {
    let destination = '';

    applyDocLocaleSelection(
      'zh',
      '/guide/core-concepts/',
      {
        setItem: () => {
          throw new Error('Storage unavailable');
        },
      },
      (href) => {
        destination = href;
      }
    );

    expect(destination).toBe('/guide/core-concepts/');
  });

  it('mounts English search, theme, and locale controls', () => {
    history.replaceState({}, '', '/en/api/app/');
    document.body.innerHTML = [
      '<div data-doc-search-root></div>',
      '<div data-doc-theme-root></div>',
      '<div data-doc-locale-root></div>',
    ].join('');

    mountDocsClient();

    expect(
      document.querySelector('[type="search"]')?.getAttribute('placeholder')
    ).toBe('Search docs');
    expect(
      document.querySelector('[type="search"]')?.getAttribute('aria-label')
    ).toBe('Search documentation');
    expect(document.querySelector('.docs-theme-toggle')?.textContent).toBe(
      'Dark'
    );
    expect(
      document.querySelector('.docs-theme-toggle')?.getAttribute('aria-label')
    ).toBe('Toggle documentation theme');
    expect(
      document.querySelector<HTMLSelectElement>('.docs-locale-select')?.value
    ).toBe('en');
    expect(
      document.querySelector('.docs-locale-select')?.getAttribute('aria-label')
    ).toBe('Documentation language');
  });

  it('keeps docs widget apps safe when their mount roots are absent', () => {
    const catalog = docCatalogs.en;

    createDocsSearchApp(catalog.searchEntries, catalog.config.messages).mount();
    createDocsThemeApp(catalog.config.messages).mount();
    createDocsLocaleApp(
      catalog.locale,
      '/api/app/',
      catalog.config.messages
    ).mount();

    expect(document.body.textContent).toBe('');
  });

  it('keeps Chinese documentation rendering and widgets compatible', () => {
    const catalog = docCatalogs.zh;
    const page = catalog.pages.find((item) => item.path === '/api/app/');
    if (!page) throw new Error('Missing Chinese App API page');
    const html = createDocsPageApp(
      'zh',
      page,
      catalog.pages
    ).renderHtmlDocument();

    expect(html).toContain('<html lang="zh-CN">');
    expect(html).toContain('href="/"');
    expect(html).toContain('>名称</th>');

    document.body.innerHTML = [
      '<div data-doc-search-root></div>',
      '<div data-doc-theme-root></div>',
      '<div data-doc-locale-root></div>',
    ].join('');
    mountDocsClient();

    expect(
      document.querySelector('[type="search"]')?.getAttribute('placeholder')
    ).toBe('搜索文档');
    expect(document.querySelector('.docs-theme-toggle')?.textContent).toBe(
      '深色'
    );
    expect(
      document.querySelector<HTMLSelectElement>('.docs-locale-select')?.value
    ).toBe('zh');
  });
});
