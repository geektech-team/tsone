import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { OneTable } from '../lib';

describe('OneTable', () => {
  let container: HTMLElement;
  let component: OneTable;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    component?.unmount();
    container.remove();
  });

  it('renders column headings and row cells', () => {
    component = new OneTable({
      data: [
        { name: '林晚', role: '设计' },
        { name: '苏北', role: '前端' },
      ],
      columns: [
        { key: 'name', title: '姓名' },
        { key: 'role', title: '角色' },
      ],
      ariaLabel: '成员',
    });
    component.mount(container);

    const table = container.querySelector('table') as HTMLTableElement;
    expect(table.getAttribute('aria-label')).toBe('成员');
    const heads = Array.from(table.querySelectorAll('th')).map(
      (node) => node.textContent
    );
    expect(heads).toEqual(['姓名', '角色']);
    const cells = Array.from(table.querySelectorAll('tbody tr td')).map(
      (node) => node.textContent
    );
    expect(cells).toEqual(['林晚', '设计', '苏北', '前端']);
  });

  it('derives columns from the first data row when omitted', () => {
    component = new OneTable({ data: [{ name: '林晚', age: 18 }] });
    component.mount(container);

    const heads = Array.from(container.querySelectorAll('th')).map(
      (node) => node.textContent
    );
    expect(heads).toEqual(['name', 'age']);
  });

  it('supports a custom cell renderer returning a VNode', () => {
    component = new OneTable({
      data: [{ name: '林晚' }],
      columns: [
        { key: 'name', title: '姓名' },
        {
          key: 'role',
          title: '角色',
          render: () => ({ tag: 'b', children: ['成员'] }),
        },
      ],
    });
    component.mount(container);

    expect(container.querySelector('tbody b')?.textContent).toBe('成员');
  });

  it('renders an empty state spanning all columns', () => {
    component = new OneTable({
      data: [],
      columns: [
        { key: 'a', title: 'A' },
        { key: 'b', title: 'B' },
      ],
      emptyText: '没有记录',
    });
    component.mount(container);

    const empty = container.querySelector('.one-table__empty') as HTMLTableCellElement;
    expect(empty.textContent).toBe('没有记录');
    expect(empty.colSpan).toBe(2);
  });

  it('adds striped and hover modifier classes', () => {
    component = new OneTable({
      data: [{ a: 1 }],
      columns: [{ key: 'a', title: 'A' }],
      striped: true,
      hover: true,
    });
    component.mount(container);

    const table = container.querySelector('table') as HTMLTableElement;
    expect(table.className).toContain('one-table--striped');
    expect(table.className).toContain('one-table--hover');
    expect(table.querySelector('tbody tr')).toBeTruthy();
  });
});
