import { describe, expect, it } from 'bun:test';
import { enApiPages } from '../docs/app/content/en/api';
import { enGuidePages } from '../docs/app/content/en/guide';
import { enHomePages } from '../docs/app/content/en/home';
import { apiPages as zhApiPages } from '../docs/app/content/zh/api';
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
import {
  docText,
  validateDocPages,
  type DocInline,
  type DocPage,
} from '../docs/app/content/types';

function collectDocLinks(pages: DocPage[]): string[] {
  const collectInlineLinks = (content: DocInline[]): string[] =>
    content.flatMap((item) =>
      typeof item !== 'string' && item.type === 'link' ? [item.href] : []
    );

  return pages.flatMap((page) =>
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
}

function collectTypeScriptContractLines(pages: DocPage[]): string[] {
  const contractLine =
    /^(?:abstract class |class |interface |protected |(?:root|rootProps|rootElement|state|config|document|routes|mode|base|path|component|name|meta)\??:)/;

  return pages.flatMap((page) =>
    page.body.flatMap((block) =>
      block.type === 'code' && block.language === 'ts'
        ? block.code
            .split('\n')
            .map((line) => line.trim())
            .filter((line) => contractLine.test(line))
        : []
    )
  );
}

function apiPageStructure(pages: DocPage[]) {
  return pages.map((page) => ({
    path: page.path,
    sectionOrder: page.sectionOrder,
    order: page.order,
    blocks: page.body.map((block) => {
      switch (block.type) {
        case 'heading':
          return { type: block.type, level: block.level };
        case 'paragraph':
          return {
            type: block.type,
            inlineTypes: block.content.map((item) =>
              typeof item === 'string' ? 'text' : item.type
            ),
          };
        case 'list':
          return {
            type: block.type,
            items: block.items.map((item) =>
              item.map((part) =>
                typeof part === 'string' ? 'text' : part.type
              )
            ),
          };
        case 'code':
          return {
            type: block.type,
            language: block.language,
            lineCount: block.code.split('\n').length,
            imports: block.code
              .split('\n')
              .filter((line) => line.startsWith('import ')),
          };
        case 'callout':
          return {
            type: block.type,
            kind: block.kind,
            inlineTypes: block.body.map((item) =>
              typeof item === 'string' ? 'text' : item.type
            ),
          };
        case 'api-table':
          return {
            type: block.type,
            rows: block.rows.map(({ name, signature }) => ({
              name,
              signature,
            })),
          };
      }
    }),
  }));
}

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

  it('provides complete English API content', () => {
    const pages = validateDocPages(enApiPages);
    expect(pages.map((page) => page.path)).toEqual([
      '/api/app/',
      '/api/component/',
      '/api/reactive/',
      '/api/router/',
      '/api/style/',
    ]);
    expect(pages.map((page) => page.title)).toEqual([
      'App API',
      'Component API',
      'Reactive API',
      'Router API',
      'Style API',
    ]);

    const text = pages.map(docText).join('\n');
    expect(text).not.toMatch(/[\u3400-\u9fff]/u);
    for (const symbol of [
      'createApp',
      'Component<Props, State>',
      'reactive',
      'RouterView',
      'StyleManager',
      'VNode',
    ]) {
      expect(text).toContain(symbol);
    }
  });

  it('preserves the Chinese API catalog structure and technical contracts', () => {
    const chinesePages = validateDocPages(zhApiPages);
    const englishPages = validateDocPages(enApiPages);

    expect(apiPageStructure(englishPages)).toEqual(
      apiPageStructure(chinesePages)
    );
    expect(collectDocLinks(englishPages)).toEqual(
      collectDocLinks(chinesePages)
    );
    expect(collectTypeScriptContractLines(englishPages)).toEqual(
      collectTypeScriptContractLines(chinesePages)
    );
    expect(englishPages.every((page) => !page.path.startsWith('/en/'))).toBe(
      true
    );
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
    expect(
      englishPages.map((page) => page.body.map((block) => block.type))
    ).toEqual(chinesePages.map((page) => page.body.map((block) => block.type)));
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
