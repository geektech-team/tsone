import { describe, expect, it } from 'bun:test';
import { ONE_THEME_DEFAULTS } from '../lib';
import {
  headingsForPage,
  normalizeOneDocPath,
  oneDocPages,
  validateOneDocPages,
  type OneDocPage,
} from '../docs/app/content';

const APPROVED_PATHS = [
  '/',
  '/guide/design/',
  '/guide/getting-started/',
  '/guide/theming/',
  '/components/button/',
  '/components/input/',
  '/components/card/',
];

function pageAt(path: string): OneDocPage {
  const page = oneDocPages.find((candidate) => candidate.path === path);
  if (!page) throw new Error(`Missing page: ${path}`);
  return page;
}

function pageText(path: string): string {
  return JSON.stringify(pageAt(path));
}

function apiRowAt(path: string, name: string) {
  const row = pageAt(path)
    .body.flatMap((block) => (block.type === 'api-table' ? block.rows : []))
    .find((candidate) => candidate.name === name);
  if (!row) throw new Error(`Missing API row: ${path} ${name}`);
  return row;
}

function themeTokenFor(key: string): string {
  return `--one-${key.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)}`;
}

function validPage(overrides: Partial<OneDocPage> = {}): OneDocPage {
  return {
    path: '/valid/',
    title: 'Valid page',
    description: 'A valid documentation page.',
    section: '指南',
    sectionOrder: 1,
    order: 1,
    body: [{ type: 'heading', level: 1, id: 'valid', text: 'Valid' }],
    ...overrides,
  };
}

