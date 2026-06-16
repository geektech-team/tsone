import { describe, expect, it } from 'bun:test';

import { reactive, effect, ReactiveSystem } from '../reactive';

describe('ReactiveSystem', () => {
  describe('reactive', () => {
    it('应该正确代理基本类型属性的get和set操作', () => {
      const original = { count: 0 };
      const observed = reactive(original);

      expect(observed.count).toBe(0);
      observed.count = 1;
      expect(observed.count).toBe(1);
      expect(original.count).toBe(1);
    });

    it('应该正确处理嵌套对象', () => {
      const original = { nested: { count: 0 } };
      const observed = reactive(original);

      expect(observed.nested.count).toBe(0);
      observed.nested.count = 1;
      expect(observed.nested.count).toBe(1);
      expect(original.nested.count).toBe(1);
    });

    it('不应重复创建响应式对象', () => {
      const original = { count: 0 };
      const observed1 = reactive(original);
      const observed2 = reactive(observed1);

      expect(observed1).toBe(observed2);
    });
  });

  describe('effect', () => {
    it('应该正确收集和触发依赖', () => {
      const observed = reactive({ count: 0 });
      let dummy = 0;

      effect(() => {
        dummy = observed.count;
      });

      expect(dummy).toBe(0);
      observed.count++;
      expect(dummy).toBe(1);
    });

    it('应该处理多个effect', () => {
      const observed = reactive({ count: 0 });
      let dummy1 = 0;
      let dummy2 = 0;

      effect(() => {
        dummy1 = observed.count;
      });

      effect(() => {
        dummy2 = observed.count * 2;
      });

      expect(dummy1).toBe(0);
      expect(dummy2).toBe(0);

      observed.count = 2;
      expect(dummy1).toBe(2);
      expect(dummy2).toBe(4);
    });

    it('应该正确处理嵌套的effect', () => {
      const observed = reactive({ foo: 0, bar: 0 });
      let dummy = 0;

      effect(() => {
        effect(() => {
          dummy = observed.bar;
        });
        observed.foo;
      });

      expect(dummy).toBe(0);
      observed.bar = 1;
      expect(dummy).toBe(1);
    });
  });

  describe('单例模式', () => {
    it('应该始终返回相同的实例', () => {
      const instance1 = ReactiveSystem.getInstance();
      const instance2 = ReactiveSystem.getInstance();

      expect(instance1).toBe(instance2);
    });
  });
});
