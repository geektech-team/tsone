import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { OneCascader } from '../lib/cascader';
import { OneEmpty } from '../lib/empty';
import { OneFormModel } from '../lib/form/model';
import {
  ONE_DEFAULT_LOCALE,
  ONE_I18N_MESSAGES,
  OneI18n,
  OneI18nConfigError,
  OneLocalizedComponent,
  createOneI18n,
  oneI18n,
} from '../lib/i18n';
import { OneLoading } from '../lib/loading';
import { OnePagination } from '../lib/pagination';
import { OneSelect } from '../lib/select';
import { OneTable } from '../lib/table';
import { OneTimePicker } from '../lib/time-picker';

describe('OneI18n', () => {
  afterEach(() => {
    oneI18n.setLocale(ONE_DEFAULT_LOCALE);
  });

  it('resolves built-in messages with the default zh-CN locale', () => {
    expect(oneI18n.getLocale()).toBe('zh-CN');
    expect(oneI18n.t('one.empty.description')).toBe('暂无数据');
    expect(oneI18n.t('one.pagination.prev')).toBe('上一页');
  });

  it('switches locale and interpolates message parameters', () => {
    const i18n = createOneI18n({ locale: 'en' });

    expect(i18n.t('one.empty.description')).toBe('No data');
    expect(i18n.t('one.pagination.page', { page: 3 })).toBe('Page 3');
    expect(i18n.t('one.form.minLength', { min: 4 })).toBe(
      'Must be at least 4 characters'
    );
    expect(i18n.t('one.upload.remove', { name: 'a.pdf' })).toBe(
      'Remove a.pdf'
    );
  });

  it('falls back to the fallback locale and finally to the key itself', () => {
    const i18n = createOneI18n({
      locale: 'ja',
      fallbackLocale: 'zh-CN',
    });

    expect(i18n.t('one.empty.description')).toBe('暂无数据');
    expect(i18n.t('one.missing.key')).toBe('one.missing.key');
    expect(i18n.has('one.empty.description')).toBe(true);
    expect(i18n.has('one.missing.key')).toBe(false);
  });

  it('keeps a resolved key stable when a message equals the key', () => {
    const i18n = createOneI18n({
      locale: 'en',
      messages: { en: { 'one.raw': 'one.raw' } },
    });

    expect(i18n.t('one.raw')).toBe('one.raw');
  });

  it('merges custom messages over the built-in dictionary', () => {
    const i18n = createOneI18n({
      locale: 'en',
      messages: {
        en: { 'one.empty.description': 'Nothing here yet' },
        'zh-CN': { 'one.custom': '自定义消息' },
      },
    });

    expect(i18n.t('one.empty.description')).toBe('Nothing here yet');
    expect(i18n.t('one.custom')).toBe('自定义消息');

    i18n.setLocale('zh-CN');
    expect(i18n.t('one.custom')).toBe('自定义消息');
    expect(i18n.t('one.empty.description')).toBe('暂无数据');
  });

  it('merges messages at runtime through mergeMessages', () => {
    const i18n = createOneI18n({ locale: 'en' });
    i18n.mergeMessages({ en: { 'one.empty.description': 'Empty list' } });

    expect(i18n.t('one.empty.description')).toBe('Empty list');
  });

  it('notifies locale listeners and unsubscribes on request', () => {
    const i18n = createOneI18n({ locale: 'zh-CN' });
    const seen: string[] = [];
    const unsubscribe = i18n.onLocaleChange(() => {
      seen.push(i18n.getLocale());
    });

    i18n.setLocale('en');
    i18n.setLocale('zh-CN');
    expect(seen).toEqual(['en', 'zh-CN']);

    unsubscribe();
    i18n.setLocale('en');
    expect(seen).toEqual(['en', 'zh-CN']);
  });

  it('does not notify when the locale is unchanged', () => {
    const i18n = createOneI18n({ locale: 'en' });
    let notifications = 0;
    i18n.onLocaleChange(() => {
      notifications += 1;
    });

    i18n.setLocale('en');
    expect(notifications).toBe(0);
  });

  it('rejects empty or whitespace locales', () => {
    expect(() => createOneI18n({ locale: '' })).toThrow(OneI18nConfigError);
    expect(() => createOneI18n({ locale: 'en US' })).toThrow(
      OneI18nConfigError
    );
    expect(() => oneI18n.setLocale(' ')).toThrow(OneI18nConfigError);
  });

  it('cleans up listeners and subscribers on destroy', () => {
    const i18n = createOneI18n({ locale: 'zh-CN' });
    const component = new OneEmpty();
    i18n.attach(component);

    i18n.destroy();
    expect(() => i18n.setLocale('en')).not.toThrow();
  });
});

