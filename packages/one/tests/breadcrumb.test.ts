import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { OneBreadcrumb, type OneBreadcrumbClickEvent } from '../lib/breadcrumb';

describe('OneBreadcrumb', () => {
  let container: HTMLElement;
  let component: OneBreadcrumb;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    component?.unmount();
    container.remove();
  });

  it('renders native hierarchy, one current item and default separators', () => {
    component = new OneBreadcrumb({
      ariaLabel: '项目路径',
      items: [
        { label: '首页', href: '/' },
        { label: '项目', href: '/projects', current: true },
        { label: '详情', current: true },
      ],
    });
    component.mount(container);

    expect(container.querySelector('nav')?.getAttribute('aria-label')).toBe(
      '项目路径'
    );
    expect(container.querySelectorAll('ol > li')).toHaveLength(3);
    expect(container.querySelectorAll('[aria-current="page"]')).toHaveLength(1);
    expect(container.querySelector('[aria-current="page"]')?.textContent).toBe(
      '项目'
    );
    expect(
      container.querySelectorAll('.one-breadcrumb__separator')
    ).toHaveLength(2);
  });

  it('emits a cancellable itemClick before native navigation', () => {
    component = new OneBreadcrumb({
      items: [{ label: '首页', href: '/home' }, { label: '当前' }],
    });
    let received: OneBreadcrumbClickEvent | undefined;
    component.on('itemClick', (payload) => {
      received = payload as OneBreadcrumbClickEvent;
      received.originalEvent.preventDefault();
    });
    component.mount(container);

    const event = new MouseEvent('click', {
      bubbles: true,
      cancelable: true,
    });
    container.querySelector('a')?.dispatchEvent(event);
    expect(received?.item.label).toBe('首页');
    expect(received?.index).toBe(0);
    expect(event.defaultPrevented).toBe(true);
  });

  it('keeps first, current and last items and expands every hidden range', () => {
    component = new OneBreadcrumb({
      maxItems: 3,
      items: [
        { label: '一', href: '/1' },
        { label: '二', href: '/2' },
        { label: '三', current: true },
        { label: '四', href: '/4' },
        { label: '五' },
      ],
    });
    component.mount(container);

    expect(container.querySelectorAll('.one-breadcrumb__item')).toHaveLength(3);
    expect(
      container.querySelectorAll('.one-breadcrumb__ellipsis')
    ).toHaveLength(2);
    expect(container.textContent).toContain('一');
    expect(container.textContent).toContain('三');
    expect(container.textContent).toContain('五');
    (
      container.querySelector('.one-breadcrumb__ellipsis') as HTMLButtonElement
    ).click();
    expect(container.querySelectorAll('.one-breadcrumb__item')).toHaveLength(5);
    expect(container.querySelector('.one-breadcrumb__ellipsis')).toBeNull();
  });

  it('normalizes a small limit and prefers the separator slot', () => {
    component = new OneBreadcrumb({
      maxItems: 1,
      separator: '>',
      items: [
        { label: '一', href: '/1' },
        { label: '二', href: '/2' },
        { label: '三' },
        { label: '四' },
      ],
      children: [{ tag: 'span', slot: 'separator', children: ['→'] }],
    });
    component.mount(container);

    expect(container.querySelector('[aria-current="page"]')?.textContent).toBe(
      '四'
    );
    expect(container.querySelectorAll('.one-breadcrumb__item')).toHaveLength(3);
    expect(
      container.querySelector('.one-breadcrumb__separator')?.textContent
    ).toBe('→');
    expect(container.textContent).not.toContain('>');
  });

  it('renders one item without a separator and publishes interaction styles', () => {
    component = new OneBreadcrumb({ items: [{ label: '当前' }] });
    component.mount(container);

    expect(container.querySelectorAll('.one-breadcrumb__item')).toHaveLength(1);
    expect(container.querySelector('.one-breadcrumb__separator')).toBeNull();
    const css = [...document.querySelectorAll('style')]
      .map((style) => style.textContent)
      .join('\n');
    expect(css).toContain('.one-breadcrumb__link:hover');
    expect(css).toContain('.one-breadcrumb__ellipsis:focus-visible');
  });
});
