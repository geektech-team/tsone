import {
  createDomWindow,
  installDomGlobals,
  type MediaQueryList,
} from '@geektech/tsone/dom';
import { flushSync } from '@geektech/tsone';

const domWindow = createDomWindow({ url: 'http://localhost/' });
installDomGlobals(domWindow);

const mediaQueryStub = (query: string): MediaQueryList => ({
  matches: false,
  media: query,
  onchange: null,
  addListener: () => {},
  removeListener: () => {},
  addEventListener: () => {},
  removeEventListener: () => {},
  dispatchEvent: () => false,
});

Object.defineProperty(window, 'matchMedia', {
  configurable: true,
  writable: true,
  value: mediaQueryStub,
});
Object.defineProperty(globalThis, 'matchMedia', {
  configurable: true,
  writable: true,
  value: mediaQueryStub,
});

if (typeof window.ResizeObserver === 'undefined') {
  window.ResizeObserver = class ResizeObserver {
    observe(): void {}
    unobserve(): void {}
    disconnect(): void {}
  };
}

// 组件更新通过响应式调度器批处理并在微任务中冲刷。测试在事件分发
// 或 setProps 后同步断言 DOM，此时微任务尚未执行；因此在事件分发后
// 同步冲刷调度器，模拟真实浏览器中"事件任务结束、渲染前微任务已执行"
// 的时序。
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

wrapDispatch(EventTarget.prototype);
