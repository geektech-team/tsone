import {
  createDomWindow,
  installDomGlobals,
  type MediaQueryList,
} from '../lib/dom';

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
