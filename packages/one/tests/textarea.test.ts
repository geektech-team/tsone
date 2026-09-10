import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { flushSync } from '@geektech/tsone';
import {
  OneForm,
  OneFormItem,
  OneTextarea,
  normalizeOneTextareaRows,
  type OneFormSubmitEvent,
  type OneTextareaProps,
  type OneTextareaValueEvent,
} from '../lib';

describe('OneTextarea', () => {
  let container: HTMLElement;
  let component: OneTextarea | OneForm | undefined;

  beforeEach(() => {
    document.head.innerHTML = '';
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    component?.unmount();
    component = undefined;
    container.remove();
  });

  it('updates internal state in uncontrolled mode', () => {
    component = new OneTextarea({ defaultValue: 'start', ariaLabel: 'Notes' });
    const payloads: OneTextareaValueEvent[] = [];
    const changes: OneTextareaValueEvent[] = [];
    component.on('input', (payload) => {
      payloads.push(payload as OneTextareaValueEvent);
    });
    component.on('change', (payload) => {
      changes.push(payload as OneTextareaValueEvent);
    });
    component.mount(container);
    const textarea = container.querySelector('textarea') as HTMLTextAreaElement;

    expect(textarea.value).toBe('start');
    textarea.value = 'next';
    textarea.dispatchEvent(new Event('input'));

    expect(textarea.value).toBe('next');
    expect(payloads[0].value).toBe('next');
    expect(payloads[0].originalEvent.type).toBe('input');

    textarea.dispatchEvent(new Event('change'));
    expect(changes[0].value).toBe('next');
    expect(changes[0].originalEvent.type).toBe('change');

    component.setProps({ defaultValue: 'replacement' });
    flushSync();
    expect(textarea.value).toBe('next');
  });

  it('emits but restores the latest prop in controlled mode', () => {
    component = new OneTextarea({ value: 'locked' });
    const payloads: OneTextareaValueEvent[] = [];
    component.on('input', (payload) => {
      payloads.push(payload as OneTextareaValueEvent);
    });
    component.mount(container);
    const textarea = container.querySelector('textarea') as HTMLTextAreaElement;

    textarea.value = 'typed';
    textarea.dispatchEvent(new Event('input'));
    expect(payloads[0].value).toBe('typed');
    expect(textarea.value).toBe('locked');

    component.setProps({ value: 'accepted' });
    flushSync();
    expect(textarea.value).toBe('accepted');
  });

  it('maps native, invalid and size states and renders rows', () => {
    component = new OneTextarea({
      name: 'bio',
      placeholder: 'Tell us',
      rows: 6,
      required: true,
      readonly: true,
      invalid: true,
      size: 'lg',
    });
    component.mount(container);
    const textarea = container.querySelector('textarea') as HTMLTextAreaElement;

    expect(textarea.name).toBe('bio');
    expect(textarea.placeholder).toBe('Tell us');
    expect(textarea.getAttribute('rows')).toBe('6');
    expect(textarea.hasAttribute('required')).toBe(true);
    expect(textarea.hasAttribute('readonly')).toBe(true);
    expect(textarea.getAttribute('aria-invalid')).toBe('true');
    expect(textarea.className).toContain(
      'one-textarea--invalid one-textarea--lg'
    );
  });

  it('maps disabled, ariaLabel and invalid runtime size safely', () => {
    component = new OneTextarea({
      size: 'oversized',
      disabled: true,
      ariaLabel: '备注',
    } as unknown as OneTextareaProps);
    component.mount(container);

    const textarea = container.querySelector('textarea') as HTMLTextAreaElement;
    expect(textarea.className).toContain('one-textarea--md');
    expect(textarea.disabled).toBe(true);
    expect(textarea.getAttribute('aria-label')).toBe('备注');
  });

  it('normalizes rows into the 1-10 range with a default of 3', () => {
    expect(normalizeOneTextareaRows(5)).toBe(5);
    expect(normalizeOneTextareaRows(0)).toBe(3);
    expect(normalizeOneTextareaRows(-2)).toBe(3);
    expect(normalizeOneTextareaRows(99)).toBe(10);
    expect(normalizeOneTextareaRows('tall')).toBe(3);
    expect(normalizeOneTextareaRows(undefined)).toBe(3);
  });

  it('integrates with OneFormItem validation and submit values', () => {
    component = new OneForm({
      initialValues: { bio: '' },
      rules: {
        bio: [{ required: true, message: '请输入简介' }],
      },
      children: [
        {
          component: OneFormItem,
          props: { name: 'bio', label: '简介' },
          children: [
            {
              component: OneTextarea,
              props: { ariaLabel: '简介' },
            },
          ],
        },
      ],
    });
    const submits: OneFormSubmitEvent[] = [];
    component.on('submit', (payload) => {
      submits.push(payload as OneFormSubmitEvent);
    });
    component.mount(container);

    const form = container.querySelector('form') as HTMLFormElement;
    const textarea = container.querySelector('textarea') as HTMLTextAreaElement;
    const label = container.querySelector('label') as HTMLLabelElement;

    expect(textarea.value).toBe('');
    expect(form.dispatchEvent(new Event('submit', { cancelable: true }))).toBe(
      false
    );
    expect(textarea.getAttribute('aria-invalid')).toBe('true');
    expect(label.htmlFor).toBe(textarea.id);
    expect(submits).toEqual([]);

    textarea.value = '前端工程师';
    textarea.dispatchEvent(new Event('input'));
    expect(form.dispatchEvent(new Event('submit', { cancelable: true }))).toBe(
      false
    );
    expect(submits).toEqual([{ values: { bio: '前端工程师' } }]);
  });
});
