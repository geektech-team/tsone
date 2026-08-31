import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { OneAlert } from '../lib/alert';

describe('OneAlert', () => {
  let container: HTMLElement;
  let component: OneAlert;

  beforeEach(() => {
    document.head.innerHTML = '';
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    component?.unmount();
    container.remove();
  });

  it('normalizes variants and assigns status or alert roles', () => {
    for (const [variant, role] of [
      ['info', 'status'],
      ['success', 'status'],
      ['warning', 'alert'],
      ['error', 'alert'],
    ] as const) {
      component = new OneAlert({ title: variant, variant });
      component.mount(container);
      const alert = container.querySelector('.one-alert');
      expect(alert?.classList.contains(`one-alert--${variant}`)).toBe(true);
      expect(alert?.getAttribute('role')).toBe(role);
      component.unmount();
      container.innerHTML = '';
    }

    component = new OneAlert({
      title: 'Fallback',
      variant: 'unknown' as 'info',
    });
    component.mount(container);
    expect(
      container
        .querySelector('.one-alert')
        ?.classList.contains('one-alert--info')
    ).toBe(true);
  });

  it('prefers explicit icon, default and actions slots', () => {
    component = new OneAlert({
      title: 'Release',
      description: 'Fallback description',
      closable: true,
      children: [
        { tag: 'span', slot: 'icon', children: ['I'] },
        { tag: 'p', children: ['Custom description'] },
        { tag: 'button', slot: 'actions', children: ['Retry'] },
      ],
    });
    component.mount(container);

    expect(container.querySelector('.one-alert__icon')?.textContent).toBe('I');
    expect(
      container.querySelector('.one-alert__description')?.textContent
    ).toBe('Custom description');
    expect(
      container.querySelector('.one-alert__description')?.textContent
    ).not.toContain('Fallback description');
    expect(container.querySelector('.one-alert__actions')?.textContent).toBe(
      'Retry'
    );
    expect(container.querySelector('.one-alert__close')).toBeTruthy();
  });

  it('emits close and hides an uncontrolled closable alert', () => {
    let closes = 0;
    component = new OneAlert({
      title: 'Network error',
      variant: 'error',
      closable: true,
    });
    component.on('close', () => {
      closes += 1;
    });
    component.mount(container);

    const close = container.querySelector(
      '.one-alert__close'
    ) as HTMLButtonElement;
    expect(close.getAttribute('aria-label')).toBe('关闭提示');
    close.click();

    expect(closes).toBe(1);
    expect(container.querySelector('.one-alert')).toBeNull();
    expect(container.querySelector('[data-one-alert-anchor]')).toBeTruthy();
  });
});
