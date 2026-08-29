import {
  apiTable,
  callout,
  codeBlock,
  demo,
  heading,
  inlineCode,
  paragraph,
  type OneDocPage,
} from './types';

export const componentPages: OneDocPage[] = [
  {
    path: '/components/button/',
    title: 'OneButton',
    description: 'OneButton 的变体、尺寸、状态、点击事件与完整 props。',
    section: '组件',
    sectionOrder: 2,
    order: 0,
    body: [
      heading(1, 'button', 'OneButton'),
      paragraph(
        'OneButton 使用原生 button 元素呈现 primary、secondary 和 danger 操作。'
      ),
      demo('button'),
      heading(2, 'variants-sizes', '变体与尺寸'),
      codeBlock(
        'ts',
        [
          "import { createComponent } from '@geektech/tsone';",
          "import { OneButton } from '@geektech/one';",
          '',
          "createComponent(OneButton, { variant: 'primary', size: 'sm' }, ['Primary']);",
          "createComponent(OneButton, { variant: 'secondary', size: 'md' }, ['Secondary']);",
          "createComponent(OneButton, { variant: 'danger', size: 'lg' }, ['Danger']);",
        ].join('\n')
      ),
      heading(2, 'states-events', '状态与事件'),
      paragraph(
        inlineCode('disabled'),
        ' 禁止交互；',
        inlineCode('loading'),
        ' 同时禁用按钮、显示静态 spinner 并设置 aria-busy。启用状态下的原生点击会发出 click 事件。'
      ),
      codeBlock(
        'ts',
        [
          "import { OneButton } from '@geektech/one';",
          '',
          "const button = new OneButton({ loading: false, children: ['保存'] });",
          "button.on('click', (event) => {",
          '  const mouseEvent = event as MouseEvent;',
          "  console.log('clicked', mouseEvent);",
          '});',
        ].join('\n')
      ),
      heading(2, 'api', 'API'),
      apiTable('OneButton 属性与事件', [
        {
          name: 'variant',
          signature: 'variant?: OneButtonVariant',
          description:
            "视觉变体：'primary' | 'secondary' | 'danger'，默认 primary。",
        },
        {
          name: 'size',
          signature: 'size?: OneComponentSize',
          description: "组件尺寸：'sm' | 'md' | 'lg'，默认 md。",
        },
        {
          name: 'type',
          signature: "type?: 'button' | 'submit' | 'reset'",
          description: '原生按钮类型，默认 button。',
        },
        {
          name: 'disabled',
          signature: 'disabled?: boolean',
          description: '禁用按钮。',
        },
        {
          name: 'loading',
          signature: 'loading?: boolean',
          description: '显示加载状态并禁用按钮。',
        },
        {
          name: 'children',
          signature: 'children?: Array<VNode | string>',
          description: '按钮默认内容。',
        },
        {
          name: 'click',
          signature: '(event: MouseEvent) => void',
          description: '按钮启用且未加载时发出。',
        },
      ]),
    ],
  },
  {
    path: '/components/input/',
    title: 'OneInput',
    description: 'OneInput 的受控和非受控模式、原生状态、事件与完整 props。',
    section: '组件',
    sectionOrder: 2,
    order: 1,
    body: [
      heading(1, 'input', 'OneInput'),
      paragraph('OneInput 封装原生 input，同时保留明确的值控制边界。'),
      demo('input'),
      heading(2, 'value-modes', '受控与非受控'),
      paragraph(
        '传入 ',
        inlineCode('value'),
        ' 使用受控模式；监听 input 后用 setProps 接受新值。只传 ',
        inlineCode('defaultValue'),
        ' 时使用非受控模式，组件会维护内部值。'
      ),
      codeBlock(
        'ts',
        [
          "import { OneInput, type OneInputValueEvent } from '@geektech/one';",
          '',
          "const controlled = new OneInput({ value: 'one', ariaLabel: '项目名称' });",
          "controlled.on('input', (payload) => {",
          '  const event = payload as OneInputValueEvent;',
          '  controlled.setProps({ value: event.value });',
          '});',
          '',
          "const uncontrolled = new OneInput({ defaultValue: 'draft', ariaLabel: '草稿名称' });",
          "uncontrolled.on('change', (payload) => {",
          '  const event = payload as OneInputValueEvent;',
          '  console.log(event.value, event.originalEvent);',
          '});',
        ].join('\n')
      ),
      heading(2, 'native-states', '原生状态'),
      paragraph(
        'type、name、placeholder、disabled、readonly 和 required 直接映射到原生 input；invalid 同时添加状态类并设置 aria-invalid。'
      ),
      heading(2, 'api', 'API'),
      apiTable('OneInput 属性与事件', [
        {
          name: 'value',
          signature: 'value?: string',
          description: '受控值；存在时输入后恢复最新 prop。',
        },
        {
          name: 'defaultValue',
          signature: 'defaultValue?: string',
          description: '非受控初始值。',
        },
        {
          name: 'type',
          signature: 'type?: string',
          description: '原生 input 类型。',
        },
        {
          name: 'name',
          signature: 'name?: string',
          description: '原生字段名。',
        },
        {
          name: 'placeholder',
          signature: 'placeholder?: string',
          description: '输入提示。',
        },
        {
          name: 'size',
          signature: 'size?: OneComponentSize',
          description: "组件尺寸：'sm' | 'md' | 'lg'，默认 md。",
        },
        {
          name: 'disabled',
          signature: 'disabled?: boolean',
          description: '原生禁用状态。',
        },
        {
          name: 'readonly',
          signature: 'readonly?: boolean',
          description: '原生只读状态。',
        },
        {
          name: 'required',
          signature: 'required?: boolean',
          description: '原生必填状态。',
        },
        {
          name: 'invalid',
          signature: 'invalid?: boolean',
          description: '无效样式与 aria-invalid。',
        },
        {
          name: 'ariaLabel',
          signature: 'ariaLabel?: string',
          description: '映射到 aria-label。',
        },
        {
          name: 'input',
          signature: '(payload: OneInputValueEvent) => void',
          description: '每次原生 input 事件发出。',
        },
        {
          name: 'change',
          signature: '(payload: OneInputValueEvent) => void',
          description: '每次原生 change 事件发出。',
        },
      ]),
      callout('note', 'OneInputValueEvent', [
        inlineCode('value: string'),
        ' 是输入值，',
        inlineCode('originalEvent: Event'),
        ' 是对应的原生事件。',
      ]),
    ],
  },
  {
    path: '/components/card/',
    title: 'OneCard',
    description: 'OneCard 的 title、header/default/footer 插槽和优先级。',
    section: '组件',
    sectionOrder: 2,
    order: 2,
    body: [
      heading(1, 'card', 'OneCard'),
      paragraph('OneCard 将标题、主体与操作区域组织为语义化 section。'),
      demo('card'),
      heading(2, 'slots', '插槽与优先级'),
      paragraph(
        '带 ',
        inlineCode("slot: 'header'"),
        ' 的显式 header 插槽优先于 title。无 slot 的 children 进入 default 主体，带 ',
        inlineCode("slot: 'footer'"),
        ' 的节点进入 footer；未提供 footer 时不会渲染空区域。'
      ),
      codeBlock(
        'ts',
        [
          "import { createComponent } from '@geektech/tsone';",
          "import { OneCard } from '@geektech/one';",
          '',
          "createComponent(OneCard, { title: '后备标题' }, [",
          "  { tag: 'strong', slot: 'header', children: ['显式标题'] },",
          "  { tag: 'p', children: ['default 内容'] },",
          "  { tag: 'button', slot: 'footer', children: ['继续'] },",
          ']);',
        ].join('\n')
      ),
      heading(2, 'api', 'API'),
      apiTable('OneCard 属性', [
        {
          name: 'title',
          signature: 'title?: string',
          description: '没有 header 插槽时显示的标题。',
        },
        {
          name: 'children',
          signature: 'children?: Array<VNode | string>',
          description: '默认内容和命名插槽节点。',
        },
      ]),
      apiTable('OneCard 插槽', [
        {
          name: 'header',
          signature: "Array<VNode & { slot: 'header' }>",
          description: '标题区域，优先于 title。',
        },
        {
          name: 'default',
          signature: 'Array<VNode | string>',
          description: '卡片主体内容。',
        },
        {
          name: 'footer',
          signature: "Array<VNode & { slot: 'footer' }>",
          description: '可选底部操作区域。',
        },
      ]),
    ],
  },
];
