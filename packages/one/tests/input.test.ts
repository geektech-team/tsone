import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { OneInput, type OneInputValueEvent } from '../lib';

describe('OneInput', () => {
  let container: HTMLElement;
  let component: OneInput;

  beforeEach(() => {
    document.head.innerHTML = '';
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    component?.unmount();
    container.remove();
  });

  it('updates internal state in uncontrolled mode', () => {
    component = new OneInput({ defaultValue: 'start', ariaLabel: 'Name' });
    const payloads: OneInputValueEvent[] = [];
    const changes: OneInputValueEvent[] = [];
    component.on('input', (payload) => {
      payloads.push(payload as OneInputValueEvent);
    });
    component.on('change', (payload) => {
      changes.push(payload as OneInputValueEvent);
    });
    component.mount(container);
    const input = container.querySelector('input') as HTMLInputElement;

    expect(input.value).toBe('start');
    input.value = 'next';
    input.dispatchEvent(new Event('input'));

    expect(input.value).toBe('next');
    expect(payloads[0].value).toBe('next');
    expect(payloads[0].originalEvent.type).toBe('input');

    input.dispatchEvent(new Event('change'));
    expect(changes[0].value).toBe('next');
    expect(changes[0].originalEvent.type).toBe('change');

    component.setProps({ defaultValue: 'replacement' });
    expect(input.value).toBe('next');
  });

  it('emits but restores the latest prop in controlled mode', () => {
    component = new OneInput({ value: 'locked', defaultValue: 'ignored' });
    const payloads: OneInputValueEvent[] = [];
    component.on('input', (payload) => {
      payloads.push(payload as OneInputValueEvent);
    });
    component.mount(container);
    const input = container.querySelector('input') as HTMLInputElement;

    input.value = 'typed';
    input.dispatchEvent(new Event('input'));
    expect(payloads[0].value).toBe('typed');
    expect(input.value).toBe('locked');

    component.setProps({ value: 'accepted' });
    expect(input.value).toBe('accepted');
  });

  it('maps native and invalid state props', () => {
    component = new OneInput({
      type: 'email',
      name: 'contact',
      required: true,
      readonly: true,
      invalid: true,
      size: 'lg',
    });
    component.mount(container);
    const input = container.querySelector('input') as HTMLInputElement;
    expect(input.type).toBe('email');
    expect(input.name).toBe('contact');
    expect(input.hasAttribute('required')).toBe(true);
    expect(input.hasAttribute('readonly')).toBe(true);
    expect(input.getAttribute('aria-invalid')).toBe('true');
    expect(input.className).toContain('one-input--invalid one-input--lg');
  });
});
