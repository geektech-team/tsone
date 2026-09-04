import { describe, expect, it } from 'bun:test';
import { ONE_COMPONENT_CATEGORIES } from '../lib';

describe('ONE_COMPONENT_CATEGORIES', () => {
  it('keeps component names in a stable category catalog', () => {
    expect(ONE_COMPONENT_CATEGORIES).toEqual([
      {
        id: 'basic',
        label: '基础',
        components: ['OneButton', 'OneDivider', 'OneSpace'],
      },
      {
        id: 'form',
        label: '表单',
        components: [
          'OneForm',
          'OneFormItem',
          'OneInput',
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
        components: ['OneTabs', 'OneSteps', 'OneBreadcrumb', 'OnePagination'],
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
    ]);
  });
});
