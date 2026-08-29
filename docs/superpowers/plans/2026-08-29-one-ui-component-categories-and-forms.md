# One UI 组件分类与表单体系 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为 `@geektech/one` 建立分类化的同步表单组件体系，并把其 API、文档、交互示例和发布契约完整接入现有 One UI 包。

**Architecture:** 每个可视组件直接继承 TSone `Component`。`OneForm` 组合无 DOM 的 `OneFormModel`，并通过 TSone `provide/inject` 将模型和字段上下文提供给 `OneFormItem` 与字段组件；字段组件在表单内让模型成为唯一值源，在表单外继续保留既有受控/非受控行为。文档使用同一份分类内容和真实组件样式/交互 demo，不增加外部运行时依赖或新的框架能力。

**Tech Stack:** Bun、TypeScript strict、TSone `Component`/VNode/slots/provide-inject、Happy DOM、Bun test。

**Spec:** `docs/superpowers/specs/2026-08-29-one-ui-component-categories-and-form-design.md`

## Global Constraints

- 只修改 `packages/one/**` 及本计划/规格；保留当前未提交的 `packages/tsone-cli/**` 改动。
- `@geektech/one` 保持零浏览器运行时依赖，不能修改 TSone 的公开 API 或导入 renderer 内部实现。
- 可视组件直接继承 `Component<Props, State>`；共享状态通过 `OneFormModel` 的组合和受限接口，不新增字段基类。
- 字段支持同步 `required`、`minLength`、`maxLength`、`pattern` 与 `validator`，不实现异步验证或远程选项加载。
- 所有新增选择器使用 `.one-*`，主题变量使用 `--one-*`，并更新主题 token 文档的严格集合测试。
- 新公开 API 必须同步根入口、双语 README、typed docs、严格类型测试、构建与 tarball runtime smoke。
- 先写失败测试，再实现；每个任务仅提交任务相关文件。

---

## 文件结构

```text
packages/one/
├── lib/
│   ├── form/
│   │   ├── context.ts       # 注入 key、字段上下文与公共表单类型
│   │   ├── model.ts         # 无 DOM 的同步表单模型和规则执行器
│   │   ├── OneForm.ts       # form 容器和 submit/reset 公共方法
│   │   ├── OneFormItem.ts   # label/description/error/焦点注册
│   │   └── index.ts
│   ├── select/OneSelect.ts
│   ├── checkbox/OneCheckbox.ts
│   ├── checkbox/OneCheckboxGroup.ts
│   ├── switch/OneSwitch.ts
│   ├── categories.ts        # 分类常量及供文档/消费者读取的受限元数据
│   └── index.ts
├── docs/app/
│   ├── content/form.ts
│   ├── demos/FormDemo.ts
│   ├── demos/SelectDemo.ts
│   ├── demos/CheckboxDemo.ts
│   └── demos/SwitchDemo.ts
└── tests/
    ├── form-model.test.ts
    ├── form.test.ts
    ├── select.test.ts
    ├── checkbox.test.ts
    ├── switch.test.ts
    ├── categories.test.ts
    └── form-components.test.ts
```

---

### Task 1: 表单类型、模型与注入上下文

**Files:**
- Create: `packages/one/lib/form/context.ts`
- Create: `packages/one/lib/form/model.ts`
- Create: `packages/one/lib/form/index.ts`
- Create: `packages/one/tests/form-model.test.ts`
- Modify: `packages/one/lib/types.ts`

**Interfaces:**
- Consumes: TSone `InjectionKey`，现有 `OneInputValueEvent` 的事件载荷风格。
- Produces: `OneFieldValue`、`OneFieldValueEvent<T>`、`OneFormValues`、`OneValidationRule`、`OneFormValidationResult`、`OneFormModel`、`ONE_FORM_MODEL_KEY`、`ONE_FORM_FIELD_KEY`。

- [ ] **Step 1: 写失败的模型测试**

