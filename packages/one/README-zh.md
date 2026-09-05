# One UI

One UI（`@geektech/one`）是面向 TSone 类组件框架的轻量级、无额外运行时依赖
UI 组件库。TSone 是它的 peer dependency，使用 One UI 的应用必须同时安装
TSone。

**文档：** <https://geektech-team.github.io/tsone/one/>

## 安装

```bash
bun add @geektech/tsone @geektech/one
```

## 快速开始

```ts
import {
  Component,
  createApp,
  createComponent,
  type VNode,
} from '@geektech/tsone';
import { OneButton, OneCard, OneInput } from '@geektech/one';

class App extends Component {
  protected initState(): object {
    return {};
  }

  protected initStyles(): void {}

  protected render(): VNode {
    return {
      tag: 'main',
      children: [
        createComponent(OneButton, {}, ['保存']),
        createComponent(OneInput, {
          placeholder: '项目名称',
          ariaLabel: '项目名称',
        }),
        createComponent(OneCard, { title: 'One UI' }, [
          '为 TSone 提供轻量级组件。',
        ]),
      ],
    };
  }
}

createApp({ root: App }).mount();
```

## 组件分类

- 基础：`OneButton`、`OneDivider`、`OneSpace`
- 表单：`OneForm`、`OneFormItem`、`OneInput`、`OneSelect`、`OneCascader`、
  `OneTimePicker`、`OneCheckbox`、`OneCheckboxGroup`、`OneRadio`、
  `OneRadioGroup`、`OneSwitch`、`OneSlider`、`OneRate`、`OneUpload`
- 导航：`OneTabs`、`OneSteps`、`OneBreadcrumb`、`OnePagination`
- 数据展示：`OneCard`、`OneTag`、`OneBadge`、`OneAvatar`、`OneProgress`、
  `OneEmpty`、`OneTable`、`OneCollapse`、`OneSkeleton`、`OneDescriptions`、
  `OneTimeline`
- 反馈与浮层：`OneAlert`、`OneMessage`、`OneDialog`、`OneTooltip`、
  `OnePopover`、`OneLoading`

## 导航

并列内容使用标签页，层级位置使用面包屑，大量同类记录使用分页。三个组件分别
提供受控状态；涉及原生链接时也可以通过事件决定是否继续导航。

```ts
import {
  OneBreadcrumb,
  OnePagination,
  OneTabs,
  type OneBreadcrumbClickEvent,
  type OnePaginationChangeEvent,
  type OneTabsChangeEvent,
} from '@geektech/one';

const tabs = new OneTabs({
  value: 'overview',
  items: [
    { value: 'overview', label: '概览' },
    { value: 'security', label: '安全' },
  ],
  children: [
    { tag: 'p', slot: 'overview', children: ['概览内容'] },
    { tag: 'p', slot: 'security', children: ['安全内容'] },
  ],
});
tabs.on('change', (payload) => {
  const event = payload as OneTabsChangeEvent;
  tabs.setProps({ value: event.value });
});

const breadcrumb = new OneBreadcrumb({
  maxItems: 3,
  separator: '/',
  items: [
    { label: '首页', href: '/' },
    { label: '项目', href: '/projects' },
    { label: '详情', current: true },
  ],
});
breadcrumb.on('itemClick', (payload) => {
  const event = payload as OneBreadcrumbClickEvent;
  console.log(event.item, event.index);
});

const basicPagination = new OnePagination({ total: 95 });
const pagination = new OnePagination({
  total: 95,
  page: 1,
  pageSize: 10,
  pageSizeOptions: [10, 20, 50],
  showQuickJumper: true,
});
pagination.on('change', (payload) => {
  const event = payload as OnePaginationChangeEvent;
  pagination.setProps({ page: event.page, pageSize: event.pageSize });
});
void basicPagination;
```

## 数据展示

标签适合表达紧凑状态，徽标适合展示数量，头像适合表达身份，进度条适合表达完成
度，无数据时使用空状态，表格适合组织行列数据，折叠面板适合组织分组详情，加载中
使用骨架占位。`OneEmpty` 支持通过 `actions` 插槽提供下一步操作。

