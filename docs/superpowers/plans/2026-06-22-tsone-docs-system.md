# TSone Docs System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a TSone-generated static MPA documentation system whose content lives in typed TypeScript modules and whose browser enhancements are mounted by TSone islands.

**Architecture:** The docs system has a typed content registry, TSone class components for static page rendering, a Bun static build/preview script, and a small browser bundle for search and theme islands. Static output is MPA HTML under `docs/dist`; `bun run docs` previews it and `bun run docs:build` generates it.

**Tech Stack:** Bun, TypeScript, TSone `Component`/`VNode`/`createApp`, Happy DOM for build-time rendering, `bun:test`, `Bun.build`.

## Global Constraints

- `bun run docs` 继续表示启动文档预览服务。
- 新增 `bun run docs:build` 生成静态文档产物。
- 文档站第一阶段采用 MPA：每个路由输出独立 HTML 文件，页面导航走真实链接跳转，不依赖 history fallback。
- 文档内容迁移为 TypeScript content registry，例如 `docs/app/content/*.ts`。
- 不引入 React、Vue、JSX 编译器、VitePress、SSR 框架或新的浏览器运行时依赖。
- `docs/dist` 是生成产物，不提交到仓库。
- 文档源不再使用 `docs/src/**/*.md`；最终实现删除 `docs/src`。
- TSone 当前没有 hydration；客户端增强通过独立 island 挂载实现。

---

## File Structure

- Create `docs/app/content/types.ts`: doc page/block types, block helper functions, route normalization, registry validation, plain-text extraction.
- Create `docs/app/content/home.ts`: homepage content pages.
- Create `docs/app/content/guide.ts`: guide content pages migrated from current `docs/src/guide/*.md`.
- Create `docs/app/content/api.ts`: API content pages migrated from current `docs/src/api/*.md`.
- Create `docs/app/content/examples.ts`: example content pages migrated from current `docs/src/examples/*.md`.
- Create `docs/app/content/contributing.ts`: contributing page migrated from current `docs/src/contributing.md`.
- Create `docs/app/content/index.ts`: exports the validated, sorted registry and derived search index.
- Create `docs/app/components/DocArticle.ts`: converts `DocBlock[]` to TSone VNodes.
- Create `docs/app/components/DocsNav.ts`: renders sectioned MPA nav links.
- Create `docs/app/components/DocsPage.ts`: renders the static page shell.
- Create `docs/app/components/SearchBox.ts`: TSone client island for search filtering.
- Create `docs/app/components/ThemeToggle.ts`: TSone client island for theme switching.
- Create `docs/app/styles.ts`: static CSS string for generated docs pages.
- Create `docs/app/client.ts`: mounts client islands only.
- Rewrite `scripts/docs.ts`: static build, client bundle generation, static preview server.
- Modify `package.json`: add `docs:build`; keep `docs`.
- Modify `.gitignore`: ignore `docs/dist/`.
- Modify `README.md`: document `bun run docs` and `bun run docs:build`.
- Modify `tests/docs-server.test.ts`: preview server tests for static output.
- Create `tests/docs-content.test.ts`: registry/content tests.
- Create `tests/docs-build.test.ts`: static build tests.
- Modify `tests/public-api-docs.test.ts`: read docs text from TypeScript registry.
- Modify `tests/repository-hygiene.test.ts`: assert `docs/dist` is ignored.
- Delete `docs/src/` after content migration and test updates are green.

## Task 1: Content Types, Helpers, and Validation

**Files:**
- Create: `tests/docs-content.test.ts`
- Create: `docs/app/content/types.ts`

**Interfaces:**
- Produces: `DocPage`, `DocBlock`, `inlineCode(text)`, `link(text, href)`, `heading(level, text)`, `paragraph(...content)`, `list(items)`, `codeBlock(language, code)`, `callout(kind, title, body)`, `apiTable(rows)`, `normalizeDocPath(path)`, `sortDocPages(pages)`, `validateDocPages(pages)`, `docText(page)`.
- Consumes: none.

- [ ] **Step 1: Write the failing content helper tests**

Create `tests/docs-content.test.ts` with this initial test file:

```ts
import { describe, expect, it } from 'bun:test';
import {
  codeBlock,
  docText,
  heading,
  inlineCode,
  link,
  normalizeDocPath,
  paragraph,
  sortDocPages,
  validateDocPages,
  type DocPage,
} from '../docs/app/content/types';

describe('docs content model', () => {
  it('normalizes documentation paths for directory-style MPA output', () => {
    expect(normalizeDocPath('/')).toBe('/');
    expect(normalizeDocPath('guide/getting-started')).toBe(
      '/guide/getting-started/'
    );
    expect(normalizeDocPath('/api/component.md')).toBe('/api/component/');
  });

  it('sorts pages by section order and page order', () => {
    const pages: DocPage[] = [
      {
        path: '/api/router/',
        title: 'Router',
        description: 'Router API',
        section: 'API',
        sectionOrder: 3,
        order: 2,
        body: [heading(1, 'Router')],
      },
      {
        path: '/',
        title: 'TSone',
        description: 'Home',
        section: 'Guide',
        sectionOrder: 1,
        order: 0,
        body: [heading(1, 'TSone')],
      },
      {
        path: '/guide/getting-started/',
        title: 'Getting Started',
        description: 'Start using TSone',
        section: 'Guide',
        sectionOrder: 1,
        order: 1,
        body: [heading(1, 'Getting Started')],
      },
    ];

    expect(sortDocPages(pages).map((page) => page.path)).toEqual([
      '/',
      '/guide/getting-started/',
      '/api/router/',
    ]);
  });

  it('rejects duplicate routes and pages without readable content', () => {
    const duplicatePages: DocPage[] = [
      {
        path: '/api/router/',
        title: 'Router',
        description: 'Router API',
        section: 'API',
        sectionOrder: 3,
        order: 1,
        body: [heading(1, 'Router')],
      },
      {
        path: '/api/router',
        title: 'Router Duplicate',
        description: 'Duplicate route',
        section: 'API',
        sectionOrder: 3,
        order: 2,
        body: [paragraph('Duplicate')],
      },
    ];

    expect(() => validateDocPages(duplicatePages)).toThrow(
      'Duplicate documentation route: /api/router/'
    );

    expect(() =>
      validateDocPages([
        {
          path: '/empty/',
          title: 'Empty',
          description: 'Empty page',
          section: 'Guide',
          sectionOrder: 1,
          order: 1,
          body: [],
        },
      ])
    ).toThrow('Documentation page has no content: /empty/');
  });

  it('extracts plain text from structured docs content', () => {
    const page: DocPage = {
      path: '/guide/getting-started/',
      title: 'Getting Started',
      description: 'Start using TSone',
      section: 'Guide',
      sectionOrder: 1,
      order: 1,
      body: [
        heading(1, 'Getting Started'),
        paragraph('Install ', inlineCode('@geektech/tsone'), ' with Bun.'),
        paragraph('Read the ', link('router guide', '/guide/router-system/')),
        codeBlock('ts', "import { createApp } from '@geektech/tsone';"),
      ],
    };

    expect(docText(page)).toContain('Getting Started');
    expect(docText(page)).toContain('@geektech/tsone');
    expect(docText(page)).toContain('router guide');
    expect(docText(page)).toContain('createApp');
  });
});
```

