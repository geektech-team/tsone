import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { OneRate, type OneRateValueEvent } from '../lib';

describe('OneRate', () => {
  let container: HTMLElement;
  let component: OneRate;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    component?.unmount();
    container.remove();
  });

  it('renders a radiogroup with the configured number of stars', () => {
    component = new OneRate({ defaultValue: 3, count: 5, ariaLabel: '评分' });
    component.mount(container);

    const group = container.querySelector('.one-rate') as HTMLElement;
    expect(group.getAttribute('role')).toBe('radiogroup');
    expect(group.getAttribute('aria-label')).toBe('评分');
    const stars = container.querySelectorAll('.one-rate__star');
    expect(stars).toHaveLength(5);
    expect(stars[0].className).toContain('one-rate__star--filled');
    expect(stars[2].className).toContain('one-rate__star--filled');
    expect(stars[3].className).not.toContain('one-rate__star--filled');
    expect(stars[0].getAttribute('aria-checked')).toBe('true');
    expect(stars[3].getAttribute('aria-checked')).toBe('false');
    expect(stars[0].textContent).toBe('★');
    expect(stars[4].textContent).toBe('★');
  });

  it('emits a change and updates an uncontrolled value', () => {
    component = new OneRate({ defaultValue: 0 });
    const changes: Array<OneRateValueEvent> = [];
    component.on('change', (payload) =>
      changes.push(payload as OneRateValueEvent)
    );
    component.mount(container);

    const stars = container.querySelectorAll('.one-rate__star');
    (stars[3] as HTMLButtonElement).click();

    expect(changes[0].value).toBe(4);
    const refilled = container.querySelectorAll('.one-rate__star');
    expect(refilled[3].className).toContain('one-rate__star--filled');
  });

  it('clears the current rating when allowClear and clicking the same star', () => {
    component = new OneRate({ defaultValue: 4, allowClear: true });
    const changes: Array<OneRateValueEvent> = [];
    component.on('change', (payload) =>
      changes.push(payload as OneRateValueEvent)
    );
    component.mount(container);

    const stars = container.querySelectorAll('.one-rate__star');
    (stars[3] as HTMLButtonElement).click();

    expect(changes[0].value).toBe(0);
  });

  it('keeps a controlled value after interaction', () => {
    component = new OneRate({ value: 2 });
    const changes: Array<OneRateValueEvent> = [];
    component.on('change', (payload) =>
      changes.push(payload as OneRateValueEvent)
    );
    component.mount(container);

    const stars = container.querySelectorAll('.one-rate__star');
    (stars[4] as HTMLButtonElement).click();

    expect(changes[0].value).toBe(5);
    expect(stars[1].className).toContain('one-rate__star--filled');
    expect(stars[2].className).not.toContain('one-rate__star--filled');
  });

  it('ignores clicks when disabled and marks readonly', () => {
    component = new OneRate({ value: 3, disabled: true });
    const changes: Array<OneRateValueEvent> = [];
    component.on('change', (payload) =>
      changes.push(payload as OneRateValueEvent)
    );
    component.mount(container);
    (container.querySelectorAll('.one-rate__star')[4] as HTMLButtonElement).click();
    expect(changes).toHaveLength(0);
    component.unmount();

    component = new OneRate({ value: 3, readonly: true });
    component.mount(container);
    expect(container.querySelector('.one-rate')?.className).toContain(
      'one-rate--readonly'
    );
    (container.querySelectorAll('.one-rate__star')[4] as HTMLButtonElement).click();
    expect(changes).toHaveLength(0);
  });
});
