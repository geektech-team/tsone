import {
  isHTMLNode,
  type EventListeners,
  type HTMLNode,
  type HTMLProps,
  type VNode,
} from '../vnode';

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

export type KeyedTransitionChild = VNode & {
  key: string | number;
};

export function normalizeTransitionGroupProps(
  props: TransitionGroupProps
): Required<Pick<TransitionGroupProps, 'tag' | 'type' | 'duration'>> {
  const tag = (props.tag ?? 'div').trim();
  const type = props.type ?? 'fade';
  const duration = props.duration ?? 300;

  if (!tag) {
    throw new Error('TransitionGroup tag must not be empty');
  }
  if (!TRANSITION_ANIMATION_TYPES.includes(type)) {
    throw new Error(`Unknown TransitionGroup animation type "${type}"`);
  }
  if (!Number.isFinite(duration) || duration < 0) {
    throw new Error(
      'TransitionGroup duration must be a non-negative finite number'
    );
  }

  return { tag, type, duration };
}

export function validateTransitionGroupChildren(
  children: Array<VNode | string>
): KeyedTransitionChild[] {
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
    return child as KeyedTransitionChild;
  });
}

export function isTransitionGroupNode(
  vnode: unknown
): vnode is TransitionGroupNode {
  return (
    typeof vnode === 'object' &&
    vnode !== null &&
    'transitionGroup' in vnode &&
    isHTMLNode(vnode as unknown as VNode)
  );
}
