import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import {
  OneMenu,
  normalizeOneMenuMode,
  type OneMenuOpenChangeEvent,
  type OneMenuSelectEvent,
} from '../lib';

const VERTICAL_ITEMS = [
  { value: 'overview', label: '概览' },
  {
    value: 'city',
    label: '城市',
    children: [
      { value: 'ranking', label: '排行榜' },
      { value: 'compare', label: '对比' },
    ],
  },
  { value: 'settings', label: '设置', disabled: true },
];

describe('OneMenu', () => {
  let container: HTMLElement;
  let component: OneMenu;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    component?.unmount();
    container.remove();
  });

  function root(): HTMLElement {
    const element = container.querySelector('.one-menu');
    if (!(element instanceof HTMLElement)) {
      throw new Error('Missing menu root');
    }
    return element;
  }

  function items(): HTMLButtonElement[] {
    return [
      ...container.querySelectorAll<HTMLButtonElement>('.one-menu__item'),
    ];
  }

  function itemByLabel(label: string): HTMLButtonElement {
    const button = items().find(
      (candidate) =>
        (candidate.textContent ?? '').replace(/[▸▾\s]/g, '') === label
    );
    if (!button) {
      throw new Error(`Missing menu item: ${label}`);
    }
    return button;
  }

  it('normalizes the menu mode with a vertical fallback', () => {
    expect(normalizeOneMenuMode('horizontal')).toBe('horizontal');
    expect(normalizeOneMenuMode('vertical')).toBe('vertical');
    expect(normalizeOneMenuMode('side')).toBe('vertical');
    expect(normalizeOneMenuMode(undefined)).toBe('vertical');
  });

  it('renders a vertical menu with labels and the selected state', () => {
    component = new OneMenu({
      items: VERTICAL_ITEMS,
      defaultValue: 'ranking',
      defaultOpen: ['city'],
    });
    component.mount(container);

    expect(root().className).toBe('one-menu one-menu--vertical');
    expect(root().getAttribute('role')).toBe('list');
    expect(root().getAttribute('aria-label')).toBe('菜单');
    expect(itemByLabel('概览').getAttribute('aria-current')).toBeNull();
    expect(itemByLabel('排行榜').getAttribute('aria-current')).toBe('true');
    expect(itemByLabel('设置').disabled).toBe(true);

    const trigger = itemByLabel('城市');
    expect(trigger.getAttribute('aria-expanded')).toBe('true');
    expect(container.querySelector('.one-menu__sub')).toBeTruthy();
  });

  it('selects an uncontrolled leaf and marks it with aria-current', () => {
    component = new OneMenu({ items: VERTICAL_ITEMS });
    const selects: Array<OneMenuSelectEvent> = [];
    component.on('select', (payload) =>
      selects.push(payload as OneMenuSelectEvent)
    );
    component.mount(container);

    itemByLabel('概览').click();
    expect(selects[0]?.value).toBe('overview');
    expect(selects[0]?.originalEvent).toBeInstanceOf(Event);
    expect(itemByLabel('概览').getAttribute('aria-current')).toBe('true');

    itemByLabel('概览').click();
    expect(selects).toHaveLength(1);
  });

  it('toggles a vertical submenu and emits openChange', () => {
    component = new OneMenu({ items: VERTICAL_ITEMS });
    const changes: Array<OneMenuOpenChangeEvent> = [];
    component.on('openChange', (payload) =>
      changes.push(payload as OneMenuOpenChangeEvent)
    );
    component.mount(container);

    const trigger = itemByLabel('城市');
    trigger.click();
    expect(trigger.getAttribute('aria-expanded')).toBe('true');
    expect(changes[0]?.value).toEqual(['city']);
    expect(container.querySelector('.one-menu__sub')).toBeTruthy();

    trigger.click();
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
    expect(changes[1]?.value).toEqual([]);
    expect(container.querySelector('.one-menu__sub')).toBeNull();
  });

  it('keeps only one submenu open in accordion mode', () => {
    component = new OneMenu({
      items: [
        { value: 'a', label: 'A', children: [{ value: 'a1', label: 'A1' }] },
        { value: 'b', label: 'B', children: [{ value: 'b1', label: 'B1' }] },
      ],
      accordion: true,
    });
    component.mount(container);

    itemByLabel('A').click();
    itemByLabel('B').click();

    expect(itemByLabel('A').getAttribute('aria-expanded')).toBe('false');
    expect(itemByLabel('B').getAttribute('aria-expanded')).toBe('true');
    expect(container.querySelectorAll('.one-menu__sub')).toHaveLength(1);
  });

  it('stays controlled for both selection and open state', () => {
    component = new OneMenu({
      items: VERTICAL_ITEMS,
      value: 'overview',
      open: ['city'],
    });
    const selects: Array<OneMenuSelectEvent> = [];
    const changes: Array<OneMenuOpenChangeEvent> = [];
    component.on('select', (payload) =>
      selects.push(payload as OneMenuSelectEvent)
    );
    component.on('openChange', (payload) =>
      changes.push(payload as OneMenuOpenChangeEvent)
    );
    component.mount(container);

    itemByLabel('排行榜').click();
    expect(selects[0]?.value).toBe('ranking');
    expect(itemByLabel('概览').getAttribute('aria-current')).toBe('true');

    itemByLabel('城市').click();
    expect(changes[0]?.value).toEqual([]);
    expect(container.querySelector('.one-menu__sub')).toBeTruthy();
  });

  it('ignores clicks on disabled items', () => {
    component = new OneMenu({ items: VERTICAL_ITEMS });
    const selects: Array<OneMenuSelectEvent> = [];
    component.on('select', (payload) =>
      selects.push(payload as OneMenuSelectEvent)
    );
    component.mount(container);

    itemByLabel('设置').click();
    expect(selects).toHaveLength(0);
  });

  it('moves focus with arrow keys, Home and End', () => {
    component = new OneMenu({
      items: [
        { value: 'a', label: 'A' },
        { value: 'b', label: 'B' },
        { value: 'c', label: 'C' },
      ],
    });
    component.mount(container);

    itemByLabel('A').focus();
    root().dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true })
    );
    expect(document.activeElement).toBe(itemByLabel('B'));

    root().dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true })
    );
    expect(document.activeElement).toBe(itemByLabel('C'));

    root().dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true })
    );
    expect(document.activeElement).toBe(itemByLabel('B'));

    root().dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Home', bubbles: true })
    );
    expect(document.activeElement).toBe(itemByLabel('A'));

    root().dispatchEvent(
      new KeyboardEvent('keydown', { key: 'End', bubbles: true })
    );
    expect(document.activeElement).toBe(itemByLabel('C'));
  });

  it('skips disabled items while moving focus', () => {
    component = new OneMenu({ items: VERTICAL_ITEMS });
    component.mount(container);

    itemByLabel('概览').focus();
    root().dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true })
    );
    expect(document.activeElement).toBe(itemByLabel('城市'));

    root().dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true })
    );
    expect(document.activeElement).toBe(itemByLabel('概览'));
  });

  it('opens a horizontal dropdown, selects a leaf and closes it', () => {
    component = new OneMenu({ items: VERTICAL_ITEMS, mode: 'horizontal' });
    const selects: Array<OneMenuSelectEvent> = [];
    const changes: Array<OneMenuOpenChangeEvent> = [];
    component.on('select', (payload) =>
      selects.push(payload as OneMenuSelectEvent)
    );
    component.on('openChange', (payload) =>
      changes.push(payload as OneMenuOpenChangeEvent)
    );
    component.mount(container);

    expect(root().className).toContain('one-menu--horizontal');

    itemByLabel('城市').click();
    expect(changes[0]?.value).toEqual(['city']);
    const dropdown = container.querySelector('.one-menu__dropdown');
    expect(dropdown).toBeTruthy();
    expect(dropdown?.getAttribute('role')).toBe('group');

    itemByLabel('排行榜').click();
    expect(selects[0]?.value).toBe('ranking');
    expect(changes[1]?.value).toEqual([]);
    expect(container.querySelector('.one-menu__dropdown')).toBeNull();
  });

  it('closes a horizontal dropdown on an outside pointerdown', () => {
    component = new OneMenu({ items: VERTICAL_ITEMS, mode: 'horizontal' });
    const changes: Array<OneMenuOpenChangeEvent> = [];
    component.on('openChange', (payload) =>
      changes.push(payload as OneMenuOpenChangeEvent)
    );
    component.mount(container);

    itemByLabel('城市').click();
    expect(container.querySelector('.one-menu__dropdown')).toBeTruthy();

    document.dispatchEvent(new Event('pointerdown', { bubbles: true }));
    expect(changes[1]?.value).toEqual([]);
    expect(container.querySelector('.one-menu__dropdown')).toBeNull();
  });

  it('drops invalid items and renders an empty list when no items remain', () => {
    component = new OneMenu({
      items: [
        { value: 'ok', label: '有效' },
        { value: '', label: '空值' },
        { value: 'dup', label: '第一' },
        { value: 'dup', label: '重复' },
        { label: '缺 value' } as { value: string; label: string },
      ],
    });
    component.mount(container);

    expect(items()).toHaveLength(2);
    expect(itemByLabel('有效').textContent).toBe('有效');

    component.unmount();
    component = new OneMenu({ items: [] });
    component.mount(container);
    expect(items()).toHaveLength(0);
  });
});
