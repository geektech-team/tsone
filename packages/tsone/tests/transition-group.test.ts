import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import * as publicApi from '../lib';
import { Component, TransitionGroup, each } from '../lib';
import type { EventListeners, HTMLProps, VNode } from '../lib';

interface AnimatedItemState {
  items: Array<{ id: string; label: string }>;
}

class AnimatedListHost extends Component<
  Record<string, never>,
  AnimatedItemState
> {
  protected initState(): AnimatedItemState {
    return { items: [{ id: 'a', label: 'A' }] };
  }

  protected initStyles(): void {}

  protected render(): VNode {
    return {
      component: TransitionGroup,
      props: { tag: 'ul', type: 'slide-up', duration: 200 },
      children: each(
        this.state.items,
        (item) => ({
          tag: 'li',
          props: { 'data-id': item.id },
          children: [item.label],
        }),
        (item) => item.id
      ),
    };
  }
}

interface AnimationRecord {
  element: HTMLElement;
  keyframes: Keyframe[];
  options: KeyframeAnimationOptions;
}

const animationRecords: AnimationRecord[] = [];
const originalAnimate = Object.getOwnPropertyDescriptor(
  HTMLElement.prototype,
  'animate'
);

beforeEach(() => {
  animationRecords.length = 0;
  Object.defineProperty(HTMLElement.prototype, 'animate', {
    configurable: true,
    writable: true,
    value(
      this: HTMLElement,
      frames: Keyframe[] | PropertyIndexedKeyframes | null,
      options?: number | KeyframeAnimationOptions
    ): Animation {
      animationRecords.push({
        element: this,
        keyframes: Array.isArray(frames) ? frames : [],
        options:
          typeof options === 'object' && options !== null ? options : {},
      });
      return {
        cancel(): void {},
        finished: new Promise<Animation>(() => {}),
      } as Animation;
    },
  });
});

afterEach(() => {
  if (originalAnimate) {
    Object.defineProperty(
      HTMLElement.prototype,
      'animate',
      originalAnimate
    );
  } else {
    Reflect.deleteProperty(HTMLElement.prototype, 'animate');
  }
});

interface ExpectedTransitionGroupProps {
  tag?: string;
  type?:
    | 'fade'
    | 'slide-up'
    | 'slide-down'
    | 'slide-left'
    | 'slide-right'
    | 'scale';
  duration?: number;
  elementProps?: HTMLProps;
  listeners?: EventListeners;
  children?: VNode[];
}

type ExpectedTransitionGroupConstructor = new (
  props?: ExpectedTransitionGroupProps
) => {
  mount(container: HTMLElement): void;
  mountToNode(): Node;
};

const api = publicApi as unknown as Record<string, unknown>;

describe('TransitionGroup', () => {
  it('exports a component that renders a default div wrapper', () => {
    expect(typeof api.TransitionGroup).toBe('function');
    const TransitionGroup =
      api.TransitionGroup as ExpectedTransitionGroupConstructor;
    const container = document.createElement('div');
    const group = new TransitionGroup({
      children: [{ tag: 'span', key: 'first', children: ['First'] }],
    });

    group.mount(container);

    expect(container.firstElementChild?.tagName).toBe('DIV');
    expect(container.textContent).toBe('First');
  });

  it('rejects direct children without keys', () => {
    const TransitionGroup =
      api.TransitionGroup as ExpectedTransitionGroupConstructor;
    const group = new TransitionGroup({
      children: [{ tag: 'span', children: ['Missing key'] }],
    });

    expect(() => group.mountToNode()).toThrow(
      'TransitionGroup children must have unique keys'
    );
  });

  it('rejects duplicate direct child keys', () => {
    const TransitionGroup =
      api.TransitionGroup as ExpectedTransitionGroupConstructor;
    const group = new TransitionGroup({
      children: [
        { tag: 'span', key: 'same', children: ['First'] },
        { tag: 'span', key: 'same', children: ['Second'] },
      ],
    });

    expect(() => group.mountToNode()).toThrow(
      'TransitionGroup children must have unique keys'
    );
  });

  it('animates initial and newly added keyed children', () => {
    const container = document.createElement('div');
    const host = new AnimatedListHost();

    host.mount(container);

    const firstItem = container.querySelector<HTMLElement>('[data-id="a"]');
    expect(
      animationRecords.find((record) => record.element === firstItem)
    ).toMatchObject({
      keyframes: [
        { opacity: 0, transform: 'translateY(12px)' },
        { opacity: 1, transform: 'translateY(0)' },
      ],
      options: { duration: 200, easing: 'ease', fill: 'both' },
    });

    host.state.items = [
      ...host.state.items,
      { id: 'b', label: 'B' },
    ];

    const secondItem =
      container.querySelector<HTMLElement>('[data-id="b"]');
    expect(container.querySelectorAll('li')).toHaveLength(2);
    expect(
      animationRecords.find((record) => record.element === secondItem)
    ).toBeDefined();
  });

  it('moves retained keyed nodes without starting another animation', () => {
    const container = document.createElement('div');
    const host = new AnimatedListHost();
    host.state.items = [
      { id: 'a', label: 'A' },
      { id: 'b', label: 'B' },
    ];
    host.mount(container);
    const firstNode =
      container.querySelector<HTMLElement>('[data-id="a"]');
    const initialAnimationCount = animationRecords.length;

    host.state.items = [...host.state.items].reverse();

    const items = container.querySelectorAll('li');
    expect(items[1]).toBe(firstNode);
    expect(animationRecords).toHaveLength(initialAnimationCount);
  });
});
