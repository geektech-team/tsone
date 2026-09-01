import { describe, expect, it } from 'bun:test';
import { ONE_COMPONENT_CATEGORIES } from '../lib';

describe('ONE_COMPONENT_CATEGORIES', () => {
  it('keeps component names in a stable category catalog', () => {
    expect(ONE_COMPONENT_CATEGORIES).toEqual([
      { id: 'basic', label: '基础', components: ['OneButton', 'OneInput'] },
      {
        id: 'form',
        label: '表单',
        components: [
          'OneForm',
          'OneFormItem',
          'OneSelect',
          'OneCheckbox',
          'OneCheckboxGroup',
          'OneSwitch',
        ],
      },
      {
        id: 'navigation',
        label: '导航',
        components: ['OneTabs', 'OneBreadcrumb', 'OnePagination'],
      },
      {
        id: 'data-display',
        label: '数据展示',
        components: ['OneCard', 'OneTag', 'OneBadge', 'OneEmpty'],
      },
      {
        id: 'feedback',
        label: '反馈与浮层',
        components: ['OneAlert', 'OneMessage', 'OneDialog', 'OneTooltip'],
      },
    ]);
  });
});
