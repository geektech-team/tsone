import { effect, ReactiveEffect, stop } from './reactive';
import type { ComponentEventListener, ComponentProps } from './component/base';
import {
  eventNameFromProp,
  isEventProp,
  parseEventName,
  setStyleValue,
  wrapEventHandler,
} from './renderer/props';
import { ModelBindingController } from './model';
import {
  ComponentNode,
  EventListeners,
  HTMLNode,
  HTMLProps,
  SlotProvider,
  VNode,
  isComponentNode,
  isHTMLNode,
  isSlotProvider,
} from './vnode';
export type {
  ComponentInstance,
  RenderRuntimeContext,
  RenderStrategy,
  Renderable,
  RendererHost,
} from './renderer/types';
import type {
  ComponentInstance,
  RenderRuntimeContext,
  RenderStrategy,
  Renderable,
} from './renderer/types';

export class RendererContext {
  private readonly strategies: RenderStrategy[];

  constructor() {
    this.strategies = [
      new TextRenderStrategy(),
      new ComponentRenderStrategy(),
      new SlotRenderStrategy(),
      new ElementRenderStrategy(),
    ];
  }

  public mount(vnode: Renderable, context: RenderRuntimeContext): Node {
    return this.findStrategy(vnode).mount(vnode as never, context);
  }

  public patch(
    oldVNode: Renderable,
    newVNode: Renderable,
    currentNode: Node,
    context: RenderRuntimeContext
  ): Node {
    const oldStrategy = this.findStrategy(oldVNode);
    const newStrategy = this.findStrategy(newVNode);

    if (oldStrategy !== newStrategy) {
      const nextNode = newStrategy.mount(newVNode as never, context);
      currentNode.parentNode?.replaceChild(nextNode, currentNode);
      oldStrategy.unmount(oldVNode as never, currentNode, context);
      return nextNode;
    }

    return oldStrategy.patch(
      oldVNode as never,
      newVNode as never,
      currentNode,
      context
    );
  }

  public unmount(
    vnode: Renderable,
    currentNode: Node,
    context: RenderRuntimeContext
  ): void {
    this.findStrategy(vnode).unmount(vnode as never, currentNode, context);
  }

  private findStrategy(vnode: Renderable): RenderStrategy {
    const strategy = this.strategies.find((item) => item.matches(vnode));
    if (!strategy) {
      throw new Error('No render strategy found for vnode');
    }
    return strategy;
  }
}

export class TextRenderStrategy implements RenderStrategy<string> {
  public matches(vnode: Renderable): vnode is string {
    return typeof vnode === 'string';
  }

  public mount(vnode: string, context: RenderRuntimeContext): Node {
    return context.templateEngine.parseTemplate(vnode);
  }

  public patch(
    oldVNode: string,
    newVNode: string,
    currentNode: Node,
    context: RenderRuntimeContext
  ): Node {
    if (oldVNode === newVNode) {
      return currentNode;
    }

    const nextNode = this.mount(newVNode, context);
    currentNode.parentNode?.replaceChild(nextNode, currentNode);
    return nextNode;
  }

  public unmount(): void {}
}

export class ComponentRenderStrategy implements RenderStrategy<ComponentNode> {
  private readonly instances = new WeakMap<Node, ComponentInstance>();
  private readonly instanceNodes = new Map<ComponentInstance, Set<Node>>();
  private readonly emitterUnsubscribers = new WeakMap<
    ComponentInstance,
    Map<string, { listener: ComponentEventListener; unsubscribe: () => void }>
  >();

  public matches(vnode: Renderable): vnode is ComponentNode {
    return (
      typeof vnode === 'object' && vnode !== null && isComponentNode(vnode)
    );
  }

  public mount(vnode: ComponentNode, context: RenderRuntimeContext): Node {
    if (vnode.directions?.if === false) {
      return document.createComment('if');
    }

    const ComponentClass = vnode.component as new (
      props?: ComponentProps
    ) => ComponentInstance;
    const instance = new ComponentClass(this.createProps(vnode));

    if (context.appContext && instance.setAppContext) {
      instance.setAppContext(context.appContext);
    }

    this.syncEmitters(instance, vnode.emitters ?? {});

    context.registerChild(instance);

    const node = instance.mountToNode();
    this.trackInstanceNode(instance, node);
    instance.setElementChangeListener?.((previousNode, nextNode) => {
      this.trackInstanceNode(instance, previousNode);
      this.trackInstanceNode(instance, nextNode);
    });
    return node;
  }

