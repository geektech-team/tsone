import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { OneSpace } from '../lib';

describe('OneSpace', () => {
  let container: HTMLElement;
  let component: OneSpace | undefined;

  beforeEach(() => {
    document.body.innerHTML = '';
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    component?.unmount();
    component = undefined;
    container.remove();
  });

  it('renders a horizontal space and wraps each child in an item', () => {
    component = new OneSpace({ children: ['a', 'b', 'c'] });
    component.mount(container);

    const space = container.querySelector('.one-space') as HTMLElement;
    expect(space.className).toContain('one-space--horizontal');
    expect(space.style.gap).toBeTruthy();
    const items = container.querySelectorAll('.one-space__item');
    expect(items.length).toBe(3);
    expect(items[0].textContent).toBe('a');
  });

  it('applies vertical, wrap and align modifiers', () => {
    component = new OneSpace({
      direction: 'vertical',
      wrap: true,
      align: 'center',
      children: ['x'],
    });
    component.mount(container);

    const space = container.querySelector('.one-space') as HTMLElement;
    expect(space.className).toContain('one-space--vertical');
    expect(space.className).toContain('one-space--wrap');
    expect(space.style.alignItems).toBe('center');
  });

  it('maps a numeric size to pixels and token size to a CSS variable', () => {
    component = new OneSpace({ size: 20, children: ['x'] });
    component.mount(container);
    expect(
      (container.querySelector('.one-space') as HTMLElement).style.gap
    ).toBe('20px');
    component.unmount();
    component = undefined;

    component = new OneSpace({ size: 'sm', children: ['x'] });
    component.mount(container);
    expect(
      (container.querySelector('.one-space') as HTMLElement).style.gap
    ).toContain('var(--one-space-sm');
  });
});