- [ ] **Step 2: Run the failing test**

Run:

```bash
bun test tests/docs-content.test.ts
```

Expected: FAIL because `docs/app/content/types.ts` does not exist.

- [ ] **Step 3: Implement the content model**

Create `docs/app/content/types.ts`:

```ts
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

export function normalizeDocPath(path: string): string {
  const withoutMarkdown = path.replace(/\.md$/, '');
  const normalized = `/${withoutMarkdown.replace(/^\/+|\/+$/g, '')}`;

  if (normalized === '/') {
    return '/';
  }

  return `${normalized}/`;
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

    if (page.body.length === 0) {
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
```

- [ ] **Step 4: Run the content helper test**

Run:

```bash
bun test tests/docs-content.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add tests/docs-content.test.ts docs/app/content/types.ts
git commit -m "feat: add typed docs content model"
```

## Task 2: Real TypeScript Content Registry

**Files:**
- Modify: `tests/docs-content.test.ts`
- Create: `docs/app/content/home.ts`
- Create: `docs/app/content/guide.ts`
- Create: `docs/app/content/api.ts`
- Create: `docs/app/content/examples.ts`
- Create: `docs/app/content/contributing.ts`
- Create: `docs/app/content/index.ts`

**Interfaces:**
- Consumes: `DocPage`, block helpers, `validateDocPages(pages)`, `createSearchEntries(pages)`.
- Produces: `docPages: DocPage[]`, `searchEntries: SearchEntry[]`, `findDocPage(path: string): DocPage | undefined`.

- [ ] **Step 1: Extend the failing registry tests**

Append these tests to `tests/docs-content.test.ts`:

```ts
import { docPages, findDocPage, searchEntries } from '../docs/app/content';

describe('docs content registry', () => {
  it('contains every migrated documentation route in stable order', () => {
    expect(docPages.map((page) => page.path)).toEqual([
      '/',
      '/guide/getting-started/',
      '/guide/core-concepts/',
      '/guide/component-system/',
      '/guide/reactive-system/',
      '/guide/router-system/',
      '/guide/style-management/',
      '/api/app/',
      '/api/component/',
      '/api/reactive/',
      '/api/router/',
      '/api/style/',
      '/examples/basic/',
      '/contributing/',
    ]);
  });

  it('keeps public API terms searchable from typed docs content', () => {
    const allText = searchEntries.map((entry) => entry.text).join('\n');

    for (const term of [
      '@geektech/tsone',
      'createapp',
      'component<props, state>',
      'protected render(): vnode',
      'routerview',
      'routerlink',
      'stylemanager',
      'bun run docs',
      'bun run docs:build',
    ]) {
      expect(allText).toContain(term);
    }
  });

  it('finds pages by normalized route', () => {
    expect(findDocPage('/api/component')?.title).toBe('Component API');
    expect(findDocPage('/guide/getting-started/')?.title).toBe('快速开始');
    expect(findDocPage('/missing/')).toBeUndefined();
  });
});
```

- [ ] **Step 2: Run the registry tests and confirm RED**

Run:

```bash
bun test tests/docs-content.test.ts
```

Expected: FAIL because `docs/app/content/index.ts` and content modules do not exist.

- [ ] **Step 3: Create content modules**

Create the five content files using these exact route groups. Migrate the current prose and code samples from the listed Markdown files into structured blocks, preserving headings, code fences, public API symbol names, Bun commands, and package name.

`docs/app/content/home.ts`:

```ts
import {
  codeBlock,
  heading,
  inlineCode,
  link,
  list,
  paragraph,
  type DocPage,
} from './types';

export const homePages: DocPage[] = [
  {
    path: '/',
    title: 'TSone',
    description: '轻量级纯 TypeScript 前端框架，提供响应式系统、组件化和路由功能。',
    section: 'Guide',
    sectionOrder: 1,
    order: 0,
    body: [
      heading(1, 'TSone'),
      paragraph('轻量级纯 TypeScript 前端框架，提供响应式系统、组件化和路由功能。'),
      heading(2, '特性'),
      list([
        ['纯 TypeScript 实现，提供完整的类型支持'],
        ['高效的响应式系统'],
        ['组件化开发模式'],
        ['内置路由功能'],
        ['样式管理系统'],
        ['轻量级设计，无外部依赖'],
        ['Bun 原生工具链：包管理、测试、构建和文档服务均由 Bun 驱动'],
      ]),
      heading(2, '快速开始'),
      paragraph('使用 Bun 安装 ', inlineCode('@geektech/tsone'), '：'),
      codeBlock('bash', 'bun add @geektech/tsone'),
      paragraph('继续阅读 ', link('快速开始', '/guide/getting-started/'), '，或直接查看 ', link('API 文档', '/api/app/'), '。'),
    ],
  },
];
```

`docs/app/content/guide.ts` exports `guidePages` with these pages and source files:

```ts
// Source mapping for migration:
// /guide/getting-started/  <- docs/src/guide/getting-started.md
// /guide/core-concepts/    <- docs/src/guide/core-concepts.md
// /guide/component-system/ <- docs/src/guide/component-system.md
// /guide/reactive-system/  <- docs/src/guide/reactive-system.md
// /guide/router-system/    <- docs/src/guide/router-system.md
// /guide/style-management/ <- docs/src/guide/style-management.md
```

Use this page metadata:

```ts
export const guidePages: DocPage[] = [
  {
    path: '/guide/getting-started/',
    title: '快速开始',
    description: '安装 TSone，创建第一个类组件应用，并使用 Bun 启动示例。',
    section: 'Guide',
    sectionOrder: 1,
    order: 1,
    body: [
      heading(1, '快速开始'),
      paragraph('本指南将帮助您快速上手 TSone 框架。'),
      heading(2, '安装'),
      codeBlock('bash', 'bun add @geektech/tsone'),
      heading(2, '创建第一个应用'),
      codeBlock(
        'ts',
        [
          "import { Component, VNode, createApp } from '@geektech/tsone';",
          '',
          'interface AppState {',
          '  count: number;',
          '}',
          '',
          'class App extends Component<object, AppState> {',
          '  protected initState(): AppState {',
          '    return { count: 0 };',
          '  }',
          '',
          '  protected initStyles(): void {}',
          '',
          '  protected render(): VNode {',
          '    return {',
          "      tag: 'button',",
          '      listeners: {',
          '        click: () => {',
          '          this.state.count += 1;',
          '        },',
          '      },',
          "      children: [`计数: {{count}}`],",
          '    };',
          '  }',
          '}',
          '',
          "createApp({ root: App, rootElement: '#app' }).mount();",
        ].join('\\n')
      ),
      heading(2, '运行应用'),
      codeBlock('bash', 'bun run dev'),
      paragraph('运行示例后，打开本地服务即可看到 TSone 应用。'),
    ],
  },
  // Add the remaining five guide pages listed in the source mapping above.
];
```

