import { describe, expect, it } from 'bun:test';
import {
  runDocsLocaleBootstrap,
  type LocaleBootstrapEnvironment,
} from '../docs/app/locale-bootstrap';
import { readNavigatorLanguages } from '../docs/app/locale-bootstrap-entry';

function environment(overrides: Partial<LocaleBootstrapEnvironment> = {}): {
  replacements: string[];
  value: LocaleBootstrapEnvironment;
} {
  const replacements: string[] = [];
  return {
    replacements,
    value: {
      pathname: '/',
      storage: undefined,
      languages: [],
      replace: (href: string) => replacements.push(href),
      ...overrides,
    },
  };
}

describe('docs locale bootstrap', () => {
  it('redirects the root using stored English preference', () => {
    const test = environment({
      storage: { getItem: () => 'en' },
      languages: ['zh-CN'],
    });
    runDocsLocaleBootstrap(test.value);
    expect(test.replacements).toEqual(['/en/']);
  });

  it('uses browser language when storage throws', () => {
    const test = environment({
      storage: {
        getItem: () => {
          throw new Error('blocked');
        },
      },
      languages: ['en-US'],
    });
    runDocsLocaleBootstrap(test.value);
    expect(test.replacements).toEqual(['/en/']);
  });

  it('ignores an invalid stored locale', () => {
    const test = environment({
      storage: { getItem: () => 'fr' },
      languages: ['en-US'],
    });
    runDocsLocaleBootstrap(test.value);
    expect(test.replacements).toEqual(['/en/']);
  });

  it('uses browser language when reading storage throws', () => {
    const test = environment({ languages: ['en-US'] });
    Object.defineProperty(test.value, 'storage', {
      get() {
        throw new Error('blocked');
      },
    });
    runDocsLocaleBootstrap(test.value);
    expect(test.replacements).toEqual(['/en/']);
  });

  it('redirects for a preferred English browser language', () => {
    const test = environment({ languages: ['en-US', 'zh-CN'] });
    runDocsLocaleBootstrap(test.value);
    expect(test.replacements).toEqual(['/en/']);
  });

  it('redirects for a non-Chinese browser language', () => {
    const test = environment({ languages: ['fr-FR'] });
    runDocsLocaleBootstrap(test.value);
    expect(test.replacements).toEqual(['/en/']);
  });

  it('does not rewrite explicit content paths', () => {
    const test = environment({
      pathname: '/guide/getting-started/',
      languages: ['en-US'],
    });
    runDocsLocaleBootstrap(test.value);
    expect(test.replacements).toEqual([]);
  });

  it('keeps the Chinese root for Chinese or missing browser languages', () => {
    const chinese = environment({ languages: ['zh-CN'] });
    const missing = environment();
    runDocsLocaleBootstrap(chinese.value);
    runDocsLocaleBootstrap(missing.value);
    expect(chinese.replacements).toEqual([]);
    expect(missing.replacements).toEqual([]);
  });
});

describe('docs locale bootstrap browser entry', () => {
  it('prefers a non-empty navigator.languages list', () => {
    expect(
      readNavigatorLanguages({
        languages: ['zh-CN', 'en-US'],
        language: 'en-US',
      })
    ).toEqual(['zh-CN', 'en-US']);
  });

  it('falls back to navigator.language when languages is empty', () => {
    expect(
      readNavigatorLanguages({ languages: [], language: 'en-US' })
    ).toEqual(['en-US']);
  });

  it('falls back when the languages getter throws', () => {
    const source = {
      get languages(): readonly string[] {
        throw new Error('languages blocked');
      },
      language: 'en-US',
    };

    expect(readNavigatorLanguages(source)).toEqual(['en-US']);
  });

  it('returns no languages when both navigator getters throw', () => {
    const source = {
      get languages(): readonly string[] {
        throw new Error('languages blocked');
      },
      get language(): string {
        throw new Error('language blocked');
      },
    };

    expect(() => readNavigatorLanguages(source)).not.toThrow();
    expect(readNavigatorLanguages(source)).toEqual([]);
  });
});
