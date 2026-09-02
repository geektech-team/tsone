import {
  oneDocDemoExamples,
  type OneDocDemoName,
  type OneDocDemoSource,
} from './demo-examples';

export type { OneDocDemoName, OneDocDemoSource } from './demo-examples';

export type OneDocLocale = 'zh' | 'en';

export const ONE_DOC_LOCALES: readonly OneDocLocale[] = ['zh', 'en'];

export const ONE_DOC_DEFAULT_LOCALE: OneDocLocale = 'zh';

/** 需要翻译的本地化文本，zh 与 en 均为必填。 */
export interface OneDocLocalizedText {
  zh: string;
  en: string;
}

/**
 * 文档文本：普通 string 表示中英文相同（组件名、代码、ASCII 字面量），
 * {@link OneDocLocalizedText} 表示需要按语言区分的 prose 文本。
 */
export type OneDocText = string | OneDocLocalizedText;

export type OneDocSection = 'start' | 'guide' | 'components';

export const ONE_DOC_SECTION_LABELS: Record<OneDocSection, OneDocLocalizedText> =
  {
    start: { zh: '开始', en: 'Getting started' },
    guide: { zh: '指南', en: 'Guide' },
    components: { zh: '组件', en: 'Components' },
  };

/** 构造一份双语文本。 */
export function t(zh: string, en: string): OneDocLocalizedText {
  return { zh, en };
}

/** 按语言解析文档文本，string 原样返回。 */
export function localize(text: OneDocText, locale: OneDocLocale): string {
  return typeof text === 'string' ? text : text[locale];
}

/** 解析分组标签的本地化显示名。 */
export function sectionLabel(
  section: OneDocSection,
  locale: OneDocLocale
): string {
  return ONE_DOC_SECTION_LABELS[section][locale];
}

export type OneDocInline =
  | OneDocText
  | { type: 'code'; text: string }
  | { type: 'link'; text: OneDocText; href: string };

export type OneDocBlock =
  | { type: 'heading'; level: 1 | 2 | 3; id: string; text: OneDocText }
  | { type: 'paragraph'; content: OneDocInline[] }
  | { type: 'list'; items: OneDocInline[][] }
  | { type: 'code'; language: 'ts' | 'css' | 'bash'; code: string }
  | {
      type: 'callout';
      kind: 'note' | 'tip';
      title: OneDocText;
      body: OneDocInline[];
    }
  | {
      type: 'api-table';
      caption: OneDocText;
      rows: Array<{
        name: string;
        signature: string;
        description: OneDocText;
      }>;
    }
  | {
      type: 'demo';
      component: OneDocDemoName;
      interactive?: boolean;
      source: OneDocDemoSource;
    };

export interface OneDocPage {
  path: string;
  title: OneDocText;
  description: OneDocText;
  section: OneDocSection;
  sectionOrder: number;
  order: number;
  body: OneDocBlock[];
}

export interface OneDocHeading {
  id: string;
  level: 1 | 2 | 3;
  text: OneDocText;
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

    if (!hasTextContent(page.title)) {
      throw new Error(`One UI documentation page has no title: ${route}`);
    }
    if (!hasTextContent(page.description)) {
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

export function link(text: OneDocText, href: string): OneDocInline {
  return { type: 'link', text, href };
}

export function heading(
  level: 1 | 2 | 3,
  id: string,
  text: OneDocText
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
  title: OneDocText,
  body: OneDocInline[]
): OneDocBlock {
  return { type: 'callout', kind, title, body };
}

export function apiTable(
  caption: OneDocText,
  rows: Extract<OneDocBlock, { type: 'api-table' }>['rows']
): OneDocBlock {
  return { type: 'api-table', caption, rows };
}

export function demo(
  component: OneDocDemoName,
  interactive = true
): OneDocBlock {
  return {
    type: 'demo',
    component,
    interactive,
    source: { ...oneDocDemoExamples[component] },
  };
}

function hasTextContent(text: OneDocText): boolean {
  return typeof text === 'string'
    ? text.trim().length > 0
    : text.zh.trim().length > 0 && text.en.trim().length > 0;
}

function blockHasContent(block: OneDocBlock): boolean {
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
    case 'demo':
      return true;
  }
}

function inlineText(content: OneDocInline[], locale: OneDocLocale): string {
  return content
    .map((item) => {
      if (typeof item === 'string') {
        return item;
      }
      if ('type' in item) {
        return item.type === 'code' ? item.text : localize(item.text, locale);
      }
      return localize(item, locale);
    })
    .join('');
}
