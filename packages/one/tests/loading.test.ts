import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { OneLoading } from '../lib';

describe('OneLoading', () => {
  let container: HTMLElement;
  let component: OneLoading;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    component?.unmount();
    container.remove();
  });

  it('renders a status spinner with a default accessible label', () => {
    component = new OneLoading();
    component.mount(container);

    const root = container.querySelector('.one-loading');
    expect(root?.getAttribute('role')).toBe('status');
    expect(root?.getAttribute('aria-label')).toBe('加载中');
    expect(container.querySelector('.one-loading__spinner')).toBeTruthy();
  });

  it('normalizes invalid size and variant to md and primary', () => {
    component = new OneLoading({
      size: 'xl' as 'md',
      variant: 'unknown' as 'primary',
    });
    component.mount(container);

    expect(container.querySelector('.one-loading')?.className).toContain(
      'one-loading--md'
    );
    expect(
      container.querySelector('.one-loading__spinner')?.className
    ).toContain('one-loading__spinner--primary');
  });

  it('renders a custom label and child text', () => {
    component = new OneLoading({ label: '正在保存', children: ['保存中'] });
    component.mount(container);

    expect(
      container.querySelector('.one-loading')?.getAttribute('aria-label')
    ).toBe('正在保存');
    expect(container.querySelector('.one-loading')?.textContent).toContain(
      '保存中'
    );
  });
});
