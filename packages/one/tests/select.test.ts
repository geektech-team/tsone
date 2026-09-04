import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { OneSelect, type OneFieldValueEvent } from '../lib';

const options = [
  { value: 'beijing', label: '北京' },
  { label: '海外', options: [{ value: 'tokyo', label: '东京' }] },
  { value: 'disabled', label: '不可选', disabled: true },
] as const;

describe('OneSelect', () => {
  let container: HTMLElement;
  let component: OneSelect;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    component?.unmount();
    container.remove();
  });

  it('filters local options and retains multiple selections', () => {
    component = new OneSelect({ options, multiple: true, searchable: true });
    const changes: Array<OneFieldValueEvent<string[]>> = [];
    component.on('change', (payload) =>
      changes.push(payload as OneFieldValueEvent<string[]>)
    );
    component.mount(container);

    const trigger = container.querySelector('[role="combobox"]') as HTMLElement;
    trigger.dispatchEvent(new Event('click'));
    const search = container.querySelector(
      'input[type="search"]'
    ) as HTMLInputElement;
    search.value = '东京';
    search.dispatchEvent(new Event('input'));
    expect(container.textContent).toContain('东京');
    expect(container.textContent).not.toContain('北京');

    (container.querySelector('[role="option"]') as HTMLElement).dispatchEvent(
      new Event('click')
    );
    expect(changes[0].value).toEqual(['tokyo']);

    search.value = '';
    search.dispatchEvent(new Event('input'));
    [...container.querySelectorAll('[role="option"]')]
      .find((option) => option.textContent === '北京')
      ?.dispatchEvent(new Event('click'));
    expect(changes[1].value).toEqual(['beijing', 'tokyo']);
  });
  it('positions the menu as a fixed floating layer and closes on outside click', () => {
    component = new OneSelect({ options });
    component.mount(container);
    const trigger = container.querySelector(
      '[role="combobox"]'
    ) as HTMLElement;
    trigger.dispatchEvent(new Event('click'));
    const menu = container.querySelector('.one-select__menu') as HTMLElement;
    expect(menu.style.position).toBe('fixed');
    document.dispatchEvent(new Event('pointerdown'));
    expect(container.querySelector('.one-select__menu')).toBeNull();
  });
});
