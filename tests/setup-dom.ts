import { Window } from 'happy-dom';

const happyWindow = new Window({ url: 'http://localhost/' });
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
] as const;

domGlobals.forEach((key) => {
  Object.defineProperty(globalThis, key, {
    configurable: true,
    writable: true,
    value: happyWindow[key],
  });
});

window.ResizeObserver =
  window.ResizeObserver ??
  class ResizeObserver {
    observe(): void {}
    unobserve(): void {}
    disconnect(): void {}
  };

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