For the remaining guide pages, preserve each current document's heading order and code examples. Required terms that must appear in the migrated body text: `Component<Props, State>`, `protected render(): VNode`, `reactive`, `effect`, `computed`, `ref`, `RouterView`, `RouterLink`, `createRouter`, and `StyleManager`.

`docs/app/content/api.ts` exports `apiPages` with these pages and source files:

```ts
// /api/app/       <- docs/src/api/app.md
// /api/component/ <- docs/src/api/component.md
// /api/reactive/  <- docs/src/api/reactive.md
// /api/router/    <- docs/src/api/router.md
// /api/style/     <- docs/src/api/style.md
```

Use `apiTable()` for public API summaries. Required rows:

```ts
apiTable([
  {
    name: 'createApp',
    signature: 'createApp(options?: AppOptions): OneApp',
    description: '创建 TSone 应用实例。',
  },
  {
    name: 'Component<Props, State>',
    signature: 'abstract class Component<Props, State>',
    description: '基于类的组件基类，提供 props、state、生命周期和 render。',
  },
  {
    name: 'RouterView',
    signature: 'class RouterView extends Component',
    description: '渲染当前路由匹配到的组件。',
  },
  {
    name: 'RouterLink',
    signature: 'class RouterLink extends Component<RouterLinkProps>',
    description: '渲染可拦截点击并通过路由导航的链接。',
  },
  {
    name: 'StyleManager',
    signature: 'class StyleManager',
    description: '管理组件样式并写入 style 元素。',
  },
]);
```

`docs/app/content/examples.ts` exports `/examples/basic/` from `docs/src/examples/basic.md`.

`docs/app/content/contributing.ts` exports `/contributing/` from `docs/src/contributing.md` and includes both `bun run docs` and `bun run docs:build`.

- [ ] **Step 4: Create the registry**

Create `docs/app/content/index.ts`:

```ts
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
```

- [ ] **Step 5: Run the content registry tests**

Run:

```bash
bun test tests/docs-content.test.ts
```

Expected: PASS with all 14 routes in stable order.

- [ ] **Step 6: Commit**

```bash
git add tests/docs-content.test.ts docs/app/content
git commit -m "feat: migrate docs content to typed registry"
```

## Task 3: TSone Static Page Components and Build Output

**Files:**
- Create: `tests/docs-build.test.ts`
- Create: `docs/app/components/DocArticle.ts`
- Create: `docs/app/components/DocsNav.ts`
- Create: `docs/app/components/DocsPage.ts`
- Create: `docs/app/styles.ts`
- Rewrite: `scripts/docs.ts`

**Interfaces:**
- Consumes: `docPages`, `DocPage`, `DocBlock`, TSone `Component`, `VNode`.
- Produces: `buildDocs(options?: DocsBuildOptions): Promise<DocsBuildResult>`, `routeToOutputPath(route, outDir)`, `renderDocPage(page, pages)`.

- [ ] **Step 1: Write the failing build tests**

Create `tests/docs-build.test.ts`:

```ts
import {
  existsSync,
  mkdtempSync,
  readFileSync,
  rmSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'bun:test';
import { buildDocs, routeToOutputPath } from '../scripts/docs';

describe('docs static build', () => {
  it('maps MPA routes to directory-style HTML output paths', () => {
    expect(routeToOutputPath('/', '/tmp/docs')).toBe('/tmp/docs/index.html');
    expect(routeToOutputPath('/api/component/', '/tmp/docs')).toBe(
      '/tmp/docs/api/component/index.html'
    );
  });

  it('builds static HTML pages and a client bundle', async () => {
    const outDir = mkdtempSync(join(tmpdir(), 'tsone-docs-'));

    try {
      const result = await buildDocs({ outDir });

      expect(result.pagesBuilt).toBe(14);
      expect(existsSync(join(outDir, 'index.html'))).toBe(true);
      expect(existsSync(join(outDir, 'api/component/index.html'))).toBe(true);
      expect(existsSync(join(outDir, 'assets/docs-client.js'))).toBe(true);

      const home = readFileSync(join(outDir, 'index.html'), 'utf8');
      expect(home).toContain('<!doctype html>');
      expect(home).toContain('data-tsone-docs-page');
      expect(home).toContain('TSone');
      expect(home).toContain('/assets/docs-client.js');

      const componentApi = readFileSync(
        join(outDir, 'api/component/index.html'),
        'utf8'
      );
      expect(componentApi).toContain('Component API');
      expect(componentApi).toContain('protected render(): VNode');
      expect(componentApi).toContain('data-doc-search-root');
      expect(componentApi).toContain('data-doc-theme-root');
    } finally {
      rmSync(outDir, { recursive: true, force: true });
    }
  });
});
```

- [ ] **Step 2: Run the build tests and confirm RED**

Run:

```bash
bun test tests/docs-build.test.ts
```

Expected: FAIL because `buildDocs` and TSone docs components do not exist.

- [ ] **Step 3: Implement `DocArticle`**

Create `docs/app/components/DocArticle.ts`:

