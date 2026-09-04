import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import {
  OneSteps,
  resolveOneStepsStatus,
  type OneStepsItem,
} from '../lib';

const items: OneStepsItem[] = [
  { title: '填写信息' },
  { title: '确认订单', description: '核对收货地址' },
  { title: '完成支付' },
];

describe('OneSteps', () => {
  let container: HTMLElement;
  let component: OneSteps | undefined;

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

  it('renders one ordered list item per step with titles', () => {
    component = new OneSteps({ items });
    component.mount(container);

    const list = container.querySelector('.one-steps') as HTMLElement;
    expect(list.tagName).toBe('OL');
    expect(container.querySelectorAll('.one-steps__item').length).toBe(3);
    expect(container.querySelector('.one-steps__title')?.textContent).toBe(
      '填写信息'
    );
  });

  it('derives wait, process and finish states from current', () => {
    component = new OneSteps({ items, current: 1 });
    component.mount(container);

    const states = Array.from(
      container.querySelectorAll('.one-steps__item')
    ).map((item) => item.className);
    expect(states[0]).toContain('one-steps__item--finish');
    expect(states[1]).toContain('one-steps__item--process');
    expect(states[2]).toContain('one-steps__item--wait');
    expect(container.querySelector('.one-steps__item--finish .one-steps__icon')
      ?.textContent).toBe('✓');
  });

  it('honours an explicit status override and renders descriptions', () => {
    component = new OneSteps({
      items: [
        { title: 'a', status: 'error' },
        { title: 'b' },
      ],
    });
    component.mount(container);

    expect(
      container.querySelector('.one-steps__item')?.className
    ).toContain('one-steps__item--error');
    expect(container.querySelector('.one-steps__item--error .one-steps__icon')
      ?.textContent).toBe('!');
  });

  it('renders a vertical layout when requested', () => {
    component = new OneSteps({ items, direction: 'vertical' });
    component.mount(container);

    expect(
      (container.querySelector('.one-steps') as HTMLElement).className
    ).toContain('one-steps--vertical');
  });

  it('resolves status independently of render', () => {
    expect(resolveOneStepsStatus(items[0], 0, 0)).toBe('process');
    expect(resolveOneStepsStatus(items[0], 1, 0)).toBe('finish');
    expect(resolveOneStepsStatus(items[0], 0, 1)).toBe('wait');
    expect(
      resolveOneStepsStatus({ title: 'x', status: 'error' }, 0, 0)
    ).toBe('error');
  });
});
