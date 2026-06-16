import type {
  AnyComponentConstructor,
  ComponentConstructor,
  ComponentEventListener,
  ComponentProps,
} from './component';

export interface ComponentType {
  mount(container: HTMLElement): void;
  unmount(): void;
  on(eventName: string, listener: ComponentEventListener): void;
}

type VNodeComponentProps = ComponentProps;

export type VNodeComponentConstructor<
  P extends VNodeComponentProps = VNodeComponentProps,
> = ComponentConstructor<P> | AnyComponentConstructor;

export type HTMLPropValue =
  | string
  | number
  | boolean
  | null
  | undefined
  | Record<string, string | number>
  | EventListener;

export interface HTMLProps {
  [key: string]: HTMLPropValue;
  class?: string;
  className?: string;
  style?: Record<string, string | number>;
}

export interface EventListeners {
  [eventName: string]: (event: Event) => void;
}

export interface Directions {
  model?: string;
  if?: boolean;
  show?: boolean;
}

export interface HTMLNode {
  tag: string;
  props?: HTMLProps;
  children?: Array<VNode | string>;
  listeners?: EventListeners;
  key?: string | number;
  slot?: string;
  directions?: Directions;
}

export interface ComponentNode<
  P extends VNodeComponentProps = VNodeComponentProps,
> {
  component: VNodeComponentConstructor<P>;
  props?: P;
  children?: Array<VNode | string>;
  emitters?: Record<string, ComponentEventListener>;
  key?: string | number;
  slot?: string;
  directions?: Directions;
}

export interface SlotProvider {
  tag: 'slot';
  props: { name: string };
  children?: Array<VNode | string>;
  key?: string | number;
  directions?: Directions;
}

export interface SlotInjector {
  tag: string;
  slot: string;
  key?: string | number;
  directions?: Directions;
}

export type VNode = HTMLNode | ComponentNode | SlotProvider | SlotInjector;

export function isComponentNode(vnode: VNode): vnode is ComponentNode {
  return typeof vnode === 'object' && vnode !== null && 'component' in vnode;
}

export function isHTMLNode(vnode: VNode): vnode is HTMLNode {
  return (
    typeof vnode === 'object' &&
    vnode !== null &&
    'tag' in vnode &&
    vnode.tag !== 'slot'
  );
}

export function isSlotProvider(vnode: VNode): vnode is SlotProvider {
  return (
    typeof vnode === 'object' &&
    vnode !== null &&
    'tag' in vnode &&
    vnode.tag === 'slot'
  );
}

export function h(
  tag: string,
  props?: HTMLProps,
  children?: Array<VNode | string>,
  listeners?: EventListeners,
  key?: string | number,
  directions?: Directions
): HTMLNode {
  return {
    tag,
    props,
    children,
    listeners,
    key,
    directions,
  };
}

export function createComponent<P extends VNodeComponentProps>(
  componentClass: ComponentConstructor<P>,
  props?: P,
  children?: Array<VNode | string>,
  key?: string | number,
  directions?: Directions
): ComponentNode<P> {
  return {
    component: componentClass,
    props,
    children,
    key,
    directions,
  };
}

export function slot(
  name: string,
  key?: string | number,
  directions?: Directions
): SlotProvider {
  return {
    tag: 'slot',
    props: { name },
    key,
    directions,
  };
}
