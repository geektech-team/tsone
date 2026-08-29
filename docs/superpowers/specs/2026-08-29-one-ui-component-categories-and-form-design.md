# One UI 组件分类与表单体系设计

日期：2026-08-29

状态：已确认设计，待用户审阅实施计划

## 1. 目标

扩展 `@geektech/one` 的公开组件，并在包入口、文档导航和组件内容中采用稳定的
组件分类。第一期优先建立完整的同步表单能力：可搜索的单选/多选选择器、复选框、
复选框组、开关、表单项和表单容器。后续数据展示与反馈浮层分类只建立信息架构，
不在本期实现具体组件。

成功标准：

- 新增组件可独立使用，也可通过 `OneForm` 完成统一的值管理、同步校验和提交。
- `OneSelect` 支持单选、多选、搜索、选项组和可访问的键盘交互。
- 规则仅支持必填、长度、正则和自定义同步校验；不支持异步校验。
- 文档按组件分类组织，表单页提供真实交互示例和完整 API。
- 不增加浏览器运行时依赖，不修改 TSone 框架公开 API。

## 2. 分类与范围

| 分类 | 本期组件 | 后续组件 |
| --- | --- | --- |
| 基础 | `OneButton`、`OneInput` | - |
| 表单 | `OneForm`、`OneFormItem`、`OneSelect`、`OneCheckbox`、`OneCheckboxGroup`、`OneSwitch` | - |
| 数据展示 | `OneCard` | `OneTag`、`OneBadge`、`OneEmpty` |
| 反馈与浮层 | - | `OneAlert`、`OneDialog`、`OneTooltip` |

本期不实现异步验证、远程选项加载、虚拟列表、日期/时间选择、富文本、图标系统、
全局 ThemeProvider 或通用字段基类。

## 3. 对象关系与职责

- 每个可视控件直接继承 TSone `Component<Props, State>`；这是唯一的继承关系。
- `OneForm` **组合**私有 `OneFormModel`，模型维护字段当前值、初始值、规则和
  校验结果，不拥有 DOM。
- `OneFormItem` **关联**表单模型中的一个字段，生成 label、描述和错误信息的
  可访问性标识，并把无效状态传递给其默认插槽中的字段。
- `OneSelect`、`OneCheckbox`、`OneCheckboxGroup`、`OneSwitch` **依赖**统一字段
  协议；它们不依赖 `OneForm`，因此可独立使用。
- 校验函数 **依赖**只读 `OneFormValues`，不访问组件实例或 DOM。

这保持单一职责和开闭原则：新增字段组件只实现字段协议和自己的渲染/样式；
`OneFormModel` 不需要了解具体控件类型。不会引入 `BaseOneField`，避免为少量共享
协议创建空泛继承层。

## 4. 公共 API

### 4.1 字段通用类型

```ts
export type OneFieldValue = string | boolean | string[];

export interface OneFieldValueEvent<TValue extends OneFieldValue> {
  value: TValue;
  originalEvent: Event;
}

export interface OneFormValues {
  readonly [name: string]: OneFieldValue | undefined;
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
```

`validator` 是同步函数：返回错误消息表示失败，返回 `undefined` 表示通过。若规则
配置非法或 validator 抛错，表单把它规范为字段错误，不让一次字段配置破坏其他字段。

### 4.2 OneForm 与 OneFormItem

```ts
export interface OneFormProps {
  initialValues?: OneFormValues;
  rules?: Readonly<Record<string, readonly OneValidationRule[]>>;
  children?: Array<VNode | string>;
}

export interface OneFormSubmitEvent {
  values: OneFormValues;
}

export interface OneFormItemProps {
  name: string;
  label?: string;
  description?: string;
  required?: boolean;
  children?: Array<VNode | string>;
}
```

`OneForm` 提供 `validate(): OneFormValidationResult`、`reset(): void` 和
`getValues(): OneFormValues`。提交按钮触发 form 的原生 `submit`，表单先执行所有
同步规则：失败时阻止提交、更新错误并聚焦第一个无效字段；通过时发出 `submit` 事件。

`OneFormItem` 使用 `name` 关联字段，渲染 label、描述和错误消息。错误存在时，字段
获得 `aria-invalid="true"`，并通过 `aria-describedby` 指向描述和错误节点。

### 4.3 OneSelect

