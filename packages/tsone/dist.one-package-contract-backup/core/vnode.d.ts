import type { AnyComponentConstructor, ComponentConstructor, ComponentEventListener, ComponentProps } from './component';
import type { ModelBinding } from './model';
export interface ComponentType {
    mount(container: HTMLElement): void;
    unmount(): void;
    on(eventName: string, listener: ComponentEventListener): () => void;
}
type VNodeComponentProps = ComponentProps;
export type VNodeComponentConstructor<P extends VNodeComponentProps = VNodeComponentProps> = ComponentConstructor<P> | AnyComponentConstructor;
export type HTMLPropValue = string | number | boolean | null | undefined | Record<string, string | number> | EventListener;
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
export interface ComponentNode<P extends VNodeComponentProps = VNodeComponentProps> extends VNodeBase {
    component: VNodeComponentConstructor<P>;
    props?: P;
    children?: Array<VNode | string>;
    emitters?: Record<string, ComponentEventListener>;
}
export interface SlotProvider extends VNodeBase {
    tag: 'slot';
    props: {
        name: string;
    };
    children?: Array<VNode | string>;
}
export interface SlotInjector extends VNodeBase {
    tag: string;
    slot: string;
}
export type VNode = HTMLNode | ComponentNode | SlotProvider | SlotInjector;
export type ElementShortcutOptions = Omit<HTMLNode, 'tag'>;
export type ElementShortcut = (options?: ElementShortcutOptions) => HTMLNode;
export declare function isComponentNode(vnode: VNode): vnode is ComponentNode;
export declare function isHTMLNode(vnode: VNode): vnode is HTMLNode;
export declare function isSlotProvider(vnode: VNode): vnode is SlotProvider;
export declare function h(tag: string, props?: HTMLProps, children?: Array<VNode | string>, listeners?: EventListeners, key?: string | number, directions?: Directions): HTMLNode;
export declare function Tag(tag: string, options?: ElementShortcutOptions): HTMLNode;
export declare const Div: ElementShortcut;
export declare const Span: ElementShortcut;
export declare const P: ElementShortcut;
export declare const Button: ElementShortcut;
export declare const Input: ElementShortcut;
export declare const Section: ElementShortcut;
export declare const Main: ElementShortcut;
export declare const Header: ElementShortcut;
export declare const Footer: ElementShortcut;
export declare const Nav: ElementShortcut;
export declare const Article: ElementShortcut;
export declare const Aside: ElementShortcut;
export declare const H1: ElementShortcut;
export declare const H2: ElementShortcut;
export declare const H3: ElementShortcut;
export declare const H4: ElementShortcut;
export declare const H5: ElementShortcut;
export declare const H6: ElementShortcut;
export declare const Strong: ElementShortcut;
export declare const Em: ElementShortcut;
export declare const Small: ElementShortcut;
export declare const Pre: ElementShortcut;
export declare const Code: ElementShortcut;
export declare const Blockquote: ElementShortcut;
export declare const Ul: ElementShortcut;
export declare const Ol: ElementShortcut;
export declare const Li: ElementShortcut;
export declare const A: ElementShortcut;
export declare const Img: ElementShortcut;
export declare const Form: ElementShortcut;
export declare const Label: ElementShortcut;
export declare const Textarea: ElementShortcut;
export declare const Select: ElementShortcut;
export declare const Option: ElementShortcut;
export declare const Table: ElementShortcut;
export declare const Thead: ElementShortcut;
export declare const Tbody: ElementShortcut;
export declare const Tr: ElementShortcut;
export declare const Th: ElementShortcut;
export declare const Td: ElementShortcut;
export declare function createComponent<P extends VNodeComponentProps>(componentClass: ComponentConstructor<P>, props?: P, children?: Array<VNode | string>, key?: string | number, directions?: Directions): ComponentNode<P>;
export declare function slot(name: string, key?: string | number, directions?: Directions): SlotProvider;
export declare function each<T>(items: readonly T[], render: (item: T, index: number) => VNode | string, key: (item: T, index: number) => string | number): VNode[];
export {};
