import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { OneTimePicker, type OneTimePickerValueEvent } from '../lib';

describe('OneTimePicker', () => {
  let container: HTMLElement;
  let component: OneTimePicker;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    component?.unmount();
    container.remove();
  });

  function input(): HTMLInputElement {
    return container.querySelector('input') as HTMLInputElement;
  }

  function open(): void {
    input().dispatchEvent(new Event('click'));
  }

  function columns(): HTMLElement[] {
    return Array.from(
      container.querySelectorAll('.one-time-picker__column')
    );
  }

  it('renders an editable text input with the default value', () => {
    component = new OneTimePicker({
      defaultValue: '09:30',
      ariaLabel: '开始时间',
    });
    component.mount(container);

    expect(input().type).toBe('text');
    expect(input().value).toBe('09:30');
    expect(input().getAttribute('aria-label')).toBe('开始时间');
  });

  it('opens the dropdown on click and closes it on Escape', () => {
    component = new OneTimePicker({ defaultValue: '09:30' });
    component.mount(container);

    expect(container.querySelector('.one-time-picker__panel')).toBeNull();

    open();
    expect(input().getAttribute('aria-expanded')).toBe('true');
    expect(container.querySelector('.one-time-picker__panel')).toBeTruthy();

    input().dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(container.querySelector('.one-time-picker__panel')).toBeNull();
    expect(input().getAttribute('aria-expanded')).toBe('false');
  });

  it('selects a minute and closes the panel', () => {
    component = new OneTimePicker({ defaultValue: '09:30' });
    const changes: Array<OneTimePickerValueEvent> = [];
    component.on('change', (payload) =>
      changes.push(payload as OneTimePickerValueEvent)
    );
    component.mount(container);

    open();
    const minuteOptions = columns()[1].querySelectorAll(
      '.one-time-picker__option'
    );
    minuteOptions[1].dispatchEvent(new Event('click'));

    expect(input().value).toBe('09:01');
    expect(changes[0].value).toBe('09:01');
    expect(container.querySelector('.one-time-picker__panel')).toBeNull();
  });

  it('selects an hour and keeps the panel open', () => {
    component = new OneTimePicker({ defaultValue: '09:30' });
    component.mount(container);

    open();
    const hourOptions = columns()[0].querySelectorAll(
      '.one-time-picker__option'
    );
    hourOptions[10].dispatchEvent(new Event('click'));

    expect(input().value).toBe('10:30');
    expect(container.querySelector('.one-time-picker__panel')).toBeTruthy();
  });

  it('emits input and change values on text entry', () => {
    component = new OneTimePicker({ defaultValue: '09:30' });
    const changes: Array<OneTimePickerValueEvent> = [];
    component.on('change', (payload) =>
      changes.push(payload as OneTimePickerValueEvent)
    );
    component.mount(container);

    input().value = '10:15';
    input().dispatchEvent(new Event('change'));

    expect(changes[0].value).toBe('10:15');
  });

  it('keeps a controlled value and restores it after a change', () => {
    component = new OneTimePicker({ value: '08:00' });
    component.mount(container);

    input().value = '11:00';
    input().dispatchEvent(new Event('change'));

    expect(input().value).toBe('08:00');
  });

  it('shows a seconds column for sub-minute steps', () => {
    component = new OneTimePicker({ defaultValue: '09:30:15', step: 1 });
    component.mount(container);

    open();
    expect(columns()).toHaveLength(3);
  });

  it('restricts the hour range with min and max', () => {
    component = new OneTimePicker({ min: '08:00', max: '18:00' });
    component.mount(container);

    open();
    const hourOptions = columns()[0].querySelectorAll(
      '.one-time-picker__option'
    );
    expect(hourOptions).toHaveLength(11);
    expect(hourOptions[0].textContent).toBe('08');
    expect(hourOptions[10].textContent).toBe('18');
  });

  it('does not open the panel when disabled', () => {
    component = new OneTimePicker({ disabled: true, defaultValue: '09:30' });
    component.mount(container);

    open();
    expect(container.querySelector('.one-time-picker__panel')).toBeNull();
  });

  it('does not open the panel when readonly', () => {
    component = new OneTimePicker({ readonly: true, defaultValue: '09:30' });
    component.mount(container);

    open();
    expect(container.querySelector('.one-time-picker__panel')).toBeNull();
  });
});
