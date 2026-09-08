import { Window } from 'happy-dom';
import { flushSync } from '@geektech/tsone';

// 根 bunfig 会先 preload tsone 的 setup-dom（已安装 happy-dom 全局）。
// 此时复用现有 window，只做原型包装与缺失补充，避免覆盖全局扩展
// （如 matchMedia、其他测试基设）。happy-dom 类原型是共享的，包装
// 任一 window 实例上的原型即对所有实例生效。
const happyWindow = new Window({ url: 'http://localhost/' });

{
  Object.assign(happyWindow, {
    Error,
    EvalError,
    RangeError,
    ReferenceError,
    SyntaxError,
    TypeError,
    URIError,
  });
  const domGlobals = [
    'window',
    'document',
    'Node',
    'Text',
    'Comment',
    'Element',
    'HTMLElement',
    'HTMLInputElement',
    'HTMLTextAreaElement',
    'HTMLSelectElement',
    'HTMLButtonElement',
    'DocumentFragment',
    'Event',
    'MouseEvent',
    'KeyboardEvent',
    'CustomEvent',
    'EventTarget',
    'history',
    'location',
    'navigator',
    'localStorage',
  ] as const;

  domGlobals.forEach((key) => {
    Object.defineProperty(globalThis, key, {
      configurable: true,
      writable: true,
      value: happyWindow[key],
    });
  });

  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }),
  });
}

if (typeof window.ResizeObserver === 'undefined') {
  window.ResizeObserver = class ResizeObserver {
    observe(): void {}
    unobserve(): void {}
    disconnect(): void {}
  };
}

// 组件更新通过响应式调度器批处理并在微任务中冲刷。测试同步 dispatchEvent
// 后立即断言 DOM，此时微任务尚未执行。在事件分发后同步冲刷调度器，
// 模拟真实浏览器中"事件任务结束、渲染前微任务已执行"的时序。
function wrapDispatch(proto: object): void {
  const original = (proto as { dispatchEvent?: (event: Event) => boolean })
    .dispatchEvent;
  if (typeof original !== 'function') {
    return;
  }
  Object.defineProperty(proto, 'dispatchEvent', {
    configurable: true,
    writable: true,
    value: function (this: EventTarget, event: Event): boolean {
      const result = original.call(this, event);
      flushSync();
      return result;
    },
  });
}

// happy-dom 在具体元素原型（HTMLButtonElement 等）上各自定义了
// dispatchEvent，EventTarget.prototype 上的实现并不被元素实例使用，
// 因此需要同时包装所有暴露的元素类原型。
console.log('[one-done]');
wrapDispatch(EventTarget.prototype);
Object.getOwnPropertyNames(happyWindow)
  .filter((name) => name.startsWith('HTML'))
  .forEach((name) => {
    const candidate = Reflect.get(happyWindow, name);
    if (typeof candidate !== 'function') {
      return;
    }
    const ctor = candidate as { prototype?: object };
    if (ctor.prototype) {
      wrapDispatch(ctor.prototype);
    }
  });