```ts
import { Component, VNode } from '../../../lib';
import type { DocBlock, DocInline, DocPage } from '../content';

export interface DocArticleProps {
  page: DocPage;
}

export class DocArticle extends Component<DocArticleProps> {
  protected initState(): object {
    return {};
  }

  protected initStyles(): void {}

  protected render(): VNode {
    return {
      tag: 'article',
      props: { className: 'doc-article' },
      children: [
        {
          tag: 'p',
          props: { className: 'doc-section-label' },
          children: [this.props.page.section],
        },
        ...this.props.page.body.map((block) => this.renderBlock(block)),
      ],
    };
  }

  private renderBlock(block: DocBlock): VNode {
    switch (block.type) {
      case 'heading':
        return {
          tag: `h${block.level}`,
          children: [block.text],
        };
      case 'paragraph':
        return {
          tag: 'p',
          children: this.renderInline(block.content),
        };
      case 'list':
        return {
          tag: 'ul',
          children: block.items.map((item) => ({
            tag: 'li',
            children: this.renderInline(item),
          })),
        };
      case 'code':
        return {
          tag: 'pre',
          children: [
            {
              tag: 'code',
              props: { className: `language-${block.language}` },
              children: [block.code],
            },
          ],
        };
      case 'callout':
        return {
          tag: 'aside',
          props: { className: `doc-callout doc-callout-${block.kind}` },
          children: [
            {
              tag: 'strong',
              children: [block.title],
            },
            {
              tag: 'p',
              children: this.renderInline(block.body),
            },
          ],
        };
      case 'api-table':
        return {
          tag: 'table',
          props: { className: 'doc-api-table' },
          children: [
            {
              tag: 'thead',
              children: [
                {
                  tag: 'tr',
                  children: [
                    { tag: 'th', children: ['Name'] },
                    { tag: 'th', children: ['Signature'] },
                    { tag: 'th', children: ['Description'] },
                  ],
                },
              ],
            },
            {
              tag: 'tbody',
              children: block.rows.map((row) => ({
                tag: 'tr',
                children: [
                  { tag: 'td', children: [{ tag: 'code', children: [row.name] }] },
                  {
                    tag: 'td',
                    children: [{ tag: 'code', children: [row.signature] }],
                  },
                  { tag: 'td', children: [row.description] },
                ],
              })),
            },
          ],
        };
    }
  }

  private renderInline(content: DocInline[]): Array<VNode | string> {
    return content.map((item) => {
      if (typeof item === 'string') {
        return item;
      }

      if (item.type === 'code') {
        return {
          tag: 'code',
          children: [item.text],
        };
      }

      return {
        tag: 'a',
        props: { href: item.href },
        children: [item.text],
      };
    });
  }
}
```

- [ ] **Step 4: Implement `DocsNav`**

Create `docs/app/components/DocsNav.ts`:

```ts
import { Component, VNode } from '../../../lib';
import type { DocPage } from '../content';

export interface DocsNavProps {
  pages: DocPage[];
  currentPath: string;
}

export class DocsNav extends Component<DocsNavProps> {
  protected initState(): object {
    return {};
  }

  protected initStyles(): void {}

  protected render(): VNode {
    return {
      tag: 'nav',
      props: {
        className: 'docs-nav',
        'aria-label': 'Documentation',
      },
      children: this.groupPages().map(([section, pages]) => ({
        tag: 'section',
        props: { className: 'docs-nav-section' },
        children: [
          {
            tag: 'h2',
            children: [section],
          },
          {
            tag: 'ul',
            children: pages.map((page) => ({
              tag: 'li',
              children: [
                {
                  tag: 'a',
                  props: {
                    href: page.path,
                    className:
                      page.path === this.props.currentPath ? 'active' : '',
                    'aria-current':
                      page.path === this.props.currentPath ? 'page' : undefined,
                  },
                  children: [page.title],
                },
              ],
            })),
          },
        ],
      })),
    };
  }

  private groupPages(): Array<[string, DocPage[]]> {
    const groups = new Map<string, DocPage[]>();

    this.props.pages.forEach((page) => {
      const pages = groups.get(page.section) ?? [];
      pages.push(page);
      groups.set(page.section, pages);
    });

    return [...groups.entries()];
  }
}
```

- [ ] **Step 5: Implement `DocsPage`**

Create `docs/app/components/DocsPage.ts`:

```ts
import { Component, VNode } from '../../../lib';
import type { DocPage } from '../content';
import { DocArticle } from './DocArticle';
import { DocsNav } from './DocsNav';

export interface DocsPageProps {
  page: DocPage;
  pages: DocPage[];
}

export class DocsPage extends Component<DocsPageProps> {
  protected initState(): object {
    return {};
  }

  protected initStyles(): void {}

  protected render(): VNode {
    return {
      tag: 'div',
      props: {
        className: 'docs-shell',
        'data-tsone-docs-page': this.props.page.path,
      },
      children: [
        {
          tag: 'header',
          props: { className: 'docs-topbar' },
          children: [
            {
              tag: 'a',
              props: { href: '/', className: 'docs-brand' },
              children: ['TSone'],
            },
            {
              tag: 'div',
              props: {
                className: 'docs-tools',
                'data-doc-theme-root': '',
              },
              children: [],
            },
          ],
        },
        {
          tag: 'div',
          props: { className: 'docs-layout' },
          children: [
            {
              tag: 'aside',
              props: { className: 'docs-sidebar' },
              children: [
                {
                  tag: 'div',
                  props: {
                    className: 'docs-search',
                    'data-doc-search-root': '',
                  },
                  children: [],
                },
                {
                  component: DocsNav,
                  props: {
                    pages: this.props.pages,
                    currentPath: this.props.page.path,
                  },
                },
              ],
            },
            {
              tag: 'main',
              props: { className: 'docs-main' },
              children: [
                {
                  component: DocArticle,
                  props: { page: this.props.page },
                },
              ],
            },
          ],
        },
      ],
    };
  }
}
```

- [ ] **Step 6: Add static CSS**

Create `docs/app/styles.ts`:

```ts
export const docsCss = `
:root {
  color-scheme: light;
  --docs-bg: #ffffff;
  --docs-surface: #f8fafc;
  --docs-text: #162033;
  --docs-muted: #5f6b7a;
  --docs-border: #d9e2ec;
  --docs-accent: #1565c0;
  --docs-code-bg: #0f172a;
  --docs-code-text: #e2e8f0;
}

:root[data-theme='dark'] {
  color-scheme: dark;
  --docs-bg: #10141f;
  --docs-surface: #171d2b;
  --docs-text: #edf2f7;
  --docs-muted: #a8b3c2;
  --docs-border: #2a3446;
  --docs-accent: #73b7ff;
  --docs-code-bg: #060914;
  --docs-code-text: #dbeafe;
}

body {
  margin: 0;
  background: var(--docs-bg);
  color: var(--docs-text);
  font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}

.docs-shell {
  min-height: 100vh;
}

.docs-topbar {
  align-items: center;
  border-bottom: 1px solid var(--docs-border);
  display: flex;
  gap: 24px;
  justify-content: space-between;
  min-height: 56px;
  padding: 0 28px;
}

.docs-brand {
  color: var(--docs-text);
  font-size: 18px;
  font-weight: 700;
  text-decoration: none;
}

.docs-layout {
  display: grid;
  grid-template-columns: 280px minmax(0, 1fr);
  min-height: calc(100vh - 57px);
}

.docs-sidebar {
  background: var(--docs-surface);
  border-right: 1px solid var(--docs-border);
  padding: 20px 18px;
}

.docs-nav-section + .docs-nav-section {
  margin-top: 22px;
}

