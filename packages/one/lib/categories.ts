export type OneComponentCategory =
  | 'basic'
  | 'layout'
  | 'form'
  | 'navigation'
  | 'data-display'
  | 'feedback';

export const ONE_COMPONENT_CATEGORIES = [
  { id: 'basic', label: '基础', components: ['OneButton', 'OneSpace'] },
  {
    id: 'layout',
    label: '布局',
    components: ['OneDivider', 'OneRow', 'OneCol'],
  },
  {
    id: 'form',
    label: '表单',
    components: [
      'OneForm',
      'OneFormItem',
      'OneInput',
      'OneTextarea',
      'OneSelect',
      'OneCascader',
      'OneTimePicker',
      'OneCheckbox',
      'OneCheckboxGroup',
      'OneRadio',
      'OneRadioGroup',
      'OneSwitch',
      'OneSlider',
      'OneRate',
      'OneUpload',
    ],
  },
  {
    id: 'navigation',
    label: '导航',
    components: [
      'OneTabs',
      'OneSteps',
      'OneBreadcrumb',
      'OnePagination',
    ],
  },
  {
    id: 'data-display',
    label: '数据展示',
    components: [
      'OneCard',
      'OneAvatar',
      'OneTag',
      'OneBadge',
      'OneProgress',
      'OneEmpty',
      'OneTable',
      'OneCollapse',
      'OneSkeleton',
      'OneDescriptions',
      'OneTimeline',
    ],
  },
  {
    id: 'feedback',
    label: '反馈与浮层',
    components: [
      'OneAlert',
      'OneMessage',
      'OneDialog',
      'OneTooltip',
      'OnePopover',
      'OneLoading',
    ],
  },
] as const;
