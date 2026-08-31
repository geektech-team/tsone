import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { OneDialog, createOneDialogService } from '../lib/dialog';
import { DomOneOverlayHost } from '../lib/overlay';

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

describe('OneDialogService', () => {
  beforeEach(() => {
    document.head.innerHTML = '';
    document.body.innerHTML = '';
    document.body.style.overflow = '';
  });

  afterEach(() => {
    document.body.style.overflow = '';
    document.body.innerHTML = '';
  });

  it('keeps confirm open for false and closes for a fulfilled confirmation', async () => {
    const service = createOneDialogService(new DomOneOverlayHost(document));
    const kept = service.confirm({ title: 'Keep', onConfirm: () => false });
    (
      document.querySelector('.one-dialog__confirm') as HTMLButtonElement
    ).click();
    await Promise.resolve();
    expect(document.querySelector('[role="dialog"]')).toBeTruthy();
    (
      document.querySelector('.one-dialog__cancel') as HTMLButtonElement
    ).click();
    expect(await kept).toBe(false);

    const closed = service.confirm({
      title: 'Save',
      onConfirm: async () => true,
    });
    (
      document.querySelector('.one-dialog__confirm') as HTMLButtonElement
    ).click();
    expect(await closed).toBe(true);
    expect(document.querySelector('[role="dialog"]')).toBeNull();
  });

  it('shows loading and suppresses repeated confirmation while pending', async () => {
    const service = createOneDialogService(new DomOneOverlayHost(document));
    let calls = 0;
    let finish: ((value: boolean) => void) | undefined;
    const result = service.confirm({
      title: 'Pending',
      onConfirm: () => {
        calls += 1;
        return new Promise<boolean>((resolve) => {
          finish = resolve;
        });
      },
    });
    const confirm = document.querySelector(
      '.one-dialog__confirm'
    ) as HTMLButtonElement;

    confirm.click();
    confirm.click();
    expect(calls).toBe(1);
    expect(confirm.getAttribute('aria-busy')).toBe('true');
    finish?.(true);
    expect(await result).toBe(true);
  });

  it('reports confirmation errors, restores controls and stays open', async () => {
    const service = createOneDialogService(new DomOneOverlayHost(document));
    const errors: unknown[] = [];
    const result = service.confirm({
      title: 'Failure',
      onConfirm: async () => {
        throw new Error('save failed');
      },
      onError: (error) => errors.push(error),
    });

    (
      document.querySelector('.one-dialog__confirm') as HTMLButtonElement
    ).click();
    await Promise.resolve();
    await Promise.resolve();
    expect(errors).toHaveLength(1);
    expect(document.querySelector('[role="dialog"]')).toBeTruthy();
    expect(
      (document.querySelector('.one-dialog__confirm') as HTMLButtonElement)
        .disabled
    ).toBe(false);
    (
      document.querySelector('.one-dialog__cancel') as HTMLButtonElement
    ).click();
    expect(await result).toBe(false);
  });

  it('updates normal handles and closes only dialog records', () => {
    const host = new DomOneOverlayHost(document);
    const service = createOneDialogService(host);
    const message = host.open({
      kind: 'message',
      factory: ({ slot }) => {
        slot.textContent = 'Keep message';
        return { update: () => {}, destroy: () => {} };
      },
    });
    const first = service.open({ title: 'Original' });
    service.open({ title: 'Second' });

    first.update({ title: 'Updated' });
    expect(document.body.textContent).toContain('Updated');
    service.close(first.id);
    service.close(first.id);
    expect(document.body.textContent).not.toContain('Updated');
    service.closeAll();
    expect(document.querySelector('[role="dialog"]')).toBeNull();
    expect(document.body.textContent).toContain('Keep message');
    message.close();
  });

  it('resolves overlay, Escape and stacked closures as false', async () => {
    const service = createOneDialogService(new DomOneOverlayHost(document));
    const overlayResult = service.confirm({ title: 'Overlay' });
    (document.querySelector('.one-dialog__backdrop') as HTMLElement).click();
    expect(await overlayResult).toBe(false);

    const first = service.confirm({ title: 'First' });
    const second = service.confirm({ title: 'Second' });
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(await second).toBe(false);
    expect(document.querySelectorAll('[role="dialog"]')).toHaveLength(1);
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(await first).toBe(false);

    const external = service.confirm({ title: 'External close' });
    service.closeAll();
    expect(await external).toBe(false);
  });
});
