import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'bun:test';
import { ONE_BUTTON_STYLES } from '../lib/button/OneButton';
import { ONE_CARD_STYLES } from '../lib/card/OneCard';
import { ONE_INPUT_STYLES } from '../lib/input/OneInput';
import { ONE_ALERT_STYLES } from '../lib/alert/OneAlert';
import { ONE_DIALOG_STYLES } from '../lib/dialog/DialogOverlay';
import { ONE_MESSAGE_STYLES } from '../lib/message/MessageOverlay';
import { ONE_TOOLTIP_STYLES } from '../lib/tooltip/TooltipBubble';
import {
  headingsForPage,
  normalizeOneDocPath,
  localize,
  oneDocPages,
  validateOneDocPages,
  type OneDocPage,
} from '../docs/app/content';

const APPROVED_PATHS = [
  '/',
  '/guide/design/',
  '/guide/getting-started/',
  '/guide/i18n/',
  '/guide/theming/',
  '/components/button/',
  '/components/space/',
  '/components/card/',
  '/components/layout/',
  '/components/layout/divider/',
  '/components/layout/grid/',
  '/components/data-display/',
  '/components/data-display/tag/',
  '/components/data-display/badge/',
  '/components/data-display/empty/',
  '/components/data-display/avatar/',
  '/components/data-display/progress/',
  '/components/data-display/table/',
  '/components/data-display/collapse/',
  '/components/data-display/skeleton/',
  '/components/data-display/descriptions/',
  '/components/data-display/timeline/',
  '/components/form/',
  '/components/form/form/',
  '/components/form/input/',
  '/components/form/select/',
  '/components/form/checkbox/',
  '/components/form/switch/',
  '/components/form/radio/',
  '/components/form/time-picker/',
  '/components/form/slider/',
  '/components/form/rate/',
  '/components/form/upload/',
  '/components/form/cascader/',
  '/components/form/textarea/',
  '/components/navigation/',
  '/components/navigation/tabs/',
  '/components/navigation/steps/',
  '/components/navigation/breadcrumb/',
  '/components/navigation/pagination/',
  '/components/feedback/',
  '/components/feedback/alert/',
  '/components/feedback/message/',
  '/components/feedback/dialog/',
  '/components/feedback/tooltip/',
  '/components/feedback/popover/',
  '/components/feedback/loading/',
];
const packageRoot = join(import.meta.dir, '..');

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

function copyableOneInputProps(markdown: string): string[] {
  const code = [...markdown.matchAll(/```ts\n([\s\S]*?)```/g)]
    .map((match) => match[1])
    .join('\n');
  const patterns = [
    /createComponent\(\s*OneInput\s*,\s*\{([\s\S]*?)\}\s*\)/g,
    /new OneInput\(\s*\{([\s\S]*?)\}\s*\)/g,
  ];
  return patterns.flatMap((pattern) =>
    [...code.matchAll(pattern)].map((match) => match[1])
  );
}

function validPage(overrides: Partial<OneDocPage> = {}): OneDocPage {
  return {
    path: '/valid/',
    title: 'Valid page',
    description: 'A valid documentation page.',
    section: 'guide',
    sectionOrder: 1,
    order: 1,
    body: [{ type: 'heading', level: 1, id: 'valid', text: 'Valid' }],
    ...overrides,
  };
}

