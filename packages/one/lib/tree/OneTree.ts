import { Component, type VNode } from '@geektech/tsone';
import {
  ONE_THEME_DEFAULTS,
  ONE_THEME_TYPOGRAPHY_PROPERTIES,
  type OneNamedStyle,
} from '../styles/shared';

export interface OneTreeNode {
  value: string;
  label: string;
  disabled?: boolean;
  children?: readonly OneTreeNode[];
}

export interface OneTreeExpandEvent {
  value: string[];
  originalEvent: Event;
}

export interface OneTreeSelectEvent {
  value: string | null;
  originalEvent: Event;
}

export interface OneTreeCheckEvent {
  value: string[];
  originalEvent: Event;
}

export interface OneTreeProps {
  data?: readonly OneTreeNode[];
  defaultExpanded?: readonly string[];
  expanded?: readonly string[];
  defaultSelected?: string | null;
  selected?: string | null;
  defaultChecked?: readonly string[];
  checked?: readonly string[];
  selectable?: boolean;
  checkable?: boolean;
  cascade?: boolean;
  ariaLabel?: string;
}

interface OneTreeState {
  internalExpanded: string[];
  internalSelected: string | null;
  internalChecked: string[];
  focused: string | null;
}

interface OneTreeVisibleNode {
  node: OneTreeNode;
  level: number;
  parentKey: string | undefined;
  expanded: boolean;
}

interface OneTreeRenderContext {
  activeKey: string | null;
  checked: Set<string>;
  indeterminate: Set<string>;
  selected: string | null;
}

export const ONE_TREE_STYLES: OneNamedStyle[] = [
  {
    name: 'one-tree-base',
    selector: '.one-tree',
    properties: {
      ...ONE_THEME_TYPOGRAPHY_PROPERTIES,
      margin: '0',
      padding: '0',
      listStyle: 'none',
      color: `var(--one-color-text, ${ONE_THEME_DEFAULTS.colorText})`,
    },
  },
  {
    name: 'one-tree-group',
    selector: '.one-tree__group',
    properties: {
      margin: '0',
      paddingLeft: ONE_THEME_DEFAULTS.spaceLg,
      listStyle: 'none',
    },
  },
  {
    name: 'one-tree-node',
    selector: '.one-tree__node',
    properties: {
      margin: '0',
      padding: '0',
    },
  },
  {
    name: 'one-tree-row',
    selector: '.one-tree__row',
    properties: {
      display: 'flex',
      alignItems: 'center',
      gap: ONE_THEME_DEFAULTS.spaceXs,
      padding: `4px ${ONE_THEME_DEFAULTS.spaceSm}`,
      borderRadius: `var(--one-radius-sm, ${ONE_THEME_DEFAULTS.radiusSm})`,
      cursor: 'pointer',
      outline: 'none',
      userSelect: 'none',
    },
  },
  {
    name: 'one-tree-row-hover',
    selector: '.one-tree__row:hover',
    properties: {
      backgroundColor: `var(--one-color-border, ${ONE_THEME_DEFAULTS.colorBorder})`,
    },
  },
  {
    name: 'one-tree-row-focus',
    selector: '.one-tree__row:focus-visible',
    properties: {
      outline: `2px solid var(--one-color-focus, ${ONE_THEME_DEFAULTS.colorFocus})`,
      outlineOffset: '-2px',
    },
  },
  {
    name: 'one-tree-row-selected',
    selector: '.one-tree__row--selected',
    properties: {
      color: `var(--one-color-primary-contrast, ${ONE_THEME_DEFAULTS.colorText})`,
      backgroundColor: `var(--one-color-primary, ${ONE_THEME_DEFAULTS.colorPrimary})`,
    },
  },
  {
    name: 'one-tree-row-selected-hover',
    selector: '.one-tree__row--selected:hover',
    properties: {
      color: `var(--one-color-primary-contrast, ${ONE_THEME_DEFAULTS.colorText})`,
      backgroundColor: `var(--one-color-primary-hover, ${ONE_THEME_DEFAULTS.colorPrimaryHover})`,
    },
  },
  {
    name: 'one-tree-row-disabled',
    selector: '.one-tree__row--disabled',
    properties: {
      opacity: '0.5',
      cursor: 'not-allowed',
    },
  },
  {
    name: 'one-tree-caret',
    selector: '.one-tree__caret',
    properties: {
      flexShrink: '0',
      width: '16px',
      color: `var(--one-color-muted, ${ONE_THEME_DEFAULTS.colorMuted})`,
      lineHeight: '1',
      textAlign: 'center',
      transition: 'transform 150ms ease',
    },
  },
  {
    name: 'one-tree-caret-open',
    selector: '.one-tree__caret--open',
    properties: { transform: 'rotate(90deg)' },
  },
  {
    name: 'one-tree-checkbox',
    selector: '.one-tree__checkbox',
    properties: {
      flexShrink: '0',
      margin: '0',
      accentColor: `var(--one-color-primary, ${ONE_THEME_DEFAULTS.colorPrimary})`,
    },
  },
  {
    name: 'one-tree-label',
    selector: '.one-tree__label',
    properties: {
      flex: '1',
      minWidth: '0',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
    },
  },
];

