export type OneDocDemoName =
  | 'button'
  | 'input'
  | 'card'
  | 'form'
  | 'select'
  | 'checkbox'
  | 'switch'
  | 'alert'
  | 'message'
  | 'dialog'
  | 'tooltip';

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
  card: {
    language: 'ts',
    code: [
      "import { createComponent } from '@geektech/tsone';",
      "import { OneCard } from '@geektech/one';",
      '',
      "createComponent(OneCard, { title: '项目概览' }, [",
      "  { tag: 'p', children: ['卡片内容'] },",
      "  { tag: 'button', slot: 'footer', children: ['继续'] },",
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
      "import { OneTooltip } from '@geektech/one';",
      '',
      'new OneTooltip({',
      "  content: '复制链接',",
      "  placement: 'bottom-end',",
      "  children: [{ tag: 'button', children: ['复制'] }],",
      '});',
    ].join('\n'),
  },
};