  public patch(
    oldVNode: ComponentNode,
    newVNode: ComponentNode,
    currentNode: Node,
    context: RenderRuntimeContext
  ): Node {
    if (currentNode.nodeType === Node.COMMENT_NODE) {
      const nextNode = this.mount(newVNode, context);
      currentNode.parentNode?.replaceChild(nextNode, currentNode);
      return nextNode;
    }

    if (newVNode.directions?.if === false) {
      const nextNode = document.createComment('if');
      currentNode.parentNode?.replaceChild(nextNode, currentNode);
      this.unmount(oldVNode, currentNode, context);
      return nextNode;
    }

    const instance = this.instances.get(currentNode);

    if (instance && oldVNode.component === newVNode.component) {
      this.syncEmitters(instance, newVNode.emitters ?? {});
      instance.setProps(this.createProps(newVNode));
      const nextNode = instance.getElement() ?? currentNode;
      this.trackInstanceNode(instance, nextNode);
      return nextNode;
    }

    const nextNode = this.mount(newVNode, context);
    currentNode.parentNode?.replaceChild(nextNode, currentNode);
    this.unmount(oldVNode, currentNode, context);
    return nextNode;
  }

  public unmount(
    _vnode: ComponentNode,
    currentNode: Node,
    context: RenderRuntimeContext
  ): void {
    const instance = this.instances.get(currentNode);
    if (instance) {
      this.clearEmitters(instance);
      instance.unmount();
      this.clearInstanceNodes(instance);
      context.unregisterChild(instance);
    }
  }

  private createProps(vnode: ComponentNode): ComponentProps {
    return {
      ...(vnode.props ?? {}),
      children: vnode.children ?? [],
    };
  }

  private syncEmitters(
    instance: ComponentInstance,
    emitters: NonNullable<ComponentNode['emitters']>
  ): void {
    const current = this.emitterUnsubscribers.get(instance) ?? new Map();

    current.forEach(({ listener: currentListener, unsubscribe }, eventName) => {
      const listener = emitters[eventName];
      if (!listener || listener !== currentListener) {
        unsubscribe();
        current.delete(eventName);
      }
    });

    Object.entries(emitters).forEach(([eventName, listener]) => {
      if (current.get(eventName)?.listener === listener) {
        return;
      }

      current.set(eventName, {
        listener,
        unsubscribe: instance.on(eventName, listener),
      });
    });

    this.emitterUnsubscribers.set(instance, current);
  }

  private clearEmitters(instance: ComponentInstance): void {
    this.emitterUnsubscribers.get(instance)?.forEach(({ unsubscribe }) => {
      unsubscribe();
    });
    this.emitterUnsubscribers.delete(instance);
  }

  private trackInstanceNode(instance: ComponentInstance, node: Node): void {
    this.instances.set(node, instance);
    const nodes = this.instanceNodes.get(instance) ?? new Set<Node>();
    nodes.add(node);
    this.instanceNodes.set(instance, nodes);
  }

  private clearInstanceNodes(instance: ComponentInstance): void {
    this.instanceNodes.get(instance)?.forEach((node) => {
      this.instances.delete(node);
    });
    this.instanceNodes.delete(instance);
  }
}

export class SlotRenderStrategy implements RenderStrategy<SlotProvider> {
  private readonly renderedChildren = new WeakMap<
    HTMLElement,
    Array<VNode | string>
  >();

  public matches(vnode: Renderable): vnode is SlotProvider {
    return typeof vnode === 'object' && vnode !== null && isSlotProvider(vnode);
  }

  public mount(vnode: SlotProvider, context: RenderRuntimeContext): Node {
    if (vnode.directions?.if === false) {
      return document.createComment('if');
    }

    const slotContainer = document.createElement('div');
    slotContainer.setAttribute('data-slot', vnode.props.name);
    this.mountSlotChildren(
      slotContainer,
      this.resolveChildren(vnode, context),
      context
    );
    return slotContainer;
  }

