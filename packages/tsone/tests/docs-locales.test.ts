import { describe, expect, it } from 'bun:test';
import { enGuidePages } from '../docs/app/content/en/guide';
import { enHomePages } from '../docs/app/content/en/home';
import { guidePages as zhGuidePages } from '../docs/app/content/zh/guide';
import { homePages } from '../docs/app/content/zh/home';
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

  it('preserves the Chinese catalog structure in English content', () => {
    const chinesePages = validateDocPages([...homePages, ...zhGuidePages]);
    const englishPages = validateDocPages([...enHomePages, ...enGuidePages]);

    expect(
      englishPages.map(({ path, sectionOrder, order }) => ({
        path,
        sectionOrder,
        order,
      }))
    ).toEqual(
      chinesePages.map(({ path, sectionOrder, order }) => ({
        path,
        sectionOrder,
        order,
      }))
    );
    expect(englishPages.map((page) => page.body.length)).toEqual(
      chinesePages.map((page) => page.body.length)
    );
    expect(englishPages.map((page) => page.body.map((block) => block.type))).toEqual(
      chinesePages.map((page) => page.body.map((block) => block.type))
    );
  });

  it('preserves logical links and executable examples in English content', () => {
    const chinesePages = [...homePages, ...zhGuidePages];
    const englishPages = [...enHomePages, ...enGuidePages];
    const collectInlineLinks = (content: unknown[]): string[] =>
      content
        .filter(
          (item) =>
            item !== null &&
            typeof item === 'object' &&
            'type' in item &&
            item.type === 'link'
        )
        .map((item) => (item as { href: string }).href);
    const collectLinks = (pages: typeof englishPages): string[] =>
      pages.flatMap((page) =>
        page.body.flatMap((block) => {
          if (block.type === 'paragraph') {
            return collectInlineLinks(block.content);
          }

          if (block.type === 'callout') {
            return collectInlineLinks(block.body);
          }

          if (block.type === 'list') {
            return block.items.flatMap(collectInlineLinks);
          }

          return [];
        })
      );
    const collectCode = (pages: typeof englishPages): string[] =>
      pages.flatMap((page) =>
        page.body
          .filter((block) => block.type === 'code')
          .map((block) => block.code)
      );
    const collectImports = (pages: typeof englishPages): string[] =>
      collectCode(pages).flatMap((code) =>
        code.split('\n').filter((line) => line.startsWith('import '))
      );
    const collectBunCommands = (pages: typeof englishPages): string[] =>
      collectCode(pages).filter((code) => code.startsWith('bun '));

    expect(collectLinks(englishPages)).toEqual(collectLinks(chinesePages));
    expect(collectImports(englishPages)).toEqual(collectImports(chinesePages));
    expect(collectBunCommands(englishPages)).toEqual(
      collectBunCommands(chinesePages)
    );
    const englishExamples = collectCode(englishPages).join('\n');
    expect(englishExamples).not.toContain('lang="zh-CN"');
    expect(englishExamples).toContain('lang="en"');
  });
});