```ts
import { OneBadge, OneButton, OneEmpty, OneTag } from '@geektech/one';

new OneTag({ variant: 'success', closable: true });
new OneBadge({ value: 120, max: 99 });
const actions = [
  {
    component: OneButton,
    slot: 'actions',
    children: ['创建项目'],
  },
];
new OneEmpty({ description: '暂无结果', children: actions });
```

```ts
import { OneAvatar, OneProgress } from '@geektech/one';

new OneAvatar({ text: 'M', variant: 'primary' });
new OneAvatar({ src: '/avatar.png', alt: '头像', shape: 'square' });
new OneProgress({ percent: 65, showText: true });
new OneProgress({ percent: 30, variant: 'success' });
```

```ts
import { OneTable, OneCollapse, OneSkeleton } from '@geektech/one';

new OneTable({
  data: [
    { name: '林晚', role: '设计' },
    { name: '苏北', role: '前端' },
  ],
  columns: [
    { key: 'name', title: '姓名' },
    { key: 'role', title: '角色' },
  ],
});
new OneCollapse({
  accordion: true,
  defaultActive: ['basic'],
  items: [
    { value: 'basic', title: '基础用法', children: ['内容'] },
    { value: 'advanced', title: '高级用法', children: ['更多内容'] },
  ],
});
new OneSkeleton({ rows: 3, title: true, avatar: true });
```

## 反馈与浮层

持续显示的页面内反馈使用 `OneAlert`，附着到单个触发元素的简短说明使用
`OneTooltip`，进行中的加载状态使用 `OneLoading`：

```ts
import { OneAlert, OneButton, OneLoading, OneTooltip } from '@geektech/one';

const alert = new OneAlert({
  title: '保存成功',
  variant: 'success',
  closable: true,
});

const tooltip = new OneTooltip({
  content: '复制链接',
  placement: 'bottom-end',
  children: [{ component: OneButton, children: ['复制'] }],
});

const loading = new OneLoading({ size: 'md', label: '加载中' });
```

临时消息和确认流程可以使用命令式服务：

```ts
import { oneDialog, oneMessage } from '@geektech/one';

oneMessage.success('Saved');

const confirmed = await oneDialog.confirm({
  title: 'Delete item?',
  description: 'This action cannot be undone.',
});
```

## 按钮变体、尺寸、加载状态和事件

`OneButton` 提供 `primary`、`secondary`、`danger` 三种变体，以及 `sm`、
`md`、`lg` 三种尺寸。加载状态下按钮会被禁用并带有 `aria-busy`。

```ts
import { OneButton } from '@geektech/one';

const button = new OneButton({
  variant: 'danger',
  size: 'lg',
  loading: false,
  children: ['删除'],
});

button.on('click', (event) => {
  console.log('已点击', event);
  button.setProps({ loading: true });
});
button.mount(document.querySelector('#actions') as HTMLElement);
```

## 受控与非受控输入框

受控输入框传入 `value`，收到事件后通过 `setProps` 接受新值；非受控输入框传入
`defaultValue`，值由 One UI 自己维护。

```ts
import { OneInput, type OneInputValueEvent } from '@geektech/one';

const controlled = new OneInput({
  value: 'one',
  ariaLabel: '受控项目名称',
});
controlled.on('input', (payload) => {
  const event = payload as OneInputValueEvent;
  controlled.setProps({ value: event.value });
});

const uncontrolled = new OneInput({
  defaultValue: '草稿',
  ariaLabel: '草稿名称',
});
uncontrolled.on('change', (payload) => {
  const event = payload as OneInputValueEvent;
  console.log(event.value, event.originalEvent);
});
```

## 选择与时间

单选按钮从多个选项中选一个，时间选择器提供可编辑文本输入，点击展开时/分/秒下拉
面板。二者都支持受控与非受控模式。

