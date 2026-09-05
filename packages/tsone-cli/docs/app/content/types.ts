export type CliDocLocale = 'zh' | 'en';

export const CLI_DOC_LOCALES: readonly CliDocLocale[] = ['zh', 'en'];

export const CLI_DOC_DEFAULT_LOCALE: CliDocLocale = 'zh';

/** 需要翻译的本地化文本，zh 与 en 均为必填。 */
export interface CliDocLocalizedText {
  zh: string;
  en: string;
}

/**
 * 文档文本：普通 string 表示中英文相同（命令名、代码、ASCII 字面量），
 * {@link CliDocLocalizedText} 表示需要按语言区分的 prose 文本。
 */
export type CliDocText = string | CliDocLocalizedText;

export type CliDocSection = 'start' | 'guide' | 'reference';

export const CLI_DOC_SECTION_LABELS: Record<
  CliDocSection,
  CliDocLocalizedText
> = {
  start: { zh: '开始', en: 'Getting started' },
  guide: { zh: '指南', en: 'Guide' },
  reference: { zh: '参考', en: 'Reference' },
};

/** 构造一份双语文本。 */
export function t(zh: string, en: string): CliDocLocalizedText {
  return { zh, en };
}

/** 按语言解析文档文本，string 原样返回。 */
export function localize(text: CliDocText, locale: CliDocLocale): string {
  return typeof text === 'string' ? text : text[locale];
}

/** 解析分组标签的本地化显示名。 */
export function sectionLabel(
  section: CliDocSection,
  locale: CliDocLocale
): string {
  return CLI_DOC_SECTION_LABELS[section][locale];
}

export type CliDocInline =
  | CliDocText
  | { type: 'code'; text: string }
  | { type: 'link'; text: CliDocText; href: string };

export type CliDocBlock =
  | { type: 'heading'; level: 1 | 2 | 3; id: string; text: CliDocText }
  | { type: 'paragraph'; content: CliDocInline[] }
  | { type: 'list'; items: CliDocInline[][] }
  | { type: 'code'; language: 'ts' | 'bash'; code: string }
  | {
      type: 'callout';
      kind: 'note' | 'tip';
      title: CliDocText;
      body: CliDocInline[];
    }
  | {
      type: 'api-table';
      caption: CliDocText;
      rows: Array<{
        name: string;
        signature: string;
        description: CliDocText;
      }>;
    };

export interface CliDocPage {
  path: string;
  title: CliDocText;
  description: CliDocText;
  section: CliDocSection;
  sectionOrder: number;
  order: number;
  body: CliDocBlock[];
}

export interface CliDocHeading {
  id: string;
  level: 1 | 2 | 3;
  text: CliDocText;
}

const ROUTE_PATTERN = /^\/?[a-z0-9-]+(?:\/[a-z0-9-]+)*(?:\/|\.md)?$/;

export function normalizeCliDocPath(path: string): string {
  if (path === '/') {
    return path;
  }

  if (!path || /\s/.test(path) || !ROUTE_PATTERN.test(path)) {
    throw new Error(`Invalid TSone CLI documentation route: ${path}`);
  }

  const normalized = path.replace(/\.md$/, '').replace(/^\/+|\/+$/g, '');
  if (!normalized || !/^[a-z0-9-]+(?:\/[a-z0-9-]+)*$/.test(normalized)) {
    throw new Error(`Invalid TSone CLI documentation route: ${path}`);
  }

  return `/${normalized}/`;
}

export function validateCliDocPages(pages: CliDocPage[]): CliDocPage[] {
  const routes = new Set<string>();

  const normalizedPages = pages.map((page) => {
    const route = normalizeCliDocPath(page.path);
    if (routes.has(route)) {
      throw new Error(`Duplicate TSone CLI documentation route: ${route}`);
    }
    routes.add(route);

    if (!hasTextContent(page.title)) {
      throw new Error(`TSone CLI documentation page has no title: ${route}`);
    }
    if (!hasTextContent(page.description)) {
      throw new Error(
        `TSone CLI documentation page has no description: ${route}`
      );
    }
    if (page.body.length === 0 || !page.body.some(blockHasContent)) {
      throw new Error(`TSone CLI documentation page has no content: ${route}`);
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

export function headingsForPage(page: CliDocPage): CliDocHeading[] {
  return page.body.flatMap((block) =>
    block.type === 'heading'
      ? [{ id: block.id, level: block.level, text: block.text }]
      : []
  );
}

export function inlineCode(text: string): CliDocInline {
  return { type: 'code', text };
}

export function link(text: CliDocText, href: string): CliDocInline {
  return { type: 'link', text, href };
}

export function heading(
  level: 1 | 2 | 3,
  id: string,
  text: CliDocText
): CliDocBlock {
  return { type: 'heading', level, id, text };
}

export function paragraph(...content: CliDocInline[]): CliDocBlock {
  return { type: 'paragraph', content };
}

export function list(items: CliDocInline[][]): CliDocBlock {
  return { type: 'list', items };
}

export function codeBlock(
  language: 'ts' | 'bash',
  code: string
): CliDocBlock {
  return { type: 'code', language, code };
}

export function callout(
  kind: 'note' | 'tip',
  title: CliDocText,
  body: CliDocInline[]
): CliDocBlock {
  return { type: 'callout', kind, title, body };
}

export function apiTable(
  caption: CliDocText,
  rows: Extract<CliDocBlock, { type: 'api-table' }>['rows']
): CliDocBlock {
  return { type: 'api-table', caption, rows };
}

function hasTextContent(text: CliDocText): boolean {
  return typeof text === 'string'
    ? text.trim().length > 0
    : text.zh.trim().length > 0 && text.en.trim().length > 0;
}

function blockHasContent(block: CliDocBlock): boolean {
  switch (block.type) {
    case 'heading':
      return Boolean(block.id.trim() && hasTextContent(block.text));
    case 'paragraph':
      return inlineText(block.content, 'zh').trim().length > 0;
    case 'list':
      return block.items.some(
        (item) => inlineText(item, 'zh').trim().length > 0
      );
    case 'code':
      return block.code.trim().length > 0;
    case 'callout':
      return Boolean(
        hasTextContent(block.title) || inlineText(block.body, 'zh').trim()
      );
    case 'api-table':
      return block.rows.length > 0;
  }
}

function inlineText(content: CliDocInline[], locale: CliDocLocale): string {
  return content
    .map((item) => {
      if (typeof item === 'string') {
        return item;
      }
      if ('type' in item) {
        return item.type === 'code'
          ? item.text
          : item.type === 'link'
            ? inlineText([item.text], locale)
            : '';
      }
      return item[locale];
    })
    .join('')
    .trim();
}
