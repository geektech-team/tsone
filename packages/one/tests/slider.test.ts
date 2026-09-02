import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { OneSlider, type OneSliderValueEvent } from '../lib';

describe('OneSlider', () => {
  let container: HTMLElement;
  let component: OneSlider;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    component?.unmount();
    container.remove();
  });

  it('renders a range input with min, max, step and value', () => {
    component = new OneSlider({
      value: 75,
      min: 0,
      max: 100,
      step: 5,
      ariaLabel: '音量',
    });
    component.mount(container);

    const input = container.querySelector('input') as HTMLInputElement;
    expect(input.type).toBe('range');
    expect(input.min).toBe('0');
    expect(input.max).toBe('100');
    expect(input.step).toBe('5');
    expect(input.value).toBe('75');
    expect(input.getAttribute('aria-label')).toBe('音量');
    expect(input.getAttribute('aria-valuenow')).toBe('75');
  });

  it('clamps an out-of-range default into the slider bounds', () => {
    component = new OneSlider({ defaultValue: 120, min: 0, max: 100 });
    component.mount(container);

    expect((container.querySelector('input') as HTMLInputElement).value).toBe(
      '100'
    );
  });

  it('emits a clamped change and updates an uncontrolled value', () => {
    component = new OneSlider({
      defaultValue: 10,
      min: 0,
      max: 50,
      showValue: true,
    });
    const changes: Array<OneSliderValueEvent> = [];
    component.on('change', (payload) =>
      changes.push(payload as OneSliderValueEvent)
    );
    component.mount(container);

    const input = container.querySelector('input') as HTMLInputElement;
    input.value = '40';
    input.dispatchEvent(new Event('change'));

    expect(changes[0].value).toBe(40);
    const updated = container.querySelector('input') as HTMLInputElement;
    expect(updated.value).toBe('40');
    expect(container.querySelector('.one-slider__value')?.textContent).toBe(
      '40'
    );
  });

  it('reports an interaction value while staying controlled', () => {
    component = new OneSlider({ value: 20, min: 0, max: 100 });
    const changes: Array<OneSliderValueEvent> = [];
    component.on('change', (payload) =>
      changes.push(payload as OneSliderValueEvent)
    );
    component.mount(container);

    const input = container.querySelector('input') as HTMLInputElement;
    input.value = '80';
    input.dispatchEvent(new Event('change'));

    expect(changes[0].value).toBe(80);
    // 受控组件不自改内部状态，DOM 保留交互值，等待父级按新的 value 重渲染。
    expect(input.value).toBe('80');
  });

  it('disables the input and marks the wrapper', () => {
    component = new OneSlider({ disabled: true });
    component.mount(container);

    expect((container.querySelector('input') as HTMLInputElement).disabled).toBe(
      true
    );
    expect(container.querySelector('.one-slider')?.className).toContain(
      'one-slider--disabled'
    );
  });
});
