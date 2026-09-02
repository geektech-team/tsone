import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { OneProgress } from '../lib';

describe('OneProgress', () => {
  let container: HTMLElement;
  let component: OneProgress;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    component?.unmount();
    container.remove();
  });

  it('clamps percent into the 0-100 range and sizes the bar', () => {
    component = new OneProgress({ percent: 120 });
    component.mount(container);

    const bar = container.querySelector('.one-progress__bar') as HTMLElement;
    expect(bar.style.width).toBe('100%');
    expect(
      container.querySelector('.one-progress')?.getAttribute('aria-valuenow')
    ).toBe('100');

    component.setProps({ percent: -5 });
    expect(
      (container.querySelector('.one-progress__bar') as HTMLElement).style.width
    ).toBe('0%');
  });

  it('exposes progressbar semantics and defaults invalid percent to zero', () => {
    component = new OneProgress({ percent: Number.NaN, ariaLabel: '下载进度' });
    component.mount(container);

    const root = container.querySelector('.one-progress');
    expect(root?.getAttribute('role')).toBe('progressbar');
    expect(root?.getAttribute('aria-valuemin')).toBe('0');
    expect(root?.getAttribute('aria-valuemax')).toBe('100');
    expect(root?.getAttribute('aria-valuenow')).toBe('0');
    expect(root?.getAttribute('aria-label')).toBe('下载进度');
  });

  it('shows a rounded percentage text when showText is enabled', () => {
    component = new OneProgress({ percent: 66.6, showText: true });
    component.mount(container);

    expect(
      container.querySelector('.one-progress__text')?.textContent
    ).toBe('67%');
  });

  it('applies the variant color class with a primary fallback', () => {
    component = new OneProgress({ percent: 50, variant: 'error' });
    component.mount(container);

    expect(
      container.querySelector('.one-progress__bar')?.className
    ).toContain('one-progress__bar--error');

    component.setProps({ variant: 'unknown' as 'primary' });
    expect(
      container.querySelector('.one-progress__bar')?.className
    ).toContain('one-progress__bar--primary');
  });
});