describe('OneLocalizedComponent', () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    oneI18n.setLocale(ONE_DEFAULT_LOCALE);
    container.remove();
  });

  it('renders default zh-CN text and rerenders after a locale switch', () => {
    const component = new OneEmpty();
    component.mount(container);

    expect(
      container.querySelector('.one-empty__description')?.textContent
    ).toBe('暂无数据');

    oneI18n.setLocale('en');

    expect(
      container.querySelector('.one-empty__description')?.textContent
    ).toBe('No data');

    oneI18n.setLocale('zh-CN');

    expect(
      container.querySelector('.one-empty__description')?.textContent
    ).toBe('暂无数据');
  });

  it('prefers explicit props over translated defaults', () => {
    const component = new OneEmpty({ description: '自定义说明' });
    component.mount(container);

    expect(
      container.querySelector('.one-empty__description')?.textContent
    ).toBe('自定义说明');

    oneI18n.setLocale('en');

    expect(
      container.querySelector('.one-empty__description')?.textContent
    ).toBe('自定义说明');
  });

  it('translates aria labels in components', () => {
    const loading = new OneLoading();
    loading.mount(container);
    expect(
      container.querySelector('.one-loading')?.getAttribute('aria-label')
    ).toBe('加载中');

    oneI18n.setLocale('en');
    expect(
      container.querySelector('.one-loading')?.getAttribute('aria-label')
    ).toBe('Loading');
    loading.unmount();
  });

  it('translates empty text in tables', () => {
    const table = new OneTable({ columns: [{ key: 'name' }], data: [] });
    table.mount(container);
    expect(container.querySelector('.one-table__empty')?.textContent).toBe(
      '暂无数据'
    );

    oneI18n.setLocale('en');
    expect(container.querySelector('.one-table__empty')?.textContent).toBe(
      'No data'
    );
    table.unmount();
  });

  it('translates pagination labels and page-size options', () => {
    const pagination = new OnePagination({ total: 100 });
    pagination.mount(container);

    expect(
      container
        .querySelector('.one-pagination__pages button')
        ?.getAttribute('aria-label')
    ).toBe('上一页');
    expect(
      container.querySelector('.one-pagination__size option')?.textContent
    ).toBe('10 条/页');

    oneI18n.setLocale('en');

    expect(
      container
        .querySelector('.one-pagination__pages button')
        ?.getAttribute('aria-label')
    ).toBe('Previous');
    expect(
      container.querySelector('.one-pagination__size option')?.textContent
    ).toBe('10 per page');
    pagination.unmount();
  });

  it('translates default placeholders in form controls', () => {
    const cascaderContainer = document.createElement('div');
    document.body.appendChild(cascaderContainer);
    const selectContainer = document.createElement('div');
    document.body.appendChild(selectContainer);
    const timeContainer = document.createElement('div');
    document.body.appendChild(timeContainer);

    const cascader = new OneCascader();
    cascader.mount(cascaderContainer);
    const select = new OneSelect({ options: [] });
    select.mount(selectContainer);
    const timePicker = new OneTimePicker();
    timePicker.mount(timeContainer);

    expect(
      cascaderContainer.querySelector('[role="combobox"]')?.textContent
    ).toBe('请选择');
    expect(
      (timeContainer.querySelector('input[type="text"]') as HTMLInputElement)
        ?.placeholder
    ).toBe('请选择时间');

    oneI18n.setLocale('en');

    expect(
      cascaderContainer.querySelector('[role="combobox"]')?.textContent
    ).toBe('Please select');
    expect(
      (timeContainer.querySelector('input[type="text"]') as HTMLInputElement)
        ?.placeholder
    ).toBe('Select time');

    cascader.unmount();
    select.unmount();
    timePicker.unmount();
    cascaderContainer.remove();
    selectContainer.remove();
    timeContainer.remove();
  });

  it('updates subscribed components only while they are mounted', () => {
    const component = new OneEmpty();
    component.mount(container);
    component.unmount();

    expect(() => oneI18n.setLocale('en')).not.toThrow();
    expect(oneI18n.t('one.empty.description')).toBe('No data');
  });

  it('validates OneLocalizedComponent as a public component base', () => {
    expect(OneLocalizedComponent).toBeFunction();
  });
});

describe('OneFormModel messages', () => {
  afterEach(() => {
    oneI18n.setLocale(ONE_DEFAULT_LOCALE);
  });

  it('translates validation messages at validation time', () => {
    const model = new OneFormModel(
      { name: '' },
      { name: [{ required: true }, { minLength: 3 }] }
    );
    model.registerField('name', () => undefined);

    expect(model.validate().errors).toEqual({
      name: ['此字段为必填项', '长度不能少于 3'],
    });

    oneI18n.setLocale('en');

    expect(model.validate().errors).toEqual({
      name: ['This field is required', 'Must be at least 3 characters'],
    });
  });

  it('exposes the built-in message dictionary for both locales', () => {
    expect(Object.keys(ONE_I18N_MESSAGES)).toEqual(['zh-CN', 'en']);
    expect(ONE_I18N_MESSAGES['zh-CN']['one.empty.description']).toBe(
      '暂无数据'
    );
    expect(ONE_I18N_MESSAGES.en['one.empty.description']).toBe('No data');
  });

  it('supports custom i18n instances isolated from the global singleton', () => {
    const custom = new OneI18n({
      locale: 'en',
      messages: { en: { 'one.empty.description': 'Custom empty' } },
    });

    expect(custom.t('one.empty.description')).toBe('Custom empty');
    expect(oneI18n.t('one.empty.description')).toBe('暂无数据');
  });
});
