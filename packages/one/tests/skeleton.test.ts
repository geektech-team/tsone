import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { OneSkeleton } from '../lib';

describe('OneSkeleton', () => {
  let container: HTMLElement;
  let component: OneSkeleton;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    component?.unmount();
    container.remove();
  });

  it('renders title, avatar and rows as aria-hidden placeholders', () => {
    component = new OneSkeleton({
      rows: 3,
      title: true,
      avatar: true,
      ariaLabel: '内容加载中',
    });
    component.mount(container);

    const root = container.querySelector('.one-skeleton') as HTMLElement;
    expect(root.getAttribute('role')).toBe('status');
    expect(root.getAttribute('aria-busy')).toBe('true');
    expect(root.getAttribute('aria-label')).toBe('内容加载中');
    expect(root.querySelectorAll('.one-skeleton__title')).toHaveLength(1);
    expect(root.querySelectorAll('.one-skeleton__avatar')).toHaveLength(1);
    expect(root.querySelectorAll('.one-skeleton__line')).toHaveLength(3);
    expect(
      root.querySelector('.one-skeleton__avatar')?.getAttribute('aria-hidden')
    ).toBe('true');
    expect(
      root.querySelector('.one-skeleton__title')?.getAttribute('aria-hidden')
    ).toBe('true');
    expect(
      root
        .querySelector('.one-skeleton__paragraph')
        ?.getAttribute('aria-hidden')
    ).toBe('true');
  });

  it('applies the animated modifier by default and drops it when disabled', () => {
    component = new OneSkeleton();
    component.mount(container);
    expect(container.querySelector('.one-skeleton')?.className).toContain(
      'one-skeleton--animated'
    );
    component.unmount();

    component = new OneSkeleton({ animated: false });
    component.mount(container);
    expect(container.querySelector('.one-skeleton')?.className).not.toContain(
      'one-skeleton--animated'
    );
  });

  it('honors widths and omits title and avatar when disabled', () => {
    component = new OneSkeleton({
      rows: 2,
      title: false,
      avatar: false,
      widths: ['80%', '50%'],
    });
    component.mount(container);

    const root = container.querySelector('.one-skeleton') as HTMLElement;
    expect(root.querySelectorAll('.one-skeleton__title')).toHaveLength(0);
    expect(root.querySelectorAll('.one-skeleton__avatar')).toHaveLength(0);
    const lines = root.querySelectorAll('.one-skeleton__line');
    expect(lines).toHaveLength(2);
    expect((lines[0] as HTMLElement).style.width).toBe('80%');
    expect((lines[1] as HTMLElement).style.width).toBe('50%');
  });
});
