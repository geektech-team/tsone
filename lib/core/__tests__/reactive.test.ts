import { describe, expect, it, spyOn } from 'bun:test';

import {
  reactive,
  readonly,
  effect,
  ReactiveSystem,
  isReactive,
  isReadonly,
  ref,
  isRef,
  unref,
} from '../reactive';

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

    it('应该追踪数组中嵌套对象的属性变化', () => {
      const observed = reactive({ items: [{ count: 0 }] });
      let dummy = 0;

      effect(() => {
        dummy = observed.items[0].count;
      });

      observed.items[0].count = 1;

      expect(dummy).toBe(1);
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

  describe('readonly', () => {
    it('应该阻止嵌套数组和数组项被修改', () => {
      const warnSpy = spyOn(console, 'warn').mockImplementation(() => {});
      const original = { items: [{ count: 0 }] };
      const observed = readonly(original);

      expect(isReadonly(observed)).toBe(true);
      expect(isReactive(observed)).toBe(false);
      expect(isReadonly(observed.items)).toBe(true);
      expect(isReadonly(observed.items[0])).toBe(true);

      try {
        observed.items.push({ count: 1 });
      } catch {
        // Proxy set traps may throw in strict mode when readonly mutation fails.
      }

      try {
        (observed.items[0] as { count: number }).count = 2;
      } catch {
        // Proxy set traps may throw in strict mode when readonly mutation fails.
      }

      expect(original.items).toHaveLength(1);
      expect(original.items[0].count).toBe(0);
      warnSpy.mockRestore();
    });
  });

  describe('ref', () => {
    it('应该创建响应式单值引用并支持unref', () => {
      const count = ref(0);
      let dummy = 0;

      expect(isRef(count)).toBe(true);
      expect(isRef(1)).toBe(false);

      effect(() => {
        dummy = count.value;
      });

      count.value = 2;

      expect(dummy).toBe(2);
      expect(unref(count)).toBe(2);
      expect(unref('plain')).toBe('plain');
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