```ts
import { OneFormModel } from '../lib/form/model';

it('validates required, length, pattern and custom synchronous rules', () => {
  const model = new OneFormModel(
    { name: '', tags: [], enabled: false },
    {
      name: [
        { required: true, message: '名称不能为空' },
        { minLength: 3, message: '至少 3 个字符' },
        { pattern: /^[a-z]+$/, message: '仅允许小写字母' },
      ],
      tags: [{ required: true, message: '至少选择一个标签' }],
      enabled: [{ required: true, message: '请启用开关' }],
      code: [
        {
          validator: (value, values) =>
            value === values.name ? undefined : '编码必须等于名称',
        },
      ],
    }
  );

  model.setValue('code', 'wrong');
  expect(model.validate().errors).toEqual({
    name: ['名称不能为空', '至少 3 个字符', '仅允许小写字母'],
    tags: ['至少选择一个标签'],
    enabled: ['请启用开关'],
    code: ['编码必须等于名称'],
  });
});
```

同时覆盖 `reset()` 恢复 initialValues、订阅者在 `setValue/reset/validate` 后收到一次
通知、字段注册返回的注销函数移除 focus target，以及 validator 抛错时返回稳定的
`'校验器执行失败'` 字段错误。

- [ ] **Step 2: 运行模型测试，确认失败**

Run: `bun test packages/one/tests/form-model.test.ts`

Expected: FAIL，缺少 `../lib/form/model` 和公开表单类型。

- [ ] **Step 3: 实现严格同步模型与字段上下文**

在 `context.ts` 定义：

```ts
export type OneFieldValue = string | boolean | string[];
export type OneFormValues = Readonly<Record<string, OneFieldValue | undefined>>;

export interface OneFieldValueEvent<TValue extends OneFieldValue> {
  value: TValue;
  originalEvent: Event;
}

export interface OneValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  message?: string;
  validator?: (value: OneFieldValue | undefined, values: OneFormValues) =>
    | string
    | undefined;
}

export interface OneFormFieldContext {
  name: string;
  controlId: string;
  describedBy: string | undefined;
  model: OneFormModel;
}
```

使用带类型的 symbol key：

```ts
export const ONE_FORM_MODEL_KEY = Symbol('one-form-model') as InjectionKey<OneFormModel>;
export const ONE_FORM_FIELD_KEY = Symbol('one-form-field') as InjectionKey<OneFormFieldContext>;
```

`OneFormModel` 只保存普通对象/Map/Set：

- 构造时复制 initial values 与 rules，禁止把用户对象作为可变内部状态泄漏。
- 内部保留一份 immutable initial values 快照和一组已注册字段名；`ensureValue(name,
  fallback)` 只在值尚未存在时写入 initial value（存在时）或 fallback。
- `setValue(name, value)`、`getValue(name)`、`getValues()`、`getErrors(name)`、`validate()`、
  `reset()`、`subscribe(listener)`、`registerField(name, focus)` 为唯一公共方法。
- `getValues()` 与无参数 `validate()` 只处理当前已注册字段；注销字段时移除其当前值、错误与
  focus target，重新挂载时可由 initial value/fallback 恢复。这确保卸载的 FormItem 不会参与
  提交或校验。
- `required` 对 `undefined`、空字符串、空数组和 `false` 失败；长度只检查 string/array；
  pattern 只检查 string。每条匹配失败的 rule 都追加一个消息，`message` 优先。
- validator 使用当前只读 values；捕获异常并产生 `'校验器执行失败'`，没有 `any`。

- [ ] **Step 4: 运行模型与类型检查**

Run:

```bash
bun test packages/one/tests/form-model.test.ts
bunx tsc --noEmit --project packages/one/tsconfig.json
```

Expected: PASS。

- [ ] **Step 5: 提交模型基础**

```bash
git add packages/one/lib/form packages/one/lib/types.ts \
  packages/one/tests/form-model.test.ts
git diff --cached --check
git commit -m "feat(one): add synchronous form model"
```

---

### Task 2: OneForm、OneFormItem 与 OneInput 表单接入

