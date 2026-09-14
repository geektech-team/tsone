import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { flushSync } from '@geektech/tsone';
import {
  OneTree,
  type OneTreeCheckEvent,
  type OneTreeExpandEvent,
  type OneTreeSelectEvent,
} from '../lib';

const TREE_DATA = [
  {
    value: 'design',
    label: '设计',
    children: [
      { value: 'visual', label: '视觉' },
      { value: 'interaction', label: '交互' },
    ],
  },
  {
    value: 'engineering',
    label: '工程',
    children: [
      { value: 'frontend', label: '前端' },
      {
        value: 'quality',
        label: '质量',
        disabled: true,
        children: [{ value: 'qa', label: 'QA' }],
      },
    ],
  },
];

function rows(container: HTMLElement): HTMLElement[] {
  return [...container.querySelectorAll<HTMLElement>('.one-tree__row')];
}

function rowByLabel(container: HTMLElement, label: string): HTMLElement {
  const row = rows(container).find(
    (candidate) =>
      candidate.querySelector('.one-tree__label')?.textContent === label
  );
  if (!row) throw new Error(`Missing row: ${label}`);
  return row;
}

function nodeByLabel(container: HTMLElement, label: string): HTMLElement {
  const node = [
    ...container.querySelectorAll<HTMLElement>('.one-tree__node'),
  ].find(
    (candidate) =>
      candidate.querySelector('.one-tree__label')?.textContent === label
  );
  if (!node) throw new Error(`Missing node: ${label}`);
  return node;
}

function caretOf(container: HTMLElement, label: string): HTMLElement {
  const caret = nodeByLabel(container, label).querySelector<HTMLElement>(
    '.one-tree__caret'
  );
  if (!caret) throw new Error(`Missing caret: ${label}`);
  return caret;
}

function checkboxOf(container: HTMLElement, label: string): HTMLInputElement {
  const input = rowByLabel(container, label).querySelector<HTMLInputElement>(
    '.one-tree__checkbox'
  );
  if (!input) throw new Error(`Missing checkbox: ${label}`);
  return input;
}

function click(el: Element): void {
  el.dispatchEvent(new MouseEvent('click', { bubbles: true }));
}

function pressKey(row: HTMLElement, key: string): void {
  row.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }));
}

