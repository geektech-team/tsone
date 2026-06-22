import { describe, expect, it } from 'bun:test';
import {
  codeBlock,
  docText,
  heading,
  inlineCode,
  link,
  normalizeDocPath,
  paragraph,
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