**Files:**
- Create: `packages/one/lib/form/OneForm.ts`
- Create: `packages/one/lib/form/OneFormItem.ts`
- Create: `packages/one/tests/form.test.ts`
- Modify: `packages/one/lib/form/index.ts`
- Modify: `packages/one/lib/input/OneInput.ts`
- Modify: `packages/one/lib/input/index.ts`
- Modify: `packages/one/lib/index.ts`

**Interfaces:**
- Consumes: Task 1 的 `OneFormModel`、`ONE_FORM_MODEL_KEY`、`ONE_FORM_FIELD_KEY`。
- Produces: `OneForm`、`OneFormProps`、`OneFormSubmitEvent`、`OneFormItem`、`OneFormItemProps`；表单内 `OneInput` 读取字段上下文。

- [ ] **Step 1: 写失败的 form DOM 测试**

```ts
it('submits valid values and blocks invalid values with linked errors', () => {
  const form = new OneForm({
    initialValues: { project: '' },
    rules: { project: [{ required: true, message: '请输入项目名称' }] },
    children: [
      {
        component: OneFormItem,
        props: { name: 'project', label: '项目名称', description: '用于展示' },
        children: [{ component: OneInput, props: { ariaLabel: '项目名称' } }],
      },
    ],
  });
  // mount, dispatch submit, assert preventDefault, aria-invalid, label for,
  // aria-describedby and error text; fill input and assert submit payload.
});
```

覆盖：initialValues 作为表单内 Input 的初始值、`reset()` 恢复初始值、卸载
`OneFormItem` 后不参与 getValues/validate、失败时第一个无效 input 获得 focus、
表单外 OneInput 的现有 controlled/uncontrolled 测试继续通过。

- [ ] **Step 2: 运行 form 测试，确认失败**

Run: `bun test packages/one/tests/form.test.ts packages/one/tests/input.test.ts`

Expected: FAIL，缺少 `OneForm`/`OneFormItem` 及 Input 的字段上下文行为。

- [ ] **Step 3: 实现组件与 OneInput 接入**

`OneForm`：

```ts
export class OneForm extends Component<OneFormProps, { revision: number }> {
  public validate(): OneFormValidationResult;
  public reset(): void;
  public getValues(): OneFormValues;
}
```

- 构造后 `provide(ONE_FORM_MODEL_KEY, this.model)`；onMounted 订阅 model 并递增
  `revision`，onUnmounted 取消订阅。
- 根节点为原生 `<form class="one-form" novalidate>`，submit listener 调用
  `event.preventDefault()`、`model.validate()`；失败时 `focusFirstInvalidField()`，
  成功时 `emit('submit', { values: model.getValues() })`。
- `reset()` 调用 model.reset()，不发 submit。

`OneFormItem`：

- 在 `beforeMount` 注入模型；没有 form 父级时抛出 `OneFormItem requires OneForm`。
- 使用稳定的由 `name` 归一化而来的 control/description/error id；`provide`
  `ONE_FORM_FIELD_KEY` 给 default slot。
- 根节点包含 `<label for>`（有 label 时）、slot、description 与有错误才出现的
  `role="alert"` 错误节点；注册 focus 回调查找第一项 `input, button`。

`OneInput`：

- 在表单字段上下文存在时以 `model.getValue(name)` 为值源，并在缺值时
  `ensureValue(name, props.value ?? props.defaultValue ?? '')`；表单值优先于 props。
- 输入事件写入 model；`invalid` 合并 `props.invalid` 与 `model.getErrors(name).length > 0`；
  写入 context 的 `id` 和 `aria-describedby`。
- 在 `onMounted/onUnmounted` 订阅/取消 model，订阅时递增一个私有 state revision 触发渲染。

- [ ] **Step 4: 运行表单回归**

Run:

```bash
bun test packages/one/tests/form-model.test.ts \
  packages/one/tests/form.test.ts packages/one/tests/input.test.ts
bunx tsc --noEmit --project packages/one/tsconfig.json
```

Expected: PASS。

