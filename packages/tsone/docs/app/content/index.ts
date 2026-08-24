import { apiPages } from './api';
import { contributingPages } from './contributing';
import { examplePages } from './examples';
import { guidePages } from './guide';
import { homePages } from './home';
import {
  createSearchEntries,
  normalizeDocPath,
  validateDocPages,
  type DocPage,
  type SearchEntry,
} from './types';

export const docPages: DocPage[] = validateDocPages([
  ...homePages,
  ...guidePages,
  ...apiPages,
  ...examplePages,
  ...contributingPages,
]);

export const searchEntries: SearchEntry[] = createSearchEntries(docPages);

export function findDocPage(path: string): DocPage | undefined {
  const normalizedPath = normalizeDocPath(path);
  return docPages.find((page) => page.path === normalizedPath);
}

export * from './types';
