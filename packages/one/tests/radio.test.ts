import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import {
  OneRadio,
  OneRadioGroup,
  type OneFieldValueEvent,
} from '../lib';

describe('OneRadio', () => {
  let container: HTMLElement;
  let component: OneRadio;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    component?.unmount();
    container.remove();
  });

  it('renders a native radio input carrying its value and label', () => {
    component = new OneRadio({
      value: 'design',
      ariaLabel: '设计',
      children: ['设计'],
    });
    component.mount(container);

    const input = container.querySelector('input') as HTMLInputElement;
    expect(input.type).toBe('radio');
    expect(input.value).toBe('design');
    expect(container.querySelector('.one-radio')?.textContent).toContain('设计');
  });

  it('emits its value and restores a controlled unchecked state', () => {
    component = new OneRadio({ value: 'design', checked: false });
    const changes: Array<OneFieldValueEvent<string>> = [];
    component.on('change', (payload) =>
      changes.push(payload as OneFieldValueEvent<string>)
    );
    component.mount(container);
    const input = container.querySelector('input') as HTMLInputElement;

    input.checked = true;
    input.dispatchEvent(new Event('change'));

    expect(changes[0].value).toBe('design');
    expect(input.checked).toBe(false);
  });

  it('keeps an uncontrolled default and ignores disabled input', () => {
    component = new OneRadio({ value: 'a', defaultChecked: true, disabled: true });
    component.mount(container);
    const input = container.querySelector('input') as HTMLInputElement;
    expect(input.checked).toBe(true);

    input.checked = false;
    input.dispatchEvent(new Event('change'));

    expect(input.checked).toBe(false);
  });
});

describe('OneRadioGroup', () => {
  let container: HTMLElement;
  let component: OneRadioGroup;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    component?.unmount();
    container.remove();
  });

  it('renders a radiogroup and marks the default value', () => {
    component = new OneRadioGroup({
      defaultValue: 'b',
      ariaLabel: '选项',
      options: [
        { value: 'a', label: 'A' },
        { value: 'b', label: 'B' },
      ],
    });
    component.mount(container);

    const group = container.querySelector('.one-radio-group');
    expect(group?.getAttribute('role')).toBe('radiogroup');
    expect(group?.getAttribute('aria-label')).toBe('选项');
    const inputs = container.querySelectorAll('input');
    expect(inputs[0].checked).toBe(false);
    expect(inputs[1].checked).toBe(true);
  });

  it('emits input and change with the newly selected value', () => {
    component = new OneRadioGroup({
      options: [
        { value: 'a', label: 'A' },
        { value: 'b', label: 'B' },
      ],
    });
    const changes: Array<OneFieldValueEvent<string>> = [];
    component.on('change', (payload) =>
      changes.push(payload as OneFieldValueEvent<string>)
    );
    component.mount(container);

    const inputs = container.querySelectorAll('input');
    (inputs[0] as HTMLInputElement).checked = true;
    (inputs[0] as HTMLInputElement).dispatchEvent(new Event('change'));

    expect(changes[0].value).toBe('a');
  });

  it('does not select a disabled option', () => {
    component = new OneRadioGroup({
      options: [
        { value: 'a', label: 'A', disabled: true },
        { value: 'b', label: 'B' },
      ],
    });
    const changes: Array<OneFieldValueEvent<string>> = [];
    component.on('change', (payload) =>
      changes.push(payload as OneFieldValueEvent<string>)
    );
    component.mount(container);

    const inputs = container.querySelectorAll('input');
    (inputs[0] as HTMLInputElement).checked = true;
    (inputs[0] as HTMLInputElement).dispatchEvent(new Event('change'));

    expect(changes).toHaveLength(0);
  });
});
