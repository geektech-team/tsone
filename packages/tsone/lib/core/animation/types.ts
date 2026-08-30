import type { EventListeners, HTMLNode, HTMLProps, VNode } from '../vnode';

export const TRANSITION_ANIMATION_TYPES = [
  'fade',
  'slide-up',
  'slide-down',
  'slide-left',
  'slide-right',
  'scale',
] as const;

export type TransitionAnimationType =
  (typeof TRANSITION_ANIMATION_TYPES)[number];

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

export function validateTransitionGroupChildren(
  children: Array<VNode | string>
): VNode[] {
  const keys = new Set<string | number>();

  return children.map((child) => {
    if (
      typeof child === 'string' ||
      child.key === undefined ||
      keys.has(child.key)
    ) {
      throw new Error('TransitionGroup children must have unique keys');
    }

    keys.add(child.key);
    return child;
  });
}
