import { describe, expect, it } from 'bun:test';
import {
  docCatalogs,
  docPages,
  findDocPage,
  findLocalizedDocPage,
  getDocCatalog,
  searchEntries,
  zhDocPages,
} from '../docs/app/content';
import {
  codeBlock,
  callout,
  docText,
  heading,
  inlineCode,
  link,
  normalizeDocPath,
  paragraph,
  list,
  sortDocPages,
  validateDocPages,
  type DocPage,
} from '../docs/app/content/types';

describe('docs content model', () => {
  it('normalizes documentation paths for directory-style MPA output', () => {
    expect(normalizeDocPath('/')).toBe('/');
    expect(normalizeDocPath('guide/getting-started')).toBe(
      '/guide/getting-started/'
    );
    expect(normalizeDocPath('/api/component.md')).toBe('/api/component/');
  });

  it('sorts pages by section order and page order', () => {
    const pages: DocPage[] = [
      {
        path: '/api/router/',
        title: 'Router',
        description: 'Router API',
        section: 'API',
        sectionOrder: 3,
        order: 2,
        body: [heading(1, 'Router')],
      },
      {
        path: '/',
        title: 'TSone',
        description: 'Home',
        section: 'Guide',
        sectionOrder: 1,
        order: 0,
        body: [heading(1, 'TSone')],
      },
      {
        path: '/guide/getting-started/',
        title: 'Getting Started',
        description: 'Start using TSone',
        section: 'Guide',
        sectionOrder: 1,
        order: 1,
        body: [heading(1, 'Getting Started')],
      },
    ];

    expect(sortDocPages(pages).map((page) => page.path)).toEqual([
      '/',
      '/guide/getting-started/',
      '/api/router/',
    ]);
  });

  it('rejects duplicate routes and pages without readable content', () => {
    const duplicatePages: DocPage[] = [
      {
        path: '/api/router/',
        title: 'Router',
        description: 'Router API',
        section: 'API',
        sectionOrder: 3,
        order: 1,
        body: [heading(1, 'Router')],
      },
      {
        path: '/api/router',
        title: 'Router Duplicate',
        description: 'Duplicate route',
        section: 'API',
        sectionOrder: 3,
        order: 2,
        body: [paragraph('Duplicate')],
      },
    ];

    expect(() => validateDocPages(duplicatePages)).toThrow(
      'Duplicate documentation route: /api/router/'
    );

    expect(() =>
      validateDocPages([
        {
          path: '/empty/',
          title: 'Empty',
          description: 'Empty page',
          section: 'Guide',
          sectionOrder: 1,
          order: 1,
          body: [],
        },
      ])
    ).toThrow('Documentation page has no content: /empty/');

    expect(() =>
      validateDocPages([
        {
          path: '/blank-content/',
          title: 'Blank Content',
          description: 'Body has only blank structured blocks',
          section: 'Guide',
          sectionOrder: 1,
          order: 1,
          body: [
            paragraph('   '),
            list([['   ']]),
            callout('note', '   ', ['   ']),
            codeBlock('ts', '   '),
          ],
        },
      ])
    ).toThrow('Documentation page has no content: /blank-content/');
  });

  it('rejects empty and whitespace-only documentation paths', () => {
    const basePage: DocPage = {
      path: '/valid/',
      title: 'Valid',
      description: 'Valid description',
      section: 'Guide',
      sectionOrder: 1,
      order: 1,
      body: [paragraph('Has content')],
    };

    expect(() =>
      validateDocPages([
        {
          ...basePage,
          path: '',
        },
      ])
    ).toThrow('Documentation page has no path');

    expect(() =>
      validateDocPages([
        {
          ...basePage,
          path: '   ',
        },
      ])
    ).toThrow('Documentation page has no path');
  });

  it('rejects malformed non-empty documentation paths', () => {
    const basePage: DocPage = {
      path: '/valid/',
      title: 'Valid',
      description: 'Valid description',
      section: 'Guide',
      sectionOrder: 1,
      order: 1,
      body: [paragraph('Has content')],
    };

    expect(() =>
      validateDocPages([
        {
          ...basePage,
          path: ' /guide',
        },
      ])
    ).toThrow('Invalid documentation route:  /guide');

    expect(() =>
      validateDocPages([
        {
          ...basePage,
          path: '///',
        },
      ])
    ).toThrow('Invalid documentation route: ///');

    expect(() =>
      validateDocPages([
        {
          ...basePage,
          path: '///guide',
        },
      ])
    ).toThrow('Invalid documentation route: ///guide');

    expect(() =>
      validateDocPages([
        {
          ...basePage,
          path: 'guide///',
        },
      ])
    ).toThrow('Invalid documentation route: guide///');
  });

  it('extracts plain text from structured docs content', () => {
    const page: DocPage = {
      path: '/guide/getting-started/',
      title: 'Getting Started',
      description: 'Start using TSone',
      section: 'Guide',
      sectionOrder: 1,
      order: 1,
      body: [
        heading(1, 'Getting Started'),
        paragraph('Install ', inlineCode('@geektech/tsone'), ' with Bun.'),
        paragraph('Read the ', link('router guide', '/guide/router-system/')),
        codeBlock('ts', "import { createApp } from '@geektech/tsone';"),
      ],
    };

    expect(docText(page)).toContain('Getting Started');
    expect(docText(page)).toContain('@geektech/tsone');
    expect(docText(page)).toContain('router guide');
    expect(docText(page)).toContain('createApp');
  });
});

