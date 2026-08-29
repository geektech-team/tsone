import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { OneForm, OneFormItem, OneSwitch } from '../lib';

describe('OneSwitch', () => {
  let container: HTMLElement;
  let component: OneForm;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    component?.unmount();
    container.remove();
  });

  it('writes to OneForm and fails required validation when false', () => {
    component = new OneForm({
      initialValues: { enabled: false },
      rules: { enabled: [{ required: true, message: '请启用开关' }] },
      children: [
        {
          component: OneFormItem,
          props: { name: 'enabled', label: '启用' },
          children: [{ component: OneSwitch, props: { ariaLabel: '启用' } }],
        },
      ],
    });
    component.mount(container);
    const form = container.querySelector('form') as HTMLFormElement;

    form.dispatchEvent(new Event('submit', { cancelable: true }));
    expect(container.querySelector('[role="alert"]')?.textContent).toContain(
      '请启用开关'
    );

    const input = container.querySelector('input') as HTMLInputElement;
    input.checked = true;
    input.dispatchEvent(new Event('change'));

    expect(component.getValues()).toEqual({ enabled: true });
    expect(
      container.querySelector('[role="switch"]')?.getAttribute('aria-checked')
    ).toBe('true');
  });
});
