/**
 * BackOne 文档内容模型。
 * 与 @geektech/one 的文档模型同构（typed content + 双语），
 * 服务端框架文档不需要 UI demo 块，因此去掉 demo 类型，保留代码示例块。
 */

export type BackOneDocLocale = 'zh' | 'en';

export const BACKONE_DOC_LOCALES: readonly BackOneDocLocale[] = ['zh', 'en'];

export const BACKONE_DOC_DEFAULT_LOCALE: BackOneDocLocale = 'zh';

/** 需要翻译的本地化文本，zh 与 en 均为必填。 */
export interface BackOneDocLocalizedText {
  zh: string;
  en: string;
}

/**
 * 文档文本：普通 string 表示中英文相同（API 名、代码、ASCII 字面量），
 * {@link BackOneDocLocalizedText} 表示需要按语言区分的 prose 文本。
 */
export type BackOneDocText = string | BackOneDocLocalizedText;

export type BackOneDocSection = 'start' | 'guide' | 'api';

export const BACKONE_DOC_SECTION_LABELS: Record<
  BackOneDocSection,
  BackOneDocLocalizedText
> = {
  start: { zh: '开始', en: 'Getting started' },
  guide: { zh: '指南', en: 'Guide' },
  api: { zh: 'API 参考', en: 'API reference' },
};

/** 构造一份双语文本。 */
export function t(zh: string, en: string): BackOneDocLocalizedText {
  return { zh, en };
}

/** 按语言解析文档文本，string 原样返回。 */
export function localize(
  text: BackOneDocText,
  locale: BackOneDocLocale
): string {
  return typeof text === 'string' ? text : text[locale];
}

/** 解析分组标签的本地化显示名。 */
export function sectionLabel(
  section: BackOneDocSection,
  locale: BackOneDocLocale
): string {
  return BACKONE_DOC_SECTION_LABELS[section][locale];
}

export type BackOneDocInline =
  | BackOneDocText
  | { type: 'code'; text: string }
  | { type: 'link'; text: BackOneDocText; href: string };

/** SVG 节点树：content 层不依赖框架运行时，DocArticle 渲染时转成 VNode。 */
export interface BackOneDocDiagramNode {
  tag: string;
  props?: Record<string, string | number | boolean | null | undefined>;
  children?: Array<BackOneDocDiagramNode | string>;
}

export type BackOneDocBlock =
  | { type: 'heading'; level: 1 | 2 | 3; id: string; text: BackOneDocText }
  | { type: 'paragraph'; content: BackOneDocInline[] }
  | { type: 'list'; items: BackOneDocInline[][] }
  | { type: 'code'; language: 'ts' | 'bash'; code: string }
  | {
      type: 'callout';
      kind: 'note' | 'tip';
      title: BackOneDocText;
      body: BackOneDocInline[];
    }
  | {
      type: 'api-table';
      caption: BackOneDocText;
      rows: Array<{
        name: string;
        signature: string;
        description: BackOneDocText;
      }>;
    }
  | { type: 'diagram'; title: BackOneDocText; svg: BackOneDocDiagramNode };

export interface BackOneDocPage {
  path: string;
  title: BackOneDocText;
  description: BackOneDocText;
  section: BackOneDocSection;
  sectionOrder: number;
  order: number;
  body: BackOneDocBlock[];
}

export interface BackOneDocHeading {
  id: string;
  level: 1 | 2 | 3;
  text: BackOneDocText;
}

const ROUTE_PATTERN = /^\/?[a-z0-9-]+(?:\/[a-z0-9-]+)*(?:\/|\.md)?$/;

export function normalizeBackOneDocPath(path: string): string {
  if (path === '/') {
    return path;
  }

  if (!path || /\s/.test(path) || !ROUTE_PATTERN.test(path)) {
    throw new Error(`Invalid BackOne documentation route: ${path}`);
  }

  const normalized = path.replace(/\.md$/, '').replace(/^\/+|\/+$/g, '');
  if (!normalized || !/^[a-z0-9-]+(?:\/[a-z0-9-]+)*$/.test(normalized)) {
    throw new Error(`Invalid BackOne documentation route: ${path}`);
  }

  return `/${normalized}/`;
}

export function validateBackOneDocPages(
  pages: BackOneDocPage[]
): BackOneDocPage[] {
  const routes = new Set<string>();

  const normalizedPages = pages.map((page) => {
    const route = normalizeBackOneDocPath(page.path);
    if (routes.has(route)) {
      throw new Error(`Duplicate BackOne documentation route: ${route}`);
    }
    routes.add(route);

    if (!hasTextContent(page.title)) {
      throw new Error(`BackOne documentation page has no title: ${route}`);
    }
    if (!hasTextContent(page.description)) {
      throw new Error(
        `BackOne documentation page has no description: ${route}`
      );
    }
    if (page.body.length === 0 || !page.body.some(blockHasContent)) {
      throw new Error(`BackOne documentation page has no content: ${route}`);
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

export function headingsForPage(page: BackOneDocPage): BackOneDocHeading[] {
  return page.body.flatMap((block) =>
    block.type === 'heading'
      ? [{ id: block.id, level: block.level, text: block.text }]
      : []
  );
}

export function inlineCode(text: string): BackOneDocInline {
  return { type: 'code', text };
}

export function link(text: BackOneDocText, href: string): BackOneDocInline {
  return { type: 'link', text, href };
}

export function heading(
  level: 1 | 2 | 3,
  id: string,
  text: BackOneDocText
): BackOneDocBlock {
  return { type: 'heading', level, id, text };
}

export function paragraph(...content: BackOneDocInline[]): BackOneDocBlock {
  return { type: 'paragraph', content };
}

export function list(items: BackOneDocInline[][]): BackOneDocBlock {
  return { type: 'list', items };
}

export function codeBlock(
  language: 'ts' | 'bash',
  code: string
): BackOneDocBlock {
  return { type: 'code', language, code };
}

export function callout(
  kind: 'note' | 'tip',
  title: BackOneDocText,
  body: BackOneDocInline[]
): BackOneDocBlock {
  return { type: 'callout', kind, title, body };
}

export function apiTable(
  caption: BackOneDocText,
  rows: Extract<BackOneDocBlock, { type: 'api-table' }>['rows']
): BackOneDocBlock {
  return { type: 'api-table', caption, rows };
}

/** 构造一个 SVG 节点（供 diagram 使用）。 */
export function svgEl(
  tag: string,
  props: BackOneDocDiagramNode['props'] = {},
  children: BackOneDocDiagramNode['children'] = []
): BackOneDocDiagramNode {
  return { tag, props, children };
}

/** 构造一张内嵌 SVG 架构图（随 SSR 输出，明暗主题通过 CSS 变量适配）。 */
export function diagram(
  title: BackOneDocText,
  svg: BackOneDocDiagramNode
): BackOneDocBlock {
  return { type: 'diagram', title, svg };
}

function hasTextContent(text: BackOneDocText): boolean {
  return typeof text === 'string'
    ? text.trim().length > 0
    : text.zh.trim().length > 0 && text.en.trim().length > 0;
}

function blockHasContent(block: BackOneDocBlock): boolean {
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
    case 'diagram':
      return block.svg.tag === 'svg' && (block.svg.children?.length ?? 0) > 0;
  }
}

function inlineText(
  content: BackOneDocInline[],
  locale: BackOneDocLocale
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