function nodeHasChildren(node: OneTreeNode): boolean {
  return Boolean(node.children && node.children.length > 0);
}

function normalizeKeys(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string')
    : [];
}

function collectDescendants(
  node: OneTreeNode,
  out: string[],
  includeDisabled: boolean
): void {
  node.children?.forEach((child) => {
    if (includeDisabled || !child.disabled) out.push(child.value);
    collectDescendants(child, out, includeDisabled);
  });
}

interface OneTreeIndex {
  byValue: Map<string, OneTreeNode>;
  parentOf: Map<string, string | undefined>;
}

function buildNodeIndex(data: readonly OneTreeNode[]): OneTreeIndex {
  const byValue = new Map<string, OneTreeNode>();
  const parentOf = new Map<string, string | undefined>();
  const walk = (nodes: readonly OneTreeNode[], parent?: string): void => {
    nodes.forEach((node) => {
      byValue.set(node.value, node);
      parentOf.set(node.value, parent);
      if (node.children) walk(node.children, node.value);
    });
  };
  walk(data);
  return { byValue, parentOf };
}

/**
 * 级联勾选：切换 key 后同步所有后代，并沿祖先链重新计算父节点状态。
 * 返回完全勾选的 key 集合；半选的父节点不进入集合，由渲染层表达为 mixed。
 */
function cascadeCheck(
  data: readonly OneTreeNode[],
  current: readonly string[],
  key: string
): string[] {
  const { byValue, parentOf } = buildNodeIndex(data);
  const node = byValue.get(key);
  if (!node) return [...current];

  const next = new Set(current);
  const willCheck = !next.has(key);
  if (willCheck) next.add(key);
  else next.delete(key);

  const descendants: string[] = [];
  collectDescendants(node, descendants, false);
  descendants.forEach((value) => {
    if (willCheck) next.add(value);
    else next.delete(value);
  });

  let parentKey = parentOf.get(key);
  while (parentKey !== undefined) {
    const parent = byValue.get(parentKey);
    if (!parent) break;
    const enabledChildren = (parent.children ?? []).filter(
      (child) => !child.disabled
    );
    if (enabledChildren.length === 0) break;
    const allChecked = enabledChildren.every((child) => next.has(child.value));
    const anyChecked = enabledChildren.some((child) => next.has(child.value));
    if (allChecked) next.add(parentKey);
    else if (anyChecked) next.delete(parentKey);
    else next.delete(parentKey);
    parentKey = parentOf.get(parentKey);
  }

  return [...next];
}

function togglePlain(current: readonly string[], key: string): string[] {
  return current.includes(key)
    ? current.filter((value) => value !== key)
    : [...current, key];
}

export class OneTree extends Component<OneTreeProps, OneTreeState> {
  protected initState(): OneTreeState {
    return {
      internalExpanded: normalizeKeys(this.props.defaultExpanded),
      internalSelected:
        typeof this.props.defaultSelected === 'string'
          ? this.props.defaultSelected
          : null,
      internalChecked: normalizeKeys(this.props.defaultChecked),
      focused: null,
    };
  }

  protected initStyles(): void {
    ONE_TREE_STYLES.forEach(({ name, ...style }) => {
      this.styleManager.addStyle(name, style);
    });
  }

  protected render(): VNode {
    const visible = this.flattenVisible();
    const activeKey =
      this.state.focused !== null &&
      visible.some((item) => item.node.value === this.state.focused)
        ? this.state.focused
        : (visible[0]?.node.value ?? null);
    const context: OneTreeRenderContext = {
      activeKey,
      checked: new Set(this.getChecked()),
      indeterminate: this.collectIndeterminateKeys(),
      selected: this.getSelected(),
    };

    return {
      tag: 'ul',
      props: {
        className: 'one-tree',
        role: 'tree',
        'aria-label': this.props.ariaLabel,
      },
      children: this.renderNodes(this.props.data ?? [], 1, context),
    };
  }

