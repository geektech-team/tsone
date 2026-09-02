import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { OneCollapse, type OneCollapseChangeEvent } from '../lib';

describe('OneCollapse', () => {
  let container: HTMLElement;
  let component: OneCollapse;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    component?.unmount();
    container.remove();
  });

  it('renders items with the default active panel expanded', () => {
    component = new OneCollapse({
      defaultActive: ['basic'],
      items: [
        { value: 'basic', title: '基础用法', children: ['内容'] },
        { value: 'advanced', title: '高级用法', children: ['更多'] },
      ],
    });
    component.mount(container);

    const items = container.querySelectorAll('.one-collapse__item');
    expect(items).toHaveLength(2);
    expect(items[0].className).toContain('one-collapse__item--open');
    expect(items[1].className).not.toContain('one-collapse__item--open');
    const headers = container.querySelectorAll('.one-collapse__header');
    expect(headers[0].getAttribute('aria-expanded')).toBe('true');
    expect(headers[1].getAttribute('aria-expanded')).toBe('false');
    const panels = container.querySelectorAll('.one-collapse__panel');
    expect((panels[0] as HTMLElement).hidden).toBe(false);
    expect((panels[1] as HTMLElement).hidden).toBe(true);
    expect(panels[0].getAttribute('role')).toBe('region');
  });

  it('expands and collapses panels in a non-accordion mode', () => {
    component = new OneCollapse({
      items: [
        { value: 'a', title: 'A', children: ['AA'] },
        { value: 'b', title: 'B', children: ['BB'] },
      ],
    });
    const changes: Array<OneCollapseChangeEvent> = [];
    component.on('change', (payload) =>
      changes.push(payload as OneCollapseChangeEvent)
    );
    component.mount(container);

    let headers = container.querySelectorAll('.one-collapse__header');
    (headers[0] as HTMLButtonElement).click();
    expect(changes[0].value).toEqual(['a']);
    headers = container.querySelectorAll('.one-collapse__header');
    (headers[1] as HTMLButtonElement).click();
    expect(changes[1].value).toEqual(['a', 'b']);
    headers = container.querySelectorAll('.one-collapse__header');
    (headers[0] as HTMLButtonElement).click();
    expect(changes[2].value).toEqual(['b']);
  });

  it('keeps a single panel open in accordion mode', () => {
    component = new OneCollapse({
      accordion: true,
      defaultActive: ['a'],
      items: [
        { value: 'a', title: 'A', children: ['AA'] },
        { value: 'b', title: 'B', children: ['BB'] },
      ],
    });
    const changes: Array<OneCollapseChangeEvent> = [];
    component.on('change', (payload) =>
      changes.push(payload as OneCollapseChangeEvent)
    );
    component.mount(container);

    const headers = container.querySelectorAll('.one-collapse__header');
    (headers[1] as HTMLButtonElement).click();

    expect(changes[0].value).toEqual(['b']);
    const items = container.querySelectorAll('.one-collapse__item');
    expect(items[0].className).not.toContain('one-collapse__item--open');
    expect(items[1].className).toContain('one-collapse__item--open');
  });

  it('keeps a controlled active list and ignores disabled items', () => {
    component = new OneCollapse({
      active: ['a'],
      items: [
        { value: 'a', title: 'A', children: ['AA'] },
        { value: 'b', title: 'B', disabled: true, children: ['BB'] },
      ],
    });
    const changes: Array<OneCollapseChangeEvent> = [];
    component.on('change', (payload) =>
      changes.push(payload as OneCollapseChangeEvent)
    );
    component.mount(container);

    const headers = container.querySelectorAll('.one-collapse__header');
    expect((headers[1] as HTMLButtonElement).disabled).toBe(true);
    (headers[1] as HTMLButtonElement).click();
    expect(changes).toHaveLength(0);
    (headers[0] as HTMLButtonElement).click();
    expect(changes[0].value).toEqual([]);
    const items = container.querySelectorAll('.one-collapse__item');
    expect(items[0].className).toContain('one-collapse__item--open');
  });
});