```ts
export interface OneSelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface OneSelectOptionGroup {
  label: string;
  options: readonly OneSelectOption[];
}

export interface OneSelectProps {
  value?: string | string[];
  defaultValue?: string | string[];
  options: readonly (OneSelectOption | OneSelectOptionGroup)[];
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

单选值为 `string`，多选值为 `string[]`。运行时不匹配 `multiple` 的值回退为空选择。
搜索仅过滤现有本地 options，大小写不敏感，不触发远程加载。控件通过 `input` 和
`change` 发出精确值载荷。

选择器使用 `combobox`、`listbox` 与 `option` 语义：方向键移动活动项，Enter 选择，
Escape 关闭，下拉中跳过 disabled option。多选保持列表打开，单选选择后关闭。

### 4.4 OneCheckbox、OneCheckboxGroup 与 OneSwitch

```ts
export interface OneCheckboxProps {
  checked?: boolean;
  defaultChecked?: boolean;
  name?: string;
  value?: string;
  disabled?: boolean;
  required?: boolean;
  invalid?: boolean;
  ariaLabel?: string;
  children?: Array<VNode | string>;
}

export interface OneCheckboxGroupProps {
  value?: string[];
  defaultValue?: string[];
  options: readonly OneSelectOption[];
  name?: string;
  disabled?: boolean;
  required?: boolean;
  invalid?: boolean;
  ariaLabel?: string;
}

export interface OneSwitchProps {
  checked?: boolean;
  defaultChecked?: boolean;
  name?: string;
  disabled?: boolean;
  required?: boolean;
  invalid?: boolean;
  ariaLabel?: string;
}
```

Checkbox 与 Switch 支持受控和非受控布尔值，CheckboxGroup 支持字符串数组。
它们发出 `input`、`change` 以及与现有组件一致的原始 DOM 事件信息。CheckboxGroup
复用 `OneSelectOption`，但不继承 Select；两者只是共享值对象。

## 5. 表单数据流

```text
字段 input/change
  -> OneFormModel.setValue(name, value)
  -> 字段状态和 OneFormItem 错误提示更新
  -> OneForm.validate()（submit 或显式调用）
  -> 成功：form submit(values)；失败：阻止提交并聚焦首个无效字段
```

独立字段不注册到 form 时仍按自身受控/非受控规则工作。表单内字段通过 TSone 的
父组件关联与依赖注入访问 FormModel；注册在 mount 时发生，unmount 时移除，避免已
卸载字段残留在提交值或校验结果中。

## 6. 样式与可访问性

- 所有选择器继续使用 `.one-*`，变量继续使用 `--one-*`。
- 新增表单布局、控件、错误、描述、option、group 和 switch 所需 token；文档主题页
  必须与实际样式变量严格同步。
- 错误不只依赖颜色：包含文字、`aria-invalid` 和可见 focus 样式。
- Checkbox 使用原生 `<input type="checkbox">`；Switch 使用原生 checkbox 加
  `role="switch"`；Select 的按钮/输入、列表和 option 使用对应 ARIA 关系。
- `OneFormItem` 在可提供 label 时使用 `<label for>`；无法关联时要求 `ariaLabel`。

## 7. 文档与分类导航

文档导航从扁平的“组件”组升级为分类树，保持现有路径稳定：

```text
/components/form/
/components/form/form/
/components/form/select/
/components/form/checkbox/
/components/form/switch/
```

已有 `/components/button/`、`/components/input/` 和 `/components/card/` 不改 URL，
只迁移到“基础”或“数据展示”分类。每个新增页包含 API、受控/非受控示例、键盘与
ARIA 说明。Form 总览页提供 select 多选搜索、checkbox group、switch、同步规则、
提交和 reset 的完整交互示例。

双语 README 新增分类清单和完整表单示例。包入口以分类目录导出，同时保留根入口的
扁平 named exports，避免破坏现有消费者。

## 8. 测试与验证

- 每个组件：DOM 行为、受控/非受控、disabled、无效运行时值、事件载荷、样式和
  可访问属性测试。
- Select：本地搜索、单/多选、分组、disabled option、键盘导航与 Escape 测试。
- Form：字段注册/卸载、initialValues、规则组合、custom validator、submit、reset、
  首个无效字段聚焦与错误 ARIA 关联测试。
- 公共 API：严格类型测试、分类导出和 README/documentation contract。
- 文档：分类导航、路由、真实 demo、主题 token 严格集合、静态 build/client/server。
- 发布：build、包 smoke、ESM runtime 和根 workspace 集成。

完成前运行 `bun test packages/one --timeout 15000`、`bunx tsc --noEmit`、
`bun run build`、`bun run --cwd packages/one docs:build`、
`bun pm pack --cwd packages/one --dry-run` 和 `bunx prettier --check packages/one`。

## 9. 明确决策

- 本期包含多选、搜索、同步校验和组合控件。
- 本期不包含异步校验和远程选项加载。
- 表单模型用组合，不增加共享字段基类。
- `OneSelect` 与 `OneCheckboxGroup` 共享 option 数据类型，不形成继承关系。
- 文档路径对现有组件保持兼容，新组件采用 `/components/form/<name>/` 分类路径。
