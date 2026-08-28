# One UI Package Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 新增可独立发布的 `@geektech/one`，提供 `OneButton`、`OneInput`、`OneCard`，并交付由 TSone 构建的 One UI 静态文档站。

**Architecture:** `packages/one` 是独立 Bun workspace package，以 `@geektech/tsone` 为 peer dependency。三个 UI 类分别继承 TSone `Component`，通过组合共享的令牌和归一化函数保持一致，不增加 UI 基类；文档站位于包内，通过 TSone `renderHtmlDocument()` 输出静态多页 HTML，并用小型客户端 bundle 挂载真实交互 demo。

**Tech Stack:** Bun workspace、TypeScript strict、`bun:test`、TSone Component/VNode/StyleManager、Happy DOM、Bun.build。

**Spec:** `docs/superpowers/specs/2026-08-28-one-ui-package-design.md`

## Global Constraints

- 发布包名必须是 `@geektech/one`，显示名必须是 `One UI`，初始版本必须是 `0.0.1`。
- 公开组件名称必须是 `OneButton`、`OneInput`、`OneCard`。
- `@geektech/tsone` peer 范围必须是 `>=0.0.2 <0.1.0`，浏览器运行时不得增加其他依赖。
- 保持 TSone 核心公开 API 不变，不修改渲染器、组件基类或 StyleManager。
- 所有组件类名使用 `.one-*`，所有主题变量使用 `--one-*`；组件不得写全局 `body` 或 `html` 样式。
- TypeScript 保持 strict，不新增 `any`，组件关系遵守 SOLID 和仓库 OOP 约束。
- 先写失败测试，再实现最小代码；每个任务结束前运行该任务的聚焦验证。
- 当前 checkout 已有用户未提交修改。不得回滚、格式化或提交无关改动；修改已脏的根配置时只暂存本任务 hunks，并在提交前检查 `git diff --cached`。
- 不提交 `dist/`、`docs/dist/`、`.superpowers/`、tarball、缓存或其他生成产物。

## File Map

### Package runtime

- `packages/one/lib/index.ts`：唯一公开入口和品牌常量。
- `packages/one/lib/types.ts`：共享公开联合类型。
- `packages/one/lib/styles/shared.ts`：共享令牌、尺寸归一化和样式注册类型。
- `packages/one/lib/button/OneButton.ts`：按钮行为、VNode 和组件样式。
- `packages/one/lib/input/OneInput.ts`：受控/非受控输入状态、事件和样式。
- `packages/one/lib/card/OneCard.ts`：title、命名插槽、正文和样式。

### Package build and contracts

- `packages/one/package.json`：发布元数据、peer dependency、files 和脚本。
- `packages/one/tsconfig.json`：开发、测试、文档和脚本类型检查。
- `packages/one/tsconfig.build.json`：只从 `lib/` 生成声明文件。
- `packages/one/scripts/build.ts`：清理 `dist`、生成 `.d.ts`、构建浏览器 ESM。
- `packages/one/README.md`、`README-zh.md`、`LICENSE`：消费者文档和许可证。
- `packages/one/tests/*.test.ts`：组件、类型、文档和发布包契约。

### Documentation

- `packages/one/docs/app/content/types.ts`：typed content block 和页面类型。
- `packages/one/docs/app/content/*.ts`：首页、指南和组件文档内容。
- `packages/one/docs/app/components/DocsPage.ts`：经典三栏文档布局。
- `packages/one/docs/app/components/DocsNav.ts`：左侧分组导航。
- `packages/one/docs/app/components/DocArticle.ts`：内容 block、真实组件示例和 API 表。
- `packages/one/docs/app/components/DocsToc.ts`：右侧页内目录。
- `packages/one/docs/app/demos/*.ts`：三个可交互真实组件 demo。
- `packages/one/docs/app/app.ts`：静态页面 app 和客户端 demo app 工厂。
- `packages/one/docs/app/client.ts`：按 `data-one-demo` 挂载交互 demo。
- `packages/one/docs/app/styles.ts`：文档站 typed stylesheet。
- `packages/one/scripts/docs.ts`：静态构建、路由映射和安全文件服务。

### Workspace integration

- `.gitignore`：忽略 `.superpowers/` 和 One UI 文档构建目录。
- `package.json`：增加 One UI 构建和文档脚本。
- `tsconfig.json`：增加 `@geektech/one` path 和 One UI include。
- `bun.lock`：记录 workspace package。

---

### Task 1: 建立 One UI package 与共享样式契约

**Files:**
- Create: `packages/one/package.json`
- Create: `packages/one/tsconfig.json`
- Create: `packages/one/tsconfig.build.json`
- Create: `packages/one/scripts/build.ts`
- Create: `packages/one/lib/types.ts`
- Create: `packages/one/lib/styles/shared.ts`
- Create: `packages/one/lib/index.ts`
- Create: `packages/one/tests/package-contract.test.ts`

**Interfaces:**
- Consumes: `@geektech/tsone` public exports; root TypeScript compiler options.
- Produces: `OneComponentSize = 'sm' | 'md' | 'lg'`, `normalizeOneSize(value): OneComponentSize`, `oneStylesToSheet(styles): StyleSheet`, `ONE_NAME`, `ONE_VERSION`, package build command.

- [ ] **Step 1: Write the failing package contract test**

```ts
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'bun:test';
import { ONE_NAME, ONE_VERSION } from '../lib';
import {
  normalizeOneSize,
  oneStylesToSheet,
} from '../lib/styles/shared';

const packageRoot = join(import.meta.dir, '..');

describe('One UI package contract', () => {
  it('uses the approved package identity and peer range', () => {
    const manifest = JSON.parse(
      readFileSync(join(packageRoot, 'package.json'), 'utf8')
    ) as {
      name: string;
      version: string;
      peerDependencies: Record<string, string>;
      dependencies?: Record<string, string>;
    };

    expect(manifest.name).toBe('@geektech/one');
    expect(manifest.version).toBe('0.0.1');
    expect(manifest.peerDependencies['@geektech/tsone']).toBe(
      '>=0.0.2 <0.1.0'
    );
    expect(manifest.dependencies ?? {}).toEqual({});
    expect(ONE_NAME).toBe(manifest.name);
    expect(ONE_VERSION).toBe(manifest.version);
  });

  it('normalizes component sizes to md at runtime', () => {
    expect(normalizeOneSize('sm')).toBe('sm');
    expect(normalizeOneSize('lg')).toBe('lg');
    expect(normalizeOneSize('unexpected')).toBe('md');
  });

  it('converts component styles for static document rendering', () => {
    expect(
      oneStylesToSheet([
        {
          name: 'sample',
          selector: '.one-sample',
          properties: { color: 'red' },
          hover: { color: 'blue' },
        },
      ])
    ).toEqual([
      { selector: '.one-sample', properties: { color: 'red' } },
      { selector: '.one-sample:hover', properties: { color: 'blue' } },
    ]);
  });
});
```

