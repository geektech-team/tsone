import { Component } from '../component';
import { VNode } from '../vnode';
import { describe, expect, it, beforeEach, afterEach, spyOn } from 'bun:test';

class TestComponent extends Component {
  protected initState(): object {
    return { count: 0 };
  }

  protected initStyles(): void {
    // 测试组件不需要样式
  }

  render(): VNode {
    return {
      tag: 'div',
      props: { id: 'test-component' },
      children: [`Count: ${this.state.count}`],
    };
  }
}

describe('Component', () => {
  let component: TestComponent;
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    component = new TestComponent();
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  describe('生命周期', () => {
    it('应该正确执行mount和unmount', () => {
      component.mount(container);
      expect(container.querySelector('#test-component')).toBeTruthy();
      expect(container.textContent).toBe('Count: 0');

      component.unmount();
      expect(container.querySelector('#test-component')).toBeFalsy();
    });
  });

  describe('状态管理', () => {
    it('应该正确处理状态更新', () => {
      component.mount(container);
      const initialText = container.textContent;

      // 通过修改响应式状态来触发更新
      component.state.count = 1;
      expect(container.textContent).not.toBe(initialText);
      expect(container.textContent).toBe('Count: 1');
    });

    it('状态更新应该触发重新渲染', () => {
      const renderSpy = spyOn(component, 'render');
      component.mount(container);
      renderSpy.mockClear(); // 清除mount时的render调用

      component.state.count = 2;
      expect(renderSpy).toHaveBeenCalled();
    });
  });

  describe('错误处理', () => {
    it('应该捕获渲染错误', () => {
      const error = new Error('Render error');
      const consoleSpy = spyOn(console, 'error').mockImplementation(() => {});
      spyOn(component, 'render').mockImplementation(() => {
        throw error;
      });

      expect(() => component.mount(container)).toThrow(error);
      expect(consoleSpy).toHaveBeenCalledWith('组件渲染错误:', error);
      consoleSpy.mockRestore();
    });
  });
});