describe('docs content registry', () => {
  it('keeps complete HTML document shells out of typed guide code blocks', () => {
    const completeHtmlDocument =
      /<!doctype html>[\s\S]*<html(?:\s[^>]*)?>[\s\S]*<\/html>/iu;

    for (const catalog of Object.values(docCatalogs)) {
      for (const page of catalog.pages) {
        for (const block of page.body) {
          if (block.type === 'code') {
            expect(block.code).not.toMatch(completeHtmlDocument);
          }
        }
      }
    }
  });

  it('keeps Chinese as the default compatibility catalog', () => {
    expect(zhDocPages).toBe(docPages);
    expect(docPages).toBe(docCatalogs.zh.pages);
    expect(searchEntries).toBe(docCatalogs.zh.searchEntries);
    expect(getDocCatalog('zh')).toBe(docCatalogs.zh);
    expect(findDocPage('/guide/getting-started/')?.title).toBe('快速开始');
    expect(searchEntries.some((entry) => entry.text.includes('快速开始'))).toBe(
      true
    );
  });

  it('contains every migrated documentation route in stable order', () => {
    expect(docPages.map((page) => page.path)).toEqual([
      '/',
      '/guide/getting-started/',
      '/guide/core-concepts/',
      '/guide/component-system/',
      '/guide/reactive-system/',
      '/guide/router-system/',
      '/guide/style-management/',
      '/api/app/',
      '/api/component/',
      '/api/reactive/',
      '/api/router/',
      '/api/style/',
      '/examples/basic/',
      '/contributing/',
      '/benchmark/framework-comparison/',
    ]);
  });

  it('keeps public API terms searchable from typed docs content', () => {
    const allText = searchEntries.map((entry) => entry.text).join('\n');
    const englishText = docCatalogs.en.searchEntries
      .map((entry) => entry.text)
      .join('\n');

    for (const term of [
      '@geektech/tsone',
      '@geektech/tsone-cli',
      'createapp',
      'component<props, state>',
      'protected render(): vnode',
      'routerview',
      'routerlink',
      'stylemanager',
      'tsone.config.ts',
      'server.proxy',
      'tsone dev',
      'tsone build',
      'defineconfig',
      'resolveconfig',
      'startdevserver',
      'bun run docs',
      'bun run docs:build',
    ]) {
      expect(allText).toContain(term);
      expect(englishText).toContain(term);
    }
  });

  it('finds pages by normalized route', () => {
    expect(findDocPage('/api/component')?.title).toBe('Component API');
    expect(findDocPage('/guide/getting-started/')?.title).toBe('快速开始');
    expect(findDocPage('/missing/')).toBeUndefined();
  });

  it('keeps contributing guidance aligned with the typed content registry', () => {
    const contributing = findLocalizedDocPage('zh', '/contributing/');
    const englishContributing = findLocalizedDocPage('en', '/contributing/');

    if (!contributing || !englishContributing) {
      throw new Error('Missing bilingual contributing documentation page');
    }

    const chineseText = docText(contributing);
    const englishText = docText(englishContributing);

    expect(docCatalogs.zh.pages).toHaveLength(15);
    expect(docCatalogs.en.pages).toHaveLength(15);
    expect(chineseText).not.toContain('Markdown 格式');
    expect(chineseText).not.toContain(
      'https://github.com/yourusername/tsone.git'
    );
    expect(chineseText).toContain('packages/tsone/docs/app/content/zh/');
    expect(chineseText).toContain('packages/tsone/docs/app/content/en/');
    expect(chineseText).toContain('中英文 catalog 当前各包含 15 条逻辑路由');
    expect(chineseText).toContain('新增或删除路由时必须同步修改两边');
    expect(chineseText).toContain('中英文逻辑路由必须一致');
    expect(chineseText).toContain('不要手写 /en/');
    expect(chineseText).toContain('缺失、多余、重复、空内容或混用语言');
    expect(englishText).toContain('packages/tsone/docs/app/content/en/');
    expect(englishText).toContain('packages/tsone/docs/app/content/zh/');
    expect(englishText).toContain(
      'Chinese and English catalogs each contain exactly 15 logical routes'
    );
    expect(englishText).toContain(
      'add or remove a route in both catalogs in the same change'
    );
    expect(englishText).toContain('same logical route');
    expect(englishText).toContain('never write /en/ manually');
    expect(englishText).toContain(
      'missing, extra, duplicate, empty, or mixed-language pages'
    );
  });

  it('includes complete form and list examples without truncation', () => {
    const example = findDocPage('/examples/basic/');

    if (!example) {
      throw new Error('Missing basic examples documentation page');
    }

    const text = docText(example);

    expect(text).not.toContain('...表单字段省略...');
    expect(text).toContain("children: ['Submit']");
    expect(text).toContain("props: { htmlFor: 'name' }");
    expect(text).toContain("props: { htmlFor: 'email' }");
    expect(text).toContain("props: { htmlFor: 'message' }");
    expect(text).toContain('this.state.items.map((item, index) => ({');
    expect(text).toContain("children: ['Remove']");
    expect(text).toContain("children: ['Add']");
  });
});