- [ ] **Step 2: Run the test and verify the missing package fails**

Run: `bun test packages/one/tests/package-contract.test.ts`

Expected: FAIL because `packages/one/lib` and `packages/one/package.json` do not exist.

- [ ] **Step 3: Create the manifest, compiler configs and shared types**

Use this manifest contract:

```json
{
  "name": "@geektech/one",
  "version": "0.0.1",
  "description": "One UI 是基于 TSone 的轻量级纯 TypeScript UI 组件库",
  "type": "module",
  "main": "./dist/index.js",
  "module": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/index.js",
      "types": "./dist/index.d.ts"
    }
  },
  "scripts": {
    "build": "bun scripts/build.ts",
    "build:types": "bunx tsc --project tsconfig.build.json",
    "test": "bun test",
    "docs": "bun scripts/docs.ts",
    "docs:build": "bun scripts/docs.ts --build"
  },
  "peerDependencies": {
    "@geektech/tsone": ">=0.0.2 <0.1.0"
  },
  "devDependencies": {
    "@geektech/tsone": "workspace:*"
  },
  "files": ["dist", "README.md", "README-zh.md", "LICENSE"],
  "publishConfig": {
    "access": "public",
    "registry": "https://registry.npmjs.org/"
  },
  "license": "MIT",
  "engines": { "bun": ">=1.3.0" }
}
```

`lib/types.ts`:

```ts
export type OneComponentSize = 'sm' | 'md' | 'lg';
```

`lib/styles/shared.ts`:

```ts
import type { StyleSheet } from '@geektech/tsone';
import type { StyleOptions } from '@geektech/tsone/style';
import type { OneComponentSize } from '../types';

export type OneNamedStyle = StyleOptions & { name: string };

const ONE_SIZES: readonly OneComponentSize[] = ['sm', 'md', 'lg'];

export function normalizeOneSize(value: unknown): OneComponentSize {
  return ONE_SIZES.includes(value as OneComponentSize)
    ? (value as OneComponentSize)
    : 'md';
}

export function oneStylesToSheet(
  styles: readonly OneNamedStyle[]
): StyleSheet {
  const sheet: StyleSheet = [];

  styles.forEach((style) => {
    sheet.push({ selector: style.selector, properties: style.properties });
    if (style.hover) {
      sheet.push({
        selector: `${style.selector}:hover`,
        properties: style.hover,
      });
    }
    Object.entries(style.media ?? {}).forEach(([query, properties]) => {
      sheet.push({
        atRule: `@media ${query}`,
        rules: [{ selector: style.selector, properties }],
      });
    });
  });

  return sheet;
}
```

`lib/index.ts` initially exports only the stable foundation:

```ts
export type { OneComponentSize } from './types';

export const ONE_NAME = '@geektech/one';
export const ONE_VERSION = '0.0.1';
```

Configure `tsconfig.json` to extend `../../tsconfig.json`, include `lib`, `tests`, `docs/app`, and `scripts`, and keep `noEmit: true`. Configure `tsconfig.build.json` with `rootDir: './lib'`, `outDir: './dist'`, `declaration: true`, `emitDeclarationOnly: true`, `noEmit: false`, and exclude tests/docs/scripts.

`scripts/build.ts` must mirror the TSone package build shape: remove only
`packages/one/dist`, run `bunx tsc --project tsconfig.build.json`, then call:

```ts
Bun.build({
  entrypoints: ['./lib/index.ts'],
  outdir: './dist',
  root: './lib',
  target: 'browser',
  format: 'esm',
  sourcemap: 'linked',
  splitting: true,
  external: ['@geektech/tsone', '@geektech/tsone/style'],
});
```

Throw when either subprocess or build fails. Keeping both TSone import paths
external is mandatory so the peer framework is not bundled into One UI.

- [ ] **Step 4: Run the package contract and build**

Run:

```bash
bun test packages/one/tests/package-contract.test.ts
bun run --cwd packages/one build
```

Expected: PASS; `dist/index.js` and `dist/index.d.ts` are generated locally and remain ignored.

- [ ] **Step 5: Commit the foundation**

```bash
git add packages/one/package.json packages/one/tsconfig.json \
  packages/one/tsconfig.build.json packages/one/scripts/build.ts \
  packages/one/lib packages/one/tests/package-contract.test.ts
git diff --cached --check
git commit -m "chore: scaffold One UI package"
```

---

### Task 2: 实现 OneButton

**Files:**
- Create: `packages/one/lib/button/OneButton.ts`
- Create: `packages/one/lib/button/index.ts`
- Create: `packages/one/tests/button.test.ts`
- Modify: `packages/one/lib/index.ts`

**Interfaces:**
- Consumes: `OneComponentSize`, `normalizeOneSize`, TSone `Component`, `VNode`, `StyleManager` lifecycle and component `emit`.
- Produces: `OneButton`, `OneButtonProps`, `OneButtonVariant` and component events named `click`.

- [ ] **Step 1: Write failing Button behavior tests**

```ts
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { OneButton, type OneButtonProps } from '../lib';

describe('OneButton', () => {
  let container: HTMLElement;
  let component: OneButton;

  beforeEach(() => {
    document.head.innerHTML = '';
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    component?.unmount();
    container.remove();
  });

  it('renders default and selected variants and sizes', () => {
    component = new OneButton({ children: ['Save'] });
    component.mount(container);
    const button = container.querySelector('button');
    expect(button?.className).toBe(
      'one-button one-button--primary one-button--md'
    );
    expect(button?.getAttribute('type')).toBe('button');
    expect(button?.textContent).toContain('Save');

    component.setProps({ variant: 'danger', size: 'lg', type: 'submit' });
    expect(button?.className).toContain('one-button--danger');
    expect(button?.className).toContain('one-button--lg');
    expect(button?.getAttribute('type')).toBe('submit');
  });

  it('emits click only when enabled and not loading', () => {
    component = new OneButton({ children: ['Save'] });
    const events: unknown[] = [];
    component.on('click', (event) => events.push(event));
    component.mount(container);

    const button = container.querySelector('button') as HTMLButtonElement;
    button.dispatchEvent(new MouseEvent('click'));
    expect(events).toHaveLength(1);

    component.setProps({ loading: true });
    expect(button.disabled).toBe(true);
    expect(button.getAttribute('aria-busy')).toBe('true');
    expect(button.querySelector('.one-button__spinner')).toBeTruthy();
    button.dispatchEvent(new MouseEvent('click'));
    expect(events).toHaveLength(1);

    component.setProps({ loading: false, disabled: true });
    expect(button.disabled).toBe(true);
    expect(button.hasAttribute('aria-busy')).toBe(false);
    button.dispatchEvent(new MouseEvent('click'));
    expect(events).toHaveLength(1);
  });

  it('falls back from invalid runtime enum values', () => {
    component = new OneButton({
      variant: 'unknown',
      size: 'huge',
      children: ['Safe'],
    } as unknown as OneButtonProps);
    component.mount(container);
    expect(container.querySelector('button')?.className).toContain(
      'one-button--primary one-button--md'
    );
  });
});
```

