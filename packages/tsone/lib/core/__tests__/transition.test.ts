import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { Component } from '../component';
import { flushSync } from '../reactive';
import { VNode } from '../vnode';
import { Transition } from '../animation/Transition';

class TransitionHost extends Component<object, { show: boolean }> {
  protected initState(): { show: boolean } {
    return { show: true };
  }

  protected initStyles(): void {}

  render(): VNode {
    return {
      component: Transition,
      props: { show: this.state.show, name: 'test', duration: 20 },
      children: [
        {
          tag: 'div',
          props: { class: 'box', id: 'box' },
          children: ['content'],
        },
      ],
    };
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

describe('Transition', () => {
  let container: HTMLElement;

  beforeEach(() => {
    document.head.innerHTML = '';
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    if (container.parentNode) {
      document.body.removeChild(container);
    }
  });

  it('首次挂载 show=true 时直接渲染元素', () => {
    const host = new TransitionHost();
    host.mount(container);

    const box = container.querySelector('.box');
    expect(box).toBeTruthy();
    expect(box?.textContent).toBe('content');
    expect(box?.className).toBe('box');
  });

  it('show=false 时先播放离开动画再移除元素', async () => {
    const host = new TransitionHost();
    host.mount(container);

    host.state.show = false;
    flushSync();

    const leaving = container.querySelector('.box');
    expect(leaving).toBeTruthy();
    expect(leaving?.className).toContain('test-leave-from');
    expect(leaving?.className).toContain('test-leave-active');

    await sleep(30);

    expect(container.querySelector('.box')).toBeNull();
  });

  it('show=true 时播放进入动画且结束后保留元素', async () => {
    const host = new TransitionHost();
    host.mount(container);
    host.state.show = false;
    flushSync();
    await sleep(30);

    host.state.show = true;
    flushSync();

    const entering = container.querySelector('.box');
    expect(entering).toBeTruthy();
    expect(entering?.className).toContain('test-enter-from');

    await sleep(30);

    const settled = container.querySelector('.box');
    expect(settled).toBeTruthy();
    expect(settled?.className).toBe('box');
  });

  it('首次挂载 show=false 时不渲染元素', () => {
    class HiddenHost extends Component {
      protected initState(): object {
        return {};
      }

      protected initStyles(): void {}

      render(): VNode {
        return {
          component: Transition,
          props: { show: false },
          children: [{ tag: 'div', props: { class: 'box' } }],
        };
      }
    }

    const host = new HiddenHost();
    host.mount(container);

    expect(container.querySelector('.box')).toBeNull();
  });
});
