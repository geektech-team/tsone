import { ModelBindingController } from '../model';
import { effect, ReactiveEffect, stop } from '../reactive';
import {
  EventListeners,
  HTMLNode,
  HTMLProps,
  VNode,
  isHTMLNode,
} from '../vnode';
import {
  eventNameFromProp,
  isEventProp,
  parseEventName,
  setStyleValue,
  wrapEventHandler,
} from './props';
import type { RenderRuntimeContext, RenderStrategy, Renderable } from './types';

export class ElementRenderStrategy<
  TNode extends HTMLNode = HTMLNode,
> implements RenderStrategy<TNode> {
  private readonly listeners = new WeakMap<
    HTMLElement,
    Map<string, { eventName: string; listener: EventListener }>
  >();
  private readonly effects = new WeakMap<HTMLElement, Set<ReactiveEffect>>();
  private readonly modelBindings = new ModelBindingController();

  public matches(vnode: Renderable): vnode is TNode {
    return typeof vnode === 'object' && vnode !== null && isHTMLNode(vnode);
  }

  public mount(vnode: TNode, context: RenderRuntimeContext): Node {
    if (vnode.directions?.if === false) {
      return document.createComment('if');
    }

    const element = document.createElement(vnode.tag);
    this.applyProps(element, {}, vnode.props ?? {}, context);
    this.updateListeners(element, {}, this.collectListeners(vnode));
    this.mountChildren(element, vnode, context);
    this.applyDirections(element, undefined, vnode.directions, context);

    return element;
  }

  public patch(
    oldVNode: TNode,
    newVNode: TNode,
    currentNode: Node,
    context: RenderRuntimeContext
  ): Node {
    if (
      oldVNode.tag !== newVNode.tag ||
      currentNode.nodeType === Node.COMMENT_NODE
    ) {
      const nextNode = this.mount(newVNode, context);
      currentNode.parentNode?.replaceChild(nextNode, currentNode);
      this.unmount(oldVNode, currentNode, context);
      return nextNode;
    }

    if (!(currentNode instanceof HTMLElement)) {
      return currentNode;
    }

    if (newVNode.directions?.if === false) {
      const nextNode = document.createComment('if');
      currentNode.parentNode?.replaceChild(nextNode, currentNode);
      this.unmount(oldVNode, currentNode, context);
      return nextNode;
    }

    this.applyProps(
      currentNode,
      oldVNode.props ?? {},
      newVNode.props ?? {},
      context
    );
    this.updateListeners(
      currentNode,
      this.collectListeners(oldVNode),
      this.collectListeners(newVNode)
    );
    this.updateChildren(currentNode, oldVNode, newVNode, context);
    this.applyDirections(
      currentNode,
      oldVNode.directions,
      newVNode.directions,
      context
    );

    return currentNode;
  }

  public unmount(
    vnode: TNode,
    currentNode: Node,
    context: RenderRuntimeContext
  ): void {
    if (!(currentNode instanceof HTMLElement)) {
      return;
    }

    this.effects.get(currentNode)?.forEach((item) => stop(item));
    this.effects.delete(currentNode);

    this.listeners.get(currentNode)?.forEach(({ eventName, listener }) => {
      currentNode.removeEventListener(eventName, listener);
    });
    this.listeners.delete(currentNode);
    this.modelBindings.cleanup(currentNode);
    this.unmountChildren(currentNode, vnode, context);
  }

  protected mountChildren(
    element: HTMLElement,
    vnode: TNode,
    context: RenderRuntimeContext
  ): void {
    (vnode.children ?? []).forEach((child) => {
      element.appendChild(context.renderer.mount(child, context));
    });
  }

  protected updateChildren(
    element: HTMLElement,
    oldVNode: TNode,
    newVNode: TNode,
    context: RenderRuntimeContext
  ): void {
    this.updateOrdinaryChildren(
      element,
      oldVNode.children ?? [],
      newVNode.children ?? [],
      context
    );
  }

  protected unmountChildren(
    element: HTMLElement,
    vnode: TNode,
    context: RenderRuntimeContext
  ): void {
    (vnode.children ?? []).forEach((child, index) => {
      const childNode = element.childNodes[index];
      if (childNode) {
        context.renderer.unmount(child, childNode, context);
      }
    });
  }

  private applyProps(
    element: HTMLElement,
    oldProps: HTMLProps,
    newProps: HTMLProps,
    context: RenderRuntimeContext
  ): void {
    Object.keys(oldProps).forEach((key) => {
      if (isEventProp(key) || key in newProps) {
        return;
      }

      if (key === 'className' || key === 'class') {
        element.removeAttribute('class');
      } else if (key === 'style') {
        element.removeAttribute('style');
      } else if (
        key === 'value' &&
        typeof element === 'object' &&
        element !== null &&
        'value' in element
      ) {
        element.value = '';
      } else {
        element.removeAttribute(key);
      }
    });

    Object.entries(newProps).forEach(([key, value]) => {
      if (isEventProp(key)) {
        return;
      }

      // 值未变化时跳过 DOM 更新，避免每次 patch 全量重写属性
      if (oldProps[key] === value) {
        return;
      }

      if (key === 'className' || key === 'class') {
        element.className = String(value ?? '');
        return;
      }

      // 表单控件（input/textarea/select/option）的 value 必须写入 DOM
      // property 而不是 attribute：setAttribute('value') 只更新默认值，
      // 用户输入或程序修改后的当前值不会随之变化。
      if (
        key === 'value' &&
        typeof element === 'object' &&
        element !== null &&
        'value' in element
      ) {
        element.value = String(value ?? '');
        return;
      }

      if (key === 'style' && typeof value === 'object' && value !== null) {
        element.removeAttribute('style');
        Object.entries(value).forEach(([cssKey, cssValue]) => {
          setStyleValue(element.style, cssKey, cssValue);
        });
        return;
      }

      if (value === false || value === undefined || value === null) {
        element.removeAttribute(key);
        return;
      }

      if (value === true) {
        element.setAttribute(key, '');
        return;
      }

      if (
        typeof value === 'string' &&
        context.templateEngine.hasExpressions(value)
      ) {
        this.setupReactiveAttribute(element, key, value, context);
        return;
      }

      element.setAttribute(key, String(value));
    });
  }

  private applyDirections(
    element: HTMLElement,
    oldDirections: HTMLNode['directions'],
    newDirections: HTMLNode['directions'],
    context: RenderRuntimeContext
  ): void {
    if (newDirections && 'show' in newDirections) {
      element.style.display = newDirections.show ? '' : 'none';
    } else if (oldDirections && 'show' in oldDirections) {
      element.style.display = '';
    }

    if (!newDirections?.model) {
      this.modelBindings.cleanup(element);
      return;
    }

    this.modelBindings.bind(
      element,
      newDirections.model,
      context.templateEngine.state as Record<string, unknown>
    );
  }

  private updateOrdinaryChildren(
    element: HTMLElement,
    oldChildren: Array<VNode | string>,
    newChildren: Array<VNode | string>,
    context: RenderRuntimeContext
  ): void {
    this.assertNoDuplicateKeys(oldChildren);
    this.assertNoDuplicateKeys(newChildren);

    if (this.hasOnlyKeyedChildren(oldChildren, newChildren)) {
      this.updateKeyedChildren(element, oldChildren, newChildren, context);
      return;
    }

    const sharedLength = Math.min(oldChildren.length, newChildren.length);

    for (let index = 0; index < sharedLength; index += 1) {
      const childNode = element.childNodes[index];
      if (!childNode) {
        element.appendChild(
          context.renderer.mount(newChildren[index], context)
        );
        continue;
      }
      context.renderer.patch(
        oldChildren[index],
        newChildren[index],
        childNode,
        context
      );
    }

    for (let index = sharedLength; index < newChildren.length; index += 1) {
      element.appendChild(context.renderer.mount(newChildren[index], context));
    }

    for (
      let index = oldChildren.length - 1;
      index >= newChildren.length;
      index -= 1
    ) {
      const childNode = element.childNodes[index];
      if (childNode) {
        context.renderer.unmount(oldChildren[index], childNode, context);
        if (childNode.parentNode === element) {
          element.removeChild(childNode);
        }
      }
    }
  }

  private updateKeyedChildren(
    element: HTMLElement,
    oldChildren: Array<VNode | string>,
    newChildren: Array<VNode | string>,
    context: RenderRuntimeContext
  ): void {
    const oldEntries = oldChildren.map((vnode, index) => ({
      vnode,
      node: element.childNodes[index],
      index,
    }));
    const keyedOldEntries = new Map<
      string | number,
      { vnode: VNode | string; node: Node; index: number }
    >();
    const usedOldIndexes = new Set<number>();

    oldEntries.forEach((entry) => {
      const key = this.getVNodeKey(entry.vnode);
      if (key !== undefined && entry.node) {
        keyedOldEntries.set(key, {
          vnode: entry.vnode,
          node: entry.node,
          index: entry.index,
        });
      }
    });

    newChildren.forEach((newChild, newIndex) => {
      const key = this.getVNodeKey(newChild);
      const oldEntry = key === undefined ? undefined : keyedOldEntries.get(key);
      let nextNode: Node;

      if (oldEntry) {
        nextNode = context.renderer.patch(
          oldEntry.vnode,
          newChild,
          oldEntry.node,
          context
        );
        usedOldIndexes.add(oldEntry.index);
      } else {
        nextNode = context.renderer.mount(newChild, context);
      }

      const referenceNode = element.childNodes[newIndex] ?? null;
      if (nextNode !== referenceNode) {
        element.insertBefore(nextNode, referenceNode);
      }
    });

    oldEntries.forEach((entry) => {
      if (!entry.node || usedOldIndexes.has(entry.index)) {
        return;
      }

      context.renderer.unmount(entry.vnode, entry.node, context);
      if (entry.node.parentNode === element) {
        element.removeChild(entry.node);
      }
    });
  }

  private hasOnlyKeyedChildren(
    oldChildren: Array<VNode | string>,
    newChildren: Array<VNode | string>
  ): boolean {
    return [...oldChildren, ...newChildren].every(
      (child) => this.getVNodeKey(child) !== undefined
    );
  }

  private assertNoDuplicateKeys(children: Array<VNode | string>): void {
    const keys = new Set<string | number>();

    children.forEach((child) => {
      const key = this.getVNodeKey(child);
      if (key === undefined) {
        return;
      }

      if (keys.has(key)) {
        throw new Error(`Duplicate key "${key}"`);
      }

      keys.add(key);
    });
  }

  private getVNodeKey(vnode: VNode | string): string | number | undefined {
    if (typeof vnode === 'string') {
      return undefined;
    }

    return vnode.key;
  }

  private collectListeners(vnode: HTMLNode): EventListeners {
    const listeners: EventListeners = {};

    Object.entries(vnode.props ?? {}).forEach(([key, value]) => {
      if (isEventProp(key) && typeof value === 'function') {
        listeners[eventNameFromProp(key)] = value as (event: Event) => void;
      }
    });

    return {
      ...listeners,
      ...(vnode.listeners ?? {}),
    };
  }

  private updateListeners(
    element: HTMLElement,
    oldListeners: EventListeners,
    newListeners: EventListeners
  ): void {
    const store = this.listeners.get(element) ?? new Map();
    const oldKeys = new Set(Object.keys(oldListeners));
    const newKeys = new Set(Object.keys(newListeners));

    oldKeys.forEach((event) => {
      if (!newKeys.has(event) || oldListeners[event] !== newListeners[event]) {
        const stored = store.get(event);
        if (stored) {
          element.removeEventListener(stored.eventName, stored.listener);
          store.delete(event);
        }
      }
    });

    newKeys.forEach((event) => {
      if (!oldKeys.has(event) || oldListeners[event] !== newListeners[event]) {
        const { eventName, modifiers } = parseEventName(event);
        const listener = wrapEventHandler(newListeners[event], modifiers);
        element.addEventListener(eventName, listener);
        store.set(event, { eventName, listener });
      }
    });

    this.listeners.set(element, store);
  }

  private setupReactiveAttribute(
    element: HTMLElement,
    attrName: string,
    attrValue: string,
    context: RenderRuntimeContext
  ): void {
    const effectRef = effect(() => {
      element.setAttribute(
        attrName,
        context.templateEngine.evaluateTemplateValue(attrValue)
      );
    });

    this.trackEffect(element, effectRef);
  }

  private trackEffect(element: HTMLElement, effectRef: ReactiveEffect): void {
    const effects = this.effects.get(element) ?? new Set();
    effects.add(effectRef);
    this.effects.set(element, effects);
  }
}
