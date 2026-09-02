import {
  apiTable,
  callout,
  codeBlock,
  demo,
  heading,
  inlineCode,
  paragraph,
  t,
  type OneDocPage,
} from './types';

export const componentPages: OneDocPage[] = [
  {
    path: '/components/button/',
    title: 'OneButton',
    description: t(
      'OneButton 的变体、尺寸、状态、点击事件与完整 props。',
      'OneButton variants, sizes, states, click events and the full props reference.'
    ),
    section: 'components',
    sectionOrder: 2,
    order: 0,
    body: [
      heading(1, 'button', 'OneButton'),
      paragraph(
        t(
          'OneButton 使用原生 button 元素呈现 primary、secondary 和 danger 操作。',
          'OneButton renders primary, secondary and danger actions with a native button element.'
        )
      ),
      demo('button'),
      heading(2, 'variants-sizes', t('变体与尺寸', 'Variants and sizes')),
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
      heading(2, 'states-events', t('状态与事件', 'States and events')),
      paragraph(
        inlineCode('disabled'),
        t(' 禁止交互；', ' blocks interaction; '),
        inlineCode('loading'),
        t(
          ' 同时禁用按钮、显示静态 spinner 并设置 aria-busy。启用状态下的原生点击会发出 click 事件。',
          ' disables the button, shows a static spinner and sets aria-busy. A native click on an enabled button emits the click event.'
        )
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
      apiTable(t('OneButton 属性与事件', 'OneButton props and events'), [
        {
          name: 'variant',
          signature: 'variant?: OneButtonVariant',
          description: t(
            "视觉变体：'primary' | 'secondary' | 'danger'，默认 primary。",
            "Visual variants: 'primary' | 'secondary' | 'danger'; default primary."
          ),
        },
        {
          name: 'size',
          signature: 'size?: OneComponentSize',
          description: t(
            "组件尺寸：'sm' | 'md' | 'lg'，默认 md。",
            "Component size: 'sm' | 'md' | 'lg'; default md."
          ),
        },
        {
          name: 'type',
          signature: "type?: 'button' | 'submit' | 'reset'",
          description: t('原生按钮类型，默认 button。', 'Native button type; default button.'),
        },
        {
          name: 'disabled',
          signature: 'disabled?: boolean',
          description: t('禁用按钮。', 'Disables the button.'),
        },
        {
          name: 'loading',
          signature: 'loading?: boolean',
          description: t('显示加载状态并禁用按钮。', 'Shows a loading state and disables the button.'),
        },
        {
          name: 'children',
          signature: 'children?: Array<VNode | string>',
          description: t('按钮默认内容。', 'Default button content.'),
        },
        {
          name: 'click',
          signature: '(event: MouseEvent) => void',
          description: t('按钮启用且未加载时发出。', 'Emitted when the button is enabled and not loading.'),
        },
      ]),
    ],
  },
  {
    path: '/components/input/',
    title: 'OneInput',
    description: t(
      'OneInput 的受控和非受控模式、原生状态、事件与完整 props。',
      'OneInput controlled and uncontrolled modes, native states, events and the full props reference.'
    ),
    section: 'components',
    sectionOrder: 2,
    order: 1,
    body: [
      heading(1, 'input', 'OneInput'),
      paragraph(
        t(
          'OneInput 封装原生 input，同时保留明确的值控制边界。',
          'OneInput wraps a native input while keeping a clear value-control boundary.'
        )
      ),
      demo('input'),
      heading(2, 'value-modes', t('受控与非受控', 'Controlled and uncontrolled')),
      paragraph(
        t('传入 ', 'Pass '),
        inlineCode('value'),
        t(' 使用受控模式；监听 input 后用 setProps 接受新值。只传 ', ' to use the controlled mode; listen to input and accept the new value via setProps. Pass only '),
        inlineCode('defaultValue'),
        t(' 时使用非受控模式，组件会维护内部值。', ' to use the uncontrolled mode, where the component keeps an internal value.')
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
      heading(2, 'native-states', t('原生状态', 'Native states')),
      paragraph(
        t(
          'type、name、placeholder、disabled、readonly 和 required 直接映射到原生 input；invalid 同时添加状态类并设置 aria-invalid。',
          'type, name, placeholder, disabled, readonly and required map directly to the native input; invalid adds a state class and sets aria-invalid.'
        )
      ),
      heading(2, 'api', 'API'),
      apiTable(t('OneInput 属性与事件', 'OneInput props and events'), [
        {
          name: 'value',
          signature: 'value?: string',
          description: t('受控值；存在时输入后恢复最新 prop。', 'Controlled value; when present, input reverts to the latest prop.'),
        },
        {
          name: 'defaultValue',
          signature: 'defaultValue?: string',
          description: t('非受控初始值。', 'Uncontrolled initial value.'),
        },
        {
          name: 'type',
          signature: 'type?: string',
          description: t('原生 input 类型。', 'Native input type.'),
        },
        {
          name: 'name',
          signature: 'name?: string',
          description: t('原生字段名。', 'Native field name.'),
        },
        {
          name: 'placeholder',
          signature: 'placeholder?: string',
          description: t('输入提示。', 'Input placeholder.'),
        },
        {
          name: 'size',
          signature: 'size?: OneComponentSize',
          description: t(
            "组件尺寸：'sm' | 'md' | 'lg'，默认 md。",
            "Component size: 'sm' | 'md' | 'lg'; default md."
          ),
        },
        {
          name: 'disabled',
          signature: 'disabled?: boolean',
          description: t('原生禁用状态。', 'Native disabled state.'),
        },
        {
          name: 'readonly',
          signature: 'readonly?: boolean',
          description: t('原生只读状态。', 'Native read-only state.'),
        },
        {
          name: 'required',
          signature: 'required?: boolean',
          description: t('原生必填状态。', 'Native required state.'),
        },
        {
          name: 'invalid',
          signature: 'invalid?: boolean',
          description: t('无效样式与 aria-invalid。', 'Invalid styling and aria-invalid.'),
        },
        {
          name: 'ariaLabel',
          signature: 'ariaLabel?: string',
          description: t('映射到 aria-label。', 'Mapped to aria-label.'),
        },
        {
          name: 'input',
          signature: '(payload: OneInputValueEvent) => void',
          description: t('每次原生 input 事件发出。', 'Emitted on every native input event.'),
        },
        {
          name: 'change',
          signature: '(payload: OneInputValueEvent) => void',
          description: t('每次原生 change 事件发出。', 'Emitted on every native change event.'),
        },
      ]),
      callout('note', 'OneInputValueEvent', [
        inlineCode('value: string'),
        t(' 是输入值，', ' is the input value and '),
        inlineCode('originalEvent: Event'),
        t(' 是对应的原生事件。', ' is the corresponding native event.'),
      ]),
    ],
  },
  {
    path: '/components/card/',
    title: 'OneCard',
    description: t(
      'OneCard 的 title、header/default/footer 插槽和优先级。',
      'OneCard title, header/default/footer slots and their precedence.'
    ),
    section: 'components',
    sectionOrder: 2,
    order: 2,
    body: [
      heading(1, 'card', 'OneCard'),
      paragraph(
        t(
          'OneCard 将标题、主体与操作区域组织为语义化 section。',
          'OneCard organizes a title, body and action area into a semantic section.'
        )
      ),
      demo('card'),
      heading(2, 'slots', t('插槽与优先级', 'Slots and precedence')),
      paragraph(
        t('带 ', 'An explicit header slot with '),
        inlineCode("slot: 'header'"),
        t(' 的显式 header 插槽优先于 title。无 slot 的 children 进入 default 主体，带 ', ' takes precedence over title. Children without a slot enter the default body, and nodes with '),
        inlineCode("slot: 'footer'"),
        t(' 的节点进入 footer；未提供 footer 时不会渲染空区域。', ' enter the footer; no empty area is rendered when the footer is absent.')
      ),
      codeBlock(
        'ts',
        [
          "import { createComponent } from '@geektech/tsone';",
          "import { OneButton, OneCard } from '@geektech/one';",
          '',
          "createComponent(OneCard, { title: '后备标题' }, [",
          "  { tag: 'strong', slot: 'header', children: ['显式标题'] },",
          "  { tag: 'p', children: ['default 内容'] },",
          "  { component: OneButton, slot: 'footer', children: ['继续'] },",
          ']);',
        ].join('\n')
      ),
      heading(2, 'api', 'API'),
      apiTable(t('OneCard 属性', 'OneCard props'), [
        {
          name: 'title',
          signature: 'title?: string',
          description: t('没有 header 插槽时显示的标题。', 'Title shown when no header slot is present.'),
        },
        {
          name: 'children',
          signature: 'children?: Array<VNode | string>',
          description: t('默认内容和命名插槽节点。', 'Default content and named slot nodes.'),
        },
      ]),
      apiTable(t('OneCard 插槽', 'OneCard slots'), [
        {
          name: 'header',
          signature: "Array<VNode & { slot: 'header' }>",
          description: t('标题区域，优先于 title。', 'Title area; takes precedence over title.'),
        },
        {
          name: 'default',
          signature: 'Array<VNode | string>',
          description: t('卡片主体内容。', 'Card body content.'),
        },
        {
          name: 'footer',
          signature: "Array<VNode & { slot: 'footer' }>",
          description: t('可选底部操作区域。', 'Optional bottom action area.'),
        },
      ]),
    ],
  },
];
