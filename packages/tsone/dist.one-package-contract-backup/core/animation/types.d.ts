import { type EventListeners, type HTMLNode, type HTMLProps, type VNode } from '../vnode';
export declare const TRANSITION_ANIMATION_TYPES: readonly ["fade", "slide-up", "slide-down", "slide-left", "slide-right", "scale"];
export type TransitionAnimationType = (typeof TRANSITION_ANIMATION_TYPES)[number];
export interface TransitionGroupOptions {
    type: TransitionAnimationType;
    duration: number;
}
export interface TransitionGroupProps {
    tag?: string;
    type?: TransitionAnimationType;
    duration?: number;
    elementProps?: HTMLProps;
    listeners?: EventListeners;
    children?: VNode[];
}
export interface TransitionGroupNode extends HTMLNode {
    transitionGroup: TransitionGroupOptions;
    children?: VNode[];
}
export type KeyedTransitionChild = VNode & {
    key: string | number;
};
export declare function normalizeTransitionGroupProps(props: TransitionGroupProps): Required<Pick<TransitionGroupProps, 'tag' | 'type' | 'duration'>>;
export declare function validateTransitionGroupChildren(children: Array<VNode | string>): KeyedTransitionChild[];
export declare function isTransitionGroupNode(vnode: unknown): vnode is TransitionGroupNode;