```ts
import {
  OneRadio,
  OneRadioGroup,
  OneTimePicker,
  type OneFieldValueEvent,
} from '@geektech/one';

const radio = new OneRadio({ value: 'design', defaultChecked: true });
const group = new OneRadioGroup({
  defaultValue: 'weekly',
  ariaLabel: '通知频率',
  options: [
    { value: 'daily', label: '每天' },
    { value: 'weekly', label: '每周' },
  ],
});
group.on('change', (payload) => {
  const event = payload as OneFieldValueEvent<string>;
  console.log(event.value);
});

new OneTimePicker({ defaultValue: '09:30', ariaLabel: '开始时间' });
```

## 滑块、评分与上传

滑块在范围内选择一个数值，评分用星星表达打分，上传用于收集本地文件元数据。
三者都支持受控与非受控模式。

```ts
import {
  OneSlider,
  OneRate,
  OneUpload,
  type OneSliderValueEvent,
  type OneRateValueEvent,
  type OneUploadChangeEvent,
} from '@geektech/one';

const slider = new OneSlider({ defaultValue: 60, showValue: true });
slider.on('change', (payload) => {
  const event = payload as OneSliderValueEvent;
  console.log(event.value);
});

const rating = new OneRate({ defaultValue: 4, allowClear: true });
rating.on('change', (payload) => {
  const event = payload as OneRateValueEvent;
  console.log(event.value);
});

const upload = new OneUpload({ multiple: true, ariaLabel: '附件' });
upload.on('change', (payload) => {
  const event = payload as OneUploadChangeEvent;
  console.log(event.files.map((file) => file.name));
});
```

## 卡片插槽

带有 `slot: 'header'` 或 `slot: 'footer'` 的子节点进入对应命名插槽，未指定
slot 的子节点进入默认内容区。

```ts
import { createComponent } from '@geektech/tsone';
import { OneButton, OneCard } from '@geektech/one';

const card = createComponent(OneCard, {}, [
  { tag: 'h2', slot: 'header', children: ['账户'] },
  { tag: 'p', children: ['默认插槽内容'] },
  { component: OneButton, slot: 'footer', children: ['继续'] },
]);
```

## 全局主题

不可变的内置 `default` 主题始终可用。可以注册任意多套局部配置；未填写的颜色、
字体、行高、边框和圆角字段都会从 `ONE_DEFAULT_THEME` 继承。

```ts
import { ONE_DEFAULT_THEME, oneTheme } from '@geektech/one';

oneTheme.init({
  defaultTheme: 'brand',
  themes: {
    brand: {
      colors: { primary: '#326bff' },
      typography: { fontFamily: 'Inter, sans-serif', lineHeight: '1.6' },
      border: { color: '#cbd5e1', width: '1px', style: 'solid' },
      radius: { sm: '4px', md: '8px', lg: '12px' },
    },
    night: { colors: { surface: '#101510', text: '#f4f8f4' } },
  },
});

oneTheme.switch('default');
console.log(oneTheme.currentTheme, ONE_DEFAULT_THEME.colors.primary);
```

主题服务只写入 `document.documentElement`，不创建局部主题，也不会自动持久化选中
名称或跟随系统配色。无效配置会抛出 `OneThemeConfigError`，未知主题名称会抛出
`OneThemeNotFoundError`。

## CSS 变量覆盖

One UI 样式限定在 `.one-*` 选择器中。可以在应用容器或 `:root` 上覆盖公开
CSS 变量：

```css
.my-app {
  --one-color-primary: #326bff;
  --one-radius-md: 12px;
}
```

对应的默认回退值也可以从 `ONE_THEME_DEFAULTS` 读取。

## 开发

```bash
bun install
bun test packages/one
bunx tsc --noEmit --project packages/one/tsconfig.json
bun run --cwd packages/one build
```

在仓库根目录运行完整发布前检查：

```bash
bun test packages/one/tests/package-contract.test.ts packages/one/tests/component-types.test.ts packages/one/tests/style-contract.test.ts packages/one/tests/package-smoke.test.ts && bunx tsc --noEmit --project packages/one/tsconfig.json && bun run --cwd packages/one build && bun pm pack --cwd packages/one --dry-run
```