  public patch(
    oldVNode: SlotProvider,
    newVNode: SlotProvider,
    currentNode: Node,
    context: RenderRuntimeContext
  ): Node {
    if (currentNode.nodeType === Node.COMMENT_NODE) {
      const nextNode = this.mount(newVNode, context);
      currentNode.parentNode?.replaceChild(nextNode, currentNode);
      return nextNode;
    }

    if (newVNode.directions?.if === false) {
      const nextNode = document.createComment('if');
      currentNode.parentNode?.replaceChild(nextNode, currentNode);
      this.unmount(oldVNode, currentNode, context);
      return nextNode;
    }

    if (currentNode instanceof HTMLElement) {
      currentNode.setAttribute('data-slot', newVNode.props.name);
      this.replaceSlotChildren(currentNode, oldVNode, newVNode, context);
    }
    return currentNode;
  }

  public unmount(
    _vnode: SlotProvider,
    currentNode: Node,
    context: RenderRuntimeContext
  ): void {
    if (!(currentNode instanceof HTMLElement)) {
      return;
    }

    this.unmountSlotChildren(currentNode, context);
    this.renderedChildren.delete(currentNode);
  }

  private resolveChildren(
    vnode: SlotProvider,
    context: RenderRuntimeContext
  ): Array<VNode | string> {
    return context.slots[vnode.props.name] ?? vnode.children ?? [];
  }

  private replaceSlotChildren(
    element: HTMLElement,
    _oldVNode: SlotProvider,
    newVNode: SlotProvider,
    context: RenderRuntimeContext
  ): void {
    this.unmountSlotChildren(element, context);
    element.textContent = '';
    this.mountSlotChildren(
      element,
      this.resolveChildren(newVNode, context),
      context
    );
  }

  private mountSlotChildren(
    element: HTMLElement,
    children: Array<VNode | string>,
    context: RenderRuntimeContext
  ): void {
    children.forEach((child) => {
      element.appendChild(context.renderer.mount(child, context));
    });
    this.renderedChildren.set(element, children);
  }

  private unmountSlotChildren(
    element: HTMLElement,
    context: RenderRuntimeContext
  ): void {
    const children = this.renderedChildren.get(element) ?? [];
    children.forEach((child, index) => {
      const childNode = element.childNodes[index];
      if (childNode) {
        context.renderer.unmount(child, childNode, context);
      }
    });
  }
}

export class ElementRenderStrategy implements RenderStrategy<HTMLNode> {
  private readonly listeners = new WeakMap<
    HTMLElement,
    Map<string, { eventName: string; listener: EventListener }>
  >();
  private readonly effects = new WeakMap<HTMLElement, Set<ReactiveEffect>>();
  private readonly modelBindings = new ModelBindingController();

  public matches(vnode: Renderable): vnode is HTMLNode {
    return typeof vnode === 'object' && vnode !== null && isHTMLNode(vnode);
  }

  public mount(vnode: HTMLNode, context: RenderRuntimeContext): Node {
    if (vnode.directions?.if === false) {
      return document.createComment('if');
    }

    const element = document.createElement(vnode.tag);
    this.applyProps(element, {}, vnode.props ?? {}, context);
    this.updateListeners(element, {}, this.collectListeners(vnode));

    (vnode.children ?? []).forEach((child) => {
      element.appendChild(context.renderer.mount(child, context));
    });
    this.applyDirections(element, undefined, vnode.directions, context);

    return element;
  }

  public patch(
    oldVNode: HTMLNode,
    newVNode: HTMLNode,
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
    this.updateChildren(
      currentNode,
      oldVNode.children ?? [],
      newVNode.children ?? [],
      context
    );
    this.applyDirections(
      currentNode,
      oldVNode.directions,
      newVNode.directions,
      context
    );

    return currentNode;
  }

  public unmount(
    vnode: HTMLNode,
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

    (vnode.children ?? []).forEach((child, index) => {
      const childNode = currentNode.childNodes[index];
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
      } else {
        element.removeAttribute(key);
      }
    });

    Object.entries(newProps).forEach(([key, value]) => {
      if (isEventProp(key)) {
        return;
      }

      if (key === 'className' || key === 'class') {
        element.className = String(value ?? '');
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

  private updateChildren(
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
