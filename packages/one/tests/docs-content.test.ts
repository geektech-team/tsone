import { describe, expect, it } from 'bun:test';
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

const THEME_TOKEN_NAMES = [
  '--one-color-primary',
  '--one-color-primary-hover',
  '--one-color-danger',
  '--one-color-surface',
  '--one-color-text',
  '--one-color-muted',
  '--one-color-border',
  '--one-color-focus',
  '--one-radius-sm',
  '--one-radius-md',
  '--one-space-xs',
  '--one-space-sm',
  '--one-space-md',
  '--one-space-lg',
  '--one-font-size-sm',
  '--one-font-size-md',
  '--one-font-size-lg',
  '--one-shadow-card',
  '--one-font-family',
] as const;

const THEME_DEFAULT_KEYS = [
  'colorPrimary',
  'colorPrimaryHover',
  'colorDanger',
  'colorSurface',
  'colorText',
  'colorMuted',
  'colorBorder',
  'colorFocus',
  'radiusSm',
  'radiusMd',
  'spaceXs',
  'spaceSm',
  'spaceMd',
  'spaceLg',
  'fontSizeSm',
  'fontSizeMd',
  'fontSizeLg',
  'shadowCard',
  'fontFamily',
] as const;

function pageAt(path: string): OneDocPage {
  const page = oneDocPages.find((candidate) => candidate.path === path);
  if (!page) throw new Error(`Missing page: ${path}`);
  return page;
}

function pageText(path: string): string {
  return JSON.stringify(pageAt(path));
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
    for (const token of THEME_TOKEN_NAMES) {
      expect(theming).toContain(token);
    }
    for (const key of THEME_DEFAULT_KEYS) {
      expect(theming).toContain(key);
    }
    expect(theming).toContain(
      "import { ONE_THEME_DEFAULTS } from '@geektech/one'"
    );
    const fontFamilyRow = pageAt('/guide/theming/')
      .body.flatMap((block) => (block.type === 'api-table' ? block.rows : []))
      .find((row) => row.name === '--one-font-family');
    expect(fontFamilyRow?.signature).toBe(
      'fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, \'Segoe UI\', sans-serif"'
    );
    expect(theming).toContain(':root');
    expect(theming).toContain('.checkout-panel');
  });

  it('documents every OneButton prop and click event signature', () => {
    const text = pageText('/components/button/');
    for (const fragment of [
      "variant?: 'primary' | 'secondary' | 'danger'",
      "size?: 'sm' | 'md' | 'lg'",
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
  });

  it('documents every OneInput prop, event, payload and state mode', () => {
    const text = pageText('/components/input/');
    for (const fragment of [
      'value?: string',
      'defaultValue?: string',
      'type?: string',
      'name?: string',
      'placeholder?: string',
      "size?: 'sm' | 'md' | 'lg'",
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