- [ ] **Step 2: Run the Button tests and verify the export is missing**

Run: `bun test packages/one/tests/button.test.ts`

Expected: FAIL because `OneButton` is not exported.

- [ ] **Step 3: Implement the minimal Button component**

Define the public contract exactly:

```ts
export type OneButtonVariant = 'primary' | 'secondary' | 'danger';

export interface OneButtonProps {
  variant?: OneButtonVariant;
  size?: OneComponentSize;
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
  loading?: boolean;
  children?: Array<VNode | string>;
}
```

Implementation shape:

```ts
export class OneButton extends Component<OneButtonProps> {
  protected initState(): object {
    return {};
  }

  protected initStyles(): void {
    ONE_BUTTON_STYLES.forEach(({ name, ...style }) => {
      this.styleManager.addStyle(name, style);
    });
  }

  protected render(): VNode {
    const variant = normalizeButtonVariant(this.props.variant);
    const size = normalizeOneSize(this.props.size);
    const disabled = this.props.disabled === true || this.props.loading === true;

    return {
      tag: 'button',
      props: {
        className: `one-button one-button--${variant} one-button--${size}`,
        type: this.props.type ?? 'button',
        disabled,
        'aria-busy': this.props.loading === true ? 'true' : undefined,
      },
      listeners: {
        click: (event) => {
          if (!disabled && event instanceof MouseEvent) {
            this.emit('click', event);
          }
        },
      },
      children: [
        ...(this.props.loading
          ? [{ tag: 'span', props: { className: 'one-button__spinner', 'aria-hidden': 'true' } } as VNode]
          : []),
        ...(this.props.children ?? []),
      ],
    };
  }
}
```

Add direct-module export `ONE_BUTTON_STYLES: OneNamedStyle[]` for base,
variants, sizes, disabled, focus-visible and spinner selectors. The spinner is a
static CSS border indicator because the current StyleManager has no keyframe
API. Use only `.one-button*` selectors and `var(--one-..., fallback)` values.
Add `normalizeButtonVariant(value: unknown)` with `primary` fallback. Export
the class and types through `button/index.ts` and the package entry; do not
re-export `ONE_BUTTON_STYLES` from the package root.

- [ ] **Step 4: Run Button tests and strict typecheck**

Run:

```bash
bun test packages/one/tests/button.test.ts
bunx tsc --noEmit --project packages/one/tsconfig.json
```

Expected: PASS with no TypeScript diagnostics.

- [ ] **Step 5: Commit OneButton**

```bash
git add packages/one/lib/button packages/one/lib/index.ts \
  packages/one/tests/button.test.ts
git diff --cached --check
git commit -m "feat(one): add OneButton"
```

---

### Task 3: 实现 OneInput 的受控与非受控状态

**Files:**
- Create: `packages/one/lib/input/OneInput.ts`
- Create: `packages/one/lib/input/index.ts`
- Create: `packages/one/tests/input.test.ts`
- Modify: `packages/one/lib/index.ts`

**Interfaces:**
- Consumes: `OneComponentSize`, `normalizeOneSize`, TSone `Component`, reactive component state and `emit`.
- Produces: `OneInput`, `OneInputProps`, `OneInputValueEvent`; events named `input` and `change`.

- [ ] **Step 1: Write failing controlled and uncontrolled tests**

```ts
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { OneInput, type OneInputValueEvent } from '../lib';

describe('OneInput', () => {
  let container: HTMLElement;
  let component: OneInput;

  beforeEach(() => {
    document.head.innerHTML = '';
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    component?.unmount();
    container.remove();
  });

  it('updates internal state in uncontrolled mode', () => {
    component = new OneInput({ defaultValue: 'start', ariaLabel: 'Name' });
    const payloads: OneInputValueEvent[] = [];
    const changes: OneInputValueEvent[] = [];
    component.on('input', (payload) => {
      payloads.push(payload as OneInputValueEvent);
    });
    component.on('change', (payload) => {
      changes.push(payload as OneInputValueEvent);
    });
    component.mount(container);
    const input = container.querySelector('input') as HTMLInputElement;

    expect(input.value).toBe('start');
    input.value = 'next';
    input.dispatchEvent(new Event('input'));

    expect(input.value).toBe('next');
    expect(payloads[0].value).toBe('next');
    expect(payloads[0].originalEvent.type).toBe('input');

    input.dispatchEvent(new Event('change'));
    expect(changes[0].value).toBe('next');
    expect(changes[0].originalEvent.type).toBe('change');

    component.setProps({ defaultValue: 'replacement' });
    expect(input.value).toBe('next');
  });

  it('emits but restores the latest prop in controlled mode', () => {
    component = new OneInput({ value: 'locked', defaultValue: 'ignored' });
    const payloads: OneInputValueEvent[] = [];
    component.on('input', (payload) => {
      payloads.push(payload as OneInputValueEvent);
    });
    component.mount(container);
    const input = container.querySelector('input') as HTMLInputElement;

    input.value = 'typed';
    input.dispatchEvent(new Event('input'));
    expect(payloads[0].value).toBe('typed');
    expect(input.value).toBe('locked');

    component.setProps({ value: 'accepted' });
    expect(input.value).toBe('accepted');
  });

  it('maps native and invalid state props', () => {
    component = new OneInput({
      type: 'email',
      name: 'contact',
      required: true,
      readonly: true,
      invalid: true,
      size: 'lg',
    });
    component.mount(container);
    const input = container.querySelector('input') as HTMLInputElement;
    expect(input.type).toBe('email');
    expect(input.name).toBe('contact');
    expect(input.hasAttribute('required')).toBe(true);
    expect(input.hasAttribute('readonly')).toBe(true);
    expect(input.getAttribute('aria-invalid')).toBe('true');
    expect(input.className).toContain('one-input--invalid one-input--lg');
  });
});
```