.docs-nav h2 {
  color: var(--docs-muted);
  font-size: 12px;
  letter-spacing: 0;
  margin: 0 0 8px;
  text-transform: uppercase;
}

.docs-nav ul {
  list-style: none;
  margin: 0;
  padding: 0;
}

.docs-nav a {
  border-radius: 6px;
  color: var(--docs-muted);
  display: block;
  font-size: 14px;
  line-height: 1.4;
  padding: 7px 9px;
  text-decoration: none;
}

.docs-nav a.active,
.docs-nav a:hover {
  background: rgba(21, 101, 192, 0.12);
  color: var(--docs-accent);
}

.docs-main {
  max-width: 920px;
  padding: 44px 56px 72px;
}

.doc-section-label {
  color: var(--docs-accent);
  font-size: 13px;
  font-weight: 700;
  margin: 0 0 12px;
}

.doc-article h1 {
  font-size: 42px;
  line-height: 1.12;
  margin: 0 0 18px;
}

.doc-article h2 {
  border-top: 1px solid var(--docs-border);
  font-size: 26px;
  margin: 36px 0 14px;
  padding-top: 28px;
}

.doc-article h3 {
  font-size: 20px;
  margin: 28px 0 10px;
}

.doc-article p,
.doc-article li {
  color: var(--docs-muted);
  font-size: 16px;
  line-height: 1.75;
}

.doc-article a {
  color: var(--docs-accent);
}

.doc-article code {
  background: var(--docs-surface);
  border: 1px solid var(--docs-border);
  border-radius: 4px;
  color: var(--docs-text);
  font-size: 0.92em;
  padding: 2px 5px;
}

.doc-article pre {
  background: var(--docs-code-bg);
  border-radius: 8px;
  color: var(--docs-code-text);
  overflow: auto;
  padding: 16px;
}

.doc-article pre code {
  background: transparent;
  border: 0;
  color: inherit;
  padding: 0;
}

.doc-api-table {
  border-collapse: collapse;
  width: 100%;
}

.doc-api-table th,
.doc-api-table td {
  border-bottom: 1px solid var(--docs-border);
  padding: 10px;
  text-align: left;
  vertical-align: top;
}

.doc-callout {
  border: 1px solid var(--docs-border);
  border-left: 4px solid var(--docs-accent);
  border-radius: 8px;
  padding: 14px 16px;
}

.docs-search input {
  border: 1px solid var(--docs-border);
  border-radius: 6px;
  box-sizing: border-box;
  color: var(--docs-text);
  font: inherit;
  padding: 8px 10px;
  width: 100%;
}

.docs-search-results {
  list-style: none;
  margin: 10px 0 18px;
  padding: 0;
}

.docs-search-results a {
  color: var(--docs-text);
  display: block;
  font-size: 14px;
  padding: 5px 0;
}

.docs-theme-toggle {
  border: 1px solid var(--docs-border);
  border-radius: 6px;
  background: var(--docs-surface);
  color: var(--docs-text);
  cursor: pointer;
  font: inherit;
  padding: 7px 10px;
}

@media (max-width: 820px) {
  .docs-layout {
    display: block;
  }

  .docs-sidebar {
    border-right: 0;
    border-bottom: 1px solid var(--docs-border);
  }

  .docs-main {
    padding: 32px 22px 56px;
  }

  .doc-article h1 {
    font-size: 34px;
  }
}
`;
```

- [ ] **Step 7: Implement static rendering and build output**

Rewrite `scripts/docs.ts` around static generation:

```ts
import { mkdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { dirname, extname, join, normalize } from 'node:path';
import { Window } from 'happy-dom';
import { DocsPage } from '../docs/app/components/DocsPage';
import { docPages, type DocPage } from '../docs/app/content';
import { docsCss } from '../docs/app/styles';

export interface DocsBuildOptions {
  outDir?: string;
}

export interface DocsBuildResult {
  outDir: string;
  pagesBuilt: number;
  assetsBuilt: string[];
}

const DEFAULT_OUT_DIR = 'docs/dist';

export function routeToOutputPath(route: string, outDir: string): string {
  if (route === '/') {
    return join(outDir, 'index.html');
  }

  return join(outDir, route.replace(/^\/+|\/+$/g, ''), 'index.html');
}

export async function buildDocs(
  options: DocsBuildOptions = {}
): Promise<DocsBuildResult> {
  const outDir = options.outDir ?? DEFAULT_OUT_DIR;

  await rm(outDir, { recursive: true, force: true });
  await mkdir(join(outDir, 'assets'), { recursive: true });

  const assetsBuilt = await buildClientBundle(outDir);

  for (const page of docPages) {
    const html = renderDocPage(page, docPages);
    const outputPath = routeToOutputPath(page.path, outDir);
    await mkdir(dirname(outputPath), { recursive: true });
    await writeFile(outputPath, html);
  }

  return {
    outDir,
    pagesBuilt: docPages.length,
    assetsBuilt,
  };
}

export function renderDocPage(page: DocPage, pages: DocPage[]): string {
  installBuildDom(page.path);
  const root = document.createElement('div');
  root.id = 'app';
  document.body.appendChild(root);

  const instance = new DocsPage({ page, pages });
  instance.mount(root);

  return [
    '<!doctype html>',
    '<html lang="zh-CN">',
    '<head>',
    '  <meta charset="utf-8">',
    '  <meta name="viewport" content="width=device-width, initial-scale=1">',
    `  <title>${escapeHtml(page.title)} - TSone Docs</title>`,
    `  <meta name="description" content="${escapeHtml(page.description)}">`,
    `  <style>${docsCss}</style>`,
    '</head>',
    '<body>',
    root.innerHTML,
    '  <script type="module" src="/assets/docs-client.js"></script>',
    '</body>',
    '</html>',
  ].join('\n');
}

async function buildClientBundle(outDir: string): Promise<string[]> {
  const result = await Bun.build({
    entrypoints: ['./docs/app/client.ts'],
    target: 'browser',
    format: 'esm',
    sourcemap: 'inline',
    write: false,
  });

  if (!result.success || !result.outputs[0]) {
    result.logs.forEach((log) => console.error(log));
    throw new Error('Failed to build docs client bundle');
  }

  const outputPath = join(outDir, 'assets/docs-client.js');
  await writeFile(outputPath, await result.outputs[0].text());
  return [outputPath];
}

function installBuildDom(route: string): void {
  const window = new Window({ url: `http://127.0.0.1${route}` });
  const keys = [
    'window',
    'document',
    'Node',
    'Text',
    'Comment',
    'Element',
    'HTMLElement',
    'HTMLInputElement',
    'HTMLTextAreaElement',
    'HTMLSelectElement',
    'HTMLButtonElement',
    'DocumentFragment',
    'Event',
    'MouseEvent',
    'KeyboardEvent',
    'CustomEvent',
    'EventTarget',
    'history',
    'location',
    'navigator',
    'localStorage',
  ] as const;

  keys.forEach((key) => {
    Object.defineProperty(globalThis, key, {
      configurable: true,
      writable: true,
      value: window[key],
    });
  });
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
```

Keep the old server-only code deleted from this file. `startDocsServer()` is added in Task 5.

- [ ] **Step 8: Run build tests**

Run:

```bash
bun test tests/docs-content.test.ts tests/docs-build.test.ts
```

Expected: PASS after Task 4 adds `docs/app/client.ts`; before Task 4, `tests/docs-build.test.ts` may fail with missing `docs/app/client.ts`. If it fails only for the missing client entry, proceed to Task 4 before committing Task 3.

## Task 4: Client Enhancement Islands

**Files:**
- Create: `docs/app/components/SearchBox.ts`
- Create: `docs/app/components/ThemeToggle.ts`
- Create: `docs/app/client.ts`
- Modify: `tests/docs-build.test.ts`

**Interfaces:**
- Consumes: `searchEntries`, TSone `createApp`, `Component`, `VNode`.
- Produces: `SearchBox`, `ThemeToggle`, `mountDocsClient()`.

- [ ] **Step 1: Extend build test for client bundle content**

Add these assertions inside the `builds static HTML pages and a client bundle` test in `tests/docs-build.test.ts` after checking the bundle exists:

```ts
const clientBundle = readFileSync(
  join(outDir, 'assets/docs-client.js'),
  'utf8'
);
expect(clientBundle).toContain('mountDocsClient');
expect(clientBundle).toContain('data-doc-search-root');
expect(clientBundle).toContain('data-doc-theme-root');
```

- [ ] **Step 2: Run the build test and confirm RED**

Run:

```bash
bun test tests/docs-build.test.ts
```

Expected: FAIL because the client files are missing.

- [ ] **Step 3: Implement `SearchBox`**

Create `docs/app/components/SearchBox.ts`:

```ts
import { Component, VNode } from '../../../lib';
import type { SearchEntry } from '../content';