describe('One UI docs content', () => {
  it('defines exactly the seven approved routes in stable order', () => {
    expect(oneDocPages.map((page) => page.path)).toEqual(APPROVED_PATHS);
  });

  it('normalizes supported routes and rejects malformed routes', () => {
    expect(normalizeOneDocPath('guide/design')).toBe('/guide/design/');
    expect(normalizeOneDocPath('/guide/design.md')).toBe('/guide/design/');
    expect(normalizeOneDocPath('/')).toBe('/');

    for (const path of [
      '',
      '/Guide/design/',
      '/guide//design/',
      '/bad path/',
    ]) {
      expect(() => normalizeOneDocPath(path)).toThrow(
        'Invalid One UI documentation route'
      );
    }
  });

  it('rejects duplicate routes and incomplete page records', () => {
    expect(() =>
      validateOneDocPages([validPage(), validPage({ path: '/valid.md' })])
    ).toThrow('Duplicate One UI documentation route: /valid/');
    expect(() => validateOneDocPages([validPage({ title: ' ' })])).toThrow(
      'has no title'
    );
    expect(() =>
      validateOneDocPages([validPage({ description: ' ' })])
    ).toThrow('has no description');
    expect(() => validateOneDocPages([validPage({ body: [] })])).toThrow(
      'has no content'
    );
    expect(() =>
      validateOneDocPages([
        validPage({
          body: [
            { type: 'heading', level: 1, id: 'same', text: 'First' },
            { type: 'heading', level: 2, id: 'same', text: 'Second' },
          ],
        }),
      ])
    ).toThrow('Duplicate heading id on /valid/: same');
  });

  it('derives the ordered table of contents from page headings', () => {
    expect(headingsForPage(pageAt('/components/card/'))).toEqual([
      { id: 'card', level: 1, text: 'OneCard' },
      { id: 'slots', level: 2, text: '插槽与优先级' },
      { id: 'api', level: 2, text: 'API' },
    ]);
  });

  it('covers the required home and guide content with exported APIs', () => {
    const home = pageText('/');
    expect(home).toContain('轻量级');
    expect(home).toContain('bun add @geektech/tsone @geektech/one');
    for (const path of [
      '/components/button/',
      '/components/input/',
      '/components/card/',
    ]) {
      expect(home).toContain(path);
    }

    const design = pageText('/guide/design/');
    for (const term of [
      '零运行时依赖',
      '类组件',
      '组合优于额外继承',
      '可访问性',
      'CSS Variables',
    ]) {
      expect(design).toContain(term);
    }

    const gettingStarted = pageText('/guide/getting-started/');
    for (const api of [
      "from '@geektech/tsone'",
      "from '@geektech/one'",
      'createApp',
      'OneButton',
      'OneInput',
      'OneCard',
    ]) {
      expect(gettingStarted).toContain(api);
    }
  });

  it('documents every immutable theme default and both override scopes', () => {
    const theming = pageText('/guide/theming/');
    for (const [key, value] of Object.entries(ONE_THEME_DEFAULTS)) {
      const row = apiRowAt('/guide/theming/', themeTokenFor(key));
      expect(row.signature).toContain(`${key}:`);
      expect(row.signature).toContain(value);
    }
    expect(theming).toContain(
      "import { ONE_THEME_DEFAULTS } from '@geektech/one'"
    );
    expect(theming).toContain(':root');
    expect(theming).toContain('.checkout-panel');
  });

  it('documents every OneButton prop and click event signature', () => {
    const text = pageText('/components/button/');
    for (const fragment of [
      "type?: 'button' | 'submit' | 'reset'",
      'disabled?: boolean',
      'loading?: boolean',
      'children?: Array<VNode | string>',
      'click',
      '(event: MouseEvent) => void',
      "variant: 'primary'",
      "variant: 'secondary'",
      "variant: 'danger'",
      "size: 'sm'",
      "size: 'md'",
      "size: 'lg'",
    ]) {
      expect(text).toContain(fragment);
    }
    expect(apiRowAt('/components/button/', 'variant').signature).toBe(
      'variant?: OneButtonVariant'
    );
    expect(apiRowAt('/components/button/', 'variant').description).toContain(
      "'primary' | 'secondary' | 'danger'"
    );
    expect(apiRowAt('/components/button/', 'size').signature).toBe(
      'size?: OneComponentSize'
    );
    expect(apiRowAt('/components/button/', 'size').description).toContain(
      "'sm' | 'md' | 'lg'"
    );
  });

  it('documents every OneInput prop, event, payload and state mode', () => {
    const text = pageText('/components/input/');
    for (const fragment of [
      'value?: string',
      'defaultValue?: string',
      'type?: string',
      'name?: string',
      'placeholder?: string',
      'disabled?: boolean',
      'readonly?: boolean',
      'required?: boolean',
      'invalid?: boolean',
      'ariaLabel?: string',
      'input',
      'change',
      'OneInputValueEvent',
      'value: string',
      'originalEvent: Event',
      '受控',
      '非受控',
    ]) {
      expect(text).toContain(fragment);
    }
    expect(apiRowAt('/components/input/', 'size').signature).toBe(
      'size?: OneComponentSize'
    );
    expect(apiRowAt('/components/input/', 'size').description).toContain(
      "'sm' | 'md' | 'lg'"
    );
  });

  it('documents every OneCard prop, slot and header precedence rule', () => {
    const text = pageText('/components/card/');
    for (const fragment of [
      'title?: string',
      'children?: Array<VNode | string>',
      'header',
      'default',
      'footer',
      "slot: 'header'",
      "slot: 'footer'",
      '优先于',
    ]) {
      expect(text).toContain(fragment);
    }
    expect(apiRowAt('/components/card/', 'header').signature).toBe(
      "Array<VNode & { slot: 'header' }>"
    );
    expect(apiRowAt('/components/card/', 'default').signature).toBe(
      'Array<VNode | string>'
    );
    expect(apiRowAt('/components/card/', 'footer').signature).toBe(
      "Array<VNode & { slot: 'footer' }>"
    );
  });

  it('gives every copyable OneInput example an accessible name', () => {
    expect(pageText('/guide/getting-started/')).toContain(
      "createComponent(OneInput, { placeholder: '项目名称', ariaLabel: '项目名称' })"
    );
    const input = pageText('/components/input/');
    expect(input).toContain(
      "new OneInput({ value: 'one', ariaLabel: '项目名称' })"
    );
    expect(input).toContain(
      "new OneInput({ defaultValue: 'draft', ariaLabel: '草稿名称' })"
    );
  });

  it('gives every component page a real demo block', () => {
    for (const [path, component] of [
      ['/components/button/', 'button'],
      ['/components/input/', 'input'],
      ['/components/card/', 'card'],
    ] as const) {
      expect(pageAt(path).body).toContainEqual({
        type: 'demo',
        component,
        interactive: true,
      });
    }
  });
});