- [ ] **Step 2: Run Input tests and verify the export is missing**

Run: `bun test packages/one/tests/input.test.ts`

Expected: FAIL because `OneInput` is not exported.

- [ ] **Step 3: Implement exact props, event payload and state transition**

```ts
export interface OneInputValueEvent {
  value: string;
  originalEvent: Event;
}

export interface OneInputProps {
  value?: string;
  defaultValue?: string;
  type?: string;
  name?: string;
  placeholder?: string;
  size?: OneComponentSize;
  disabled?: boolean;
  readonly?: boolean;
  required?: boolean;
  invalid?: boolean;
  ariaLabel?: string;
}

interface OneInputState {
  internalValue: string;
}
```

`initState()` returns `{ internalValue: this.props.defaultValue ?? '' }`.
`render()` uses `this.props.value ?? this.state.internalValue`, adds
`one-input`, `one-input--${normalizeOneSize(size)}` and optional
`one-input--invalid`, and maps every approved prop to the native input.

Use one private handler for each event:

```ts
private emitValue(eventName: 'input' | 'change', event: Event): void {
  const input = event.currentTarget;
  if (!(input instanceof HTMLInputElement)) {
    return;
  }

  const nextValue = input.value;
  if (this.props.value === undefined) {
    this.state.internalValue = nextValue;
  }

  this.emit(eventName, { value: nextValue, originalEvent: event });

  if (this.props.value !== undefined) {
    input.value = this.props.value;
  }
}
```

Register `.one-input`, size, invalid, disabled and focus-visible styles through
direct-module export `ONE_INPUT_STYLES`. Use CSS variable fallbacks and no
global selectors. Export the component through `input/index.ts` and
`lib/index.ts`, but do not re-export `ONE_INPUT_STYLES` from the package root.

- [ ] **Step 4: Run Input tests and strict typecheck**

Run:

```bash
bun test packages/one/tests/input.test.ts
bunx tsc --noEmit --project packages/one/tsconfig.json
```

Expected: PASS.

- [ ] **Step 5: Commit OneInput**

```bash
git add packages/one/lib/input packages/one/lib/index.ts \
  packages/one/tests/input.test.ts
git diff --cached --check
git commit -m "feat(one): add OneInput"
```

---

### Task 4: 实现 OneCard 的 title 和命名插槽

**Files:**
- Create: `packages/one/lib/card/OneCard.ts`
- Create: `packages/one/lib/card/index.ts`
- Create: `packages/one/tests/card.test.ts`
- Modify: `packages/one/lib/index.ts`

**Interfaces:**
- Consumes: TSone `Component`, `VNode`, `slot()` and slot marker semantics.
- Produces: `OneCard`, `OneCardProps`; header/default/footer composition.

- [ ] **Step 1: Write failing Card slot tests**

```ts
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { OneCard } from '../lib';

describe('OneCard', () => {
  let container: HTMLElement;
  let component: OneCard;

  beforeEach(() => {
    document.head.innerHTML = '';
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    component?.unmount();
    container.remove();
  });

  it('renders title and default content without an empty footer', () => {
    component = new OneCard({ title: 'Profile', children: ['Body'] });
    component.mount(container);
    expect(container.querySelector('.one-card__header')?.textContent).toBe(
      'Profile'
    );
    expect(container.querySelector('.one-card__body')?.textContent).toBe(
      'Body'
    );
    expect(container.querySelector('.one-card__footer')).toBeNull();
  });

  it('prefers explicit header slot and renders footer slot', () => {
    component = new OneCard({
      title: 'Fallback',
      children: [
        { tag: 'strong', slot: 'header', children: ['Custom'] },
        { tag: 'p', children: ['Body'] },
        { tag: 'button', slot: 'footer', children: ['Done'] },
      ],
    });
    component.mount(container);
    expect(container.querySelector('.one-card__header')?.textContent).toBe(
      'Custom'
    );
    expect(container.querySelector('.one-card__header')?.textContent).not.toContain(
      'Fallback'
    );
    expect(container.querySelector('.one-card__footer')?.textContent).toBe(
      'Done'
    );
  });

  it('omits header when neither title nor header slot exists', () => {
    component = new OneCard({ children: ['Only body'] });
    component.mount(container);
    expect(container.querySelector('.one-card__header')).toBeNull();
  });
});
```

- [ ] **Step 2: Run Card tests and verify the export is missing**

Run: `bun test packages/one/tests/card.test.ts`

Expected: FAIL because `OneCard` is not exported.

- [ ] **Step 3: Implement slot presence detection and conditional regions**

```ts
export interface OneCardProps {
  title?: string;
  children?: Array<VNode | string>;
}

function hasNamedSlot(
  children: Array<VNode | string>,
  name: 'header' | 'footer'
): boolean {
  return children.some(
    (child) => typeof child !== 'string' && child.slot === name
  );
}
```

In `render()`, compute `hasHeaderSlot` and `hasFooterSlot`. Return
`.one-card` with these regions:

```ts
const children = this.props.children ?? [];
const headerChildren = hasNamedSlot(children, 'header')
  ? [slot('header')]
  : this.props.title
    ? [this.props.title]
    : [];

return {
  tag: 'section',
  props: { className: 'one-card' },
  children: [
    ...(headerChildren.length > 0
      ? [{ tag: 'header', props: { className: 'one-card__header' }, children: headerChildren } as VNode]
      : []),
    {
      tag: 'div',
      props: { className: 'one-card__body' },
      children: [slot('default')],
    },
    ...(hasNamedSlot(children, 'footer')
      ? [{ tag: 'footer', props: { className: 'one-card__footer' }, children: [slot('footer')] } as VNode]
      : []),
  ],
};
```

Register only `.one-card*` styles through direct-module export
`ONE_CARD_STYLES`, using surface, text, border, radius, spacing and shadow
variables with fallbacks. Export the component through `card/index.ts` and the
package entry, but do not re-export `ONE_CARD_STYLES` from the package root.

- [ ] **Step 4: Run Card and combined component tests**

Run:

```bash
bun test packages/one/tests/button.test.ts \
  packages/one/tests/input.test.ts packages/one/tests/card.test.ts
bunx tsc --noEmit --project packages/one/tsconfig.json
```

