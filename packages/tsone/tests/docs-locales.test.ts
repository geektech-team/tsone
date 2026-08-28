import { describe, expect, it } from 'bun:test';
import { enGuidePages } from '../docs/app/content/en/guide';
import { enHomePages } from '../docs/app/content/en/home';
import {
  DOC_LOCALE_CONFIGS,
  localizeDocHref,
  localizeDocPath,
  parseLocalizedDocPath,
  resolvePreferredDocLocale,
  switchDocLocale,
} from '../docs/app/content/locales';
import { docText, validateDocPages } from '../docs/app/content/types';

describe('docs locales', () => {
  it('maps logical routes to Chinese and English public routes', () => {
    expect(localizeDocPath('zh', '/')).toBe('/');
    expect(localizeDocPath('en', '/')).toBe('/en/');
    expect(localizeDocPath('zh', '/api/app/')).toBe('/api/app/');
    expect(localizeDocPath('en', '/api/app/')).toBe('/en/api/app/');
  });

  it('parses and switches localized routes without changing the logical page', () => {
    expect(parseLocalizedDocPath('/en/api/app/')).toEqual({
      locale: 'en',
      logicalPath: '/api/app/',
    });
    expect(parseLocalizedDocPath('/guide/getting-started/')).toEqual({
      locale: 'zh',
      logicalPath: '/guide/getting-started/',
    });
    expect(switchDocLocale('/en/api/app/', 'zh')).toBe('/api/app/');
    expect(switchDocLocale('/api/app/', 'en')).toBe('/en/api/app/');
  });

  it('localizes only internal documentation links', () => {
    expect(localizeDocHref('en', '/guide/router-system/')).toBe(
      '/en/guide/router-system/'
    );
    expect(localizeDocHref('en', '#routes')).toBe('#routes');
    expect(localizeDocHref('en', 'https://example.com')).toBe(
      'https://example.com'
    );
  });

  it('prefers stored locale, then browser language, then Chinese', () => {
    expect(resolvePreferredDocLocale('en', ['zh-CN'])).toBe('en');
    expect(resolvePreferredDocLocale(undefined, ['zh-CN', 'en-US'])).toBe('zh');
    expect(resolvePreferredDocLocale(undefined, ['en-US'])).toBe('en');
    expect(resolvePreferredDocLocale('invalid', [])).toBe('zh');
  });

  it('defines complete UI messages for both locales', () => {
    expect(Object.keys(DOC_LOCALE_CONFIGS)).toEqual(['zh', 'en']);
    for (const config of Object.values(DOC_LOCALE_CONFIGS)) {
      expect(Object.values(config.messages).every(Boolean)).toBe(true);
    }
  });

  it('provides complete English home and guide content', () => {
    const pages = validateDocPages([...enHomePages, ...enGuidePages]);
    expect(pages.map((page) => page.path)).toEqual([
      '/',
      '/guide/getting-started/',
      '/guide/core-concepts/',
      '/guide/component-system/',
      '/guide/reactive-system/',
      '/guide/router-system/',
      '/guide/style-management/',
    ]);
    expect(pages.map(docText).join('\n')).not.toMatch(/[\u3400-\u9fff]/u);
    expect(
      pages.find((page) => page.path === '/guide/getting-started/')?.title
    ).toBe('Getting Started');
  });
});
