import { ElementRenderStrategy } from '../renderer/element-strategy';
import type { RenderRuntimeContext, Renderable } from '../renderer/types';
import type { VNode } from '../vnode';
import { ListAnimationController } from './list-animation-controller';
import {
  isTransitionGroupNode,
  validateTransitionGroupChildren,
  type TransitionGroupNode,
  type TransitionGroupOptions,
} from './types';

interface TransitionEntry {
  key: string | number;
  vnode: VNode;
  node: Node;
  status: 'active' | 'exiting';
  animationToken?: symbol;
}

export class TransitionGroupRenderStrategy extends ElementRenderStrategy<TransitionGroupNode> {
  private readonly entries = new WeakMap<
    HTMLElement,
    Map<string | number, TransitionEntry>
  >();
  private readonly animations = new ListAnimationController();

  public matches(vnode: Renderable): vnode is TransitionGroupNode {
    return isTransitionGroupNode(vnode);
  }

  protected mountChildren(
    element: HTMLElement,
    groupVNode: TransitionGroupNode,
    context: RenderRuntimeContext
  ): void {
    const keyedChildren = validateTransitionGroupChildren(
      groupVNode.children ?? []
    );
    const entries = new Map<string | number, TransitionEntry>();

    keyedChildren.forEach((childVNode) => {
      const node = context.renderer.mount(childVNode, context);
      element.appendChild(node);
      const entry: TransitionEntry = {
        key: childVNode.key,
        vnode: childVNode,
        node,
        status: 'active',
      };
      entries.set(entry.key, entry);
      this.playEnter(entry, node, groupVNode.transitionGroup);
    });

    this.entries.set(element, entries);
  }

  protected updateChildren(
    element: HTMLElement,
    _oldVNode: TransitionGroupNode,
    newVNode: TransitionGroupNode,
    context: RenderRuntimeContext
  ): void {
    const entries = this.entries.get(element) ?? new Map();
    const nextChildren = validateTransitionGroupChildren(
      newVNode.children ?? []
    );
    const nextKeys = new Set(nextChildren.map((child) => child.key));
    const ordered: TransitionEntry[] = [];

    nextChildren.forEach((childVNode) => {
      const key = childVNode.key;
      const current = entries.get(key);
      if (current) {
        const wasExiting = current.status === 'exiting';
        if (wasExiting && current.node instanceof HTMLElement) {
          this.animations.cancel(current.node);
        }
        current.status = 'active';
        current.animationToken = undefined;
        current.node = context.renderer.patch(
          current.vnode,
          childVNode,
          current.node,
          context
        );
        current.vnode = childVNode;
        ordered.push(current);
        if (wasExiting) {
          this.playEnter(current, current.node, newVNode.transitionGroup);
        }
        return;
      }

      const node = context.renderer.mount(childVNode, context);
      const entry: TransitionEntry = {
        key,
        vnode: childVNode,
        node,
        status: 'active',
      };
      entries.set(key, entry);
      ordered.push(entry);
      this.playEnter(entry, node, newVNode.transitionGroup);
    });

    entries.forEach((entry, key) => {
      if (nextKeys.has(key) || entry.status !== 'active') {
        return;
      }

      this.startExit(element, entry, newVNode.transitionGroup, context);
    });

    this.placeActiveEntries(element, ordered);
    this.entries.set(element, entries);
  }

  protected unmountChildren(
    element: HTMLElement,
    vnode: TransitionGroupNode,
    context: RenderRuntimeContext
  ): void {
    const entries = this.entries.get(element);
    if (!entries) {
      super.unmountChildren(element, vnode, context);
      return;
    }

    entries.forEach((entry) => {
      if (entry.node instanceof HTMLElement) {
        this.animations.cancel(entry.node);
      }
      context.renderer.unmount(entry.vnode, entry.node, context);
      if (entry.node.parentNode === element) {
        element.removeChild(entry.node);
      }
    });
    entries.clear();
    this.entries.delete(element);
  }

  private playEnter(
    entry: TransitionEntry,
    node: Node,
    options: TransitionGroupOptions
  ): void {
    if (!(node instanceof HTMLElement)) {
      return;
    }

    const run = this.animations.playEnter(node, options);
    entry.animationToken = run?.token;
  }

  private startExit(
    wrapper: HTMLElement,
    entry: TransitionEntry,
    options: TransitionGroupOptions,
    context: RenderRuntimeContext
  ): void {
    entry.status = 'exiting';
    const run =
      entry.node instanceof HTMLElement
        ? this.animations.playExit(entry.node, options)
        : null;

    if (!run) {
      this.finishExit(wrapper, entry, context);
      return;
    }

    entry.animationToken = run.token;
    void run.finished.then((result) => {
      if (
        result === 'finished' &&
        entry.status === 'exiting' &&
        entry.animationToken === run.token
      ) {
        this.finishExit(wrapper, entry, context);
      }
    });
  }

  private finishExit(
    wrapper: HTMLElement,
    entry: TransitionEntry,
    context: RenderRuntimeContext
  ): void {
    const entries = this.entries.get(wrapper);
    if (entries?.get(entry.key) !== entry) {
      return;
    }

    context.renderer.unmount(entry.vnode, entry.node, context);
    if (entry.node.parentNode === wrapper) {
      wrapper.removeChild(entry.node);
    }
    entries.delete(entry.key);
  }

  private placeActiveEntries(
    wrapper: HTMLElement,
    ordered: TransitionEntry[]
  ): void {
    let reference: Node | null = null;
    for (let index = ordered.length - 1; index >= 0; index -= 1) {
      wrapper.insertBefore(ordered[index].node, reference);
      reference = ordered[index].node;
    }
  }
}
