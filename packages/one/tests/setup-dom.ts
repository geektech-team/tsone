import {
  createDomWindow,
  installDomGlobals,
  type MediaQueryList,
} from '@geektech/tsone/dom';
import { flushSync } from '@geektech/tsone';

// 与 tsone / one-chart 的测试基建同构：基于 tsone 自研零依赖 DOM 环境，
// 不再引入 happy-dom。根 bunfig 会先 preload tsone 的 setup-dom（已安装
// 全局），此处再次安装幂等（同名键同值覆盖），保证本包单独跑测试时
// （bunfig.toml 只 preload 本文件）同样具备完整 DOM 环境。
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

// 组件更新通过响应式调度器批处理并在微任务中冲刷。测试在 dispatchEvent
// 后同步断言 DOM，此时微任务尚未执行；因此在事件分发后同步冲刷调度器，
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

wrapDispatch(domWindow.EventTarget.prototype);
Object.getOwnPropertyNames(domWindow)
  .filter((name) => name.startsWith('HTML'))
  .forEach((name) => {
    const candidate = Reflect.get(domWindow, name);
    if (typeof candidate !== 'function') {
      return;
    }
    const ctor = candidate as { prototype?: object };
    if (ctor.prototype) {
      wrapDispatch(ctor.prototype);
    }
  });