- [ ] **Step 5: 提交表单容器**

```bash
git add packages/one/lib/form packages/one/lib/input packages/one/lib/index.ts \
  packages/one/tests/form.test.ts
git diff --cached --check
git commit -m "feat(one): add accessible form components"
```

---

### Task 3: OneCheckbox、OneSwitch 与字段协议

**Files:**
- Create: `packages/one/lib/checkbox/OneCheckbox.ts`
- Create: `packages/one/lib/checkbox/index.ts`
- Create: `packages/one/lib/switch/OneSwitch.ts`
- Create: `packages/one/lib/switch/index.ts`
- Create: `packages/one/tests/checkbox.test.ts`
- Create: `packages/one/tests/switch.test.ts`
- Modify: `packages/one/lib/index.ts`

**Interfaces:**
- Consumes: Task 1 字段值事件/字段上下文，Task 2 的 OneForm 约定，`ONE_THEME_DEFAULTS`。
- Produces: `OneCheckbox`/`OneSwitch` 及其 props；二者在表单中保存 boolean 并参与 required。

- [ ] **Step 1: 写失败的 Checkbox/Switch 测试**

```ts
it('keeps controlled checkbox checked state and emits boolean values', () => {
  const component = new OneCheckbox({ checked: true, ariaLabel: '同意协议' });
  const events: Array<OneFieldValueEvent<boolean>> = [];
  component.on('change', (payload) => events.push(payload as OneFieldValueEvent<boolean>));
  // mount, uncheck native input, assert emitted false then DOM restores true.
});

it('writes a switch value into OneForm and fails required when false', () => {
  // OneFormItem(name: 'enabled') -> OneSwitch; submit false then true.
});
```

覆盖非受控 `defaultChecked`、disabled 不发事件、`name`、`aria-label`、invalid、
checkbox slot label、switch 的 `role="switch"` 和表单 reset。

- [ ] **Step 2: 运行测试，确认失败**

Run: `bun test packages/one/tests/checkbox.test.ts packages/one/tests/switch.test.ts`

Expected: FAIL，模块与导出不存在。

- [ ] **Step 3: 实现两个组件**

- `OneCheckboxProps` 和 `OneSwitchProps` 使用 `checked?/defaultChecked?`，不能复用
  `OneInputProps` 造成不相关 string API 泄漏。
- 两者渲染原生 checkbox；Switch 额外 `role="switch"` 和 `aria-checked`。
- 表单上下文存在时使用/写入 model boolean；否则按 props 实现 controlled/uncontrolled。
- 值事件精确为 `OneFieldValueEvent<boolean>`，同时发 `input` 与 `change`。
- 新样式包括 `.one-checkbox*`、`.one-switch*`、focus-visible、disabled 和 invalid；
  所有 fallback 用 `--one-*` 变量。

- [ ] **Step 4: 运行行为、样式与类型检查**

Run:

```bash
bun test packages/one/tests/checkbox.test.ts packages/one/tests/switch.test.ts \
  packages/one/tests/form.test.ts packages/one/tests/style-contract.test.ts
bunx tsc --noEmit --project packages/one/tsconfig.json
```

Expected: PASS。

- [ ] **Step 5: 提交布尔字段组件**

```bash
git add packages/one/lib/checkbox packages/one/lib/switch packages/one/lib/index.ts \
  packages/one/tests/checkbox.test.ts packages/one/tests/switch.test.ts
git diff --cached --check
git commit -m "feat(one): add checkbox and switch"
```

---

### Task 4: OneSelect 单选、多选、搜索与键盘交互

**Files:**
- Create: `packages/one/lib/select/OneSelect.ts`
- Create: `packages/one/lib/select/index.ts`
- Create: `packages/one/tests/select.test.ts`
- Modify: `packages/one/lib/index.ts`

**Interfaces:**
- Consumes: Task 1 的 `OneFieldValueEvent<string | string[]>` 与字段上下文。
- Produces: `OneSelect`、`OneSelectProps`、`OneSelectOption`、`OneSelectOptionGroup`。