  protected onUpdated(): void {
    const root = this.getElement();
    if (!(root instanceof HTMLElement)) return;
    const checked = this.getChecked();
    const checkedSet = new Set(checked);
    root
      .querySelectorAll<HTMLInputElement>('.one-tree__checkbox')
      .forEach((input) => {
        const key = input.dataset.oneKey;
        if (key === undefined) return;
        const node = this.findNode(key);
        if (!node || !nodeHasChildren(node) || checkedSet.has(key)) {
          input.indeterminate = false;
          return;
        }
        const enabled = (node.children ?? []).filter(
          (child) => !child.disabled
        );
        const count = enabled.filter((child) =>
          checkedSet.has(child.value)
        ).length;
        input.indeterminate = count > 0 && count < enabled.length;
      });
  }

  private renderNodes(
    nodes: readonly OneTreeNode[],
    level: number,
    context: OneTreeRenderContext
  ): VNode[] {
    return nodes.map((node, index) =>
      this.renderNode(node, level, index + 1, nodes.length, context)
    );
  }

  private renderNode(
    node: OneTreeNode,
    level: number,
    posInSet: number,
    setSize: number,
    context: OneTreeRenderContext
  ): VNode {
    const hasChildren = nodeHasChildren(node);
    const expanded = hasChildren && this.isExpanded(node.value);
    const disabled = node.disabled === true;
    const selected = context.selected === node.value;
    const checked = context.checked.has(node.value);
    const indeterminate = context.indeterminate.has(node.value);
    const rowClassName = [
      'one-tree__row',
      ...(selected ? ['one-tree__row--selected'] : []),
      ...(disabled ? ['one-tree__row--disabled'] : []),
    ].join(' ');

    return {
      tag: 'li',
      key: node.value,
      props: {
        className: 'one-tree__node',
        role: 'treeitem',
        'aria-expanded': hasChildren
          ? expanded
            ? 'true'
            : 'false'
          : undefined,
        'aria-selected':
          this.props.selectable !== false
            ? selected
              ? 'true'
              : 'false'
            : undefined,
        'aria-level': String(level),
        'aria-posinset': String(posInSet),
        'aria-setsize': String(setSize),
        'aria-checked': this.props.checkable
          ? checked
            ? 'true'
            : indeterminate
              ? 'mixed'
              : 'false'
          : undefined,
        'aria-disabled': disabled ? 'true' : undefined,
      },
      children: [
        {
          tag: 'div',
          props: {
            className: rowClassName,
            tabIndex: context.activeKey === node.value ? 0 : -1,
          },
          listeners: {
            click: (event) => this.handleRowClick(node, event),
            keydown: (event) => this.handleKeydown(node, event),
          },
          children: [
            {
              tag: 'span',
              props: {
                className: [
                  'one-tree__caret',
                  ...(expanded ? ['one-tree__caret--open'] : []),
                ].join(' '),
                'aria-hidden': 'true',
              },
              children: [hasChildren ? '▸' : ''],
            },
            ...(this.props.checkable === true
              ? [
                  {
                    tag: 'input',
                    props: {
                      type: 'checkbox',
                      className: 'one-tree__checkbox',
                      'data-one-key': node.value,
                      checked,
                      disabled: disabled || undefined,
                      tabIndex: -1,
                      'aria-label': node.label,
                    },
                  } as VNode,
                ]
              : []),
            {
              tag: 'span',
              props: { className: 'one-tree__label' },
              children: [node.label],
            },
          ],
        },
        ...(hasChildren && expanded
          ? [
              {
                tag: 'ul',
                props: {
                  className: 'one-tree__group',
                  role: 'group',
                },
                children: this.renderNodes(
                  node.children as readonly OneTreeNode[],
                  level + 1,
                  context
                ),
              } as VNode,
            ]
          : []),
      ],
    };
  }

  private flattenVisible(): OneTreeVisibleNode[] {
    const result: OneTreeVisibleNode[] = [];
    const visit = (
      nodes: readonly OneTreeNode[],
      level: number,
      parentKey: string | undefined
    ): void => {
      nodes.forEach((node) => {
        const hasChildren = nodeHasChildren(node);
        const expanded = hasChildren && this.isExpanded(node.value);
        result.push({ node, level, parentKey, expanded });
        if (expanded && node.children) {
          visit(node.children, level + 1, node.value);
        }
      });
    };
    visit(this.props.data ?? [], 1, undefined);
    return result;
  }

  private collectIndeterminateKeys(): Set<string> {
    const result = new Set<string>();
    if (this.props.cascade === false) return result;
    const checkedSet = new Set(this.getChecked());
    const walk = (nodes: readonly OneTreeNode[]): void => {
      nodes.forEach((node) => {
        if (nodeHasChildren(node) && !checkedSet.has(node.value)) {
          const enabled = (node.children ?? []).filter(
            (child) => !child.disabled
          );
          const count = enabled.filter((child) =>
            checkedSet.has(child.value)
          ).length;
          if (count > 0 && count < enabled.length) result.add(node.value);
        }
        if (node.children) walk(node.children);
      });
    };
    walk(this.props.data ?? []);
    return result;
  }