export interface SearchBoxProps {
  entries: SearchEntry[];
}

interface SearchBoxState {
  query: string;
}

export class SearchBox extends Component<SearchBoxProps, SearchBoxState> {
  protected initState(): SearchBoxState {
    return { query: '' };
  }

  protected initStyles(): void {}

  protected render(): VNode {
    const query = this.state.query.trim().toLowerCase();
    const matches =
      query.length === 0
        ? []
        : this.props.entries
            .filter(
              (entry) =>
                entry.title.toLowerCase().includes(query) ||
                entry.section.toLowerCase().includes(query) ||
                entry.text.includes(query)
            )
            .slice(0, 8);

    return {
      tag: 'div',
      props: {
        className: 'docs-search-widget',
        'data-doc-search-root': '',
      },
      children: [
        {
          tag: 'input',
          props: {
            type: 'search',
            value: this.state.query,
            'aria-label': '搜索文档',
          },
          listeners: {
            input: (event: Event) => {
              this.state.query = (event.target as HTMLInputElement).value;
            },
          },
        },
        {
          tag: 'ul',
          props: { className: 'docs-search-results' },
          children: matches.map((entry) => ({
            tag: 'li',
            children: [
              {
                tag: 'a',
                props: { href: entry.path },
                children: [`${entry.section} / ${entry.title}`],
              },
            ],
          })),
        },
      ],
    };
  }
}
```

- [ ] **Step 4: Implement `ThemeToggle`**

Create `docs/app/components/ThemeToggle.ts`:

```ts
import { Component, VNode } from '../../../lib';

type ThemeMode = 'light' | 'dark';

interface ThemeToggleState {
  mode: ThemeMode;
}

export class ThemeToggle extends Component<object, ThemeToggleState> {
  protected initState(): ThemeToggleState {
    return { mode: readTheme() };
  }

  protected initStyles(): void {}

  protected onMounted(): void {
    applyTheme(this.state.mode);
  }

  protected render(): VNode {
    return {
      tag: 'button',
      props: {
        type: 'button',
        className: 'docs-theme-toggle',
        'aria-label': '切换文档主题',
      },
      listeners: {
        click: () => {
          this.state.mode = this.state.mode === 'dark' ? 'light' : 'dark';
          localStorage.setItem('tsone-docs-theme', this.state.mode);
          applyTheme(this.state.mode);
        },
      },
      children: [this.state.mode === 'dark' ? '浅色' : '深色'],
    };
  }
}

function readTheme(): ThemeMode {
  const stored = localStorage.getItem('tsone-docs-theme');
  return stored === 'dark' ? 'dark' : 'light';
}

function applyTheme(mode: ThemeMode): void {
  document.documentElement.dataset.theme = mode;
}
```

- [ ] **Step 5: Implement client mounting**

Create `docs/app/client.ts`:

```ts
import { searchEntries } from './content';
import { SearchBox } from './components/SearchBox';
import { ThemeToggle } from './components/ThemeToggle';

export function mountDocsClient(): void {
  const searchRoot = document.querySelector('[data-doc-search-root]');
  if (searchRoot) {
    searchRoot.textContent = '';
    new SearchBox({ entries: searchEntries }).mount(searchRoot as HTMLElement);
  }

  const themeRoot = document.querySelector('[data-doc-theme-root]');
  if (themeRoot) {
    themeRoot.textContent = '';
    new ThemeToggle().mount(themeRoot as HTMLElement);
  }
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mountDocsClient, {
      once: true,
    });
  } else {
    mountDocsClient();
  }
}
```

- [ ] **Step 6: Run build tests**

Run:

```bash
bun test tests/docs-content.test.ts tests/docs-build.test.ts
```

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add tests/docs-build.test.ts docs/app/components docs/app/styles.ts docs/app/client.ts scripts/docs.ts
git commit -m "feat: build tsone static docs pages"
```

## Task 5: Static Preview Server and Commands

**Files:**
- Modify: `scripts/docs.ts`
- Modify: `tests/docs-server.test.ts`
- Modify: `package.json`

**Interfaces:**
- Consumes: `buildDocs(options)`, `routeToOutputPath(route, outDir)`.
- Produces: `resolveDocsServerOptions(argv, env)`, `startDocsServer(options)`.

- [ ] **Step 1: Replace docs server tests**

Rewrite `tests/docs-server.test.ts`:

```ts
import {
  mkdtempSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'bun:test';
import {
  resolveDocsServerOptions,
  startDocsServer,
} from '../scripts/docs';

let server: ReturnType<typeof Bun.serve> | undefined;

function getAvailablePort(): number {
  const probe = Bun.serve({
    port: 0,
    fetch: () => new Response('ok'),
  });
  const port = probe.port;
  probe.stop(true);
  return port;
}

afterEach(() => {
  server?.stop(true);
  server = undefined;
});

describe('TSone docs preview server', () => {
  it('resolves host, port, and output directory from args', () => {
    expect(
      resolveDocsServerOptions([
        'bun',
        'scripts/docs.ts',
        '--host',
        '127.0.0.1',
        '--port',
        '51234',
        '--out-dir',
        '/tmp/docs',
      ])
    ).toEqual({
      hostname: '127.0.0.1',
      port: 51234,
      outDir: '/tmp/docs',
    });
  });

  it('serves prebuilt static docs output', async () => {
    const outDir = mkdtempSync(join(tmpdir(), 'tsone-docs-server-'));
    writeFileSync(join(outDir, 'index.html'), '<h1>Docs Home</h1>');
    writeFileSync(join(outDir, 'asset.txt'), 'asset');
    const port = getAvailablePort();

    try {
      server = await startDocsServer({
        hostname: '127.0.0.1',
        port,
        outDir,
      });

      const home = await fetch(`http://127.0.0.1:${port}/`);
      expect(home.ok).toBe(true);
      expect(await home.text()).toContain('Docs Home');

      const asset = await fetch(`http://127.0.0.1:${port}/asset.txt`);
      expect(asset.ok).toBe(true);
      expect(asset.headers.get('content-type')).toContain('text/plain');
      expect(await asset.text()).toBe('asset');
    } finally {
      rmSync(outDir, { recursive: true, force: true });
    }
  });
});
```

- [ ] **Step 2: Run docs server tests and confirm RED**

Run:

```bash
bun test tests/docs-server.test.ts
```

Expected: FAIL because `resolveDocsServerOptions` and `startDocsServer` do not exist.

- [ ] **Step 3: Implement server options and static serving**

Add these exports to `scripts/docs.ts`, below the build functions:

```ts
export interface DocsServerOptions {
  hostname: string;
  port: number;
  outDir: string;
}

function readOption(args: string[], name: string): string | undefined {
  const inlinePrefix = `${name}=`;
  const inline = args.find((arg) => arg.startsWith(inlinePrefix));
  if (inline) {
    return inline.slice(inlinePrefix.length);
  }

  const index = args.indexOf(name);
  const value = index >= 0 ? args[index + 1] : undefined;
  return value && !value.startsWith('--') ? value : undefined;
}

function parsePort(value: string): number {
  const port = Number(value);
  if (!Number.isInteger(port) || port < 0 || port > 65535) {
    throw new Error(`Invalid docs server port: ${value}`);
  }

  return port;
}

export function resolveDocsServerOptions(
  argv: string[] = Bun.argv,
  env: Record<string, string | undefined> = process.env
): DocsServerOptions {
  const args = argv.slice(2);
  return {
    hostname: readOption(args, '--host') ?? env.HOST ?? '127.0.0.1',
    port: parsePort(readOption(args, '--port') ?? env.PORT ?? '5173'),
    outDir: readOption(args, '--out-dir') ?? env.DOCS_OUT_DIR ?? DEFAULT_OUT_DIR,
  };
}

export async function startDocsServer(
  options = resolveDocsServerOptions()
): Promise<ReturnType<typeof Bun.serve>> {
  if (!(await fileExists(join(options.outDir, 'index.html')))) {
    await buildDocs({ outDir: options.outDir });
  }

  const server = Bun.serve({
    hostname: options.hostname,
    port: options.port,
    fetch: (request) => serveDocsFile(request, options.outDir),
  });

  console.log(`TSone docs: http://${options.hostname}:${server.port}/`);
  return server;
}

async function serveDocsFile(
  request: Request,
  outDir: string
): Promise<Response> {
  const url = new URL(request.url);
  const pathname = decodeURIComponent(url.pathname);
  const filePath = resolveStaticFile(outDir, pathname);

  if (!filePath) {
    return new Response('Not found', { status: 404 });
  }

  try {
    return new Response(await readFile(filePath), {
      headers: { 'content-type': contentType(filePath) },
    });
  } catch {
    return new Response('Not found', { status: 404 });
  }
}

function resolveStaticFile(outDir: string, pathname: string): string | null {
  if (pathname.includes('..')) {
    return null;
  }

  const normalizedPath = pathname === '/' ? '/index.html' : pathname;
  const candidate =
    extname(normalizedPath) === ''
      ? join(outDir, normalizedPath, 'index.html')
      : join(outDir, normalizedPath);
  const normalizedCandidate = normalize(candidate);
  const normalizedOutDir = normalize(outDir);

  return normalizedCandidate.startsWith(normalizedOutDir)
    ? normalizedCandidate
    : null;
}

function contentType(filePath: string): string {
  if (filePath.endsWith('.html')) {
    return 'text/html; charset=utf-8';
  }
  if (filePath.endsWith('.js')) {
    return 'text/javascript; charset=utf-8';
  }
  if (filePath.endsWith('.css')) {
    return 'text/css; charset=utf-8';
  }
  if (filePath.endsWith('.json')) {
    return 'application/json; charset=utf-8';
  }
  return 'text/plain; charset=utf-8';
}

async function fileExists(path: string): Promise<boolean> {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
}

if (import.meta.main) {
  await startDocsServer();
}
```

- [ ] **Step 4: Add `docs:build` script**

Modify `package.json` scripts:

```json
{
  "scripts": {
    "dev": "bun scripts/dev.ts",
    "docs": "bun scripts/docs.ts",
    "docs:build": "bun scripts/docs.ts --build",
    "build": "bun scripts/build.ts",
    "build:types": "bunx tsc --project tsconfig.build.json",
    "lint": "eslint . --ext .ts",
    "format": "prettier --write *.ts",
    "test": "bun test",
    "preview": "bun scripts/docs.ts"
  }
}
```

Then update `scripts/docs.ts` main handling so `--build` runs `buildDocs()` and exits:

```ts
if (import.meta.main) {
  if (Bun.argv.slice(2).includes('--build')) {
    await buildDocs();
  } else {
    await startDocsServer();
  }
}
```

- [ ] **Step 5: Run server and build tests**

Run:

```bash
bun test tests/docs-build.test.ts tests/docs-server.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add scripts/docs.ts tests/docs-server.test.ts package.json
git commit -m "feat: serve generated docs output"
```

## Task 6: Public Documentation Contracts and Markdown Source Removal

**Files:**
- Modify: `tests/public-api-docs.test.ts`
- Modify: `tests/repository-hygiene.test.ts`
- Modify: `.gitignore`
- Modify: `README.md`
- Delete: `docs/src/`

**Interfaces:**
- Consumes: `docPages`, `docText`.
- Produces: tests that no longer depend on `docs/src/**/*.md`.

- [ ] **Step 1: Update public API docs tests**

Modify `tests/public-api-docs.test.ts` so it imports typed docs content instead of reading Markdown files:

```ts
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'bun:test';
import { docPages, docText } from '../docs/app/content';

