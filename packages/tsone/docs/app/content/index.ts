import { zhSourcePages } from './zh';
import {
  createSearchEntries,
  normalizeDocPath,
  validateDocPages,
  type DocPage,
  type SearchEntry,
} from './types';

export const zhDocPages = validateDocPages(zhSourcePages);

export const docPages = zhDocPages;

export const searchEntries: SearchEntry[] = createSearchEntries(docPages);

export function findDocPage(path: string): DocPage | undefined {
  const normalizedPath = normalizeDocPath(path);
  return docPages.find((page) => page.path === normalizedPath);
}

export * from './types';