Expected: PASS.

- [ ] **Step 5: Commit OneCard**

```bash
git add packages/one/lib/card packages/one/lib/index.ts \
  packages/one/tests/card.test.ts
git diff --cached --check
git commit -m "feat(one): add OneCard"
```

---

### Task 5: 固化公开类型、主题令牌和发布包

**Files:**
- Create: `packages/one/tests/component-types.test.ts`
- Create: `packages/one/tests/style-contract.test.ts`
- Create: `packages/one/tests/package-smoke.test.ts`
- Create: `packages/one/README.md`
- Create: `packages/one/README-zh.md`
- Create: `packages/one/LICENSE`
- Modify: `packages/one/lib/styles/shared.ts`
- Modify: `packages/one/lib/index.ts`

**Interfaces:**
- Consumes: all three public component classes and props from Tasks 2-4; package build from Task 1.
- Produces: final root export surface, `ONE_THEME_DEFAULTS`, installable npm tarball contract and consumer documentation.

- [ ] **Step 1: Write failing type and theme contract tests**

`component-types.test.ts` must compile these assignments and keep the negative
cases guarded by `@ts-expect-error`:

```ts
import { describe, expect, it } from 'bun:test';
import {
  OneButton,
  OneCard,
  OneInput,
  type OneButtonProps,
  type OneCardProps,
  type OneInputProps,
} from '../lib';

const buttonProps: OneButtonProps = { variant: 'danger', size: 'lg' };
const inputProps: OneInputProps = { value: 'one', invalid: true };
const cardProps: OneCardProps = { title: 'One', children: ['Body'] };

// @ts-expect-error unsupported variant
const invalidButton: OneButtonProps = { variant: 'ghost' };
// @ts-expect-error unsupported size
const invalidInput: OneInputProps = { size: 'xl' };

describe('public component types', () => {
  it('exports constructors and approved prop shapes', () => {
    expect(typeof OneButton).toBe('function');
    expect(typeof OneInput).toBe('function');
    expect(typeof OneCard).toBe('function');
    expect(buttonProps.variant).toBe('danger');
    expect(inputProps.value).toBe('one');
    expect(cardProps.title).toBe('One');
    void invalidButton;
    void invalidInput;
  });
});
```

`style-contract.test.ts` mounts one instance of each component and asserts that
all generated selectors start with `.one-`, generated CSS contains
`var(--one-color-primary`, `var(--one-radius-md`, and no rule targets `body` or
`html`. It also imports `ONE_THEME_DEFAULTS` and asserts exact keys for colors,
radii, spacing, font sizes, card shadow and font family.

- [ ] **Step 2: Run the tests and verify missing theme defaults fail**

Run:

```bash
bun test packages/one/tests/component-types.test.ts \
  packages/one/tests/style-contract.test.ts
bunx tsc --noEmit --project packages/one/tsconfig.json
```

Expected: FAIL because `ONE_THEME_DEFAULTS` and the final style contract are not
implemented yet.

- [ ] **Step 3: Add exact public theme defaults and finish exports**

Add this immutable map to `lib/styles/shared.ts`:

```ts
export const ONE_THEME_DEFAULTS = {
  colorPrimary: '#5fd956',
  colorPrimaryHover: '#4bc944',
  colorDanger: '#d64545',
  colorSurface: '#ffffff',
  colorText: '#162018',
  colorMuted: '#647268',
  colorBorder: '#d9e8d6',
  colorFocus: '#2f7c39',
  radiusSm: '4px',
  radiusMd: '8px',
  spaceXs: '4px',
  spaceSm: '8px',
  spaceMd: '12px',
  spaceLg: '16px',
  fontSizeSm: '12px',
  fontSizeMd: '14px',
  fontSizeLg: '16px',
  shadowCard: '0 12px 30px rgba(32, 74, 38, 0.1)',
  fontFamily:
    "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
} as const;
```

Use these values as fallback arguments in every component CSS variable.
`lib/index.ts` must export all three component modules, `OneComponentSize`,
`ONE_THEME_DEFAULTS`, `ONE_NAME` and `ONE_VERSION`, and must not export internal
normalizers or style arrays.

- [ ] **Step 4: Write the failing tarball smoke test**

The test must build and pack from `packages/one`, install the tarball into a
temporary directory, and assert this file list:

```ts
expect(packageFiles).toEqual(
  expect.arrayContaining([
    'dist/index.js',
    'dist/index.d.ts',
    'README.md',
    'README-zh.md',
    'LICENSE',
    'package.json',
  ])
);
expect(packageFiles.some((file) => file.startsWith('lib/'))).toBe(false);
expect(packageFiles.some((file) => file.startsWith('tests/'))).toBe(false);
expect(packageFiles.some((file) => file.startsWith('docs/'))).toBe(false);
```

After `bun add` installs both the local TSone tarball and One tarball in the
temporary consumer, run a strict `consumer.ts` that imports all three classes,
all public prop types, `ONE_NAME`, `ONE_VERSION` and `ONE_THEME_DEFAULTS`.
Before installation, read `dist/index.js` and assert that it retains an import
from `@geektech/tsone`, proving the peer runtime was not bundled.

Run: `bun test packages/one/tests/package-smoke.test.ts`

Expected: FAIL because README and LICENSE do not exist or the packed consumer
contract is incomplete.

- [ ] **Step 5: Add consumer documentation and license**

`README.md` and `README-zh.md` must contain these sections in their respective
language:

1. One UI positioning and TSone peer requirement.
2. `bun add @geektech/tsone @geektech/one` installation.
3. Quick start that imports `createApp`, `Component`, `createComponent`,
   `OneButton`, `OneInput`, `OneCard` and renders all three.
4. Button variant/size/loading event example.
5. Input controlled and uncontrolled examples with `OneInputValueEvent`.
6. Card header/default/footer slot example.
7. Theme override example using `--one-color-primary` and `--one-radius-md`.
8. Development commands and the complete publish verification command.

Copy the existing TSone MIT license text verbatim into `packages/one/LICENSE`,
preserving its copyright attribution.

- [ ] **Step 6: Run public contract, build and package smoke tests**

Run:

```bash
bun test packages/one/tests/package-contract.test.ts \
  packages/one/tests/component-types.test.ts \
  packages/one/tests/style-contract.test.ts \
  packages/one/tests/package-smoke.test.ts
bunx tsc --noEmit --project packages/one/tsconfig.json
bun run --cwd packages/one build
```

Expected: PASS.

- [ ] **Step 7: Commit the public package contract**