const root = process.cwd();

function readText(path: string): string {
  return readFileSync(join(root, path), 'utf8');
}

function packageVersion(): string {
  return JSON.parse(readText('package.json')).version as string;
}

function packageName(): string {
  return JSON.parse(readText('package.json')).name as string;
}

function docsTextFor(path: string): string {
  const page = docPages.find((item) => item.path === path);
  if (!page) {
    throw new Error(`Missing docs page: ${path}`);
  }

  return docText(page);
}

describe('public API documentation', () => {
  it('keeps README examples aligned with current package metadata and Bun commands', () => {
    const readme = readText('README.md');

    expect(readme).toContain(`version: '${packageVersion()}'`);
    expect(readme).toContain(`bun add ${packageName()}`);
    expect(readme).not.toMatch(/version:\s*['"]0\.0\.0['"]/);
    expect(readme).toContain('bun run build');
    expect(readme).toContain('bun run dev');
    expect(readme).toContain('bun run docs');
    expect(readme).toContain('bun run docs:build');
    expect(readme).toContain('bun test');
  });

  it('documents the public root exports used by framework consumers', () => {
    const readme = readText('README.md');
    const appApi = docsTextFor('/api/app/');
    const componentApi = docsTextFor('/api/component/');
    const reactiveApi = docsTextFor('/api/reactive/');

    for (const symbol of [
      'createApp',
      'Component',
      'Div',
      'Span',
      'P',
      'Button',
      'Input',
      'VNode',
      'reactive',
      'effect',
      'computed',
    ]) {
      expect(readme).toContain(symbol);
    }

    expect(appApi).toContain('root');
    expect(appApi).toContain('createApp({ root: App');
    expect(componentApi).toContain('Component<Props, State>');
    expect(componentApi).toContain('protected render(): VNode');
    expect(reactiveApi).toContain('computed');
  });

  it('documents RouterView and RouterLink as public router component exits', () => {
    const readme = readText('README.md');
    const routerApi = docsTextFor('/api/router/');

    expect(readme).toContain('RouterView');
    expect(readme).toContain('RouterLink');
    expect(routerApi).toContain('RouterView');
    expect(routerApi).toContain('RouterLink');
    expect(routerApi).toContain('createRouter({ routes');
  });
});
```

- [ ] **Step 2: Update repository hygiene tests**

Modify `tests/repository-hygiene.test.ts`:

```ts
const forbiddenPatterns = [
  /^\.DS_Store$/,
  /^coverage\//,
  /(^|\/)node_modules\//,
  /(^|\/)\.vite\//,
  /(^|\/)\.pnpm-store\//,
  /^dist\//,
  /^docs\/dist\//,
];
```

And add this assertion:

```ts
expect(gitIgnoreMatches('docs/dist/index.html')).toBe(true);
```

- [ ] **Step 3: Ignore docs dist**

Modify `.gitignore`:

```gitignore
node_modules/
dist/
.pnpm-store/
.DS_Store
coverage/
*.log
.env*
.worktrees/
docs/node_modules/
docs/dist/
docs/src/.vitepress/cache/
docs/src/.vitepress/dist/
```

- [ ] **Step 4: Update README command section**

In `README.md`, keep the existing `bun run docs` command and add:

```md
生成静态文档产物：

```bash
bun run docs:build
```
```

Also update any wording that says docs are served directly from Markdown so it says docs content lives in the TSone TypeScript documentation system.

- [ ] **Step 5: Delete old Markdown source**

Delete the old docs source tree:

```bash
rm -rf docs/src
```

Before running this command, confirm Tasks 1-5 are committed so the current Markdown content has already been migrated to `docs/app/content/*.ts`.

- [ ] **Step 6: Run public docs and hygiene tests**

Run:

```bash
bun test tests/public-api-docs.test.ts tests/repository-hygiene.test.ts tests/docs-content.test.ts
```

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add tests/public-api-docs.test.ts tests/repository-hygiene.test.ts .gitignore README.md docs/app/content
git add -u docs/src
git commit -m "docs: move documentation source into tsone app"
```

## Task 7: Typecheck, Build, and Final Verification

**Files:**
- Modify only files needed to fix verification failures discovered by the commands below.

**Interfaces:**
- Consumes: all previous task outputs.
- Produces: verified TSone-generated docs system.

- [ ] **Step 1: Run focused docs tests**

Run:

```bash
bun test tests/docs-content.test.ts tests/docs-build.test.ts tests/docs-server.test.ts
```

Expected: PASS.

- [ ] **Step 2: Run public docs and repository hygiene tests**

Run:

```bash
bun test tests/public-api-docs.test.ts tests/repository-hygiene.test.ts
```

Expected: PASS.

- [ ] **Step 3: Run TypeScript checking**

Run:

```bash
bunx tsc --noEmit
```

Expected: PASS. If docs files are not included by the root `tsconfig.json`, update `tsconfig.json` `include` to include `"docs/app"` and rerun this command.

- [ ] **Step 4: Run package build**

Run:

```bash
bun run build
```

Expected: PASS and no generated docs files are staged.

- [ ] **Step 5: Build docs output**

Run:

```bash
bun run docs:build
```

Expected: PASS and `docs/dist/index.html`, `docs/dist/api/component/index.html`, and `docs/dist/assets/docs-client.js` exist locally but remain ignored by git.

- [ ] **Step 6: Run full tests**

Run:

```bash
bun test
```

Expected: PASS.

- [ ] **Step 7: Inspect git status**

Run:

```bash
git status --short
```

Expected: only intentional source/test/doc changes are listed; `docs/dist` is absent because it is ignored.

- [ ] **Step 8: Commit final fixes**

If verification required small fixes after Task 6, commit them:

```bash
git add .
git commit -m "test: verify tsone docs system"
```

Skip this commit if there are no additional source changes after Task 6.

## Self-Review

- Spec coverage: The plan covers typed content registry, TSone static MPA generation, client islands, static preview, command changes, Markdown source removal, docs output ignore rules, and tests.
- Placeholder scan: The plan contains no open requirement markers or unnamed implementation files.
- Type consistency: `DocPage`, `DocBlock`, `SearchEntry`, `buildDocs`, `routeToOutputPath`, `renderDocPage`, `startDocsServer`, and `resolveDocsServerOptions` are named consistently across tasks.
