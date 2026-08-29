import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { OneCheckbox, type OneFieldValueEvent } from '../lib';

describe('OneCheckbox', () => {
  let container: HTMLElement;
  let component: OneCheckbox;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    component?.unmount();
    container.remove();
  });

  it('restores controlled state while emitting boolean values', () => {
    component = new OneCheckbox({ checked: true, ariaLabel: '同意协议' });
    const changes: Array<OneFieldValueEvent<boolean>> = [];
    component.on('change', (payload) => {
      changes.push(payload as OneFieldValueEvent<boolean>);
    });
    component.mount(container);
    const input = container.querySelector('input') as HTMLInputElement;

    input.checked = false;
    input.dispatchEvent(new Event('change'));

    expect(changes[0].value).toBe(false);
    expect(input.checked).toBe(true);
  });

  it('keeps an uncontrolled default checked value and ignores disabled input', () => {
    component = new OneCheckbox({ defaultChecked: true, disabled: true });
    component.mount(container);
    const input = container.querySelector('input') as HTMLInputElement;

    input.checked = false;
    input.dispatchEvent(new Event('change'));

    expect(input.checked).toBe(false);
  });
});
