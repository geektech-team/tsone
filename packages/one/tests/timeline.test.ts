import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { OneTimeline, type OneTimelineItem } from '../lib';

const items: OneTimelineItem[] = [
  { title: '创建订单', time: '2026-09-01 10:00', content: '订单已创建' },
  { title: '已发货', color: 'success' },
];

describe('OneTimeline', () => {
  let container: HTMLElement;
  let component: OneTimeline | undefined;

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

  it('renders a list with a dot, title, time and description per item', () => {
    component = new OneTimeline({ items });
    component.mount(container);

    const list = container.querySelector('.one-timeline') as HTMLElement;
    expect(list.tagName).toBe('UL');
    expect(container.querySelectorAll('.one-timeline__item').length).toBe(2);
    expect(container.querySelector('.one-timeline__title')?.textContent).toContain(
      '创建订单'
    );
    expect(container.querySelector('.one-timeline__time')?.textContent).toBe(
      '2026-09-01 10:00'
    );
    expect(container.querySelector('.one-timeline__desc')?.textContent).toBe(
      '订单已创建'
    );
  });

  it('applies a dot color class and a default primary color', () => {
    component = new OneTimeline({ items });
    component.mount(container);

    const dots = container.querySelectorAll('.one-timeline__dot');
    expect((dots[0] as HTMLElement).className).toContain(
      'one-timeline__dot--primary'
    );
    expect((dots[1] as HTMLElement).className).toContain(
      'one-timeline__dot--success'
    );
  });

  it('keeps a connecting rail on every item', () => {
    component = new OneTimeline({ items });
    component.mount(container);

    expect(container.querySelectorAll('.one-timeline__rail').length).toBe(2);
  });
});
