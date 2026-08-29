export type OneDocInline =
  | string
  | { type: 'code'; text: string }
  | { type: 'link'; text: string; href: string };

export type OneDocBlock =
  | { type: 'heading'; level: 1 | 2 | 3; id: string; text: string }
  | { type: 'paragraph'; content: OneDocInline[] }
  | { type: 'list'; items: OneDocInline[][] }
  | { type: 'code'; language: 'ts' | 'css' | 'bash'; code: string }
  | {
      type: 'callout';
      kind: 'note' | 'tip';
      title: string;
      body: OneDocInline[];
    }
  | {
      type: 'api-table';
      caption: string;
      rows: Array<{
        name: string;
        signature: string;
        description: string;
      }>;
    }
  | {
      type: 'demo';
      component:
        | 'button'
        | 'input'
        | 'card'
        | 'form'
        | 'select'
        | 'checkbox'
        | 'switch';
      interactive?: boolean;
    };

export interface OneDocPage {
  path: string;
  title: string;
  description: string;
  section: '开始' | '指南' | '组件';
  sectionOrder: number;
  order: number;
  body: OneDocBlock[];
}

export interface OneDocHeading {
  id: string;
  level: 1 | 2 | 3;
  text: string;
}

const ROUTE_PATTERN = /^\/?[a-z0-9-]+(?:\/[a-z0-9-]+)*(?:\/|\.md)?$/;

export function normalizeOneDocPath(path: string): string {
  if (path === '/') {
    return path;
  }

  if (!path || /\s/.test(path) || !ROUTE_PATTERN.test(path)) {
    throw new Error(`Invalid One UI documentation route: ${path}`);
  }

  const normalized = path.replace(/\.md$/, '').replace(/^\/+|\/+$/g, '');
  if (!normalized || !/^[a-z0-9-]+(?:\/[a-z0-9-]+)*$/.test(normalized)) {
    throw new Error(`Invalid One UI documentation route: ${path}`);
  }

  return `/${normalized}/`;
}

export function validateOneDocPages(pages: OneDocPage[]): OneDocPage[] {
  const routes = new Set<string>();

  const normalizedPages = pages.map((page) => {
    const route = normalizeOneDocPath(page.path);
    if (routes.has(route)) {
      throw new Error(`Duplicate One UI documentation route: ${route}`);
    }
    routes.add(route);

    if (!page.title.trim()) {
      throw new Error(`One UI documentation page has no title: ${route}`);
    }
    if (!page.description.trim()) {
      throw new Error(`One UI documentation page has no description: ${route}`);
    }
    if (page.body.length === 0 || !page.body.some(blockHasContent)) {
      throw new Error(`One UI documentation page has no content: ${route}`);
    }

    const headingIds = new Set<string>();
    headingsForPage(page).forEach((heading) => {
      if (headingIds.has(heading.id)) {
        throw new Error(`Duplicate heading id on ${route}: ${heading.id}`);
      }
      headingIds.add(heading.id);
    });

    return { ...page, path: route };
  });

  return normalizedPages.sort((left, right) => {
    return (
      left.sectionOrder - right.sectionOrder ||
      left.order - right.order ||
      left.path.localeCompare(right.path)
    );
  });
}

export function headingsForPage(page: OneDocPage): OneDocHeading[] {
  return page.body.flatMap((block) =>
    block.type === 'heading'
      ? [{ id: block.id, level: block.level, text: block.text }]
      : []
  );
}

export function inlineCode(text: string): OneDocInline {
  return { type: 'code', text };
}

export function link(text: string, href: string): OneDocInline {
  return { type: 'link', text, href };
}

export function heading(
  level: 1 | 2 | 3,
  id: string,
  text: string
): OneDocBlock {
  return { type: 'heading', level, id, text };
}

export function paragraph(...content: OneDocInline[]): OneDocBlock {
  return { type: 'paragraph', content };
}

export function list(items: OneDocInline[][]): OneDocBlock {
  return { type: 'list', items };
}

export function codeBlock(
  language: 'ts' | 'css' | 'bash',
  code: string
): OneDocBlock {
  return { type: 'code', language, code };
}

export function callout(
  kind: 'note' | 'tip',
  title: string,
  body: OneDocInline[]
): OneDocBlock {
  return { type: 'callout', kind, title, body };
}

export function apiTable(
  caption: string,
  rows: Extract<OneDocBlock, { type: 'api-table' }>['rows']
): OneDocBlock {
  return { type: 'api-table', caption, rows };
}

export function demo(
  component:
    | 'button'
    | 'input'
    | 'card'
    | 'form'
    | 'select'
    | 'checkbox'
    | 'switch',
  interactive = true
): OneDocBlock {
  return { type: 'demo', component, interactive };
}

function blockHasContent(block: OneDocBlock): boolean {
  switch (block.type) {
    case 'heading':
      return Boolean(block.id.trim() && block.text.trim());
    case 'paragraph':
      return inlineText(block.content).trim().length > 0;
    case 'list':
      return block.items.some((item) => inlineText(item).trim().length > 0);
    case 'code':
      return block.code.trim().length > 0;
    case 'callout':
      return Boolean(block.title.trim() || inlineText(block.body).trim());
    case 'api-table':
      return block.rows.length > 0;
    case 'demo':
      return true;
  }
}

function inlineText(content: OneDocInline[]): string {
  return content
    .map((item) => (typeof item === 'string' ? item : item.text))
    .join('');
}
