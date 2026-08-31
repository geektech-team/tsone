import {
  apiTable,
  codeBlock,
  demo,
  heading,
  paragraph,
  type OneDocPage,
} from './types';

function page(
  path: string,
  title: string,
  description: string,
  order: number,
  rows: Array<{ name: string; signature: string; description: string }>
): OneDocPage {
  return {
    path,
    title,
    description,
    section: '组件',
    sectionOrder: 2,
    order,
    body: [
      heading(1, title.toLowerCase(), title),
      paragraph(description),
      demo(
        path.includes('/form/form')
          ? 'form'
          : path.includes('select')
            ? 'select'
            : path.includes('checkbox')
              ? 'checkbox'
              : path.includes('switch')
                ? 'switch'
                : 'form'
      ),
      heading(2, 'api', 'API'),
      apiTable(`${title} API`, rows),
    ],
  };
}

export const formPages: OneDocPage[] = [
  page(
    '/components/form/',
    '表单组件',
    'One 的表单组件支持同步校验、组合控件与本地选项搜索。',
    7,
    [
      {
        name: '组件',
        signature:
          'OneForm / OneFormItem / OneSelect / OneCheckbox / OneCheckboxGroup / OneSwitch',
        description: '表单分类中的公开组件。',
      },
    ]
  ),
  {
    ...page(
      '/components/form/form/',
      'OneForm',
      'OneForm 管理字段值与同步校验，OneFormItem 负责标签、说明、错误与焦点。',
      8,
      [
        {
          name: 'rules',
          signature: 'OneFormRules',
          description:
            '支持 required、minLength、maxLength、pattern 和 validator。',
        },
        {
          name: 'submit',
          signature: 'OneFormSubmitEvent',
          description: '校验成功后发出当前 values。',
        },
        {
          name: 'reset',
          signature: 'reset(): void',
          description: '恢复 initialValues 并清除错误。',
        },
      ]
    ),
    body: [
      heading(1, 'oneform', 'OneForm 与 OneFormItem'),
      paragraph(
        '规则只同步执行；validator 返回错误文本或 undefined。失败时错误通过 aria-describedby 与字段关联。'
      ),
      demo('form'),
      codeBlock(
        'ts',
        "new OneForm({ initialValues: { name: '' }, rules: { name: [{ required: true }, { minLength: 3 }, { pattern: /^[a-z]+$/ }, { validator: (value) => value ? undefined : 'invalid' }] } })"
      ),
      heading(2, 'api', 'API'),
      apiTable('OneForm API', [
        {
          name: 'rules',
          signature: 'OneFormRules',
          description: 'required、minLength、maxLength、pattern、validator。',
        },
        {
          name: 'validate',
          signature: 'validate(): OneFormValidationResult',
          description: '立即运行全部同步规则。',
        },
        {
          name: 'reset',
          signature: 'reset(): void',
          description: '恢复初始值。',
        },
      ]),
    ],
  },
  page(
    '/components/form/select/',
    'OneSelect',
    '支持单选、多选、本地搜索、分组选项以及 ArrowDown、ArrowUp、Enter、Escape 键盘操作。',
    9,
    [
      {
        name: 'multiple',
        signature: 'multiple?: boolean',
        description: '启用 string[] 多选值。',
      },
      {
        name: 'searchable',
        signature: 'searchable?: boolean',
        description: '启用本地选项搜索。',
      },
    ]
  ),
  page(
    '/components/form/checkbox/',
    'OneCheckbox',
    'OneCheckbox、OneCheckboxGroup 使用布尔值或稳定排序的字符串数组。',
    10,
    [
      {
        name: 'checked',
        signature: 'checked?: boolean',
        description: 'Checkbox 受控值。',
      },
      {
        name: 'value',
        signature: 'value?: string[]',
        description: 'CheckboxGroup 受控值。',
      },
    ]
  ),
  page(
    '/components/form/switch/',
    'OneSwitch',
    'OneSwitch 使用原生 checkbox 语义并提供 role="switch" 与 aria-checked。',
    11,
    [
      {
        name: 'checked',
        signature: 'checked?: boolean',
        description: '受控开关状态。',
      },
    ]
  ),
];
