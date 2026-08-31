import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { OneDialog } from '../lib/dialog';

describe('OneDialog', () => {
  let container: HTMLElement;
  const components: OneDialog[] = [];

  beforeEach(() => {
    document.head.innerHTML = '';
    document.body.innerHTML = '';
    document.body.style.overflow = '';
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    components.splice(0).forEach((component) => component.unmount());
    document.body.style.overflow = '';
    document.body.innerHTML = '';
  });

  function mount(props: ConstructorParameters<typeof OneDialog>[0]): OneDialog {
    const component = new OneDialog(props);
    components.push(component);
    component.mount(container);
    return component;
  }

  it('keeps an anchor in the parent while its accessible dialog mounts in body', () => {
    const opener = document.createElement('button');
    document.body.insertBefore(opener, container);
    opener.focus();
    mount({
      title: 'Delete item',
      description: 'This action cannot be undone.',
      defaultOpen: true,
    });

    const dialog = document.querySelector('[role="dialog"]') as HTMLElement;
    expect(container.querySelector('[data-one-dialog-anchor]')).toBeTruthy();
    expect(container.querySelector('[role="dialog"]')).toBeNull();
    expect(dialog).toBeTruthy();
    expect(dialog.getAttribute('aria-modal')).toBe('true');
    expect(
      document.getElementById(dialog.getAttribute('aria-labelledby')!)
    ).toBeTruthy();
    expect(
      document.getElementById(dialog.getAttribute('aria-describedby')!)
    ).toBeTruthy();
    expect(dialog.contains(document.activeElement)).toBe(true);
    expect(document.body.style.overflow).toBe('hidden');

    (
      document.querySelector('.one-dialog__cancel') as HTMLButtonElement
    ).click();
    expect(document.querySelector('[role="dialog"]')).toBeNull();
    expect(document.body.style.overflow).toBe('');
    expect(document.activeElement).toBe(opener);
  });

  it('emits a controlled open change without overriding open=true', () => {
    const changes: boolean[] = [];
    const component = mount({ open: true, title: 'Controlled' });
    component.on('openChange', (value) => changes.push(value as boolean));

    (
      document.querySelector('.one-dialog__cancel') as HTMLButtonElement
    ).click();

    expect(changes).toEqual([false]);
    expect(document.querySelector('[role="dialog"]')).toBeTruthy();
    component.setProps({ open: false });
    expect(document.querySelector('[role="dialog"]')).toBeNull();
  });

  it('honors overlay close settings and emits one cancellation reason', () => {
    const reasons: string[] = [];
    const component = mount({
      title: 'Overlay behavior',
      defaultOpen: true,
      closeOnOverlay: false,
      closeOnEscape: false,
    });
    component.on('cancel', (reason) => reasons.push(reason as string));
    const backdrop = document.querySelector(
      '.one-dialog__backdrop'
    ) as HTMLElement;

    backdrop.click();
    expect(document.querySelector('[role="dialog"]')).toBeTruthy();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(document.querySelector('[role="dialog"]')).toBeTruthy();
    component.setProps({ closeOnOverlay: true });
    (document.querySelector('.one-dialog__backdrop') as HTMLElement).click();

    expect(reasons).toEqual(['overlay']);
    expect(document.querySelector('[role="dialog"]')).toBeNull();
  });

  it('lets only the top dialog respond to Escape', () => {
    mount({ title: 'First', defaultOpen: true });
    mount({ title: 'Second', defaultOpen: true });
    expect(document.querySelectorAll('[role="dialog"]')).toHaveLength(2);

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(document.querySelectorAll('[role="dialog"]')).toHaveLength(1);
    expect(document.body.textContent).toContain('First');
    expect(document.body.style.overflow).toBe('hidden');
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(document.querySelector('[role="dialog"]')).toBeNull();
    expect(document.body.style.overflow).toBe('');
  });

  it('emits confirm and closes an uncontrolled dialog once', () => {
    const events: string[] = [];
    const component = mount({ title: 'Confirm', defaultOpen: true });
    component.on('confirm', () => events.push('confirm'));
    component.on('afterClose', () => events.push('afterClose'));

    (
      document.querySelector('.one-dialog__confirm') as HTMLButtonElement
    ).click();

    expect(events).toEqual(['confirm', 'afterClose']);
    expect(document.querySelector('[role="dialog"]')).toBeNull();
  });

  it('wraps Tab and Shift+Tab inside the top dialog', () => {
    mount({ title: 'Focus trap', defaultOpen: true });
    const cancel = document.querySelector(
      '.one-dialog__cancel'
    ) as HTMLButtonElement;
    const confirm = document.querySelector(
      '.one-dialog__confirm'
    ) as HTMLButtonElement;

    confirm.focus();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab' }));
    expect(document.activeElement).toBe(cancel);
    cancel.focus();
    document.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Tab', shiftKey: true })
    );
    expect(document.activeElement).toBe(confirm);
  });

  it('does not lock body scrolling for a custom container', () => {
    const custom = document.createElement('section');
    custom.getBoundingClientRect = () => ({
      x: 0,
      y: 0,
      top: 0,
      left: 0,
      right: 320,
      bottom: 240,
      width: 320,
      height: 240,
      toJSON: () => ({}),
    });
    document.body.appendChild(custom);
    mount({ title: 'Contained', defaultOpen: true, container: custom });

    expect(custom.querySelector('[role="dialog"]')).toBeTruthy();
    expect(document.body.style.overflow).toBe('');
  });
});