- [ ] **Step 1: 写失败的 Select DOM 测试**

```ts
const options = [
  { value: 'beijing', label: '北京' },
  { label: '海外', options: [{ value: 'tokyo', label: '东京' }] },
  { value: 'disabled', label: '不可选', disabled: true },
] as const;

it('filters local options and retains multiple selections', () => {
  const component = new OneSelect({ options, multiple: true, searchable: true });
  // open combobox, type 东京, select it then 北京, assert ['tokyo', 'beijing'].
});
```

覆盖受控单选会恢复 prop value、非受控多选更新 array、运行时 value 类型与
`multiple` 不匹配时回退空选择、disabled option 不可选择、group label 呈现，以及
ArrowDown/ArrowUp/Enter/Escape 的焦点与打开状态。

- [ ] **Step 2: 运行测试，确认失败**

Run: `bun test packages/one/tests/select.test.ts`

Expected: FAIL，缺少 Select 模块。

- [ ] **Step 3: 实现 Select**

```ts
export interface OneSelectOption { value: string; label: string; disabled?: boolean; }
export interface OneSelectOptionGroup { label: string; options: readonly OneSelectOption[]; }
export interface OneSelectProps {
  options: readonly (OneSelectOption | OneSelectOptionGroup)[];
  value?: string | string[];
  defaultValue?: string | string[];
  multiple?: boolean;
  searchable?: boolean;
  name?: string;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  invalid?: boolean;
  ariaLabel?: string;
}
```

- 用小的私有函数 `flattenOptions`、`normalizeSelectValue`、`matchesSearch`，不把搜索/
  键盘逻辑塞进 render。
- state 保存 `open`、`query`、`activeIndex` 与仅用于非受控模式的 normalized value。
- trigger 使用 `role="combobox"`、`aria-expanded`、`aria-controls`；菜单为
  `role="listbox"`，option 为 `role="option"`，多选时有 `aria-multiselectable`。
- 选择后把值写入表单 model（如存在），否则更新非受控 state；受控模式只发事件并
  保留 props value。单选关闭菜单，多选保持打开。
- 样式覆盖 trigger、search input、listbox、option active/selected/disabled、group label、
  多选 tags、focus 和 invalid，均加入 theme token 文档来源。

- [ ] **Step 4: 运行 Select、表单与类型检查**

Run:

```bash
bun test packages/one/tests/select.test.ts packages/one/tests/form.test.ts \
  packages/one/tests/style-contract.test.ts
bunx tsc --noEmit --project packages/one/tsconfig.json
```

Expected: PASS。

- [ ] **Step 5: 提交 Select**

```bash
git add packages/one/lib/select packages/one/lib/index.ts \
  packages/one/tests/select.test.ts
git diff --cached --check
git commit -m "feat(one): add searchable multi-select"
```

---

### Task 5: OneCheckboxGroup、分类元数据与公共契约

**Files:**
- Create: `packages/one/lib/checkbox/OneCheckboxGroup.ts`
- Create: `packages/one/lib/categories.ts`
- Create: `packages/one/tests/categories.test.ts`
- Modify: `packages/one/lib/checkbox/index.ts`
- Modify: `packages/one/lib/index.ts`
- Modify: `packages/one/tests/component-types.test.ts`
- Modify: `packages/one/tests/style-contract.test.ts`
- Modify: `packages/one/tests/package-contract.test.ts`

**Interfaces:**
- Consumes: Task 3 Checkbox 和 Task 4 `OneSelectOption`。
- Produces: `OneCheckboxGroup`、`OneCheckboxGroupProps`、`ONE_COMPONENT_CATEGORIES`、
  `OneComponentCategory`，以及所有新增组件的根入口导出。

- [ ] **Step 1: 写失败的 group 与分类测试**