```bash
git add packages/one/lib packages/one/tests/component-types.test.ts \
  packages/one/tests/style-contract.test.ts \
  packages/one/tests/package-smoke.test.ts packages/one/README.md \
  packages/one/README-zh.md packages/one/LICENSE
git diff --cached --check
git commit -m "test(one): verify public package contract"
```

---

### Task 6: 建立 typed content 和经典文档布局

**Files:**
- Create: `packages/one/docs/app/content/types.ts`
- Create: `packages/one/docs/app/content/home.ts`
- Create: `packages/one/docs/app/content/guide.ts`
- Create: `packages/one/docs/app/content/components.ts`
- Create: `packages/one/docs/app/content/index.ts`
- Create: `packages/one/docs/app/components/DocsNav.ts`
- Create: `packages/one/docs/app/components/DocsToc.ts`
- Create: `packages/one/docs/app/components/DocArticle.ts`
- Create: `packages/one/docs/app/components/DocsPage.ts`
- Create: `packages/one/docs/app/styles.ts`
- Create: `packages/one/docs/app/app.ts`
- Create: `packages/one/tests/docs-content.test.ts`
- Create: `packages/one/tests/docs-app.test.ts`

**Interfaces:**
- Consumes: TSone `createApp`, `Component`, `VNode`, `StyleSheet`; One UI public components.
- Produces: seven validated `OneDocPage` records, classic header/sidebar/article/TOC layout, `createOneDocsPageApp(page, pages)`.

- [ ] **Step 1: Write failing content and page-render tests**

```ts
import { describe, expect, it } from 'bun:test';
import { createOneDocsPageApp } from '../docs/app/app';
import { oneDocPages } from '../docs/app/content';

describe('One UI docs content', () => {
  it('defines the complete approved route set', () => {
    expect(oneDocPages.map((page) => page.path)).toEqual([
      '/',
      '/guide/design/',
      '/guide/getting-started/',
      '/guide/theming/',
      '/components/button/',
      '/components/input/',
      '/components/card/',
    ]);
  });

  it('documents every public component and theme token family', () => {
    const text = JSON.stringify(oneDocPages);
    expect(text).toContain('OneButton');
    expect(text).toContain('OneInput');
    expect(text).toContain('OneCard');
    expect(text).toContain('--one-color-primary');
    expect(text).toContain('--one-radius-md');
    expect(text).toContain('header');
    expect(text).toContain('footer');
  });

  it('renders the approved classic docs layout through TSone', () => {
    const page = oneDocPages[4];
    const html = createOneDocsPageApp(page, oneDocPages).renderHtmlDocument();
    expect(html).toContain('<!doctype html>');
    expect(html).toContain('<title>OneButton - One UI</title>');
    expect(html).toContain('data-one-docs-page="/components/button/"');
    expect(html).toContain('one-docs-sidebar');
    expect(html).toContain('one-docs-toc');
    expect(html).toContain('one-button');
    expect(html).toContain('.one-button {');
  });
});
```

- [ ] **Step 2: Run docs tests and verify modules are missing**

Run:

```bash
bun test packages/one/tests/docs-content.test.ts \
  packages/one/tests/docs-app.test.ts
```

Expected: FAIL because the docs app does not exist.

- [ ] **Step 3: Implement typed content primitives and validation**

Define these discriminated unions in `content/types.ts`:

```ts
export type OneDocInline =
  | string
  | { type: 'code'; text: string }
  | { type: 'link'; text: string; href: string };

export type OneDocBlock =
  | { type: 'heading'; level: 1 | 2 | 3; id: string; text: string }
  | { type: 'paragraph'; content: OneDocInline[] }
  | { type: 'list'; items: OneDocInline[][] }
  | { type: 'code'; language: 'ts' | 'css' | 'bash'; code: string }
  | { type: 'callout'; kind: 'note' | 'tip'; title: string; body: OneDocInline[] }
  | { type: 'api-table'; rows: Array<{ name: string; signature: string; description: string }> }
  | { type: 'demo'; component: 'button' | 'input' | 'card'; interactive?: boolean };

export interface OneDocPage {
  path: string;
  title: string;
  description: string;
  section: '开始' | '指南' | '组件';
  sectionOrder: number;
  order: number;
  body: OneDocBlock[];
}
```

Implement `normalizeOneDocPath`, `validateOneDocPages` and
`headingsForPage(page)` locally. Validation rejects duplicate or malformed
routes, blank titles/descriptions, blank bodies and duplicate heading ids.

- [ ] **Step 4: Add the seven pages with exact content coverage**

Use this content matrix; each bullet is required content, not a future note:

| Route | Required content |
| --- | --- |
| `/` | One UI positioning, `bun add` command, three component links |
| `/guide/design/` | lightweight runtime, class components, composition over extra inheritance, accessibility, CSS Variables |
| `/guide/getting-started/` | complete TSone app importing and rendering all three components |
| `/guide/theming/` | every key from `ONE_THEME_DEFAULTS`, global and scoped override CSS |
| `/components/button/` | primary/secondary/danger, sm/md/lg, disabled, loading, click, props table |
| `/components/input/` | controlled/uncontrolled, input/change payload, native states, props table |
| `/components/card/` | title, header/default/footer slots, precedence, props and slots tables |

The three component pages must contain `demo` blocks, and each API table must
match the public signatures from Tasks 2-4 verbatim.

- [ ] **Step 5: Implement layout components and real static demos**

`DocsPage` returns this structure:

```text
div.one-docs-shell[data-one-docs-page]
├── header.one-docs-topbar
│   ├── a.one-docs-brand (One UI)
│   └── nav (设计理念、组件、GitHub)
└── div.one-docs-layout
    ├── aside.one-docs-sidebar > DocsNav
    ├── main.one-docs-main > DocArticle
    └── aside.one-docs-toc > DocsToc
```

`DocArticle` renders every union member exhaustively. For non-interactive demo
blocks, render real `OneButton`, `OneInput`, or `OneCard` component nodes. For
interactive blocks, render a static real component preview followed by an empty
`div` with `data-one-demo="button|input|card"` for Task 7 hydration.

`DocsToc` uses `headingsForPage` and links to heading ids. `DocsNav` groups pages
by section and marks the current route with `aria-current="page"`.

`styles.ts` imports `ONE_BUTTON_STYLES`, `ONE_INPUT_STYLES` and
`ONE_CARD_STYLES` from their direct internal module paths, converts them with
`oneStylesToSheet`, and appends the document-only rules. This is required because
static `renderHtmlDocument()` does not copy component-owned style elements into
the returned `<head>`. Export a TSone `StyleSheet` implementing the approved
green theme, fixed top bar, 240px left sidebar, centered article, 180px right
TOC, code/API table styles, and a `max-width: 900px` at-rule that produces a
single-column layout.

