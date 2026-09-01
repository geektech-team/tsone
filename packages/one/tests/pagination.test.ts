import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import {
  OnePagination,
  createOnePaginationTokens,
  type OnePaginationChangeEvent,
} from '../lib/pagination';

describe('OnePagination tokens', () => {
  it('creates stable first, sibling, ellipsis and last page tokens', () => {
    expect(createOnePaginationTokens(10, 5, 1)).toEqual([
      1,
      'ellipsis-start',
      4,
      5,
      6,
      'ellipsis-end',
      10,
    ]);
    expect(createOnePaginationTokens(5, 3, 1)).toEqual([1, 2, 3, 4, 5]);
    expect(createOnePaginationTokens(1, 1, 1)).toEqual([1]);
  });
});

describe('OnePagination', () => {
  let container: HTMLElement;
  let component: OnePagination;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    component?.unmount();
    container.remove();
  });

  it('updates uncontrolled pages and emits the final page state once', () => {
    component = new OnePagination({ total: 100, defaultPage: 5 });
    const changes: OnePaginationChangeEvent[] = [];
    component.on('change', (payload) => {
      changes.push(payload as OnePaginationChangeEvent);
    });
    component.mount(container);

    (
      container.querySelector('[aria-label="下一页"]') as HTMLButtonElement
    ).click();
    expect(changes.map(({ page, pageSize }) => [page, pageSize])).toEqual([
      [6, 10],
    ]);
    expect(container.querySelector('[aria-current="page"]')?.textContent).toBe(
      '6'
    );
  });

  it('requests controlled changes without overriding controlled props', () => {
    component = new OnePagination({ total: 100, page: 2, pageSize: 20 });
    let change: OnePaginationChangeEvent | undefined;
    component.on('change', (payload) => {
      change = payload as OnePaginationChangeEvent;
    });
    component.mount(container);

    (
      container.querySelector('[aria-label="下一页"]') as HTMLButtonElement
    ).click();
    expect(change?.page).toBe(3);
    expect(change?.pageSize).toBe(20);
    expect(container.querySelector('[aria-current="page"]')?.textContent).toBe(
      '2'
    );
  });

  it('clamps page after changing page size and emits once', () => {
    component = new OnePagination({ total: 95, defaultPage: 10 });
    const changes: OnePaginationChangeEvent[] = [];
    component.on('change', (payload) => {
      changes.push(payload as OnePaginationChangeEvent);
    });
    component.mount(container);

    const size = container.querySelector(
      '[aria-label="每页条数"]'
    ) as HTMLSelectElement;
    size.value = '20';
    size.dispatchEvent(new Event('change', { bubbles: true }));
    expect(changes.map(({ page, pageSize }) => [page, pageSize])).toEqual([
      [5, 20],
    ]);
  });

  it('submits and clears quick jump without double-emitting on blur', () => {
    component = new OnePagination({
      total: 100,
      showQuickJumper: true,
    });
    let changes = 0;
    component.on('change', () => {
      changes += 1;
    });
    component.mount(container);

    const input = container.querySelector(
      '[aria-label="快速跳转页码"]'
    ) as HTMLInputElement;
    input.value = '99';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Enter', bubbles: true })
    );
    input.dispatchEvent(new Event('blur', { bubbles: true }));
    expect(changes).toBe(1);
    expect(input.value).toBe('');
    expect(container.querySelector('[aria-current="page"]')?.textContent).toBe(
      '10'
    );
  });

  it('normalizes invalid runtime values and inserts the active page size', () => {
    component = new OnePagination({
      total: Number.NaN,
      defaultPage: -1,
      defaultPageSize: 30,
      pageSizeOptions: [20, 20, -1],
      siblingCount: -2,
      ariaLabel: '结果分页',
    });
    component.mount(container);

    expect(container.querySelector('nav')?.getAttribute('aria-label')).toBe(
      '结果分页'
    );
    expect(container.querySelector('[aria-current="page"]')?.textContent).toBe(
      '1'
    );
    expect(
      [...container.querySelectorAll('option')].map((option) => option.value)
    ).toEqual(['20', '30']);
    expect(
      (container.querySelector('[aria-label="上一页"]') as HTMLButtonElement)
        .disabled
    ).toBe(true);
    expect(
      (container.querySelector('[aria-label="下一页"]') as HTMLButtonElement)
        .disabled
    ).toBe(true);
  });

  it('suppresses disabled controls and ignores invalid quick jumps', () => {
    component = new OnePagination({
      total: 100,
      disabled: true,
      showQuickJumper: true,
    });
    let changes = 0;
    component.on('change', () => {
      changes += 1;
    });
    component.mount(container);

    const input = container.querySelector(
      '[aria-label="快速跳转页码"]'
    ) as HTMLInputElement;
    expect(input.disabled).toBe(true);
    expect(container.querySelectorAll('button:not(:disabled)')).toHaveLength(0);
    component.setProps({ disabled: false });
    const enabledInput = container.querySelector(
      '[aria-label="快速跳转页码"]'
    ) as HTMLInputElement;
    enabledInput.value = 'not-a-page';
    enabledInput.dispatchEvent(new Event('input', { bubbles: true }));
    enabledInput.dispatchEvent(new Event('blur'));
    expect(changes).toBe(0);
  });

  it('publishes scoped interaction styles', () => {
    component = new OnePagination({ total: 100 });
    component.mount(container);

    const css = [...document.querySelectorAll('style')]
      .map((style) => style.textContent)
      .join('\n');
    expect(css).toContain('.one-pagination__button:hover');
    expect(css).toContain('.one-pagination__button:focus-visible');
    expect(css).toContain('.one-pagination__button[aria-current="page"]');
  });
});