```ts
it('keeps component names in one stable category catalog', () => {
  expect(ONE_COMPONENT_CATEGORIES).toEqual([
    { id: 'basic', label: '基础', components: ['OneButton', 'OneInput'] },
    { id: 'form', label: '表单', components: ['OneForm', 'OneFormItem', 'OneSelect', 'OneCheckbox', 'OneCheckboxGroup', 'OneSwitch'] },
    { id: 'data-display', label: '数据展示', components: ['OneCard'] },
    { id: 'feedback', label: '反馈与浮层', components: [] },
  ]);
});
```

CheckboxGroup 测试必须断言字符串数组受控/非受控更新、disabled option、表单 required、
reset 以及 event payload；类型测试必须包含 `@ts-expect-error` 的错误多选 value。

- [ ] **Step 2: 运行测试，确认失败**

Run:

```bash
bun test packages/one/tests/categories.test.ts \
  packages/one/tests/component-types.test.ts
```

Expected: FAIL，新 export 与 group 不存在。

- [ ] **Step 3: 实现 Group 和分类常量**

`OneCheckboxGroup` 组合多个 `OneCheckbox` VNode，接收 `readonly OneSelectOption[]`；
不要继承 Select 或 Checkbox。它维护/读取 `string[]`，按 option value 计算 checked，
再通过 `toggleValue` 返回稳定、无重复、按 options 顺序的数组。

`categories.ts` 导出只读元数据：

```ts
export type OneComponentCategory = 'basic' | 'form' | 'data-display' | 'feedback';
export const ONE_COMPONENT_CATEGORIES = [/* Step 1 exact rows */] as const;
```

所有分类目录仅用于源码组织和根入口 re-export；不增加 npm subpath exports，从而保持当前
单 ESM entry build/publish 契约。

- [ ] **Step 4: 扩大公共契约检查**

Run:

```bash
bun test packages/one/tests/checkbox.test.ts packages/one/tests/categories.test.ts \
  packages/one/tests/component-types.test.ts packages/one/tests/style-contract.test.ts \
  packages/one/tests/package-contract.test.ts
bunx tsc --noEmit --project packages/one/tsconfig.json
```

Expected: PASS。

- [ ] **Step 5: 提交分类和 group**

```bash
git add packages/one/lib/checkbox packages/one/lib/categories.ts packages/one/lib/index.ts \
  packages/one/tests/categories.test.ts packages/one/tests/component-types.test.ts \
  packages/one/tests/style-contract.test.ts packages/one/tests/package-contract.test.ts
git diff --cached --check
git commit -m "feat(one): categorize form components"
```

---

### Task 6: 分类化文档、真实预览与交互 demos

**Files:**
- Create: `packages/one/docs/app/content/form.ts`
- Create: `packages/one/docs/app/demos/FormDemo.ts`
- Create: `packages/one/docs/app/demos/SelectDemo.ts`
- Create: `packages/one/docs/app/demos/CheckboxDemo.ts`
- Create: `packages/one/docs/app/demos/SwitchDemo.ts`
- Modify: `packages/one/docs/app/content/types.ts`
- Modify: `packages/one/docs/app/content/index.ts`
- Modify: `packages/one/docs/app/content/components.ts`
- Modify: `packages/one/docs/app/components/DocsNav.ts`
- Modify: `packages/one/docs/app/components/DocArticle.ts`
- Modify: `packages/one/docs/app/client.ts`
- Modify: `packages/one/docs/app/styles.ts`
- Modify: `packages/one/tests/docs-content.test.ts`
- Modify: `packages/one/tests/docs-app.test.ts`
- Modify: `packages/one/tests/docs-client.test.ts`
- Modify: `packages/one/tests/docs-build.test.ts`

**Interfaces:**
- Consumes: Tasks 2-5 的组件、分类常量和 styles。
- Produces: 12 个 validated docs routes、分类导航、四个真实交互 demo 和完整 token
  文档覆盖。

- [ ] **Step 1: 写失败的文档契约测试**

把现有 `APPROVED_PATHS` 更新为严格顺序：

