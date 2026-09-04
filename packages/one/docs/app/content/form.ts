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
  type OneDocText,
} from './types';

function page(
  path: string,
  title: OneDocText,
  description: OneDocText,
  headingId: string,
  caption: OneDocText,
  order: number,
  rows: Array<{ name: string; signature: string; description: OneDocText }>
): OneDocPage {
  return {
    path,
    title,
    description,
    section: 'components',
    sectionOrder: 2,
    order,
    body: [
      heading(1, headingId, title),
      paragraph(description),
      demo(
        path.includes('/form/form')
          ? 'form'
          : path.includes('cascader')
            ? 'cascader'
            : path.includes('select')
              ? 'select'
              : path.includes('checkbox')
                ? 'checkbox'
                : path.includes('switch')
                  ? 'switch'
                  : path.includes('radio')
                    ? 'radio'
                    : path.includes('time-picker')
                      ? 'time-picker'
                      : path.includes('slider')
                        ? 'slider'
                        : path.includes('rate')
                          ? 'rate'
                          : path.includes('upload')
                            ? 'upload'
                            : 'form'
      ),
      heading(2, 'api', 'API'),
      apiTable(caption, rows),
    ],
  };
}

export const formPages: OneDocPage[] = [
  page(
    '/components/form/',
    t('表单组件', 'Form components'),
    t(
      'One 的表单组件支持同步校验、组合控件与本地选项搜索。',
      "One's form components support synchronous validation, combined controls and local option search."
    ),
    'form',
    t('表单组件', 'Form components'),
    15,
    [
      {
        name: 'OneForm',
        signature: 'new OneForm(props)',
        description: t(
          '表单容器，管理字段值与同步校验。',
          'Form container; manages field values and synchronous validation.'
        ),
      },
      {
        name: 'OneFormItem',
        signature: 'new OneFormItem(props)',
        description: t(
          '字段包装，负责标签、说明、错误与焦点。',
          'Field wrapper; handles label, description, error and focus.'
        ),
      },
      {
        name: 'OneInput',
        signature: 'new OneInput(props)',
        description: t('文本输入控件。', 'Text input control.'),
      },
      {
        name: 'OneSelect',
        signature: 'new OneSelect(props)',
        description: t(
          '支持单选、多选与本地搜索的下拉选择。',
          'Dropdown select with single/multiple selection and local search.'
        ),
      },
      {
        name: 'OneCascader',
        signature: 'new OneCascader(props)',
        description: t(
          '多级级联选择，路径数组为值。',
          'Multi-level cascading selection with a path array value.'
        ),
      },
      {
        name: 'OneTimePicker',
        signature: 'new OneTimePicker(props)',
        description: t(
          '可编辑文本输入与点击展开的时/分/秒面板。',
          'Editable text input with a click-to-open hour/minute/second panel.'
        ),
      },
      {
        name: 'OneCheckbox',
        signature: 'new OneCheckbox(props)',
        description: t('单选框与复选框组。', 'Checkbox and checkbox group.'),
      },
      {
        name: 'OneRadio',
        signature: 'new OneRadio(props)',
        description: t('互斥单选按钮与单选组。', 'Mutually exclusive radio buttons and groups.'),
      },
      {
        name: 'OneSwitch',
        signature: 'new OneSwitch(props)',
        description: t('布尔开关。', 'Boolean switch.'),
      },
      {
        name: 'OneSlider',
        signature: 'new OneSlider(props)',
        description: t('数值范围滑块，值被钳制到 min–max。', 'Numeric range slider; the value is clamped to min–max.'),
      },
      {
        name: 'OneRate',
        signature: 'new OneRate(props)',
        description: t('星级评分，点击星星设置整数值。', 'Star rating; clicking a star sets an integer value.'),
      },
      {
        name: 'OneUpload',
        signature: 'new OneUpload(props)',
        description: t('选择并列出本地文件，支持多选与上限。', 'Selects and lists local files, with multiple selection and a max cap.'),
      },
    ]
  ),
  {
    ...page(
      '/components/form/form/',
      'OneForm',
      t(
        'OneForm 管理字段值与同步校验，OneFormItem 负责标签、说明、错误与焦点。',
        'OneForm manages field values and synchronous validation; OneFormItem handles label, description, error and focus.'
      ),
      'oneform',
      'OneForm API',
      16,
      []
    ),
    body: [
      heading(1, 'oneform', t('OneForm 与 OneFormItem', 'OneForm and OneFormItem')),
      paragraph(
        t(
          '规则只同步执行；validator 返回错误文本或 undefined。失败时错误通过 aria-describedby 与字段关联。',
          'Rules run synchronously only; a validator returns error text or undefined. On failure, errors are associated with the field via aria-describedby.'
        )
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
          description: t(
            'required、minLength、maxLength、pattern、validator。',
            'required, minLength, maxLength, pattern and validator.'
          ),
        },
        {
          name: 'validate',
          signature: 'validate(): OneFormValidationResult',
          description: t('立即运行全部同步规则。', 'Runs all synchronous rules immediately.'),
        },
        {
          name: 'reset',
          signature: 'reset(): void',
          description: t('恢复初始值。', 'Restores the initial values.'),
        },
      ]),
    ],
  },
  {
    path: '/components/form/input/',
    title: 'OneInput',
    description: t(
      'OneInput 的受控和非受控模式、原生状态、事件与完整 props。',
      'OneInput controlled and uncontrolled modes, native states, events and the full props reference.'
    ),
    section: 'components',
    sectionOrder: 2,
    order: 17,
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

  page(
    '/components/form/select/',
    'OneSelect',
    t(
      '支持单选、多选、本地搜索、分组选项以及 ArrowDown、ArrowUp、Enter、Escape 键盘操作。',
      'Supports single and multiple selection, local search, grouped options, and ArrowDown, ArrowUp, Enter and Escape keyboard operations.'
    ),
    'oneselect',
    'OneSelect API',
    18,
    [
      {
        name: 'multiple',
        signature: 'multiple?: boolean',
        description: t('启用 string[] 多选值。', 'Enables string[] multiple-selection values.'),
      },
      {
        name: 'searchable',
        signature: 'searchable?: boolean',
        description: t('启用本地选项搜索。', 'Enables local option search.'),
      },
    ]
  ),
  page(
    '/components/form/checkbox/',
    'OneCheckbox',
    t(
      'OneCheckbox、OneCheckboxGroup 使用布尔值或稳定排序的字符串数组。',
      'OneCheckbox and OneCheckboxGroup use booleans or stably sorted string arrays.'
    ),
    'onecheckbox',
    'OneCheckbox API',
    19,
    [
      {
        name: 'checked',
        signature: 'checked?: boolean',
        description: t('Checkbox 受控值。', 'Controlled checkbox value.'),
      },
      {
        name: 'value',
        signature: 'value?: string[]',
        description: t('CheckboxGroup 受控值。', 'Controlled checkbox group value.'),
      },
    ]
  ),
  page(
    '/components/form/switch/',
    'OneSwitch',
    t(
      'OneSwitch 使用原生 checkbox 语义并提供 role="switch" 与 aria-checked。',
      'OneSwitch uses native checkbox semantics and provides role="switch" and aria-checked.'
    ),
    'oneswitch',
    'OneSwitch API',
    20,
    [
      {
        name: 'checked',
        signature: 'checked?: boolean',
        description: t('受控开关状态。', 'Controlled switch state.'),
      },
    ]
  ),
  {
    path: '/components/form/radio/',
    title: 'OneRadio',
    description: t(
      'OneRadio 与 OneRadioGroup 使用原生 radio 语义进行互斥单选。',
      'OneRadio and OneRadioGroup use native radio semantics for mutually exclusive selection.'
    ),
    section: 'components',
    sectionOrder: 2,
    order: 21,
    body: [
      heading(1, 'oneradio', t('OneRadio 与 OneRadioGroup', 'OneRadio and OneRadioGroup')),
      paragraph(
        t(
          'OneRadio 是单体单选按钮，OneRadioGroup 通过 options 提供互斥的单选组。二者均支持受控与非受控模式，并复用 OneSelectOption 表达选项。',
          'OneRadio is a single radio button; OneRadioGroup provides a mutually exclusive group through options. Both support controlled and uncontrolled modes and reuse OneSelectOption for options.'
        )
      ),
      demo('radio'),
      heading(2, 'controlled', t('受控与非受控', 'Controlled and uncontrolled')),
      paragraph(
        inlineCode('checked'),
        t(' 控制 OneRadio 的受控状态，', ' controls the controlled state of OneRadio, '),
        inlineCode('value'),
        t(' 控制 OneRadioGroup 的受控值；', ' controls the controlled value of OneRadioGroup; '),
        inlineCode('defaultChecked'),
        t(' 与 ', ' and '),
        inlineCode('defaultValue'),
        t(' 提供非受控初始状态。', ' provide the uncontrolled initial state.')
      ),
      heading(2, 'api', 'API'),
      apiTable(t('OneRadio 属性与事件', 'OneRadio props and events'), [
        {
          name: 'value',
          signature: 'value?: string',
          description: t('选项值，选中时作为事件载荷。', 'Option value; emitted as the event payload when selected.'),
        },
        {
          name: 'checked',
          signature: 'checked?: boolean',
          description: t('受控选中状态。', 'Controlled checked state.'),
        },
        {
          name: 'defaultChecked',
          signature: 'defaultChecked?: boolean',
          description: t('非受控初始选中状态。', 'Uncontrolled initial checked state.'),
        },
        {
          name: 'name',
          signature: 'name?: string',
          description: t('原生字段名；表单内由字段上下文接管。', 'Native field name; taken over by the field context inside a form.'),
        },
        {
          name: 'disabled',
          signature: 'disabled?: boolean',
          description: t('禁用该单选按钮。', 'Disables the radio button.'),
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
          name: 'children',
          signature: 'children?: Array<VNode | string>',
          description: t('单选按钮后的标签文本。', 'Label text after the radio button.'),
        },
        {
          name: 'input / change',
          signature: '(event: OneFieldValueEvent<string>) => void',
          description: t('选中时发出 value: string 与 originalEvent: Event。', 'Emitted on selection with value: string and originalEvent: Event.'),
        },
      ]),
      apiTable(t('OneRadioGroup 属性', 'OneRadioGroup props'), [
        {
          name: 'options',
          signature: 'options: readonly OneSelectOption[]',
          description: t('互斥选项，支持 disabled 项。', 'Mutually exclusive options; supports disabled items.'),
        },
        {
          name: 'value',
          signature: 'value?: string',
          description: t('受控选中值。', 'Controlled selected value.'),
        },
        {
          name: 'defaultValue',
          signature: 'defaultValue?: string',
          description: t('非受控初始值。', 'Uncontrolled initial value.'),
        },
        {
          name: 'name',
          signature: 'name?: string',
          description: t('原生字段名。', 'Native field name.'),
        },
        {
          name: 'disabled',
          signature: 'disabled?: boolean',
          description: t('禁用整个单选组。', 'Disables the entire radio group.'),
        },
        {
          name: 'invalid',
          signature: 'invalid?: boolean',
          description: t('无效样式与 aria-invalid。', 'Invalid styling and aria-invalid.'),
        },
        {
          name: 'ariaLabel',
          signature: 'ariaLabel?: string',
          description: t('radiogroup 的可访问名称。', 'Accessible name of the radiogroup.'),
        },
      ]),
    ],
  },
  page(
    '/components/form/time-picker/',
    'OneTimePicker',
    t(
      'OneTimePicker 提供可编辑文本输入，点击展开时/分/秒下拉面板，支持受控/非受控与分钟或秒粒度。',
      'OneTimePicker provides an editable text input that expands an hour/minute/second panel on click, supporting controlled/uncontrolled use and minute or second granularity.'
    ),
    'onetimepicker',
    'OneTimePicker API',
    22,
    [
      {
        name: 'value',
        signature: 'value?: string',
        description: t('受控值，如 "09:30"。', 'Controlled value, such as "09:30".'),
      },
      {
        name: 'defaultValue',
        signature: 'defaultValue?: string',
        description: t('非受控初始值。', 'Uncontrolled initial value.'),
      },
      {
        name: 'step',
        signature: 'step?: number',
        description: t(
          '步进秒数，默认 60（分钟粒度）；step < 60 时显示秒列。',
          'Step in seconds, default 60 (minute granularity); a seconds column is shown when step < 60.'
        ),
      },
      {
        name: 'min / max',
        signature: 'min?: string; max?: string',
        description: t('可选时间范围，限制面板的小时选项。', 'Optional time range that limits the hour options in the panel.'),
      },
    ]
  ),
  page(
    '/components/form/slider/',
    'OneSlider',
    t(
      'OneSlider 使用原生 range 输入，值被钳制到 min–max，并支持受控与非受控模式。',
      'OneSlider uses a native range input whose value is clamped to min–max and supports controlled and uncontrolled modes.'
    ),
    'oneslider',
    'OneSlider API',
    23,
    [
      {
        name: 'value',
        signature: 'value?: number',
        description: t('受控数值。', 'Controlled numeric value.'),
      },
      {
        name: 'defaultValue',
        signature: 'defaultValue?: number',
        description: t('非受控初始值。', 'Uncontrolled initial value.'),
      },
      {
        name: 'min / max',
        signature: 'min?: number; max?: number',
        description: t(
          '范围边界，默认 0–100；值会被钳制。',
          'Range bounds, default 0–100; values are clamped.'
        ),
      },
      {
        name: 'step',
        signature: 'step?: number',
        description: t('步进值，默认 1。', 'Step value; default 1.'),
      },
      {
        name: 'disabled',
        signature: 'disabled?: boolean',
        description: t('禁用滑块。', 'Disables the slider.'),
      },
      {
        name: 'showValue',
        signature: 'showValue?: boolean',
        description: t('显示当前值。', 'Shows the current value.'),
      },
      {
        name: 'ariaLabel',
        signature: 'ariaLabel?: string',
        description: t('滑块的访问名称。', 'Accessible name of the slider.'),
      },
      {
        name: 'input / change',
        signature: '(event: OneSliderValueEvent) => void',
        description: t(
          '数值变化时发出 value: number 与 originalEvent: Event。',
          'Emitted on value change with value: number and originalEvent: Event.'
        ),
      },
    ]
  ),
  page(
    '/components/form/rate/',
    'OneRate',
    t(
      'OneRate 用星星按钮表达 1–count 的整数值评分，支持受控、只读与清除。',
      'OneRate expresses an integer rating of 1–count with star buttons, supporting controlled, readonly and clear modes.'
    ),
    'onerate',
    'OneRate API',
    24,
    [
      {
        name: 'value',
        signature: 'value?: number',
        description: t('受控评分。', 'Controlled rating.'),
      },
      {
        name: 'defaultValue',
        signature: 'defaultValue?: number',
        description: t('非受控初始评分。', 'Uncontrolled initial rating.'),
      },
      {
        name: 'count',
        signature: 'count?: number',
        description: t('星星数量，默认 5。', 'Number of stars; default 5.'),
      },
      {
        name: 'disabled',
        signature: 'disabled?: boolean',
        description: t('禁用评分。', 'Disables the rating.'),
      },
      {
        name: 'readonly',
        signature: 'readonly?: boolean',
        description: t('只读展示，不可点击。', 'Readonly display; not clickable.'),
      },
      {
        name: 'allowClear',
        signature: 'allowClear?: boolean',
        description: t('再次点击当前值可清除为 0。', 'Clicking the current value again clears it to 0.'),
      },
      {
        name: 'ariaLabel',
        signature: 'ariaLabel?: string',
        description: t('radiogroup 的访问名称。', 'Accessible name of the radiogroup.'),
      },
      {
        name: 'change',
        signature: '(event: OneRateValueEvent) => void',
        description: t(
          '评分变化时发出 value: number 与 originalEvent: Event。',
          'Emitted on rating change with value: number and originalEvent: Event.'
        ),
      },
    ]
  ),
  page(
    '/components/form/upload/',
    'OneUpload',
    t(
      'OneUpload 通过原生 file 输入选择本地文件，列出文件元数据并支持移除。',
      'OneUpload picks local files through a native file input, lists file metadata and supports removal.'
    ),
    'oneupload',
    'OneUpload API',
    25,
    [
      {
        name: 'accept',
        signature: 'accept?: string',
        description: t('限制可选择的文件类型。', 'Restricts selectable file types.'),
      },
      {
        name: 'multiple',
        signature: 'multiple?: boolean',
        description: t('允许一次选择多个文件。', 'Allows selecting multiple files at once.'),
      },
      {
        name: 'max',
        signature: 'max?: number',
        description: t('文件数量上限，超出部分截断。', 'Maximum file count; excess entries are truncated.'),
      },
      {
        name: 'value',
        signature: 'value?: readonly OneUploadFile[]',
        description: t('受控文件列表。', 'Controlled file list.'),
      },
      {
        name: 'defaultValue',
        signature: 'defaultValue?: readonly OneUploadFile[]',
        description: t('非受控初始文件列表。', 'Uncontrolled initial file list.'),
      },
      {
        name: 'disabled',
        signature: 'disabled?: boolean',
        description: t('禁用上传。', 'Disables the upload.'),
      },
      {
        name: 'ariaLabel',
        signature: 'ariaLabel?: string',
        description: t('文件输入的访问名称。', 'Accessible name of the file input.'),
      },
      {
        name: 'children',
        signature: 'children?: Array<VNode | string>',
        description: t('触发按钮文本，默认“选择文件”。', 'Trigger label; defaults to “选择文件”.'),
      },
      {
        name: 'change',
        signature: '(event: OneUploadChangeEvent) => void',
        description: t(
          '选择或移除文件后发出 files: OneUploadFile[] 与 originalEvent: Event。',
          'Emitted after files are selected or removed with files: OneUploadFile[] and originalEvent: Event.'
        ),
      },
    ]
  ),
  page(
    '/components/form/cascader/',
    'OneCascader',
    t(
      '多级级联选择，以分栏面板逐级展开，值为从根到叶的路径数组。',
      'Multi-level cascading selection with column panels expanding level by level; the value is a root-to-leaf path array.'
    ),
    'onecascader',
    'OneCascader API',
    26,
    [
      {
        name: 'options',
        signature: 'options: OneCascaderOption[]',
        description: t(
          '级联树：value、label、disabled 与可选 children。',
          'Cascading tree: value, label, disabled and optional children.'
        ),
      },
      {
        name: 'value',
        signature: 'value?: readonly string[]',
        description: t(
          '受控路径数组，每项对应一级的 value。',
          'Controlled path array; each item is a value at one level.'
        ),
      },
      {
        name: 'defaultValue',
        signature: 'defaultValue?: readonly string[]',
        description: t('非受控初始路径。', 'Uncontrolled initial path.'),
      },
      {
        name: 'placeholder',
        signature: 'placeholder?: string',
        description: t('未选择时的提示文本。', 'Placeholder shown when nothing is selected.'),
      },
      {
        name: 'changeOnSelect',
        signature: 'changeOnSelect?: boolean',
        description: t(
          '选择任意层级立即生效，默认需选到叶子。',
          'Commits on any level; by default a leaf is required.'
        ),
      },
      {
        name: 'disabled',
        signature: 'disabled?: boolean',
        description: t('禁用触发与选择。', 'Disables the trigger and selection.'),
      },
      {
        name: 'invalid',
        signature: 'invalid?: boolean',
        description: t('标记输入无效。', 'Marks the input as invalid.'),
      },
    ]
  ),
];