describe('OneTree', () => {
  let container: HTMLElement;
  let component: OneTree;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    component?.unmount();
    container.remove();
  });

  it('renders nested tree semantics with levels and sibling positions', () => {
    component = new OneTree({
      defaultExpanded: ['engineering'],
      data: TREE_DATA,
    });
    component.mount(container);

    const tree = container.querySelector('.one-tree');
    expect(tree?.getAttribute('role')).toBe('tree');
    expect(tree?.getAttribute('aria-label')).toBeNull();

    const design = nodeByLabel(container, '设计');
    expect(design.getAttribute('role')).toBe('treeitem');
    expect(design.getAttribute('aria-level')).toBe('1');
    expect(design.getAttribute('aria-posinset')).toBe('1');
    expect(design.getAttribute('aria-setsize')).toBe('2');
    expect(design.getAttribute('aria-expanded')).toBe('false');
    expect(design.getAttribute('aria-selected')).toBe('false');

    const engineering = nodeByLabel(container, '工程');
    expect(engineering.getAttribute('aria-level')).toBe('1');
    expect(engineering.getAttribute('aria-posinset')).toBe('2');
    expect(engineering.getAttribute('aria-expanded')).toBe('true');

    const frontend = nodeByLabel(container, '前端');
    expect(frontend.getAttribute('aria-level')).toBe('2');
    expect(frontend.getAttribute('aria-expanded')).toBeNull();

    const group = engineering.querySelector('.one-tree__group');
    expect(group?.getAttribute('role')).toBe('group');
    expect(rows(container)).toHaveLength(4);
  });

  it('expands and collapses branches and emits expand events', () => {
    component = new OneTree({ data: TREE_DATA });
    const changes: Array<OneTreeExpandEvent> = [];
    component.on('expand', (payload) =>
      changes.push(payload as OneTreeExpandEvent)
    );
    component.mount(container);

    expect(rows(container)).toHaveLength(2);

    click(caretOf(container, '设计'));
    expect(changes[0].value).toEqual(['design']);
    expect(rows(container)).toHaveLength(4);
    expect(nodeByLabel(container, '设计').getAttribute('aria-expanded')).toBe(
      'true'
    );
    expect(caretOf(container, '设计').className).toContain(
      'one-tree__caret--open'
    );

    // 再次点击箭头收起，子节点随之隐藏
    click(caretOf(container, '设计'));
    expect(changes[1].value).toEqual([]);
    expect(rows(container)).toHaveLength(2);
  });

  it('keeps controlled expanded list without internal mutation', () => {
    component = new OneTree({
      expanded: ['design'],
      data: TREE_DATA,
    });
    const changes: Array<OneTreeExpandEvent> = [];
    component.on('expand', (payload) =>
      changes.push(payload as OneTreeExpandEvent)
    );
    component.mount(container);

    click(caretOf(container, '设计'));
    expect(changes[0].value).toEqual([]);
    expect(nodeByLabel(container, '设计').getAttribute('aria-expanded')).toBe(
      'true'
    );

    component.setProps({ expanded: [] });
    flushSync();
    expect(nodeByLabel(container, '设计').getAttribute('aria-expanded')).toBe(
      'false'
    );
  });

  it('selects nodes on label click and ignores disabled nodes', () => {
    component = new OneTree({
      defaultExpanded: ['design', 'engineering'],
      data: TREE_DATA,
    });
    const changes: Array<OneTreeSelectEvent> = [];
    component.on('select', (payload) =>
      changes.push(payload as OneTreeSelectEvent)
    );
    component.mount(container);

    const visual = rowByLabel(container, '视觉');
    click(visual.querySelector('.one-tree__label') as Element);
    expect(changes[0].value).toBe('visual');
    expect(visual.className).toContain('one-tree__row--selected');
    expect(nodeByLabel(container, '视觉').getAttribute('aria-selected')).toBe(
      'true'
    );

    // 重复点击已选中节点不再触发 select
    click(visual.querySelector('.one-tree__label') as Element);
    expect(changes).toHaveLength(1);

    const quality = rowByLabel(container, '质量');
    expect(quality.className).toContain('one-tree__row--disabled');
    click(quality.querySelector('.one-tree__label') as Element);
    expect(changes).toHaveLength(1);
    expect(nodeByLabel(container, '质量').getAttribute('aria-disabled')).toBe(
      'true'
    );
  });

  it('supports controlled selected value', () => {
    component = new OneTree({
      selected: 'engineering',
      data: TREE_DATA,
    });
    component.mount(container);

    expect(rowByLabel(container, '工程').className).toContain(
      'one-tree__row--selected'
    );
    component.setProps({ selected: 'design' });
    flushSync();
    expect(rowByLabel(container, '设计').className).toContain(
      'one-tree__row--selected'
    );
    expect(rowByLabel(container, '工程').className).not.toContain(
      'one-tree__row--selected'
    );
  });

  it('cascades checks through descendants and ancestors', () => {
    component = new OneTree({
      checkable: true,
      defaultExpanded: ['engineering'],
      data: TREE_DATA,
    });
    const changes: Array<OneTreeCheckEvent> = [];
    component.on('check', (payload) =>
      changes.push(payload as OneTreeCheckEvent)
    );
    component.mount(container);

    click(checkboxOf(container, '工程'));
    expect(changes[0].value.sort()).toEqual(
      ['engineering', 'frontend', 'qa'].sort()
    );
    expect(checkboxOf(container, '工程').checked).toBe(true);
    expect(nodeByLabel(container, '工程').getAttribute('aria-checked')).toBe(
      'true'
    );
    expect(nodeByLabel(container, '前端').getAttribute('aria-checked')).toBe(
      'true'
    );
  });

  it('derives indeterminate state for partially checked parents', () => {
    component = new OneTree({
      checkable: true,
      defaultExpanded: ['design'],
      data: TREE_DATA,
    });
    component.mount(container);

    click(checkboxOf(container, '视觉'));
    const designNode = nodeByLabel(container, '设计');
    expect(designNode.getAttribute('aria-checked')).toBe('mixed');
    const designInput = checkboxOf(container, '设计');
    expect(designInput.indeterminate).toBe(true);
    expect(designInput.checked).toBe(false);

    // 勾选全部可用子节点后，父节点变为完全勾选
    click(checkboxOf(container, '交互'));
    expect(nodeByLabel(container, '设计').getAttribute('aria-checked')).toBe(
      'true'
    );
    const designInputAfter = checkboxOf(container, '设计');
    expect(designInputAfter.indeterminate).toBe(false);
    expect(designInputAfter.checked).toBe(true);
  });

  it('keeps siblings independent when cascade is disabled', () => {
    component = new OneTree({
      cascade: false,
      checkable: true,
      defaultExpanded: ['engineering'],
      data: TREE_DATA,
    });
    const changes: Array<OneTreeCheckEvent> = [];
    component.on('check', (payload) =>
      changes.push(payload as OneTreeCheckEvent)
    );
    component.mount(container);

    click(checkboxOf(container, '工程'));
    expect(changes[0].value).toEqual(['engineering']);
    expect(nodeByLabel(container, '工程').getAttribute('aria-checked')).toBe(
      'true'
    );

    click(checkboxOf(container, '前端'));
    expect(nodeByLabel(container, '工程').getAttribute('aria-checked')).toBe(
      'true'
    );
    expect(changes[1].value.sort()).toEqual(['engineering', 'frontend'].sort());
  });

  it('supports controlled checked values', () => {
    component = new OneTree({
      checkable: true,
      checked: ['design'],
      defaultExpanded: ['design'],
      data: TREE_DATA,
    });
    const changes: Array<OneTreeCheckEvent> = [];
    component.on('check', (payload) =>
      changes.push(payload as OneTreeCheckEvent)
    );
    component.mount(container);

    expect(checkboxOf(container, '设计').checked).toBe(true);

    click(checkboxOf(container, '视觉'));
    expect(changes[0].value).toEqual(['visual']);

    // 受控模式下 DOM 跟随 checked prop；父节点更新后表现为半选
    component.setProps({ checked: ['visual'] });
    flushSync();
    expect(checkboxOf(container, '视觉').checked).toBe(true);
    expect(checkboxOf(container, '设计').checked).toBe(false);
    expect(checkboxOf(container, '设计').indeterminate).toBe(true);
  });

  it('moves focus with arrow keys and supports Home and End', () => {
    component = new OneTree({
      defaultExpanded: ['engineering'],
      data: TREE_DATA,
    });
    component.mount(container);

    const first = rows(container)[0];
    expect(first.tabIndex).toBe(0);

    pressKey(first, 'ArrowDown');
    const second = rows(container)[1];
    expect(second.tabIndex).toBe(0);
    expect(first.tabIndex).toBe(-1);

    pressKey(second, 'End');
    const last = rows(container)[rows(container).length - 1];
    expect(last.tabIndex).toBe(0);

    pressKey(last, 'Home');
    expect(rows(container)[0].tabIndex).toBe(0);
  });

  it('expands with ArrowRight and collapses with ArrowLeft', () => {
    component = new OneTree({ data: TREE_DATA });
    component.mount(container);

    pressKey(rowByLabel(container, '设计'), 'ArrowRight');
    expect(rows(container)).toHaveLength(4);

    pressKey(rowByLabel(container, '设计'), 'ArrowRight');
    const visual = rowByLabel(container, '视觉');
    expect(visual.tabIndex).toBe(0);

    pressKey(visual, 'ArrowLeft');
    expect(rows(container)).toHaveLength(4);
    expect(rowByLabel(container, '设计').tabIndex).toBe(0);

    pressKey(rowByLabel(container, '设计'), 'ArrowLeft');
    expect(rows(container)).toHaveLength(2);
  });

  it('selects with Space and Enter in non-checkable mode', () => {
    component = new OneTree({ data: TREE_DATA });
    const changes: Array<OneTreeSelectEvent> = [];
    component.on('select', (payload) =>
      changes.push(payload as OneTreeSelectEvent)
    );
    component.mount(container);

    pressKey(rowByLabel(container, '设计'), ' ');
    expect(changes[0].value).toBe('design');

    pressKey(rowByLabel(container, '工程'), 'Enter');
    expect(changes[1].value).toBe('engineering');
  });

  it('toggles checks with Space in checkable mode', () => {
    component = new OneTree({
      checkable: true,
      data: TREE_DATA,
    });
    const changes: Array<OneTreeCheckEvent> = [];
    component.on('check', (payload) =>
      changes.push(payload as OneTreeCheckEvent)
    );
    component.mount(container);

    pressKey(rowByLabel(container, '设计'), ' ');
    expect(changes[0].value.sort()).toEqual(
      ['design', 'visual', 'interaction'].sort()
    );
  });

  it('ignores clicks on a disabled branch caret', () => {
    component = new OneTree({
      defaultExpanded: ['engineering'],
      data: TREE_DATA,
    });
    const changes: Array<OneTreeExpandEvent> = [];
    component.on('expand', (payload) =>
      changes.push(payload as OneTreeExpandEvent)
    );
    component.mount(container);

    click(caretOf(container, '质量'));
    expect(changes).toHaveLength(0);
    expect(rows(container)).toHaveLength(4);
  });

  it('emits no select when selectable is disabled', () => {
    component = new OneTree({
      selectable: false,
      data: TREE_DATA,
    });
    const changes: Array<OneTreeSelectEvent> = [];
    component.on('select', (payload) =>
      changes.push(payload as OneTreeSelectEvent)
    );
    component.mount(container);

    click(
      rowByLabel(container, '设计').querySelector('.one-tree__label') as Element
    );
    expect(changes).toHaveLength(0);
    expect(
      nodeByLabel(container, '设计').getAttribute('aria-selected')
    ).toBeNull();
  });
});
