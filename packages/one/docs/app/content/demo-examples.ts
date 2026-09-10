export type OneDocDemoName =
  | 'button'
  | 'input'
  | 'textarea'
  | 'card'
  | 'form'
  | 'select'
  | 'checkbox'
  | 'switch'
  | 'radio'
  | 'time-picker'
  | 'alert'
  | 'message'
  | 'dialog'
  | 'tooltip'
  | 'loading'
  | 'tag'
  | 'badge'
  | 'empty'
  | 'avatar'
  | 'progress'
  | 'tabs'
  | 'breadcrumb'
  | 'pagination'
  | 'slider'
  | 'rate'
  | 'upload'
  | 'table'
  | 'collapse'
  | 'skeleton'
  | 'divider'
  | 'space'
  | 'grid'
  | 'steps'
  | 'descriptions'
  | 'timeline'
  | 'popover'
  | 'cascader';

export interface OneDocDemoSource {
  language: 'ts';
  code: string;
}

export const oneDocDemoExamples: Record<OneDocDemoName, OneDocDemoSource> = {
  button: {
    language: 'ts',
    code: [
      "import { createComponent } from '@geektech/tsone';",
      "import { OneButton } from '@geektech/one';",
      '',
      "createComponent(OneButton, { variant: 'primary' }, ['Primary']);",
      "createComponent(OneButton, { variant: 'secondary' }, ['Secondary']);",
      "createComponent(OneButton, { variant: 'danger' }, ['Danger']);",
    ].join('\n'),
  },
  input: {
    language: 'ts',
    code: [
      "import { OneInput, type OneInputValueEvent } from '@geektech/one';",
      '',
      "const input = new OneInput({ placeholder: '请输入名称', ariaLabel: '名称' });",
      "input.on('input', (payload) => {",
      '  const event = payload as OneInputValueEvent;',
      '  console.log(event.value);',
      '});',
    ].join('\n'),
  },
  textarea: {
    language: 'ts',
    code: [
      "import { OneTextarea, type OneTextareaValueEvent } from '@geektech/one';",
      '',
      'const textarea = new OneTextarea({',
      "  rows: 5,",
      "  placeholder: '请输入补充说明',",
      "  ariaLabel: '补充说明',",
      '});',
      "textarea.on('input', (payload) => {",
      '  const event = payload as OneTextareaValueEvent;',
      '  console.log(event.value);',
      '});',
    ].join('\n'),
  },
  card: {
    language: 'ts',
    code: [
      "import { createComponent } from '@geektech/tsone';",
      "import { OneButton, OneCard } from '@geektech/one';",
      '',
      "createComponent(OneCard, { title: '项目概览' }, [",
      "  { tag: 'p', children: ['卡片内容'] },",
      "  { component: OneButton, slot: 'footer', children: ['继续'] },",
      ']);',
    ].join('\n'),
  },
  form: {
    language: 'ts',
    code: [
      "import { OneForm } from '@geektech/one';",
      '',
      'const form = new OneForm({',
      "  initialValues: { name: '' },",
      '  rules: {',
      '    name: [',
      "      { required: true, message: '请输入名称' },",
      '      {',
      '        validator: (value) =>',
      "          typeof value === 'string' && value.length < 3",
      "            ? '名称至少需要 3 个字符'",
      '            : undefined,',
      '      },',
      '    ],',
      '  },',
      '});',
    ].join('\n'),
  },
  select: {
    language: 'ts',
    code: [
      "import { OneSelect } from '@geektech/one';",
      '',
      'const select = new OneSelect({',
      '  multiple: true,',
      '  searchable: true,',
      "  placeholder: '选择城市',",
      '  options: [',
      "    { value: 'beijing', label: '北京' },",
      "    { value: 'shanghai', label: '上海' },",
      '  ],',
      '});',
    ].join('\n'),
  },
  checkbox: {
    language: 'ts',
    code: [
      "import { OneCheckbox, OneCheckboxGroup } from '@geektech/one';",
      '',
      "new OneCheckbox({ defaultChecked: true, ariaLabel: '同意协议' });",
      'new OneCheckboxGroup({',
      "  defaultValue: ['design'],",
      "  ariaLabel: '兴趣',",
      '  options: [',
      "    { value: 'design', label: '设计' },",
      "    { value: 'code', label: '编程' },",
      '  ],',
      '});',
    ].join('\n'),
  },
  switch: {
    language: 'ts',
    code: [
      "import { OneSwitch } from '@geektech/one';",
      '',
      'const notifications = new OneSwitch({',
      '  defaultChecked: true,',
      "  ariaLabel: '接收通知',",
      '});',
    ].join('\n'),
  },
  radio: {
    language: 'ts',
    code: [
      "import { OneRadio, OneRadioGroup } from '@geektech/one';",
      '',
      "new OneRadio({ value: 'design', defaultChecked: true, ariaLabel: '设计' });",
      'new OneRadioGroup({',
      "  defaultValue: 'weekly',",
      "  ariaLabel: '通知频率',",
      '  options: [',
      "    { value: 'daily', label: '每天' },",
      "    { value: 'weekly', label: '每周' },",
      '  ],',
      '});',
    ].join('\n'),
  },
  'time-picker': {
    language: 'ts',
    code: [
      "import { OneTimePicker } from '@geektech/one';",
      '',
      "new OneTimePicker({ defaultValue: '09:30', ariaLabel: '开始时间' });",
      "new OneTimePicker({ step: 60, min: '08:00', max: '18:00', ariaLabel: '结束时间' });",
    ].join('\n'),
  },
  alert: {
    language: 'ts',
    code: [
      "import { OneAlert } from '@geektech/one';",
      '',
      'new OneAlert({',
      "  title: '保存成功',",
      "  description: '更改已经同步。',",
      "  variant: 'success',",
      '  closable: true,',
      '});',
    ].join('\n'),
  },
  message: {
    language: 'ts',
    code: [
      "import { OneMessage, oneMessage } from '@geektech/one';",
      '',
      "new OneMessage({ content: '保存成功', defaultOpen: true, duration: 0 });",
      "oneMessage.success('保存成功', { placement: 'top-end' });",
    ].join('\n'),
  },
  dialog: {
    language: 'ts',
    code: [
      "import { OneDialog, oneDialog } from '@geektech/one';",
      '',
      "new OneDialog({ title: '编辑资料', defaultOpen: true });",
      'const confirmed = await oneDialog.confirm({',
      "  title: '保存更改？',",
      "  description: '确认后将立即生效。',",
      '});',
    ].join('\n'),
  },
  tooltip: {
    language: 'ts',
    code: [
      "import { OneButton, OneTooltip } from '@geektech/one';",
      '',
      'new OneTooltip({',
      "  content: '复制链接',",
      "  placement: 'bottom-end',",
      "  children: [{ component: OneButton, children: ['复制'] }],",
      '});',
    ].join('\n'),
  },
  loading: {
    language: 'ts',
    code: [
      "import { OneLoading } from '@geektech/one';",
      '',
      "new OneLoading({ label: '加载中' });",
      "new OneLoading({ size: 'lg', variant: 'primary', label: '提交中' });",
    ].join('\n'),
  },
  tag: {
    language: 'ts',
    code: [
      "import { OneTag } from '@geektech/one';",
      '',
      "new OneTag({ variant: 'success', closable: true, children: ['已发布'] });",
    ].join('\n'),
  },
  badge: {
    language: 'ts',
    code: [
      "import { OneBadge } from '@geektech/one';",
      '',
      "new OneBadge({ value: 120, max: 99, children: ['消息'] });",
    ].join('\n'),
  },
  empty: {
    language: 'ts',
    code: [
      "import { OneEmpty } from '@geektech/one';",
      '',
      "new OneEmpty({ description: '暂无搜索结果' });",
    ].join('\n'),
  },
  avatar: {
    language: 'ts',
    code: [
      "import { OneAvatar } from '@geektech/one';",
      '',
      "new OneAvatar({ src: '/avatar.png', alt: '头像', ariaLabel: '用户头像' });",
      "new OneAvatar({ text: 'M', variant: 'primary' });",
    ].join('\n'),
  },
  progress: {
    language: 'ts',
    code: [
      "import { OneProgress } from '@geektech/one';",
      '',
      "new OneProgress({ percent: 65, showText: true });",
      "new OneProgress({ percent: 30, variant: 'success' });",
    ].join('\n'),
  },
  tabs: {
    language: 'ts',
    code: [
      "import { OneTabs } from '@geektech/one';",
      '',
      'new OneTabs({',
      "  defaultValue: 'overview',",
      '  items: [',
      "    { value: 'overview', label: '概览' },",
      "    { value: 'security', label: '安全' },",
      '  ],',
      '  children: [',
      "    { tag: 'p', slot: 'overview', children: ['概览内容'] },",
      "    { tag: 'p', slot: 'security', children: ['安全内容'] },",
      '  ],',
      '});',
    ].join('\n'),
  },
  breadcrumb: {
    language: 'ts',
    code: [
      "import { OneBreadcrumb } from '@geektech/one';",
      '',
      'new OneBreadcrumb({',
      '  maxItems: 3,',
      '  items: [',
      "    { label: '首页', href: '/' },",
      "    { label: '项目', href: '/projects' },",
      "    { label: '详情', current: true },",
      '  ],',
      '});',
    ].join('\n'),
  },
  pagination: {
    language: 'ts',
    code: [
      "import { OnePagination } from '@geektech/one';",
      '',
      'new OnePagination({',
      '  total: 95,',
      '  defaultPage: 3,',
      '  pageSizeOptions: [10, 20, 50],',
      '  showQuickJumper: true,',
      '});',
    ].join('\n'),
  },
  slider: {
    language: 'ts',
    code: [
      "import { OneSlider, type OneSliderValueEvent } from '@geektech/one';",
      '',
      'const slider = new OneSlider({',
      '  defaultValue: 60,',
      '  min: 0,',
      '  max: 100,',
      '  showValue: true,',
      "  ariaLabel: '音量',",
      '});',
      "slider.on('change', (payload) => {",
      '  const event = payload as OneSliderValueEvent;',
      '  console.log(event.value);',
      '});',
    ].join('\n'),
  },
  rate: {
    language: 'ts',
    code: [
      "import { OneRate, type OneRateValueEvent } from '@geektech/one';",
      '',
      "const rating = new OneRate({ defaultValue: 3, ariaLabel: '评分' });",
      "rating.on('change', (payload) => {",
      '  const event = payload as OneRateValueEvent;',
      '  console.log(event.value);',
      '});',
    ].join('\n'),
  },
  upload: {
    language: 'ts',
    code: [
      "import { OneUpload, type OneUploadChangeEvent } from '@geektech/one';",
      '',
      "const upload = new OneUpload({ multiple: true, ariaLabel: '附件' });",
      "upload.on('change', (payload) => {",
      '  const event = payload as OneUploadChangeEvent;',
      '  console.log(event.files.map((file) => file.name));',
      '});',
    ].join('\n'),
  },
  table: {
    language: 'ts',
    code: [
      "import { OneTable } from '@geektech/one';",
      '',
      'new OneTable({',
      '  data: [',
      "    { name: '林晚', role: '设计' },",
      "    { name: '苏北', role: '前端' },",
      '  ],',
      '  columns: [',
      "    { key: 'name', title: '姓名' },",
      "    { key: 'role', title: '角色' },",
      '  ],',
      '});',
    ].join('\n'),
  },
  collapse: {
    language: 'ts',
    code: [
      "import { OneCollapse, type OneCollapseChangeEvent } from '@geektech/one';",
      '',
      'const collapse = new OneCollapse({',
      "  defaultActive: ['basic'],",
      '  items: [',
      "    { value: 'basic', title: '基础用法', children: ['内容'] },",
      "    { value: 'advanced', title: '高级用法', children: ['更多内容'] },",
      '  ],',
      '});',
      "collapse.on('change', (payload) => {",
      '  const event = payload as OneCollapseChangeEvent;',
      '  console.log(event.value);',
      '});',
    ].join('\n'),
  },
  skeleton: {
    language: 'ts',
    code: [
      "import { OneSkeleton } from '@geektech/one';",
      '',
      "new OneSkeleton({ rows: 3, title: true, avatar: true });",
    ].join('\n'),
  },
  divider: {
    language: 'ts',
    code: [
      "import { OneDivider } from '@geektech/one';",
      '',
      "new OneDivider({ text: '或' });",
      "new OneDivider({ direction: 'vertical' });",
    ].join('\n'),
  },
  space: {
    language: 'ts',
    code: [
      "import { OneSpace } from '@geektech/one';",
      "import { OneButton } from '@geektech/one';",
      '',
      "new OneSpace({ size: 'md', children: [",
      "  { component: OneButton, props: { variant: 'primary' }, children: ['保存'] },",
      "  { component: OneButton, props: {}, children: ['取消'] },",
      ']);',
    ].join('\n'),
  },
  grid: {
    language: 'ts',
    code: [
      "import { OneRow, OneCol } from '@geektech/one';",
      '',
      'new OneRow({ gutter: [16, 16], children: [',
      "  { component: OneCol, props: { span: 12 }, children: ['12'] },",
      "  { component: OneCol, props: { span: 12 }, children: ['12'] },",
      ']});',
      'new OneRow({ gutter: [16, 16], children: [',
      "  { component: OneCol, props: { span: 8, offset: 8 }, children: ['8 偏移 8'] },",
      ']});',
      'new OneRow({ gutter: [16, 16], children: [',
      "  { component: OneCol, props: { xs: 24, md: 12 }, children: ['响应式'] },",
      "  { component: OneCol, props: { xs: 24, md: 12 }, children: ['响应式'] },",
      ']});',
    ].join('\n'),
  },
  steps: {
    language: 'ts',
    code: [
      "import { OneSteps } from '@geektech/one';",
      '',
      'new OneSteps({',
      '  current: 1,',
      '  items: [',
      "    { title: '填写信息' },",
      "    { title: '确认订单', description: '核对收货地址' },",
      "    { title: '完成支付' },",
      '  ],',
      '});',
    ].join('\n'),
  },
  descriptions: {
    language: 'ts',
    code: [
      "import { OneDescriptions } from '@geektech/one';",
      '',
      'new OneDescriptions({',
      "  title: '订单信息',",
      '  column: 2,',
      '  bordered: true,',
      '  items: [',
      "    { label: '订单号', value: 'A-1024' },",
      "    { label: '状态', value: '已发货' },",
      "    { label: '收件人', value: '张三' },",
      '  ],',
      '});',
    ].join('\n'),
  },
  timeline: {
    language: 'ts',
    code: [
      "import { OneTimeline } from '@geektech/one';",
      '',
      'new OneTimeline({',
      '  items: [',
      "    { title: '创建订单', time: '09-01 10:00', content: '订单已创建' },",
      "    { title: '已发货', color: 'success' },",
      '  ],',
      '});',
    ].join('\n'),
  },
  popover: {
    language: 'ts',
    code: [
      "import { OnePopover } from '@geektech/one';",
      '',
      "new OnePopover({ content: '这是一段弹层说明', children: [",
      "  { tag: 'button', children: ['点击打开'] },",
      ']);',
    ].join('\n'),
  },
  cascader: {
    language: 'ts',
    code: [
      "import { OneCascader } from '@geektech/one';",
      '',
      "new OneCascader({",
      "  options: [",
      "    {",
      "      value: 'zhejiang',",
      "      label: '浙江',",
      "      children: [",
      "        { value: 'hangzhou', label: '杭州', children: [{ value: 'xihu', label: '西湖区' }] },",
      "        { value: 'ningbo', label: '宁波' },",
      '      ],',
      "    },",
      "    { value: 'jiangsu', label: '江苏', children: [{ value: 'nanjing', label: '南京' }] },",
      '  ],',
      "  placeholder: '请选择地区',",
      '});',
    ].join('\n'),
  },
};
