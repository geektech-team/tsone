export type DocInline =
  | string
  | {
      type: 'code';
      text: string;
    }
  | {
      type: 'link';
      text: string;
      href: string;
    };

export interface HeadingBlock {
  type: 'heading';
  level: 1 | 2 | 3 | 4;
  text: string;
}

export interface ParagraphBlock {
  type: 'paragraph';
  content: DocInline[];
}

export interface ListBlock {
  type: 'list';
  items: DocInline[][];
}

export interface CodeBlock {
  type: 'code';
  language: string;
  code: string;
}

export interface CalloutBlock {
  type: 'callout';
  kind: 'note' | 'tip' | 'warning';
  title: string;
  body: DocInline[];
}

export interface ApiTableBlock {
  type: 'api-table';
  rows: Array<{
    name: string;
    signature: string;
    description: string;
  }>;
}

export type DocBlock =
  | HeadingBlock
  | ParagraphBlock
  | ListBlock
  | CodeBlock
  | CalloutBlock
  | ApiTableBlock;

export interface DocPage {
  path: string;
  title: string;
  description: string;
  section: string;
  sectionOrder: number;
  order: number;
  body: DocBlock[];
}

export interface SearchEntry {
  path: string;
  title: string;
  section: string;
  description: string;
  text: string;
}

export function inlineCode(text: string): DocInline {
  return { type: 'code', text };
}

export function link(text: string, href: string): DocInline {
  return { type: 'link', text, href };
}

export function heading(level: HeadingBlock['level'], text: string): DocBlock {
  return { type: 'heading', level, text };
}

export function paragraph(...content: DocInline[]): DocBlock {
  return { type: 'paragraph', content };
}

export function list(items: DocInline[][]): DocBlock {
  return { type: 'list', items };
}

export function codeBlock(language: string, code: string): DocBlock {
  return { type: 'code', language, code };
}

export function callout(
  kind: CalloutBlock['kind'],
  title: string,
  body: DocInline[]
): DocBlock {
  return { type: 'callout', kind, title, body };
}

export function apiTable(rows: ApiTableBlock['rows']): DocBlock {
  return { type: 'api-table', rows };
}

const DOC_ROUTE_WITH_TRAILING_SLASH = /^\/?[a-z0-9-]+(?:\/[a-z0-9-]+)*(?:\/)?$/;
const DOC_ROUTE_WITHOUT_TRAILING_SLASH = /^\/?[a-z0-9-]+(?:\/[a-z0-9-]+)*\.md$/;

function validateRawDocPath(path: string): void {
  if (path === '/') {
    return;
  }

  if (/\s/.test(path)) {
    throw new Error(`Invalid documentation route: ${path}`);
  }

  if (
    !DOC_ROUTE_WITH_TRAILING_SLASH.test(path) &&
    !DOC_ROUTE_WITHOUT_TRAILING_SLASH.test(path)
  ) {
    throw new Error(`Invalid documentation route: ${path}`);
  }
}

export function normalizeDocPath(path: string): string {
  validateRawDocPath(path);

  const withoutMarkdown = path.replace(/\.md$/, '');

  if (withoutMarkdown === '/') {
    return '/';
  }

  const trimmedSlashes = withoutMarkdown.replace(/^\/+|\/+$/g, '');
  if (!/^[a-z0-9-]+(?:\/[a-z0-9-]+)*$/.test(trimmedSlashes)) {
    throw new Error(`Invalid documentation route: ${path}`);
  }

  return `/${trimmedSlashes}/`;
}

export function sortDocPages(pages: DocPage[]): DocPage[] {
  return [...pages].sort((a, b) => {
    const sectionOrder = a.sectionOrder - b.sectionOrder;
    if (sectionOrder !== 0) {
      return sectionOrder;
    }

    const pageOrder = a.order - b.order;
    if (pageOrder !== 0) {
      return pageOrder;
    }

    return a.path.localeCompare(b.path);
  });
}

export function validateDocPages(pages: DocPage[]): DocPage[] {
  const routes = new Set<string>();

  pages.forEach((page) => {
    if (!page.path.trim()) {
      throw new Error(`Documentation page has no path`);
    }

    const route = normalizeDocPath(page.path);
    if (routes.has(route)) {
      throw new Error(`Duplicate documentation route: ${route}`);
    }
    routes.add(route);

    if (!page.title.trim()) {
      throw new Error(`Documentation page has no title: ${route}`);
    }

    if (!page.description.trim()) {
      throw new Error(`Documentation page has no description: ${route}`);
    }

    if (
      page.body.length === 0 ||
      !page.body.some((block) => blockText(block).trim().length > 0)
    ) {
      throw new Error(`Documentation page has no content: ${route}`);
    }
  });

  return sortDocPages(
    pages.map((page) => ({
      ...page,
      path: normalizeDocPath(page.path),
    }))
  );
}

export function docText(page: DocPage): string {
  return [
    page.title,
    page.description,
    ...page.body.map((block) => blockText(block)),
  ]
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function createSearchEntries(pages: DocPage[]): SearchEntry[] {
  return pages.map((page) => ({
    path: page.path,
    title: page.title,
    section: page.section,
    description: page.description,
    text: docText(page).toLowerCase(),
  }));
}

function blockText(block: DocBlock): string {
  switch (block.type) {
    case 'heading':
      return block.text;
    case 'paragraph':
      return inlineText(block.content);
    case 'list':
      return block.items.map((item) => inlineText(item)).join(' ');
    case 'code':
      return block.code;
    case 'callout':
      return `${block.title} ${inlineText(block.body)}`;
    case 'api-table':
      return block.rows
        .map((row) => `${row.name} ${row.signature} ${row.description}`)
        .join(' ');
  }
}

function inlineText(content: DocInline[]): string {
  return content
    .map((item) => {
      if (typeof item === 'string') {
        return item;
      }

      return item.text;
    })
    .join('');
}