```ts
[
  '/', '/guide/design/', '/guide/getting-started/', '/guide/theming/',
  '/components/button/', '/components/input/', '/components/card/',
  '/components/form/', '/components/form/form/', '/components/form/select/',
  '/components/form/checkbox/', '/components/form/switch/',
]
```

测试还必须断言：

- `OneDocPage.section` 支持 `'基础' | '表单' | '数据展示' | '反馈与浮层'`；
- 导航显示基础、表单、数据展示、反馈与浮层，且 form 页面按 order 排列；
- select 页包含 multiple/searchable/option group/keyboard API；
- form 页包含 required/minLength/maxLength/pattern/validator、submit/reset 和无障碍说明；
- theming runtime token extraction 加入 Checkbox/Switch/Select/Form styles；
- 文档静态预览包含新增 `.one-*` 控件，client demo 能完成多选、校验、reset 和 switch。

- [ ] **Step 2: 运行文档测试，确认失败**

Run:

```bash
bun test packages/one/tests/docs-content.test.ts packages/one/tests/docs-app.test.ts \
  packages/one/tests/docs-client.test.ts packages/one/tests/docs-build.test.ts
```

Expected: FAIL，路由、demo union、静态预览和 styles 不完整。

- [ ] **Step 3: 实现文档内容、导航与预览**

- `content/types.ts` 将 section 改为四类联合；demo component union 扩展为
  `'form' | 'select' | 'checkbox' | 'switch'`。
- `content/form.ts` 定义 5 个页面：`/components/form/` 为总览，Form 页面文档化
  `OneForm` 与 `OneFormItem`，Checkbox 页面同时文档化 `OneCheckboxGroup`。
- 现有 Button/Input 迁入“基础”，Card 迁入“数据展示”；URL 不变。
- `DocsNav` 用 `ONE_COMPONENT_CATEGORIES` 的 label/id 生成组件分组，并保留“开始/指南”
  顺序；反馈分类显示“即将推出”，但不生成不存在的组件路由。
- `DocArticle` 对新增 demo 分支渲染真实静态 One 组件；form preview 至少包含
  FormItem + Input + Select + Button。
- `styles.ts` 直接导入每个新增组件的 `ONE_*_STYLES` 并转换；不复制 CSS 文本。

- [ ] **Step 4: 实现客户端 demos**

每个 demo 是独立 TSone component：

- `FormDemo`：项目名 required/minLength/pattern，标签 Select 多选可搜索，Switch；
  显示 submit values、错误和 reset 后状态。
- `SelectDemo`：本地选项组、search query、multiple tags、disabled option。
- `CheckboxDemo`：独立 Checkbox 与 CheckboxGroup。
- `SwitchDemo`：受控 Switch 及当前 boolean 文本。

`client.ts` 将 `data-one-demo` 映射扩展为四个新 constructor；保持现有 `WeakSet`
幂等挂载规则。

- [ ] **Step 5: 运行文档、客户端和类型验证**

Run:

```bash
bun test packages/one/tests/docs-content.test.ts packages/one/tests/docs-app.test.ts \
  packages/one/tests/docs-client.test.ts packages/one/tests/docs-build.test.ts \
  packages/one/tests/docs-server.test.ts
bun run --cwd packages/one docs:build
bunx tsc --noEmit --project packages/one/tsconfig.json
```

Expected: PASS，构建输出 12 个 HTML 页面与 client asset。

- [ ] **Step 6: 提交分类文档**

```bash
git add packages/one/docs packages/one/tests/docs-content.test.ts \
  packages/one/tests/docs-app.test.ts packages/one/tests/docs-client.test.ts \
  packages/one/tests/docs-build.test.ts
git diff --cached --check
git commit -m "docs(one): add categorized form component docs"
```

---

### Task 7: README、发布契约与完整验证

**Files:**
- Modify: `packages/one/README.md`
- Modify: `packages/one/README-zh.md`
- Modify: `packages/one/tests/package-smoke.test.ts`
- Modify: `packages/one/tests/workspace-integration.test.ts`
- Modify: `packages/one/tests/package-contract.test.ts`
- Modify: `packages/one/tests/component-types.test.ts`