`createOneDocsPageApp` must call:

```ts
return createApp({
  root: DocsPage,
  rootProps: { page, pages },
  document: {
    lang: 'zh-CN',
    title: `${page.title} - One UI`,
    description: page.description,
    body: { component: DocsPage, props: { page, pages } },
    styles: oneDocsStyles,
    scripts: [{ type: 'module', src: '/assets/one-docs-client.js' }],
  },
});
```

- [ ] **Step 6: Run content, render and type tests**

Run:

```bash
bun test packages/one/tests/docs-content.test.ts \
  packages/one/tests/docs-app.test.ts
bunx tsc --noEmit --project packages/one/tsconfig.json
```

Expected: PASS.

- [ ] **Step 7: Commit typed docs and layout**

```bash
git add packages/one/docs/app/content packages/one/docs/app/components \
  packages/one/docs/app/styles.ts packages/one/docs/app/app.ts \
  packages/one/tests/docs-content.test.ts packages/one/tests/docs-app.test.ts
git diff --cached --check
git commit -m "docs(one): add component documentation app"
```

---

### Task 7: 增加交互 demo、静态构建和文档服务

**Files:**
- Create: `packages/one/docs/app/demos/ButtonDemo.ts`
- Create: `packages/one/docs/app/demos/InputDemo.ts`
- Create: `packages/one/docs/app/demos/CardDemo.ts`
- Create: `packages/one/docs/app/client.ts`
- Modify: `packages/one/docs/app/app.ts`
- Create: `packages/one/scripts/docs.ts`
- Create: `packages/one/tests/docs-client.test.ts`
- Create: `packages/one/tests/docs-build.test.ts`
- Create: `packages/one/tests/docs-server.test.ts`

**Interfaces:**
- Consumes: One UI components, seven docs pages and `createOneDocsPageApp`.
- Produces: `mountOneDocsClient()`, `buildOneDocs(options)`, `routeToOneDocsOutputPath(route, outDir)`, secure static server and `docs/dist` output.

- [ ] **Step 1: Write failing client mount tests**

```ts
import { beforeEach, describe, expect, it } from 'bun:test';
import { mountOneDocsClient } from '../docs/app/client';

describe('One UI docs client', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('mounts each real component demo into marked roots', () => {
    document.body.innerHTML = [
      '<div data-one-demo="button"></div>',
      '<div data-one-demo="input"></div>',
      '<div data-one-demo="card"></div>',
    ].join('');

    mountOneDocsClient();

    expect(document.querySelector('.one-button')).toBeTruthy();
    expect(document.querySelector('.one-input')).toBeTruthy();
    expect(document.querySelector('.one-card')).toBeTruthy();
  });

  it('is safe when a docs page has no demo roots', () => {
    expect(() => mountOneDocsClient()).not.toThrow();
  });
});
```

- [ ] **Step 2: Run client test and verify client module is missing**

Run: `bun test packages/one/tests/docs-client.test.ts`

Expected: FAIL because `docs/app/client.ts` does not exist.

- [ ] **Step 3: Implement focused interactive demo apps**

- `ButtonDemo` renders three OneButton variants and updates a click-count label.
- `InputDemo` demonstrates one uncontrolled field and one controlled field whose
  `input` event updates parent state using `OneInputValueEvent`.
- `CardDemo` renders a OneCard with explicit header and footer slot children.

Each demo is a TSone `Component` with only the state required by that demo.
`mountOneDocsClient()` iterates `[data-one-demo]`, assigns a unique id when
needed, selects the corresponding demo constructor, and mounts it with
`createApp({ root, rootElement: '#id' })`. Export the function, then call it at
module load from `client.ts`.

- [ ] **Step 4: Run client tests and verify interaction**

Run: `bun test packages/one/tests/docs-client.test.ts`

Expected: PASS, including a click-count assertion and a controlled input value
assertion added after the initial mount test passes.

- [ ] **Step 5: Write failing docs build and server tests**

`docs-build.test.ts` must assert:

```ts
expect(routeToOneDocsOutputPath('/', outDir)).toBe(join(outDir, 'index.html'));
expect(routeToOneDocsOutputPath('/components/button/', outDir)).toBe(
  join(outDir, 'components/button/index.html')
);
const result = await buildOneDocs({ outDir });
expect(result.pagesBuilt).toBe(7);
expect(existsSync(join(outDir, 'index.html'))).toBe(true);
expect(existsSync(join(outDir, 'components/button/index.html'))).toBe(true);
expect(existsSync(join(outDir, 'assets/one-docs-client.js'))).toBe(true);
```

Read built HTML and assert `<!doctype html>`, `One UI`, the three component
class names, classic layout classes and `/assets/one-docs-client.js`.

`docs-server.test.ts` starts the server on port `0`, then verifies `/`,
`/components/button/`, the client asset, a missing route (404), encoded path
traversal (404), and a malformed encoded path (404). Always call `server.stop()`
in `finally`.

Run:

```bash
bun test packages/one/tests/docs-build.test.ts \
  packages/one/tests/docs-server.test.ts
```

Expected: FAIL because `scripts/docs.ts` does not exist.

- [ ] **Step 6: Implement static docs build and safe file server**

Follow the existing TSone docs server pattern without importing its internal
files. Implement these exact exports:

```ts
export interface OneDocsBuildOptions { outDir?: string }
export interface OneDocsBuildResult {
  outDir: string;
  pagesBuilt: number;
  assetsBuilt: string[];
}
export interface OneDocsServerOptions {
  hostname: string;
  port: number;
  outDir: string;
}
export function routeToOneDocsOutputPath(route: string, outDir: string): string;
export async function buildOneDocs(
  options?: OneDocsBuildOptions
): Promise<OneDocsBuildResult>;
export async function startOneDocsServer(
  options?: OneDocsServerOptions
): Promise<ReturnType<typeof Bun.serve>>;
```

`buildOneDocs` removes only the selected output directory, builds
`docs/app/client.ts` with `Bun.build({ target: 'browser', format: 'esm', write:
false })`, writes `assets/one-docs-client.js`, renders all seven pages through
`createOneDocsPageApp(...).renderHtmlDocument()`, and writes directory-style
HTML paths.