describe('One UI docs content', () => {
  it('defines exactly the forty-seven approved routes in stable order', () => {
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
    expect(
      headingsForPage(pageAt('/components/card/')).map((heading) => ({
        ...heading,
        text: localize(heading.text, 'zh'),
      }))
    ).toEqual([
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
      '/components/form/input/',
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

  it('documents exactly every runtime component token and fallback', () => {
    const theming = pageText('/guide/theming/');
    const styleText = JSON.stringify([
      ONE_BUTTON_STYLES,
      ONE_INPUT_STYLES,
      ONE_CARD_STYLES,
      ONE_ALERT_STYLES,
      ONE_MESSAGE_STYLES,
      ONE_DIALOG_STYLES,
      ONE_TOOLTIP_STYLES,
    ]);
    const runtimeTokens = [
      ...new Set(styleText.match(/--one-[a-z0-9-]+/g) ?? []),
    ].sort();
    const tokenRows = pageAt('/guide/theming/').body.flatMap((block) =>
      block.type === 'api-table' ? block.rows : []
    );

    expect(tokenRows.map((row) => row.name).sort()).toEqual(runtimeTokens);
    tokenRows.forEach((row) => {
      expect(row.signature.startsWith('Fallback: ')).toBe(true);
      const fallback = row.signature.slice('Fallback: '.length);
      expect(styleText).toContain(`var(${row.name}, ${fallback})`);
      expect(localize(row.description, 'zh').trim().length).toBeGreaterThan(4);
    });
    expect(
      localize(
        apiRowAt('/guide/theming/', '--one-color-primary-contrast').description,
        'zh'
      )
    ).toContain('对比');
    expect(
      localize(
        apiRowAt('/guide/theming/', '--one-button-padding-md').description,
        'zh'
      )
    ).toContain('按钮');
    expect(
      localize(
        apiRowAt('/guide/theming/', '--one-card-shadow').description,
        'zh'
      )
    ).toContain('卡片');
    expect(
      localize(
        apiRowAt('/guide/theming/', '--one-input-focus-border-color')
          .description,
        'zh'
      )
    ).toContain('输入框');
    expect(theming).toContain(
      "import { ONE_THEME_DEFAULTS } from '@geektech/one'"
    );
    expect(theming).toContain(':root');
    expect(theming).toContain('.checkout-panel');
  });

  it('documents global theme initialization and switching with OneButton', () => {
    const theming = pageText('/guide/theming/');

    for (const fragment of [
      "import { OneButton, oneTheme } from '@geektech/one'",
      'oneTheme.init({',
      "defaultTheme: 'brand'",
      'themes:',
      "oneTheme.switch('default')",
      'oneTheme.currentTheme',
      'document.documentElement',
      'OneThemeConfigError',
      'OneThemeNotFoundError',
      '不会自动持久化',
      '内置 default',
    ]) {
      expect(theming).toContain(fragment);
    }
    expect(theming).not.toContain('switchTheme(');
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
    expect(
      localize(apiRowAt('/components/button/', 'variant').description, 'zh')
    ).toContain("'primary' | 'secondary' | 'danger'");
    expect(apiRowAt('/components/button/', 'size').signature).toBe(
      'size?: OneComponentSize'
    );
    expect(
      localize(apiRowAt('/components/button/', 'size').description, 'zh')
    ).toContain("'sm' | 'md' | 'lg'");
  });

  it('documents every OneInput prop, event, payload and state mode', () => {
    const text = pageText('/components/form/input/');
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
    expect(apiRowAt('/components/form/input/', 'size').signature).toBe(
      'size?: OneComponentSize'
    );
    expect(
      localize(apiRowAt('/components/form/input/', 'size').description, 'zh')
    ).toContain("'sm' | 'md' | 'lg'");
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
    const input = pageText('/components/form/input/');
    expect(input).toContain(
      "new OneInput({ value: 'one', ariaLabel: '项目名称' })"
    );
    expect(input).toContain(
      "new OneInput({ defaultValue: 'draft', ariaLabel: '草稿名称' })"
    );
  });

  it('gives every published README OneInput example a meaningful accessible name', () => {
    for (const readme of ['README.md', 'README-zh.md']) {
      const markdown = readFileSync(join(packageRoot, readme), 'utf8');
      const examples = copyableOneInputProps(markdown);
      expect(examples).toHaveLength(3);
      examples.forEach((props) => {
        expect(props).toMatch(/ariaLabel\s*:\s*(['"])[^'"]{2,}\1/);
      });
    }
  });

  it('publishes feedback categories and minimum service examples in both READMEs', () => {
    for (const readme of ['README.md', 'README-zh.md']) {
      const markdown = readFileSync(join(packageRoot, readme), 'utf8');
      for (const name of [
        'OneAlert',
        'OneMessage',
        'OneDialog',
        'OneTooltip',
      ]) {
        expect(markdown).toContain(name);
      }
      expect(markdown).toContain("oneMessage.success('Saved');");
      expect(markdown).toContain(
        "const confirmed = await oneDialog.confirm({\n  title: 'Delete item?',\n  description: 'This action cannot be undone.',\n});"
      );
    }
  });

  it('publishes data-display categories and minimum examples in both READMEs', () => {
    for (const [readme, emptyDescription] of [
      ['README.md', 'No results'],
      ['README-zh.md', '暂无结果'],
    ] as const) {
      const markdown = readFileSync(join(packageRoot, readme), 'utf8');
      for (const name of ['OneTag', 'OneBadge', 'OneEmpty']) {
        expect(markdown).toContain(name);
      }
      expect(markdown).toContain("new OneTag({ variant: 'success'");
      expect(markdown).toContain('new OneBadge({ value: 120, max: 99');
      expect(markdown).toContain(
        `new OneEmpty({ description: '${emptyDescription}'`
      );
    }
  });

  it('publishes navigation categories and minimum examples in both READMEs', () => {
    for (const [readme, category] of [
      ['README.md', 'Navigation'],
      ['README-zh.md', '导航'],
    ] as const) {
      const markdown = readFileSync(join(packageRoot, readme), 'utf8');
      expect(markdown).toContain(category);
      for (const name of ['OneTabs', 'OneBreadcrumb', 'OnePagination']) {
        expect(markdown).toContain(name);
      }
      expect(markdown).toContain('new OneTabs({');
      expect(markdown).toContain("value: 'overview'");
      expect(markdown).toContain('new OneBreadcrumb({');
      expect(markdown).toContain("href: '/projects'");
      expect(markdown).toContain('new OnePagination({ total: 95');
    }
  });

  it('publishes the global theme service contract in both READMEs', () => {
    for (const readme of ['README.md', 'README-zh.md']) {
      const markdown = readFileSync(join(packageRoot, readme), 'utf8');

      for (const fragment of [
        'oneTheme.init({',
        "defaultTheme: 'brand'",
        "oneTheme.switch('default')",
        'oneTheme.currentTheme',
        'ONE_DEFAULT_THEME',
      ]) {
        expect(markdown).toContain(fragment);
      }
      expect(markdown).not.toContain('switchTheme(');
    }
  });

  it('gives every component page a real demo block', () => {
    for (const [path, component] of [
      ['/components/button/', 'button'],
      ['/components/form/input/', 'input'],
      ['/components/card/', 'card'],
    ] as const) {
      expect(pageAt(path).body).toContainEqual(
        expect.objectContaining({
          type: 'demo',
          component,
          interactive: true,
        })
      );
    }
  });

  it('documents every data-display component with a real demo and public API', () => {
    for (const [path, component] of [
      ['/components/data-display/tag/', 'tag'],
      ['/components/data-display/badge/', 'badge'],
      ['/components/data-display/empty/', 'empty'],
    ] as const) {
      expect(pageAt(path).body).toContainEqual(
        expect.objectContaining({
          type: 'demo',
          component,
          interactive: true,
        })
      );
    }

    expect(pageText('/components/data-display/tag/')).toContain(
      'OneDataDisplayVariant'
    );
    expect(pageText('/components/data-display/badge/')).toContain(
      'showZero?: boolean'
    );
    expect(pageText('/components/data-display/empty/')).toContain('actions');
  });

  it('provides TypeScript source for every documented demo', () => {
    const demos = oneDocPages.flatMap((page) =>
      page.body.filter((block) => block.type === 'demo')
    );

    expect(new Set(demos.map((block) => block.component))).toEqual(
      new Set([
        'button',
        'input',
        'textarea',
        'card',
        'form',
        'select',
        'checkbox',
        'switch',
        'radio',
        'time-picker',
        'alert',
        'message',
        'dialog',
        'tooltip',
        'loading',
        'tag',
        'badge',
        'empty',
        'avatar',
        'progress',
        'tabs',
        'breadcrumb',
        'pagination',
        'slider',
        'rate',
        'upload',
        'cascader',
        'table',
        'collapse',
        'skeleton',
        'divider',
        'space',
        'grid',
        'steps',
        'descriptions',
        'timeline',
        'popover',
      ])
    );

    demos.forEach((block) => {
      expect(block.source.language).toBe('ts');
      expect(block.source.code.trim().length).toBeGreaterThan(0);
    });
  });

  it('documents feedback props, services, keyboard behavior and ARIA', () => {
    const alert = pageText('/components/feedback/alert/');
    for (const fragment of [
      'title?: string',
      'description?: string',
      'variant?: OneFeedbackVariant',
      'closable?: boolean',
      'close',
      "role='alert'",
    ]) {
      expect(alert).toContain(fragment);
    }

    const message = pageText('/components/feedback/message/');
    for (const fragment of [
      'content: string',
      'duration?: number',
      'placement?: OneMessagePlacement',
      'container?: OneOverlayContainer',
      'oneMessage.success',
      'oneMessage.closeAll',
      'openChange',
    ]) {
      expect(message).toContain(fragment);
    }

    const dialog = pageText('/components/feedback/dialog/');
    for (const fragment of [
      'closeOnOverlay?: boolean',
      'closeOnEscape?: boolean',
      'confirmLoading?: boolean',
      'oneDialog.confirm',
      'Promise<boolean>',
      '返回 false 时保持打开',
      'Tab / Shift+Tab',
      'aria-modal',
    ]) {
      expect(dialog).toContain(fragment);
    }

    const tooltip = pageText('/components/feedback/tooltip/');
    placements.forEach((placement) => expect(tooltip).toContain(placement));
    for (const fragment of [
      "'hover-focus' | 'click' | 'manual'",
      'openDelay?: number',
      'closeDelay?: number',
      'aria-describedby',
      'Escape',
    ]) {
      expect(tooltip).toContain(fragment);
    }
  });

  it('documents navigation demos, public APIs, events, keyboard behavior and ARIA', () => {
    for (const [path, component] of [
      ['/components/navigation/tabs/', 'tabs'],
      ['/components/navigation/breadcrumb/', 'breadcrumb'],
      ['/components/navigation/pagination/', 'pagination'],
    ] as const) {
      expect(pageAt(path).body).toContainEqual(
        expect.objectContaining({
          type: 'demo',
          component,
          interactive: true,
        })
      );
      expect(pageText(path)).toContain('API');
      expect(pageText(path)).toContain('language":"ts');
      expect(pageText(path)).toMatch(/ARIA|aria-/);
    }

    const tabs = pageText('/components/navigation/tabs/');
    for (const fragment of [
      'OneTabsProps',
      'OneTabItem',
      'OneTabsChangeEvent',
      'ArrowLeft',
      'role=tablist',
    ]) {
      expect(tabs).toContain(fragment);
    }

    const breadcrumb = pageText('/components/navigation/breadcrumb/');
    for (const fragment of [
      'OneBreadcrumbProps',
      'OneBreadcrumbItem',
      'OneBreadcrumbClickEvent',
      'itemClick',
      'aria-current',
    ]) {
      expect(breadcrumb).toContain(fragment);
    }

    const pagination = pageText('/components/navigation/pagination/');
    for (const fragment of [
      'OnePaginationProps',
      'OnePaginationChangeEvent',
      'pageSizeOptions',
      'showQuickJumper',
      'change',
      'aria-label',
    ]) {
      expect(pagination).toContain(fragment);
    }
  });

  it('documents radio, time-picker, avatar, progress and loading pages with demos and APIs', () => {
    for (const [path, component] of [
      ['/components/form/radio/', 'radio'],
      ['/components/form/time-picker/', 'time-picker'],
      ['/components/data-display/avatar/', 'avatar'],
      ['/components/data-display/progress/', 'progress'],
      ['/components/feedback/loading/', 'loading'],
    ] as const) {
      expect(pageAt(path).body).toContainEqual(
        expect.objectContaining({
          type: 'demo',
          component,
          interactive: true,
        })
      );
      expect(pageText(path)).toContain('API');
    }

    const radio = pageText('/components/form/radio/');
    for (const fragment of [
      'OneRadio',
      'OneRadioGroup',
      'checked?: boolean',
      'defaultChecked?: boolean',
      'defaultValue?: string',
      'OneSelectOption',
      'radiogroup',
    ]) {
      expect(radio).toContain(fragment);
    }

    const timePicker = pageText('/components/form/time-picker/');
    for (const fragment of ['OneTimePicker', 'step?: number', 'min / max']) {
      expect(timePicker).toContain(fragment);
    }

    const avatar = pageText('/components/data-display/avatar/');
    for (const fragment of [
      "shape?: 'circle' | 'square'",
      'src?: string',
      'OneDataDisplayVariant',
    ]) {
      expect(avatar).toContain(fragment);
    }

    const progress = pageText('/components/data-display/progress/');
    for (const fragment of [
      'percent?: number',
      'showText?: boolean',
      'role=progressbar',
    ]) {
      expect(progress).toContain(fragment);
    }

    const loading = pageText('/components/feedback/loading/');
    for (const fragment of ['OneLoading', 'label?: string', 'role=status']) {
      expect(loading).toContain(fragment);
    }
  });

  it('publishes selection, time and added data-display components in both READMEs', () => {
    for (const readme of ['README.md', 'README-zh.md']) {
      const markdown = readFileSync(join(packageRoot, readme), 'utf8');
      for (const name of [
        'OneRadio',
        'OneRadioGroup',
        'OneTimePicker',
        'OneAvatar',
        'OneProgress',
        'OneLoading',
      ]) {
        expect(markdown).toContain(name);
      }
      expect(markdown).toContain('new OneRadioGroup({');
      expect(markdown).toContain('new OneTimePicker({');
      expect(markdown).toContain('new OneAvatar({');
      expect(markdown).toContain('new OneProgress({');
      expect(markdown).toContain('new OneLoading({');
    }
  });

  it('documents slider, rate, upload, table, collapse and skeleton pages with demos and APIs', () => {
    for (const [path, component] of [
      ['/components/form/slider/', 'slider'],
      ['/components/form/rate/', 'rate'],
      ['/components/form/upload/', 'upload'],
      ['/components/data-display/table/', 'table'],
      ['/components/data-display/collapse/', 'collapse'],
      ['/components/data-display/skeleton/', 'skeleton'],
    ] as const) {
      expect(pageAt(path).body).toContainEqual(
        expect.objectContaining({
          type: 'demo',
          component,
          interactive: true,
        })
      );
      expect(pageText(path)).toContain('API');
    }

    const slider = pageText('/components/form/slider/');
    for (const fragment of [
      'OneSlider',
      'min?: number',
      'showValue?: boolean',
      'OneSliderValueEvent',
    ]) {
      expect(slider).toContain(fragment);
    }

    const rate = pageText('/components/form/rate/');
    for (const fragment of [
      'OneRate',
      'count?: number',
      'allowClear?: boolean',
      'OneRateValueEvent',
    ]) {
      expect(rate).toContain(fragment);
    }

    const upload = pageText('/components/form/upload/');
    for (const fragment of [
      'OneUpload',
      'multiple?: boolean',
      'OneUploadFile',
      'OneUploadChangeEvent',
    ]) {
      expect(upload).toContain(fragment);
    }

    const table = pageText('/components/data-display/table/');
    for (const fragment of [
      'OneTable',
      'OneTableColumn',
      'emptyText',
      'striped?: boolean',
    ]) {
      expect(table).toContain(fragment);
    }

    const collapse = pageText('/components/data-display/collapse/');
    for (const fragment of [
      'OneCollapse',
      'accordion?: boolean',
      'OneCollapseChangeEvent',
      'aria-expanded',
    ]) {
      expect(collapse).toContain(fragment);
    }

    const skeleton = pageText('/components/data-display/skeleton/');
    for (const fragment of [
      'OneSkeleton',
      'rows?: number',
      'animated?: boolean',
      'aria-busy',
    ]) {
      expect(skeleton).toContain(fragment);
    }
  });

  it('publishes slider, rate, upload, table, collapse and skeleton in both READMEs', () => {
    for (const readme of ['README.md', 'README-zh.md']) {
      const markdown = readFileSync(join(packageRoot, readme), 'utf8');
      for (const name of [
        'OneSlider',
        'OneRate',
        'OneUpload',
        'OneTable',
        'OneCollapse',
        'OneSkeleton',
      ]) {
        expect(markdown).toContain(name);
      }
      expect(markdown).toContain('new OneSlider({');
      expect(markdown).toContain('new OneRate({');
      expect(markdown).toContain('new OneUpload({');
      expect(markdown).toContain('new OneTable({');
      expect(markdown).toContain('new OneCollapse({');
      expect(markdown).toContain('new OneSkeleton({');
    }
  });
});

const placements = [
  'top-start',
  'top',
  'top-end',
  'right-start',
  'right',
  'right-end',
  'bottom-start',
  'bottom',
  'bottom-end',
  'left-start',
  'left',
  'left-end',
];
