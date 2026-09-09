import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { flushSync } from '@geektech/tsone';
import { OneButton, type OneButtonProps } from '../lib';

describe('OneButton', () => {
  let container: HTMLElement;
  let component: OneButton;

  beforeEach(() => {
    document.head.innerHTML = '';
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    component?.unmount();
    container.remove();
  });

  it('renders default and selected variants and sizes', () => {
    component = new OneButton({ children: ['Save'] });
    component.mount(container);
    const button = container.querySelector('button');
    expect(button?.className).toBe(
      'one-button one-button--primary one-button--md'
    );
    expect(button?.getAttribute('type')).toBe('button');
    expect(button?.textContent).toContain('Save');

    component.setProps({ variant: 'danger', size: 'lg', type: 'submit' });
    flushSync();
    expect(button?.className).toContain('one-button--danger');
    expect(button?.className).toContain('one-button--lg');
    expect(button?.getAttribute('type')).toBe('submit');
  });

  it('emits click only when enabled and not loading', () => {
    component = new OneButton({ children: ['Save'] });
    const events: unknown[] = [];
    component.on('click', (event) => events.push(event));
    component.mount(container);

    const button = container.querySelector('button') as HTMLButtonElement;
    button.dispatchEvent(new MouseEvent('click'));
    expect(events).toHaveLength(1);

    component.setProps({ loading: true });
    flushSync();
    expect(button.disabled).toBe(true);
    expect(button.getAttribute('aria-busy')).toBe('true');
    expect(button.querySelector('.one-button__spinner')).toBeTruthy();
    button.dispatchEvent(new MouseEvent('click'));
    expect(events).toHaveLength(1);

    component.setProps({ loading: false, disabled: true });
    flushSync();
    expect(button.disabled).toBe(true);
    expect(button.hasAttribute('aria-busy')).toBe(false);
    button.dispatchEvent(new MouseEvent('click'));
    expect(events).toHaveLength(1);
  });

  it('falls back from invalid runtime enum values', () => {
    component = new OneButton({
      variant: 'unknown',
      size: 'huge',
      children: ['Safe'],
    } as unknown as OneButtonProps);
    component.mount(container);
    expect(container.querySelector('button')?.className).toContain(
      'one-button--primary one-button--md'
    );
  });

  it('falls back to button for an invalid runtime type', () => {
    component = new OneButton({
      type: 'unexpected',
      children: ['Safe'],
    } as unknown as OneButtonProps);
    component.mount(container);

    expect(container.querySelector('button')?.getAttribute('type')).toBe(
      'button'
    );
  });
});
