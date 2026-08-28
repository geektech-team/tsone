import {
  DOC_LOCALE_CONFIGS,
  localizeDocPath,
  type DocLocale,
  type DocLocaleConfig,
} from './locales';
import {
  createSearchEntries,
  docText,
  normalizeDocPath,
  validateDocPages,
  type DocPage,
  type SearchEntry,
} from './types';

export interface DocCatalog {
  locale: DocLocale;
  config: DocLocaleConfig;
  pages: DocPage[];
  searchEntries: SearchEntry[];
}

export function createDocCatalog(
  locale: DocLocale,
  sourcePages: DocPage[]
): DocCatalog {
  const pages = validateDocPages(sourcePages);

  if (locale === 'en') {
    const chinesePage = pages.find((page) =>
      /[\u3400-\u9fff]/u.test(docText(page))
    );
    if (chinesePage) {
      throw new Error(
        `Locale en contains Chinese content: ${chinesePage.path}`
      );
    }
  }

  return {
    locale,
    config: DOC_LOCALE_CONFIGS[locale],
    pages,
    searchEntries: createSearchEntries(pages).map((entry) => ({
      ...entry,
      path: localizeDocPath(locale, entry.path),
    })),
  };
}

export function validateDocCatalogParity(
  reference: DocCatalog,
  candidate: DocCatalog
): void {
  const referenceRoutes = new Set(
    reference.pages.map((page) => normalizeDocPath(page.path))
  );
  const candidateRoutes = new Set(
    candidate.pages.map((page) => normalizeDocPath(page.path))
  );

  const missingRoute = reference.pages
    .map((page) => normalizeDocPath(page.path))
    .find((route) => !candidateRoutes.has(route));
  if (missingRoute) {
    throw new Error(
      `Locale ${candidate.locale} is missing documentation route: ${missingRoute}`
    );
  }

  const extraRoute = candidate.pages
    .map((page) => normalizeDocPath(page.path))
    .find((route) => !referenceRoutes.has(route));
  if (extraRoute) {
    throw new Error(
      `Locale ${candidate.locale} has extra documentation route: ${extraRoute}`
    );
  }
}
