import { describe, expect, it } from 'bun:test';
import * as publicApi from '../lib';
import type { EventListeners, HTMLProps, VNode } from '../lib';

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
});