Install a Happy DOM window before each static render. The file server must
decode paths inside `try/catch`, reject `..` and NUL, resolve directory requests
to `index.html`, compare real paths against the real output root, and return
explicit HTML/JS/CSS/JSON content types. CLI `--build` builds once; otherwise
serve with `--host`, `--port`, `--out-dir` and `HOST`, `PORT`, `DOCS_OUT_DIR`
fallbacks.

- [ ] **Step 7: Run all docs verification**

Run:

```bash
bun test packages/one/tests/docs-content.test.ts \
  packages/one/tests/docs-app.test.ts \
  packages/one/tests/docs-client.test.ts \
  packages/one/tests/docs-build.test.ts \
  packages/one/tests/docs-server.test.ts
bun run --cwd packages/one docs:build
```

Expected: PASS; seven pages and one client asset are generated in ignored
`packages/one/docs/dist`.

- [ ] **Step 8: Commit docs interactivity and build**

```bash
git add packages/one/docs/app/demos packages/one/docs/app/client.ts \
  packages/one/docs/app/app.ts packages/one/scripts/docs.ts \
  packages/one/tests/docs-client.test.ts \
  packages/one/tests/docs-build.test.ts \
  packages/one/tests/docs-server.test.ts
git diff --cached --check
git commit -m "docs(one): build interactive documentation site"
```

---

### Task 8: 接入根 workspace 并完成全量验证

**Files:**
- Modify: `.gitignore`
- Modify: `package.json`
- Modify: `tsconfig.json`
- Modify: `bun.lock`
- Create: `packages/one/tests/workspace-integration.test.ts`

**Interfaces:**
- Consumes: complete One UI package and docs commands.
- Produces: root `build:one`, `docs:one`, `docs:one:build`, combined `build`, TypeScript source resolution and clean workspace install.

- [ ] **Step 1: Write the failing workspace integration test**

```ts
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'bun:test';

const repoRoot = join(import.meta.dir, '../../..');

describe('One UI workspace integration', () => {
  it('exposes root build and docs commands', () => {
    const rootPackage = JSON.parse(
      readFileSync(join(repoRoot, 'package.json'), 'utf8')
    ) as { scripts: Record<string, string>; workspaces: string[] };

    expect(rootPackage.workspaces).toContain('packages/*');
    expect(rootPackage.scripts['build:one']).toBe(
      'bun run --cwd packages/one build'
    );
    expect(rootPackage.scripts['docs:one']).toBe(
      'bun run --cwd packages/one docs'
    );
    expect(rootPackage.scripts['docs:one:build']).toBe(
      'bun run --cwd packages/one docs:build'
    );
    expect(rootPackage.scripts.build).toContain('packages/tsone');
    expect(rootPackage.scripts.build).toContain('packages/one');
  });

  it('maps the public source package for strict workspace typechecking', () => {
    const config = JSON.parse(
      readFileSync(join(repoRoot, 'tsconfig.json'), 'utf8')
    ) as {
      compilerOptions: { paths: Record<string, string[]> };
      include: string[];
    };
    expect(config.compilerOptions.paths['@geektech/one']).toEqual([
      'packages/one/lib/index.ts',
    ]);
    expect(config.include).toContain('packages/one/lib');
    expect(config.include).toContain('packages/one/docs/app');
    expect(config.include).toContain('packages/one/scripts');
  });
});
```

- [ ] **Step 2: Run the test and verify root integration is absent**

Run: `bun test packages/one/tests/workspace-integration.test.ts`

Expected: FAIL on missing One UI scripts and path mapping.

- [ ] **Step 3: Apply minimal root configuration changes**

Preserve all existing keys and user edits. Add only:

```json
{
  "scripts": {
    "build:one": "bun run --cwd packages/one build",
    "docs:one": "bun run --cwd packages/one docs",
    "docs:one:build": "bun run --cwd packages/one docs:build"
  }
}
```

Update the existing root `build` value so it runs the current TSone build first
and `bun run --cwd packages/one build` second. In `tsconfig.json`, add:

```json
{
  "compilerOptions": {
    "paths": {
      "@geektech/one": ["packages/one/lib/index.ts"]
    }
  },
  "include": [
    "packages/one/lib",
    "packages/one/docs/app",
    "packages/one/scripts"
  ]
}
```

Append `.superpowers/` and `packages/one/docs/dist/` to `.gitignore` only if an
existing broader rule does not already match them. Run `bun install` once to
update the existing lockfile without replacing unrelated workspace entries.

- [ ] **Step 4: Run focused One UI verification**

Run:

```bash
bun test packages/one
bunx tsc --noEmit --project packages/one/tsconfig.json
bun run --cwd packages/one build
bun run --cwd packages/one docs:build
bun pm pack --cwd packages/one --dry-run
```

Expected: all commands exit 0; dry-run lists only approved package files.

- [ ] **Step 5: Run repository-level verification**

Run:

```bash
bunx tsc --noEmit
bun run build
bun test
git diff --check
git status --short
```

Expected: all task-related checks pass. If `bun test` exposes an unrelated
baseline failure from the pre-existing dirty worktree, record its exact test and
error separately; do not change unrelated TSone work to hide it.

- [ ] **Step 6: Review and commit only One UI integration hunks**

Because `.gitignore`, `package.json`, `tsconfig.json` and `bun.lock` were already
dirty before this task, do not stage each whole file blindly. Stage the new test
normally, then interactively stage only One UI additions in the root files:

```bash
git add packages/one/tests/workspace-integration.test.ts
git add -p -- .gitignore package.json tsconfig.json bun.lock
git diff --cached --name-only
git diff --cached
git diff --cached --check
git commit -m "chore: integrate One UI workspace"
```

The cached diff must contain no unrelated TSone docs, playground, CLI or user
configuration changes. Leave every unrelated working-tree change unstaged.

---

## Final Acceptance Checklist

- [ ] `@geektech/one@0.0.1` builds and packs with peer range `>=0.0.2 <0.1.0`.
- [ ] `OneButton`, `OneInput`, `OneCard` and all approved public types import from the package root.
- [ ] Component behavior, runtime fallbacks, CSS prefixes, theme variables and accessibility assertions pass.
- [ ] Seven documentation routes build through TSone and include real static and interactive One UI examples.
- [ ] Root scripts and TypeScript path mapping resolve both packages in the workspace.
- [ ] Generated artifacts remain ignored and the user’s pre-existing changes remain intact and unstaged.
- [ ] Focused tests, strict typecheck, package build, docs build and dry-run pack pass.
- [ ] Full repository test/build status is recorded with unrelated baseline failures separated from task results.
