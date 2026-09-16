import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { OneCarousel, type OneCarouselChangeEvent } from '../lib';

const ITEMS = [
  { src: '/a.png', alt: '第一张', caption: 'A' },
  { src: '/b.png', alt: '第二张' },
  { src: '/c.png', caption: 'C' },
];

function wait(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

describe('OneCarousel', () => {
  let container: HTMLElement;
  let component: OneCarousel;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    component?.unmount();
    container.remove();
  });

  function root(): HTMLElement {
    const element = container.querySelector('.one-carousel');
    if (!(element instanceof HTMLElement)) {
      throw new Error('Missing carousel root');
    }
    return element;
  }

  function track(): HTMLElement {
    const element = container.querySelector('.one-carousel__track');
    if (!(element instanceof HTMLElement)) {
      throw new Error('Missing carousel track');
    }
    return element;
  }

  function arrows(): NodeListOf<HTMLButtonElement> {
    return container.querySelectorAll('.one-carousel__arrow');
  }

  function dots(): NodeListOf<HTMLButtonElement> {
    return container.querySelectorAll('.one-carousel__dot');
  }

  function clickNext(): void {
    const next = [...arrows()].find(
      (button) => button.getAttribute('aria-label') === '下一张'
    );
    if (!next) {
      throw new Error('Missing next arrow');
    }
    next.click();
  }

  function clickDot(index: number): void {
    const dot = dots()[index];
    if (!dot) {
      throw new Error(`Missing dot ${index}`);
    }
    dot.click();
  }

  it('renders slides with images, captions and the first slide visible', () => {
    component = new OneCarousel({ items: ITEMS });
    component.mount(container);

    expect(root().getAttribute('role')).toBe('region');
    expect(root().getAttribute('aria-roledescription')).toBe('carousel');
    expect(root().getAttribute('aria-label')).toBe('图片轮播');
    expect(root().style.height).toBe('240px');

    const slides = container.querySelectorAll('.one-carousel__slide');
    expect(slides).toHaveLength(3);
    const images = container.querySelectorAll('.one-carousel__image');
    expect([...images].map((image) => image.getAttribute('src'))).toEqual([
      '/a.png',
      '/b.png',
      '/c.png',
    ]);
    expect(images[0]?.getAttribute('alt')).toBe('第一张');
    expect(images[0]?.getAttribute('draggable')).toBe('false');

    expect(track().style.transform).toBe('translateX(-0%)');
    expect(slides[0]?.getAttribute('aria-hidden')).toBeNull();
    expect(slides[1]?.getAttribute('aria-hidden')).toBe('true');
    expect(slides[2]?.getAttribute('aria-hidden')).toBe('true');
    expect(
      container.querySelector('.one-carousel__caption')?.textContent
    ).toBe('A');
  });

  it('moves to the next and previous slide and emits change', () => {
    component = new OneCarousel({ items: ITEMS });
    const changes: Array<OneCarouselChangeEvent> = [];
    component.on('change', (payload) =>
      changes.push(payload as OneCarouselChangeEvent)
    );
    component.mount(container);

    clickNext();
    expect(track().style.transform).toBe('translateX(-100%)');
    expect(changes[0]?.value).toBe(1);
    const slides = container.querySelectorAll('.one-carousel__slide');
    expect(slides[1]?.getAttribute('aria-hidden')).toBeNull();
    expect(slides[0]?.getAttribute('aria-hidden')).toBe('true');

    const prev = [...arrows()].find(
      (button) => button.getAttribute('aria-label') === '上一张'
    );
    if (!prev) {
      throw new Error('Missing prev arrow');
    }
    prev.click();
    expect(track().style.transform).toBe('translateX(-0%)');
    expect(changes[1]?.value).toBe(0);
  });

  it('navigates with indicator dots and marks the active dot', () => {
    component = new OneCarousel({ items: ITEMS });
    component.mount(container);

    expect(dots()).toHaveLength(3);
    expect(dots()[0]?.getAttribute('aria-current')).toBe('true');
    clickDot(2);
    expect(track().style.transform).toBe('translateX(-200%)');
    expect(dots()[2]?.getAttribute('aria-current')).toBe('true');
    expect(dots()[0]?.getAttribute('aria-current')).toBeNull();
  });

  it('keeps arrows enabled in loop mode and wraps around', () => {
    component = new OneCarousel({ items: ITEMS, defaultValue: 0 });
    component.mount(container);

    const prev = [...arrows()].find(
      (button) => button.getAttribute('aria-label') === '上一张'
    );
    if (!prev) {
      throw new Error('Missing prev arrow');
    }
    prev.click();
    expect(track().style.transform).toBe('translateX(-200%)');
  });

  it('disables boundary arrows and stops navigation when loop is off', () => {
    component = new OneCarousel({ items: ITEMS, defaultValue: 2, loop: false });
    const changes: Array<OneCarouselChangeEvent> = [];
    component.on('change', (payload) =>
      changes.push(payload as OneCarouselChangeEvent)
    );
    component.mount(container);

    const prev = [...arrows()].find(
      (button) => button.getAttribute('aria-label') === '上一张'
    );
    const next = [...arrows()].find(
      (button) => button.getAttribute('aria-label') === '下一张'
    );
    expect(next?.disabled).toBe(true);
    expect(prev?.disabled).toBe(false);

    next?.click();
    expect(changes).toHaveLength(0);
    expect(track().style.transform).toBe('translateX(-200%)');
  });

  it('honors an uncontrolled default slide', () => {
    component = new OneCarousel({ items: ITEMS, defaultValue: 1 });
    component.mount(container);

    expect(track().style.transform).toBe('translateX(-100%)');
    expect(dots()[1]?.getAttribute('aria-current')).toBe('true');
  });

  it('stays controlled and leaves the DOM value to the parent', () => {
    component = new OneCarousel({ items: ITEMS, value: 1 });
    const changes: Array<OneCarouselChangeEvent> = [];
    component.on('change', (payload) =>
      changes.push(payload as OneCarouselChangeEvent)
    );
    component.mount(container);

    clickNext();
    expect(changes[0]?.value).toBe(2);
    expect(track().style.transform).toBe('translateX(-100%)');
  });

  it('autoplays to the last slide and stops when loop is off', async () => {
    component = new OneCarousel({
      items: ITEMS,
      autoplay: true,
      loop: false,
      interval: 20,
    });
    const changes: Array<OneCarouselChangeEvent> = [];
    component.on('change', (payload) =>
      changes.push(payload as OneCarouselChangeEvent)
    );
    component.mount(container);

    await wait(130);
    expect(track().style.transform).toBe('translateX(-200%)');
    expect(changes.length).toBeGreaterThanOrEqual(2);

    const settled = changes.length;
    await wait(80);
    expect(changes).toHaveLength(settled);
  });

  it('pauses autoplay while hovered and resumes on leave', async () => {
    component = new OneCarousel({
      items: ITEMS,
      autoplay: true,
      interval: 20,
    });
    const changes: Array<OneCarouselChangeEvent> = [];
    component.on('change', (payload) =>
      changes.push(payload as OneCarouselChangeEvent)
    );
    component.mount(container);

    root().dispatchEvent(new Event('pointerenter'));
    await wait(90);
    expect(changes).toHaveLength(0);

    root().dispatchEvent(new Event('pointerleave'));
    await wait(90);
    expect(changes.length).toBeGreaterThanOrEqual(1);
  });

  it('navigates with arrow keys, Home and End on the region', () => {
    component = new OneCarousel({ items: ITEMS });
    component.mount(container);

    root().dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true })
    );
    expect(track().style.transform).toBe('translateX(-100%)');

    root().dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true })
    );
    expect(track().style.transform).toBe('translateX(-0%)');

    root().dispatchEvent(
      new KeyboardEvent('keydown', { key: 'End', bubbles: true })
    );
    expect(track().style.transform).toBe('translateX(-200%)');

    root().dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Home', bubbles: true })
    );
    expect(track().style.transform).toBe('translateX(-0%)');
  });

  it('ignores key events that do not originate on the region', () => {
    component = new OneCarousel({ items: ITEMS });
    component.mount(container);

    const slide = container.querySelector('.one-carousel__slide');
    slide?.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true })
    );
    expect(track().style.transform).toBe('translateX(-0%)');
  });

  it('omits controls and keyboard focus for a single slide', () => {
    component = new OneCarousel({ items: [{ src: '/only.png' }] });
    component.mount(container);

    expect(arrows()).toHaveLength(0);
    expect(dots()).toHaveLength(0);
    expect(root().getAttribute('tabindex')).toBeNull();
  });

  it('drops invalid items and renders an empty track for no items', () => {
    component = new OneCarousel({
      items: [
        { src: '/ok.png' },
        { src: '' },
        { caption: '无图' } as { src: string; caption?: string },
      ],
    });
    component.mount(container);

    expect(container.querySelectorAll('.one-carousel__image')).toHaveLength(1);

    component.unmount();
    component = new OneCarousel({ items: [] });
    component.mount(container);
    expect(container.querySelectorAll('.one-carousel__slide')).toHaveLength(0);
    expect(arrows()).toHaveLength(0);
    expect(dots()).toHaveLength(0);
  });
});
