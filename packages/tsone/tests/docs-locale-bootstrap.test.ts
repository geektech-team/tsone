import { describe, expect, it } from 'bun:test';
import {
  runDocsLocaleBootstrap,
  type LocaleBootstrapEnvironment,
} from '../docs/app/locale-bootstrap';

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
