import { describe, expect, it } from 'bun:test';
import {
  CLI_DOC_DEFAULT_LOCALE,
  CLI_DOC_LOCALES,
  cliDocPages,
  headingsForPage,
  localize,
  normalizeCliDocPath,
} from '../docs/app/content';

describe('TSone CLI docs content', () => {
  it('defines exactly the six approved routes in stable order', () => {
    expect(cliDocPages.map((page) => page.path)).toEqual([
      '/',
      '/getting-started/',
      '/commands/',
      '/config/',
      '/proxy/',
      '/api/',
    ]);
    expect(CLI_DOC_LOCALES).toEqual(['zh', 'en']);
    expect(CLI_DOC_DEFAULT_LOCALE).toBe('zh');
  });

  it('normalizes supported routes and rejects malformed routes', () => {
    expect(normalizeCliDocPath('/')).toBe('/');
    expect(normalizeCliDocPath('commands')).toBe('/commands/');
    expect(normalizeCliDocPath('/getting-started.md')).toBe(
      '/getting-started/'
    );
    expect(() => normalizeCliDocPath('/UPPER/')).toThrow(
      'Invalid TSone CLI documentation route'
    );
    expect(() => normalizeCliDocPath('/has space/')).toThrow(
      'Invalid TSone CLI documentation route'
    );
  });

  it('rejects duplicate routes and incomplete page records', async () => {
    const { validateCliDocPages } = await import('../docs/app/content/types');
    const duplicate = cliDocPages.map((page) => ({ ...page }));
    duplicate.push({ ...cliDocPages[0] });

    expect(() => validateCliDocPages(duplicate)).toThrow(
      'Duplicate TSone CLI documentation route: /'
    );

    expect(() =>
      validateCliDocPages([
        {
          ...cliDocPages[0],
          title: { zh: ' ', en: ' ' },
        },
      ])
    ).toThrow('TSone CLI documentation page has no title');

    expect(() =>
      validateCliDocPages([
        {
          ...cliDocPages[0],
          body: [],
        },
      ])
    ).toThrow('TSone CLI documentation page has no content');
  });

  it('keeps heading ids unique per page', () => {
    cliDocPages.forEach((page) => {
      const ids = headingsForPage(page).map((heading) => heading.id);
      expect(new Set(ids).size).toBe(ids.length);
    });
  });

  it('localizes titles and descriptions for both locales', () => {
    cliDocPages.forEach((page) => {
      expect(localize(page.title, 'zh').trim().length).toBeGreaterThan(0);
      expect(localize(page.title, 'en').trim().length).toBeGreaterThan(0);
      expect(
        localize(page.description, 'zh').trim().length
      ).toBeGreaterThan(0);
      expect(
        localize(page.description, 'en').trim().length
      ).toBeGreaterThan(0);
    });
  });

  it('covers the required CLI topics with exported APIs', () => {
    const allText = cliDocPages
      .map((page) => localize(page.title, 'zh') + localize(page.description, 'zh'))
      .join('\n');

    expect(allText).toContain('快速开始');
    expect(allText).toContain('命令');
    expect(allText).toContain('配置');
    expect(allText).toContain('代理');
    expect(allText).toContain('编程式 API');
  });
});
