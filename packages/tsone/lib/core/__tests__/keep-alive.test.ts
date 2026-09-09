import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { Component } from '../component';
import { flushSync } from '../reactive';
import { createComponent, VNode } from '../vnode';
import { KeepAlive } from '../animation/KeepAlive';

class KeepAliveTab extends Component<object, { count: number }> {
  static instances: KeepAliveTab[] = [];

  constructor(props?: object) {
    super(props);
    KeepAliveTab.instances.push(this);
  }

  protected initState(): { count: number } {
    return { count: 0 };
  }

  protected initStyles(): void {}

  render(): VNode {
    return {
      tag: 'div',
      props: { class: 'tab' },
      children: [`count:${this.state.count}`],
    };
  }
}

class KeepAliveHost extends Component<object, { active: string }> {
  protected initState(): { active: string } {
    return { active: 'a' };
  }

  protected initStyles(): void {}

  render(): VNode {
    return {
      component: KeepAlive,
      props: { activeKey: this.state.active },
      children: [
        createComponent(KeepAliveTab, {}, [], 'a'),
        createComponent(KeepAliveTab, {}, [], 'b'),
      ],
    };
  }
}

describe('KeepAlive', () => {
  let container: HTMLElement;

  beforeEach(() => {
    document.head.innerHTML = '';
    container = document.createElement('div');
    document.body.appendChild(container);
    KeepAliveTab.instances = [];
  });

  afterEach(() => {
    if (container.parentNode) {
      document.body.removeChild(container);
    }
  });

  it('挂载时渲染全部子组件且仅活跃项可见', () => {
    const host = new KeepAliveHost();
    host.mount(container);

    expect(KeepAliveTab.instances).toHaveLength(2);

    const items = container.querySelectorAll('.keep-alive-item');
    expect(items[0].style.display).not.toBe('none');
    expect(items[1].style.display).toBe('none');
  });

  it('切换 activeKey 时不重建实例并切换可见性', () => {
    const host = new KeepAliveHost();
    host.mount(container);

    host.state.active = 'b';
    flushSync();

    expect(KeepAliveTab.instances).toHaveLength(2);

    const items = container.querySelectorAll('.keep-alive-item');
    expect(items[0].style.display).toBe('none');
    expect(items[1].style.display).not.toBe('none');
  });

  it('切换后状态保留', () => {
    const host = new KeepAliveHost();
    host.mount(container);

    // 修改第一个 tab（key 'a'）的内部状态
    KeepAliveTab.instances[0].state.count = 5;
    flushSync();

    host.state.active = 'b';
    flushSync();
    host.state.active = 'a';
    flushSync();

    const items = container.querySelectorAll('.keep-alive-item');
    expect(items[0].style.display).not.toBe('none');
    expect(items[0].textContent).toContain('count:5');
  });

  it('无 key 的子组件抛出错误', () => {
    class BadKeepAliveHost extends Component {
      protected initState(): object {
        return {};
      }

      protected initStyles(): void {}

      render(): VNode {
        return {
          component: KeepAlive,
          props: { activeKey: 'a' },
          children: [{ component: KeepAliveTab }],
        };
      }
    }

    const host = new BadKeepAliveHost();
    expect(() => host.mount(container)).toThrow(
      'KeepAlive children must have unique keys'
    );
  });
});
