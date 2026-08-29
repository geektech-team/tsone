import { describe, expect, it } from 'bun:test';
import { enApiPages } from '../docs/app/content/en/api';
import { enContributingPages } from '../docs/app/content/en/contributing';
import { enExamplePages } from '../docs/app/content/en/examples';
import { enGuidePages } from '../docs/app/content/en/guide';
import { enHomePages } from '../docs/app/content/en/home';
import {
  docCatalogs,
  findLocalizedDocPage,
  getDocCatalog,
} from '../docs/app/content';
import {
  createDocCatalog,
  validateDocCatalogParity,
} from '../docs/app/content/catalog';
import { apiPages as zhApiPages } from '../docs/app/content/zh/api';
import { contributingPages as zhContributingPages } from '../docs/app/content/zh/contributing';
import { examplePages as zhExamplePages } from '../docs/app/content/zh/examples';
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

function docPageStructure(pages: DocPage[]) {
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
            commands: block.code
              .split('\n')
              .map((line) => line.trim())
              .filter((line) => /^(?:bun|cd|git)\b/u.test(line))
              .map((line) =>
                line.startsWith('git commit -m ')
                  ? 'git commit -m "<message>"'
                  : line
              ),
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

function collectCodeBlocks(pages: DocPage[]) {
  return pages.flatMap((page) =>
    page.body.filter((block) => block.type === 'code')
  );
}

function collectHeadings(pages: DocPage[]) {
  return pages.flatMap((page) =>
    page.body
      .filter((block) => block.type === 'heading')
      .map((block) => ({ level: block.level, text: block.text }))
  );
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

  it('uses the first non-empty browser language', () => {
    expect(resolvePreferredDocLocale(undefined, ['en-US', 'zh-CN'])).toBe('en');
    expect(resolvePreferredDocLocale(undefined, ['zh-CN', 'en-US'])).toBe('zh');
    expect(resolvePreferredDocLocale(undefined, ['fr-FR'])).toBe('en');
    expect(resolvePreferredDocLocale(undefined, ['de-DE'])).toBe('en');
    expect(resolvePreferredDocLocale(undefined, [])).toBe('zh');
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

  it('preserves the complete English examples page structure and code', () => {
    const chinesePages = validateDocPages(zhExamplePages);
    const englishPages = validateDocPages(enExamplePages);
    const chineseCodeBlocks = collectCodeBlocks(chinesePages);
    const englishCodeBlocks = collectCodeBlocks(englishPages);
    const englishDescription = englishPages[0]?.description ?? '';

    expect(
      englishPages.map(({ title, description, section }) => ({
        title,
        description,
        section,
      }))
    ).toEqual([
      {
        title: 'Basic Examples',
        description:
          'Basic examples covering Hello World, a counter, form handling, and list rendering.',
        section: 'Examples',
      },
    ]);
    expect(englishDescription.trim()).not.toBe('');
    expect(englishDescription).not.toMatch(/[\u3400-\u9fff]/u);
    expect(docPageStructure(englishPages)).toEqual(
      docPageStructure(chinesePages)
    );
    expect(collectDocLinks(englishPages)).toEqual(
      collectDocLinks(chinesePages)
    );
    expect(collectHeadings(englishPages)).toEqual([
      { level: 1, text: 'Basic Examples' },
      { level: 2, text: 'Hello World' },
      { level: 2, text: 'Counter' },
      { level: 2, text: 'Form Handling' },
      { level: 2, text: 'List Rendering' },
      { level: 2, text: 'Summary' },
    ]);
    expect(
      englishCodeBlocks.map((block) => ({
        language: block.language,
        lineCount: block.code.split('\n').length,
        imports: block.code
          .split('\n')
          .filter((line) => line.startsWith('import ')),
      }))
    ).toEqual([
      {
        language: 'ts',
        lineCount: 34,
        imports: ["import { createApp, Component } from '@geektech/tsone';"],
      },
      {
        language: 'ts',
        lineCount: 77,
        imports: ["import { createApp, Component } from '@geektech/tsone';"],
      },
      {
        language: 'ts',
        lineCount: 176,
        imports: ["import { createApp, Component } from '@geektech/tsone';"],
      },
      {
        language: 'ts',
        lineCount: 153,
        imports: ["import { createApp, Component } from '@geektech/tsone';"],
      },
    ]);
    expect(englishCodeBlocks.map((block) => block.code)).toEqual(
      chineseCodeBlocks.map((block) => block.code)
    );
    expect(englishPages.map(docText).join('\n')).not.toMatch(
      /[\u3400-\u9fff]/u
    );
  });

  it('preserves every English contributing section and command', () => {
    const chinesePages = validateDocPages(zhContributingPages);
    const englishPages = validateDocPages(enContributingPages);
    const englishCodeBlocks = collectCodeBlocks(englishPages);
    const englishDescription = englishPages[0]?.description ?? '';

    expect(
      englishPages.map(({ title, description, section }) => ({
        title,
        description,
        section,
      }))
    ).toEqual([
      {
        title: 'Contributing',
        description:
          'Learn the Bun-first development workflow, coding standards, commit conventions, and documentation maintenance process.',
        section: 'Contributing',
      },
    ]);
    expect(englishDescription.trim()).not.toBe('');
    expect(englishDescription).not.toMatch(/[\u3400-\u9fff]/u);
    expect(docPageStructure(englishPages)).toEqual(
      docPageStructure(chinesePages)
    );
    expect(collectDocLinks(englishPages)).toEqual(
      collectDocLinks(chinesePages)
    );
    expect(collectHeadings(englishPages)).toEqual([
      { level: 1, text: 'Contributing' },
      { level: 2, text: 'Development Environment' },
      { level: 3, text: 'Clone the Repository' },
      { level: 3, text: 'Install Dependencies' },
      { level: 3, text: 'Run the Development Server' },
      { level: 3, text: 'Build the Project' },
      { level: 3, text: 'Run Linting' },
      { level: 2, text: 'Coding Standards' },
      { level: 3, text: 'TypeScript' },
      { level: 3, text: 'Code Style' },
      { level: 3, text: 'Naming Conventions' },
      { level: 2, text: 'Commit Conventions' },
      { level: 3, text: 'Commit Message Format' },
      { level: 3, text: 'Types' },
      { level: 3, text: 'Examples' },
      { level: 2, text: 'Development Workflow' },
      { level: 3, text: '1. Create a Branch' },
      { level: 3, text: '2. Develop the Feature' },
      { level: 3, text: '3. Commit Your Changes' },
      { level: 3, text: '4. Push the Branch' },
      { level: 3, text: '5. Create a Pull Request' },
      { level: 2, text: 'Testing' },
      { level: 3, text: 'Write Tests' },
      { level: 3, text: 'Test Coverage' },
      { level: 2, text: 'Documentation' },
      { level: 3, text: 'Update Documentation' },
      { level: 3, text: 'Documentation Commands' },
      { level: 3, text: 'Documentation Maintenance' },
      { level: 2, text: 'Issue Reports' },
      { level: 3, text: 'Bug Reports' },
      { level: 3, text: 'Feature Requests' },
      { level: 2, text: 'Code of Conduct' },
      { level: 2, text: 'Communication Channels' },
      { level: 2, text: 'License' },
      { level: 2, text: 'Thank You' },
    ]);
    expect(
      englishCodeBlocks.map((block) => ({
        language: block.language,
        lineCount: block.code.split('\n').length,
        code: block.code,
      }))
    ).toEqual([
      {
        language: 'bash',
        lineCount: 2,
        code: 'git clone https://github.com/geektech/tsone.git\ncd tsone',
      },
      { language: 'bash', lineCount: 1, code: 'bun install' },
      { language: 'bash', lineCount: 1, code: 'bun run dev' },
      { language: 'bash', lineCount: 1, code: 'bun run build' },
      { language: 'bash', lineCount: 1, code: 'bun run lint' },
      {
        language: 'text',
        lineCount: 5,
        code: [
          '<type>[optional scope]: <description>',
          '',
          '[optional body]',
          '',
          '[optional footer(s)]',
        ].join('\n'),
      },
      {
        language: 'text',
        lineCount: 5,
        code: [
          'feat(router): improve routing capabilities',
          '',
          'fix(core): fix a memory leak in the reactivity system',
          '',
          'docs: update the Component API documentation',
        ].join('\n'),
      },
      {
        language: 'bash',
        lineCount: 1,
        code: 'git checkout -b feature/your-feature-name',
      },
      {
        language: 'bash',
        lineCount: 2,
        code: 'git add .\ngit commit -m "feat: describe your feature"',
      },
      {
        language: 'bash',
        lineCount: 1,
        code: 'git push origin feature/your-feature-name',
      },
      { language: 'bash', lineCount: 1, code: 'bun test' },
      {
        language: 'bash',
        lineCount: 2,
        code: 'bun run docs\nbun run docs:build',
      },
    ]);
    expect(englishPages.map(docText).join('\n')).not.toMatch(
      /[\u3400-\u9fff]/u
    );
  });

  it('keeps Chinese and English catalogs in strict route parity', () => {
    expect(docCatalogs.zh.pages).toHaveLength(14);
    expect(docCatalogs.en.pages).toHaveLength(14);
    expect(docCatalogs.en.pages.map((page) => page.path)).toEqual(
      docCatalogs.zh.pages.map((page) => page.path)
    );
    expect(findLocalizedDocPage('en', '/guide/getting-started/')?.title).toBe(
      'Getting Started'
    );
    expect(findLocalizedDocPage('zh', '/guide/getting-started/')?.title).toBe(
      '快速开始'
    );
    expect(findLocalizedDocPage('en', '/missing/')).toBeUndefined();
    expect(getDocCatalog('zh')).toBe(docCatalogs.zh);
    expect(getDocCatalog('en')).toBe(docCatalogs.en);
  });

  it('rejects missing and extra localized routes in both directions', () => {
    const reference = createDocCatalog('zh', docCatalogs.zh.pages.slice(0, 2));
    const missing = createDocCatalog('en', docCatalogs.en.pages.slice(0, 1));
    const extra = createDocCatalog('en', docCatalogs.en.pages.slice(0, 3));

    expect(() => validateDocCatalogParity(reference, missing)).toThrow(
      'Locale en is missing documentation route: /guide/getting-started/'
    );
    expect(() => validateDocCatalogParity(reference, extra)).toThrow(
      'Locale en has extra documentation route: /guide/core-concepts/'
    );
  });

  it('keeps localized search entries isolated from logical page routes', () => {
    expect(docCatalogs.zh.pages[0].path).toBe('/');
    expect(docCatalogs.en.pages[0].path).toBe('/');
    expect(docCatalogs.zh.searchEntries[0].path).toBe('/');
    expect(docCatalogs.en.searchEntries[0].path).toBe('/en/');
    expect(
      docCatalogs.en.searchEntries.map((entry) => entry.text).join('\n')
    ).not.toMatch(/[\u3400-\u9fff]/u);
    expect(
      docCatalogs.zh.searchEntries.map((entry) => entry.text).join('\n')
    ).toMatch(/[\u3400-\u9fff]/u);
  });

  it('rejects Chinese content and preserves base page validation errors', () => {
    const englishPage: DocPage = {
      path: '/test/',
      title: 'Test',
      description: 'Test page',
      section: 'Guide',
      sectionOrder: 1,
      order: 1,
      body: [{ type: 'paragraph', content: ['English with 中文'] }],
    };

    expect(() => createDocCatalog('en', [englishPage])).toThrow(
      'Locale en contains Chinese content: /test/'
    );
    expect(() => createDocCatalog('zh', [englishPage, englishPage])).toThrow(
      'Duplicate documentation route: /test/'
    );
    expect(() =>
      createDocCatalog('zh', [{ ...englishPage, body: [] }])
    ).toThrow('Documentation page has no content: /test/');
  });

  it('preserves the Chinese API catalog structure and technical contracts', () => {
    const chinesePages = validateDocPages(zhApiPages);
    const englishPages = validateDocPages(enApiPages);

    expect(docPageStructure(englishPages)).toEqual(
      docPageStructure(chinesePages)
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
