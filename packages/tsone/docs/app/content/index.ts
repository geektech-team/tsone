import {
  createDocCatalog,
  validateDocCatalogParity,
  type DocCatalog,
} from './catalog';
import { enSourcePages } from './en';
import type { DocLocale } from './locales';
import { zhSourcePages } from './zh';
import { normalizeDocPath, type DocPage } from './types';

const zhCatalog = createDocCatalog('zh', zhSourcePages);
const enCatalog = createDocCatalog('en', enSourcePages);

validateDocCatalogParity(zhCatalog, enCatalog);

export const docCatalogs: Record<DocLocale, DocCatalog> = {
  zh: zhCatalog,
  en: enCatalog,
};

export function getDocCatalog(locale: DocLocale): DocCatalog {
  return docCatalogs[locale];
}

export function findLocalizedDocPage(
  locale: DocLocale,
  logicalPath: string
): DocPage | undefined {
  const normalizedPath = normalizeDocPath(logicalPath);
  return getDocCatalog(locale).pages.find(
    (page) => page.path === normalizedPath
  );
}

export const zhDocPages = docCatalogs.zh.pages;

export const docPages = zhDocPages;

export const searchEntries = docCatalogs.zh.searchEntries;

export function findDocPage(path: string): DocPage | undefined {
  return findLocalizedDocPage('zh', path);
}

export * from './base';
export * from './catalog';
export * from './locales';
export * from './types';