  private handleRowClick(node: OneTreeNode, event: Event): void {
    if (node.disabled) return;
    const target = event.target;
    if (target instanceof HTMLElement && target.closest('.one-tree__caret')) {
      this.toggleExpand(node.value, event);
      return;
    }
    if (
      this.props.checkable === true &&
      target instanceof HTMLElement &&
      target.closest('.one-tree__checkbox')
    ) {
      this.toggleCheck(node.value, event);
      return;
    }
    if (this.props.selectable !== false) {
      this.selectNode(node.value, event);
    }
  }

  private handleKeydown(node: OneTreeNode, event: Event): void {
    if (!(event instanceof KeyboardEvent)) return;
    const visible = this.flattenVisible();
    const index = visible.findIndex((item) => item.node.value === node.value);
    if (index < 0) return;
    const current = visible[index];

    switch (event.key) {
      case 'ArrowDown': {
        event.preventDefault();
        const next = visible[index + 1];
        if (next) this.focusNode(next.node.value);
        break;
      }
      case 'ArrowUp': {
        event.preventDefault();
        const prev = visible[index - 1];
        if (prev) this.focusNode(prev.node.value);
        break;
      }
      case 'ArrowRight': {
        event.preventDefault();
        if (current.expanded) {
          const firstChild = visible[index + 1];
          if (firstChild) this.focusNode(firstChild.node.value);
        } else if (nodeHasChildren(current.node)) {
          this.toggleExpand(node.value, event);
        }
        break;
      }
      case 'ArrowLeft': {
        event.preventDefault();
        if (current.expanded) {
          this.toggleExpand(node.value, event);
        } else if (current.parentKey !== undefined) {
          this.focusNode(current.parentKey);
        }
        break;
      }
      case 'Home': {
        event.preventDefault();
        const first = visible[0];
        if (first) this.focusNode(first.node.value);
        break;
      }
      case 'End': {
        event.preventDefault();
        const last = visible[visible.length - 1];
        if (last) this.focusNode(last.node.value);
        break;
      }
      case 'Enter':
      case ' ': {
        event.preventDefault();
        if (this.props.checkable === true) {
          this.toggleCheck(node.value, event);
        } else {
          this.selectNode(node.value, event);
        }
        break;
      }
    }
  }

  private focusNode(key: string): void {
    this.setState({ focused: key });
  }

  private selectNode(key: string, event: Event): void {
    if (this.props.selectable === false) return;
    const node = this.findNode(key);
    if (!node || node.disabled) return;
    if (this.getSelected() === key) return;
    if (this.props.selected === undefined) {
      this.setState({ internalSelected: key });
    }
    this.emit('select', {
      value: key,
      originalEvent: event,
    } satisfies OneTreeSelectEvent);
  }

  private toggleExpand(key: string, event: Event): void {
    const node = this.findNode(key);
    if (!node || node.disabled || !nodeHasChildren(node)) return;
    const current = this.getExpanded();
    const next = current.includes(key)
      ? current.filter((value) => value !== key)
      : [...current, key];
    if (this.props.expanded === undefined) {
      this.setState({ internalExpanded: next });
    }
    this.emit('expand', {
      value: next,
      originalEvent: event,
    } satisfies OneTreeExpandEvent);
  }

  private toggleCheck(key: string, event: Event): void {
    if (this.props.checkable !== true) return;
    const node = this.findNode(key);
    if (!node || node.disabled) return;
    const current = this.getChecked();
    const next =
      this.props.cascade === false
        ? togglePlain(current, key)
        : cascadeCheck(this.props.data ?? [], current, key);
    if (this.props.checked === undefined) {
      this.setState({ internalChecked: next });
    }
    this.emit('check', {
      value: next,
      originalEvent: event,
    } satisfies OneTreeCheckEvent);
  }

  private isExpanded(key: string): boolean {
    return this.getExpanded().includes(key);
  }

  private getExpanded(): readonly string[] {
    return this.props.expanded ?? this.state.internalExpanded;
  }

  private getSelected(): string | null {
    return this.props.selected !== undefined
      ? this.props.selected
      : this.state.internalSelected;
  }

  private getChecked(): readonly string[] {
    return this.props.checked ?? this.state.internalChecked;
  }

  private findNode(key: string): OneTreeNode | undefined {
    const walk = (nodes: readonly OneTreeNode[]): OneTreeNode | undefined => {
      for (const node of nodes) {
        if (node.value === key) return node;
        if (node.children) {
          const found = walk(node.children);
          if (found) return found;
        }
      }
      return undefined;
    };
    return walk(this.props.data ?? []);
  }
}
