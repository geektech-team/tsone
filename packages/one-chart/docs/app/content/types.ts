import {
  oneChartDocDemoExamples,
  type OneChartDocDemoName,
  type OneChartDocDemoSource,
} from './demo-examples';

export type { OneChartDocDemoName, OneChartDocDemoSource } from './demo-examples';

export type OneChartDocLocale = 'zh' | 'en';

export const ONE_CHART_DOC_LOCALES: readonly OneChartDocLocale[] = [
  'zh',
  'en',
];

export const ONE_CHART_DOC_DEFAULT_LOCALE: OneChartDocLocale = 'zh';

/** 需要翻译的本地化文本，zh 与 en 均为必填。 */
export interface OneChartDocLocalizedText {
  zh: string;
  en: string;
}

/**
 * 文档文本：普通 string 表示中英文相同（组件名、代码、ASCII 字面量），
 * {@link OneChartDocLocalizedText} 表示需要按语言区分的 prose 文本。
 */
export type OneChartDocText = string | OneChartDocLocalizedText;

export type OneChartDocSection = 'start' | 'guide' | 'charts';

export const ONE_CHART_DOC_SECTION_LABELS: Record<
  OneChartDocSection,
  OneChartDocLocalizedText
> = {
  start: { zh: '开始', en: 'Getting started' },
  guide: { zh: '指南', en: 'Guide' },
  charts: { zh: '图表', en: 'Charts' },
};

/** 构造一份双语文本。 */
export function t(zh: string, en: string): OneChartDocLocalizedText {
  return { zh, en };
}

/** 按语言解析文档文本，string 原样返回。 */
export function localize(
  text: OneChartDocText,
  locale: OneChartDocLocale
): string {
  return typeof text === 'string' ? text : text[locale];
}

/** 解析分组标签的本地化显示名。 */
export function sectionLabel(
  section: OneChartDocSection,
  locale: OneChartDocLocale
): string {
  return ONE_CHART_DOC_SECTION_LABELS[section][locale];
}

export type OneChartDocInline =
  | OneChartDocText
  | { type: 'code'; text: string }
  | { type: 'link'; text: OneChartDocText; href: string };

export type OneChartDocBlock =
  | { type: 'heading'; level: 1 | 2 | 3; id: string; text: OneChartDocText }
  | { type: 'paragraph'; content: OneChartDocInline[] }
  | { type: 'list'; items: OneChartDocInline[][] }
  | { type: 'code'; language: 'ts' | 'css' | 'bash'; code: string }
  | {
      type: 'callout';
      kind: 'note' | 'tip';
      title: OneChartDocText;
      body: OneChartDocInline[];
    }
  | {
      type: 'api-table';
      caption: OneChartDocText;
      rows: Array<{
        name: string;
        signature: string;
        description: OneChartDocText;
      }>;
    }
  | {
      type: 'demo';
      component: OneChartDocDemoName;
      interactive?: boolean;
      source: OneChartDocDemoSource;
    };

export interface OneChartDocPage {
  path: string;
  title: OneChartDocText;
  description: OneChartDocText;
  section: OneChartDocSection;
  sectionOrder: number;
  order: number;
  body: OneChartDocBlock[];
}

export interface OneChartDocHeading {
  id: string;
  level: 1 | 2 | 3;
  text: OneChartDocText;
}

const ROUTE_PATTERN = /^\/?[a-z0-9-]+(?:\/[a-z0-9-]+)*(?:\/|\.md)?$/;

export function normalizeOneChartDocPath(path: string): string {
  if (path === '/') {
    return path;
  }

  if (!path || /\s/.test(path) || !ROUTE_PATTERN.test(path)) {
    throw new Error(`Invalid One Chart documentation route: ${path}`);
  }

  const normalized = path.replace(/\.md$/, '').replace(/^\/+|\/+$/g, '');
  if (!normalized || !/^[a-z0-9-]+(?:\/[a-z0-9-]+)*$/.test(normalized)) {
    throw new Error(`Invalid One Chart documentation route: ${path}`);
  }

  return `/${normalized}/`;
}

export function validateOneChartDocPages(
  pages: OneChartDocPage[]
): OneChartDocPage[] {
  const routes = new Set<string>();

  const normalizedPages = pages.map((page) => {
    const route = normalizeOneChartDocPath(page.path);
    if (routes.has(route)) {
      throw new Error(`Duplicate One Chart documentation route: ${route}`);
    }
    routes.add(route);

    if (!hasTextContent(page.title)) {
      throw new Error(
        `One Chart documentation page has no title: ${route}`
      );
    }
    if (!hasTextContent(page.description)) {
      throw new Error(
        `One Chart documentation page has no description: ${route}`
      );
    }
    if (page.body.length === 0 || !page.body.some(blockHasContent)) {
      throw new Error(
        `One Chart documentation page has no content: ${route}`
      );
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

export function headingsForPage(page: OneChartDocPage): OneChartDocHeading[] {
  return page.body.flatMap((block) =>
    block.type === 'heading'
      ? [{ id: block.id, level: block.level, text: block.text }]
      : []
  );
}

export function inlineCode(text: string): OneChartDocInline {
  return { type: 'code', text };
}

export function link(text: OneChartDocText, href: string): OneChartDocInline {
  return { type: 'link', text, href };
}

export function heading(
  level: 1 | 2 | 3,
  id: string,
  text: OneChartDocText
): OneChartDocBlock {
  return { type: 'heading', level, id, text };
}

export function paragraph(...content: OneChartDocInline[]): OneChartDocBlock {
  return { type: 'paragraph', content };
}

export function list(items: OneChartDocInline[][]): OneChartDocBlock {
  return { type: 'list', items };
}

export function codeBlock(
  language: 'ts' | 'css' | 'bash',
  code: string
): OneChartDocBlock {
  return { type: 'code', language, code };
}

export function callout(
  kind: 'note' | 'tip',
  title: OneChartDocText,
  body: OneChartDocInline[]
): OneChartDocBlock {
  return { type: 'callout', kind, title, body };
}

export function apiTable(
  caption: OneChartDocText,
  rows: Extract<OneChartDocBlock, { type: 'api-table' }>['rows']
): OneChartDocBlock {
  return { type: 'api-table', caption, rows };
}

export function demo(
  component: OneChartDocDemoName,
  interactive = true
): OneChartDocBlock {
  return {
    type: 'demo',
    component,
    interactive,
    source: { ...oneChartDocDemoExamples[component] },
  };
}

function hasTextContent(text: OneChartDocText): boolean {
  return typeof text === 'string'
    ? text.trim().length > 0
    : text.zh.trim().length > 0 && text.en.trim().length > 0;
}

function blockHasContent(block: OneChartDocBlock): boolean {
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

function inlineText(
  content: OneChartDocInline[],
  locale: OneChartDocLocale
): string {
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
