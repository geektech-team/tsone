import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import * as publicApi from '../lib';
import { Component, TransitionGroup, each } from '../lib';
import type {
  EventListeners,
  HTMLProps,
  TransitionAnimationType,
  TransitionGroupProps,
  VNode,
} from '../lib';

interface AnimatedItemState {
  items: Array<{ id: string; label: string }>;
}

interface AnimatedItemProps {
  id: string;
  label: string;
}

class AnimatedItem extends Component<AnimatedItemProps> {
  public static unmountedCount = 0;

  protected initState(): object {
    return {};
  }

  protected initStyles(): void {}

  protected render(): VNode {
    return {
      tag: 'li',
      props: { 'data-id': this.props.id },
      children: [this.props.label],
    };
  }

  protected onUnmounted(): void {
    AnimatedItem.unmountedCount += 1;
  }
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
        (item) => ({ component: AnimatedItem, props: item }),
        (item) => item.id
      ),
    };
  }
}

interface AnimationRecord {
  element: HTMLElement;
  keyframes: Keyframe[];
  options: KeyframeAnimationOptions;
  resolve(): void;
  cancelCount: number;
}

const animationRecords: AnimationRecord[] = [];
const originalAnimate = Object.getOwnPropertyDescriptor(
  HTMLElement.prototype,
  'animate'
);
const originalMatchMedia = window.matchMedia;

function setReducedMotion(reduced: boolean): void {
  window.matchMedia = ((query: string) => ({
    matches: reduced && query === '(prefers-reduced-motion: reduce)',
  })) as typeof window.matchMedia;
}

function finishAnimation(element: Element | null): void {
  if (!element) {
    throw new Error('Expected an element with an animation');
  }
  const animation = animationRecords.findLast(
    (record) => record.element === element
  );
  if (!animation) {
    throw new Error('Expected an animation for element');
  }
  animation.resolve();
}

beforeEach(() => {
  animationRecords.length = 0;
  AnimatedItem.unmountedCount = 0;
  window.matchMedia = originalMatchMedia;
  Object.defineProperty(HTMLElement.prototype, 'animate', {
    configurable: true,
    writable: true,
    value(
      this: HTMLElement,
      frames: Keyframe[] | PropertyIndexedKeyframes | null,
      options?: number | KeyframeAnimationOptions
    ): Animation {
      let resolveFinished!: (animation: Animation) => void;
      let rejectFinished!: (reason?: unknown) => void;
      const finished = new Promise<Animation>((resolve, reject) => {
        resolveFinished = resolve;
        rejectFinished = reject;
      });
      const record: AnimationRecord = {
        element: this,
        keyframes: Array.isArray(frames) ? frames : [],
        options: typeof options === 'object' && options !== null ? options : {},
        resolve: () => resolveFinished(animation),
        cancelCount: 0,
      };
      const animation = {
        cancel(): void {
          record.cancelCount += 1;
          rejectFinished(new DOMException('Animation cancelled', 'AbortError'));
        },
        finished,
      } as Animation;

      animationRecords.push(record);
      return animation;
    },
  });
});

afterEach(() => {
  if (originalAnimate) {
    Object.defineProperty(HTMLElement.prototype, 'animate', originalAnimate);
  } else {
    Reflect.deleteProperty(HTMLElement.prototype, 'animate');
  }
  window.matchMedia = originalMatchMedia;
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

  it.each([
    [
      { type: 'zoom' as TransitionAnimationType },
      'Unknown TransitionGroup animation type "zoom"',
    ],
    [
      { duration: -1 },
      'TransitionGroup duration must be a non-negative finite number',
    ],
    [
      { duration: Number.NaN },
      'TransitionGroup duration must be a non-negative finite number',
    ],
    [
      { duration: Number.POSITIVE_INFINITY },
      'TransitionGroup duration must be a non-negative finite number',
    ],
    [{ tag: ' ' }, 'TransitionGroup tag must not be empty'],
  ] as Array<[Partial<TransitionGroupProps>, string]>)(
    'rejects invalid transition group props',
    (props, message) => {
      const group = new TransitionGroup({
        ...props,
        children: [{ tag: 'span', key: 'one' }],
      });

      expect(() => group.mountToNode()).toThrow(message);
    }
  );

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

    host.state.items = [...host.state.items, { id: 'b', label: 'B' }];

    const secondItem = container.querySelector<HTMLElement>('[data-id="b"]');
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
    const firstNode = container.querySelector<HTMLElement>('[data-id="a"]');
    const initialAnimationCount = animationRecords.length;

    host.state.items = [...host.state.items].reverse();

    const items = container.querySelectorAll('li');
    expect(items[1]).toBe(firstNode);
    expect(animationRecords).toHaveLength(initialAnimationCount);
  });

  it('keeps a removed component mounted until its exit animation finishes', async () => {
    const container = document.createElement('div');
    const host = new AnimatedListHost();
    host.mount(container);
    const item = container.querySelector('[data-id="a"]');

    host.state.items = [];

    expect(container.querySelector('[data-id="a"]')).toBeTruthy();
    expect(AnimatedItem.unmountedCount).toBe(0);

    finishAnimation(item);
    await Promise.resolve();
    await Promise.resolve();

    expect(container.querySelector('[data-id="a"]')).toBeNull();
    expect(AnimatedItem.unmountedCount).toBe(1);
  });

  it('reactivates the same node when an exiting key returns', async () => {
    const container = document.createElement('div');
    const host = new AnimatedListHost();
    host.mount(container);
    const original = container.querySelector('[data-id="a"]');

    host.state.items = [];
    host.state.items = [{ id: 'a', label: 'Updated' }];
    await Promise.resolve();

    expect(container.querySelector('[data-id="a"]')).toBe(original);
    expect(original?.textContent).toBe('Updated');
    expect(AnimatedItem.unmountedCount).toBe(0);
  });

  it('synchronously cleans active and exiting children when the group unmounts', () => {
    const container = document.createElement('div');
    const host = new AnimatedListHost();
    host.mount(container);

    host.state.items = [{ id: 'b', label: 'B' }];
    host.unmount();

    expect(container.childNodes).toHaveLength(0);
    expect(AnimatedItem.unmountedCount).toBe(2);
  });

  it('removes an exiting child immediately when reduced motion is enabled', () => {
    const container = document.createElement('div');
    const host = new AnimatedListHost();
    host.mount(container);
    setReducedMotion(true);

    host.state.items = [];

    expect(container.querySelector('[data-id="a"]')).toBeNull();
    expect(AnimatedItem.unmountedCount).toBe(1);
  });

  it('removes an exiting child immediately without Web Animations', () => {
    const container = document.createElement('div');
    const host = new AnimatedListHost();
    host.mount(container);
    Reflect.deleteProperty(HTMLElement.prototype, 'animate');

    host.state.items = [];

    expect(container.querySelector('[data-id="a"]')).toBeNull();
    expect(AnimatedItem.unmountedCount).toBe(1);
  });
});
