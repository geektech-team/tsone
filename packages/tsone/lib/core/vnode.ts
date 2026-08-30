import type {
  AnyComponentConstructor,
  ComponentConstructor,
  ComponentEventListener,
  ComponentProps,
} from './component';
import type { ModelBinding } from './model';

export interface ComponentType {
  mount(container: HTMLElement): void;
  unmount(): void;
  on(eventName: string, listener: ComponentEventListener): () => void;
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
  model?: ModelBinding;
  if?: boolean;
  show?: boolean;
}

export interface VNodeBase {
  key?: string | number;
  slot?: string;
  directions?: Directions;
}

export interface HTMLNode extends VNodeBase {
  tag: string;
  props?: HTMLProps;
  children?: Array<VNode | string>;
  listeners?: EventListeners;
}

export interface ComponentNode<
  P extends VNodeComponentProps = VNodeComponentProps,
> extends VNodeBase {
  component: VNodeComponentConstructor<P>;
  props?: P;
  children?: Array<VNode | string>;
  emitters?: Record<string, ComponentEventListener>;
}

export interface SlotProvider extends VNodeBase {
  tag: 'slot';
  props: { name: string };
  children?: Array<VNode | string>;
}

export interface SlotInjector extends VNodeBase {
  tag: string;
  slot: string;
}

export type VNode = HTMLNode | ComponentNode | SlotProvider | SlotInjector;

export type ElementShortcutOptions = Omit<HTMLNode, 'tag'>;

export type ElementShortcut = (options?: ElementShortcutOptions) => HTMLNode;

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

export function Tag(
  tag: string,
  options: ElementShortcutOptions = {}
): HTMLNode {
  return {
    tag,
    ...options,
  };
}

function createElementFactory(tag: string): ElementShortcut {
  return (options: ElementShortcutOptions = {}) => Tag(tag, options);
}

export const Div = createElementFactory('div');
export const Span = createElementFactory('span');
export const P = createElementFactory('p');
export const Button = createElementFactory('button');
export const Input = createElementFactory('input');
export const Section = createElementFactory('section');
export const Main = createElementFactory('main');
export const Header = createElementFactory('header');
export const Footer = createElementFactory('footer');
export const Nav = createElementFactory('nav');
export const Article = createElementFactory('article');
export const Aside = createElementFactory('aside');
export const H1 = createElementFactory('h1');
export const H2 = createElementFactory('h2');
export const H3 = createElementFactory('h3');
export const H4 = createElementFactory('h4');
export const H5 = createElementFactory('h5');
export const H6 = createElementFactory('h6');
export const Strong = createElementFactory('strong');
export const Em = createElementFactory('em');
export const Small = createElementFactory('small');
export const Pre = createElementFactory('pre');
export const Code = createElementFactory('code');
export const Blockquote = createElementFactory('blockquote');
export const Ul = createElementFactory('ul');
export const Ol = createElementFactory('ol');
export const Li = createElementFactory('li');
export const A = createElementFactory('a');
export const Img = createElementFactory('img');
export const Form = createElementFactory('form');
export const Label = createElementFactory('label');
export const Textarea = createElementFactory('textarea');
export const Select = createElementFactory('select');
export const Option = createElementFactory('option');
export const Table = createElementFactory('table');
export const Thead = createElementFactory('thead');
export const Tbody = createElementFactory('tbody');
export const Tr = createElementFactory('tr');
export const Th = createElementFactory('th');
export const Td = createElementFactory('td');

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

export function each<T>(
  items: readonly T[],
  render: (item: T, index: number) => VNode | string,
  key: (item: T, index: number) => string | number
): VNode[] {
  return items.map((item, index) => {
    const vnode = render(item, index);
    if (typeof vnode === 'string') {
      throw new Error('each render callback must return a VNode');
    }

    return { ...vnode, key: key(item, index) };
  });
}