**Interfaces:**
- Consumes: Tasks 1-6 的全部根入口 exports、文档路由和构建输出。
- Produces: 与实际 API 完全同步的双语消费文档、tarball 类型/runtime 契约和最终交付
  证据。

- [ ] **Step 1: 写失败的 README/发布契约测试**

在 package contract 测试读取双语 README，断言每个文件都包含：

```ts
['OneForm', 'OneFormItem', 'OneSelect', 'OneCheckbox',
 'OneCheckboxGroup', 'OneSwitch', 'multiple: true', 'searchable: true',
 'required', 'minLength', 'maxLength', 'pattern', 'validator', 'reset']
```

扩展 smoke consumer 的 type imports 与 runtime assertions，至少包含所有新增构造函数、
`OneValidationRule`、`OneFormValues`、`OneSelectOption`、`ONE_COMPONENT_CATEGORIES`。
新增 `@ts-expect-error`：Select multiple 为 true 时不接受 string value，CheckboxGroup
不接受 boolean value。

- [ ] **Step 2: 运行公开契约测试，确认失败**

Run:

```bash
bun test packages/one/tests/package-contract.test.ts \
  packages/one/tests/component-types.test.ts packages/one/tests/package-smoke.test.ts
```

Expected: FAIL，README 和 tarball consumer 尚未覆盖新增 API。

- [ ] **Step 3: 同步 README 与发布 consumer**

双语 README 增加分类目录和可复制完整示例：一个 OneForm 包含 Input、searchable multiple
Select、CheckboxGroup、Switch、四类同步 rules、submit 和 reset。每个输入控件提供
可访问名称。示例只能使用根入口已导出的类型/构造函数。

package smoke 继续只使用实际 `bun pm pack` tarball 解包后的临时 scoped
`node_modules`，执行严格 tsc 与真实 Bun ESM import；它不得访问 registry 或回退到
workspace 源码。

- [ ] **Step 4: 运行 One 包完整门禁**

Run:

```bash
bun test packages/one --timeout 15000
bunx tsc --noEmit --project packages/one/tsconfig.json
bun run --cwd packages/one build
bun run --cwd packages/one docs:build
bun pm pack --cwd packages/one --dry-run
bunx prettier --check packages/one
```

Expected: PASS；pack 只包含批准的 `dist/**`、README、LICENSE 和 package manifest。

- [ ] **Step 5: 运行根集成验证**

Run:

```bash
bunx tsc --noEmit
bun run build
git diff --check
```

Expected: PASS；若 `packages/tsone-cli/**` 的既有脏改动导致基线失败，记录其精确文件和
错误，不修改或混入 One 提交。

- [ ] **Step 6: 提交公共文档与验证更新**

```bash
git add packages/one/README.md packages/one/README-zh.md \
  packages/one/tests/package-smoke.test.ts \
  packages/one/tests/workspace-integration.test.ts \
  packages/one/tests/package-contract.test.ts \
  packages/one/tests/component-types.test.ts
git diff --cached --check
git commit -m "docs(one): document categorized form components"
```

---

## Plan Self-Review

| 规格要求 | 实现任务 |
| --- | --- |
| 四类分类和稳定公开 API | Task 5、Task 6、Task 7 |
| Form/FormItem 和同步规则 | Task 1、Task 2 |
| Select 多选、搜索、分组、键盘 | Task 4 |
| Checkbox、CheckboxGroup、Switch 组合控件 | Task 3、Task 5 |
| 原生语义、错误 ARIA、首个无效字段焦点 | Task 2、Task 3、Task 4 |
| 全部主题变量和静态/交互文档 | Task 3、Task 4、Task 6 |
| 双语 README、类型、tarball runtime 与 workspace | Task 5、Task 7 |

已检查：所有后续使用的类型和方法均在前置任务定义；计划不包含 TODO/TBD/“类似任务”
占位；本期明确排除异步校验、远程搜索和 npm subpath exports。
