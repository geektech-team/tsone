import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { OneTag } from '../lib/tag';

describe('OneTag', () => {
  let container: HTMLElement;
  let component: OneTag;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    component?.unmount();
    container.remove();
  });

  it('normalizes variant and size classes', () => {
    component = new OneTag({
      variant: 'success',
      size: 'lg',
      children: ['已发布'],
    });
    component.mount(container);

    expect(container.querySelector('.one-tag--success')).toBeTruthy();
    expect(container.querySelector('.one-tag--lg')?.textContent).toContain(
      '已发布'
    );
  });

  it('emits close once and leaves a stable hidden anchor', () => {
    component = new OneTag({ closable: true, children: ['可关闭'] });
    let closes = 0;
    component.on('close', () => {
      closes += 1;
    });
    component.mount(container);

    const close = container.querySelector(
      '.one-tag__close'
    ) as HTMLButtonElement;
    expect(close.getAttribute('aria-label')).toBe('关闭标签');
    close.click();
    close.click();

    expect(closes).toBe(1);
    expect(container.querySelector('[data-one-tag-anchor]')).toBeTruthy();
  });

  it('falls back from invalid runtime values', () => {
    component = new OneTag({
      variant: 'unknown' as 'neutral',
      size: 'xl' as 'md',
      children: ['回退'],
    });
    component.mount(container);

    expect(
      container.querySelector('.one-tag--neutral.one-tag--md')
    ).toBeTruthy();
  });
});
