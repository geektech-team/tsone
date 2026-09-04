import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { OneLoading } from '../lib';
import { ONE_LOADING_STYLES } from '../lib/loading/OneLoading';

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

  it('spins the default icon via injected keyframes injected exactly once', () => {
    component = new OneLoading();
    component.mount(container);

    const spinnerStyle = ONE_LOADING_STYLES.find(
      (style) => style.name === 'one-loading-spinner'
    );
    expect(spinnerStyle?.properties.animation).toBe(
      'one-loading-spin 1s linear infinite'
    );

    const keyframesStyles = Array.from(
      document.head.querySelectorAll('style')
    ).filter((style) =>
      (style.textContent ?? '').includes('@keyframes one-loading-spin')
    );
    expect(keyframesStyles).toHaveLength(1);
    expect(keyframesStyles[0]?.textContent).toContain('rotate(360deg)');

    const second = new OneLoading();
    second.mount(container);
    const afterSecond = Array.from(
      document.head.querySelectorAll('style')
    ).filter((style) =>
      (style.textContent ?? '').includes('@keyframes one-loading-spin')
    );
    expect(afterSecond).toHaveLength(1);
    second.unmount();
  });
});
