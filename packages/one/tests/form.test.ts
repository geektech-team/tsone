import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { flushSync } from '@geektech/tsone';
import {
  OneForm,
  OneFormItem,
  OneInput,
  type OneFormSubmitEvent,
} from '../lib';

describe('OneForm', () => {
  let container: HTMLElement;
  let component: OneForm;

  beforeEach(() => {
    document.head.innerHTML = '';
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    component?.unmount();
    container.remove();
  });

  it('blocks invalid submits with linked errors and emits valid values', () => {
    component = new OneForm({
      initialValues: { project: '' },
      rules: {
        project: [{ required: true, message: '请输入项目名称' }],
      },
      children: [
        {
          component: OneFormItem,
          props: {
            name: 'project',
            label: '项目名称',
            description: '用于展示',
          },
          children: [
            {
              component: OneInput,
              props: { ariaLabel: '项目名称' },
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
    const input = container.querySelector('input') as HTMLInputElement;
    const label = container.querySelector('label') as HTMLLabelElement;

    expect(input.value).toBe('');
    expect(form.dispatchEvent(new Event('submit', { cancelable: true }))).toBe(
      false
    );
    const invalidInput = container.querySelector('input') as HTMLInputElement;
    expect(invalidInput.getAttribute('aria-invalid')).toBe('true');
    expect(invalidInput.getAttribute('aria-describedby')).toContain(
      'project-description'
    );
    expect(label.htmlFor).toBe(invalidInput.id);
    expect(container.querySelector('[role="alert"]')?.textContent).toContain(
      '请输入项目名称'
    );
    expect(document.activeElement).toBe(invalidInput);
    expect(submits).toEqual([]);

    invalidInput.value = 'One UI';
    invalidInput.dispatchEvent(new Event('input'));
    expect(form.dispatchEvent(new Event('submit', { cancelable: true }))).toBe(
      false
    );
    expect(submits).toEqual([{ values: { project: 'One UI' } }]);
  });

  it('resets form field values to their initial state', () => {
    component = new OneForm({
      initialValues: { project: 'Initial' },
      children: [
        {
          component: OneFormItem,
          props: { name: 'project' },
          children: [{ component: OneInput, props: { ariaLabel: '项目名称' } }],
        },
      ],
    });
    component.mount(container);
    const input = container.querySelector('input') as HTMLInputElement;

    input.value = 'Changed';
    input.dispatchEvent(new Event('input'));
    component.reset();
    flushSync();

    expect((container.querySelector('input') as HTMLInputElement).value).toBe(
      'Initial'
    );
    expect(component.getValues()).toEqual({ project: 'Initial' });
  });

  it('handles the native form reset event through the form model', () => {
    component = new OneForm({
      initialValues: { project: 'Initial' },
      children: [
        {
          component: OneFormItem,
          props: { name: 'project' },
          children: [{ component: OneInput, props: { ariaLabel: '项目名称' } }],
        },
      ],
    });
    component.mount(container);
    const input = container.querySelector('input') as HTMLInputElement;
    input.value = 'Changed';
    input.dispatchEvent(new Event('input'));

    const form = container.querySelector('form') as HTMLFormElement;
    form.dispatchEvent(new Event('reset', { cancelable: true }));

    expect(component.getValues()).toEqual({ project: 'Initial' });
    expect((container.querySelector('input') as HTMLInputElement).value).toBe(
      'Initial'
    );
  });
});
