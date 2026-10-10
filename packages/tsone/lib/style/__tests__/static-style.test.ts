import { afterEach, expect, test } from 'bun:test';
import { StyleManager, type StyleOptions } from '../StyleManager';

const originalFetch = globalThis.fetch;
const managers: StyleManager[] = [];
let sequence = 0;
const url = () => `https://styles.test/${++sequence}.css`;
const rule = (color = 'red'): StyleOptions => ({
  selector: '.same', properties: { color },
});
function manager(): StyleManager {
  const instance = new StyleManager();
  managers.push(instance);
  instance.addStyle('same', rule());
  return instance;
}
async function flush(): Promise<void> {
  await new Promise(resolve => setTimeout(resolve, 0));
}
function candidate(instance: StyleManager): Element {
  const element = instance.styleElement!.previousSibling!;
  expect((element as Element).tagName).toBe('LINK');
  return element as Element;
}
afterEach(() => {
  for (const instance of managers.splice(0)) instance.destroy();
  globalThis.fetch = originalFetch;
});

test('keeps synchronous CSS until load and restores its exact position on edits', async () => {
  const instance = manager();
  const inline = instance.styleElement!;
  const next = document.createElement('meta');
  inline.after(next);
  globalThis.fetch = async () => new Response(inline.textContent);
  instance.useStaticStyleSheet(url());
  expect(inline.isConnected).toBe(true);
  await flush();
  const link = candidate(instance);
  expect(link.getAttribute('media')).toBe('not all');
  link.dispatchEvent(new Event('load'));
  expect(instance.styleElement).toBeNull();
  expect(inline.isConnected).toBe(false);
  expect(link.nextSibling).toBe(next);
  instance.addStyle('same', rule('blue'));
  expect(link.isConnected).toBe(false);
  expect(instance.styleElement!.nextSibling).toBe(next);
  expect(instance.styleElement!.textContent).toContain('color: blue');
  instance.removeStyle('same');
  expect(instance.styleElement!.textContent).toBe('');
  next.remove();
});

test('compares the written snapshot rather than mutable rule objects', async () => {
  const instance = manager();
  const written = instance.styleElement!.textContent!;
  let finish!: (response: Response) => void;
  globalThis.fetch = () => new Promise(resolve => { finish = resolve; });
  instance.useStaticStyleSheet(url());
  await flush();
  instance.styles.get('same')!.properties.color = 'green';
  finish(new Response(written));
  await flush();
  candidate(instance).dispatchEvent(new Event('load'));
  expect(instance.styleElement).toBeNull();
  instance.addStyle('second', rule('blue'));
  expect(instance.styleElement!.textContent).toContain('color: green');
});

test.each(['different', 'reject', 'status', 'link-error'])(
  'keeps inline CSS on %s resource failure', async failure => {
    const instance = manager();
    const inline = instance.styleElement!;
    globalThis.fetch = async () => {
      if (failure === 'reject') throw new Error('offline');
      return new Response(failure === 'different' ? '.different{}' : inline.textContent,
        { status: failure === 'status' ? 404 : 200 });
    };
    instance.useStaticStyleSheet(url());
    await flush();
    if (failure === 'link-error') candidate(instance).dispatchEvent(new Event('error'));
    expect(instance.styleElement).toBe(inline);
    expect(inline.textContent).toContain('color: red');
    expect(inline.isConnected).toBe(true);
  }
);

test.each(['add', 'remove', 'clear', 'destroy'])(
  'invalidates late fetch after %s', async operation => {
    const instance = manager();
    const css = instance.styleElement!.textContent!;
    let finish!: (response: Response) => void;
    globalThis.fetch = () => new Promise(resolve => { finish = resolve; });
    instance.useStaticStyleSheet(url());
    await flush();
    if (operation === 'add') instance.addStyle('same', rule('blue'));
    if (operation === 'remove') instance.removeStyle('same');
    if (operation === 'clear') instance.clearStyles();
    if (operation === 'destroy') instance.destroy();
    finish(new Response(css));
    await flush();
    expect(instance.styleElement?.previousSibling?.nodeName).not.toBe('LINK');
    if (operation === 'destroy') {
      instance.addStyle('same', rule('green'));
      expect(instance.styleElement!.textContent).toContain('green');
    }
  }
);

test('instances share fetch but keep separate nodes, load order and lifecycle', async () => {
  const first = manager();
  const second = manager();
  const css = first.styleElement!.textContent!;
  let requests = 0;
  globalThis.fetch = async () => { requests++; return new Response(css); };
  const href = url();
  first.useStaticStyleSheet(href);
  second.useStaticStyleSheet(href);
  await flush();
  const firstLink = candidate(first);
  const secondLink = candidate(second);
  secondLink.dispatchEvent(new Event('load'));
  firstLink.dispatchEvent(new Event('load'));
  expect(firstLink.nextSibling).toBe(secondLink);
  expect(requests).toBe(1);
  first.destroy();
  expect(secondLink.isConnected).toBe(true);
  second.clearStyles();
  expect(secondLink.isConnected).toBe(false);
  expect(second.styleElement!.textContent).toBe('');
});

test('repeated requests and direct node edits cannot activate stale candidates', async () => {
  const instance = manager();
  const css = instance.styleElement!.textContent!;
  globalThis.fetch = async () => new Response(css);
  instance.useStaticStyleSheet(url());
  await flush();
  const old = candidate(instance);
  instance.useStaticStyleSheet(url());
  await flush();
  const current = candidate(instance);
  old.dispatchEvent(new Event('load'));
  expect(old.isConnected).toBe(false);
  expect(current.isConnected).toBe(true);
  instance.styleElement!.textContent = '.edited{}';
  current.dispatchEvent(new Event('load'));
  expect(instance.styleElement!.textContent).toBe('.edited{}');
  expect(current.isConnected).toBe(false);
});

test('base elements and overridden manager methods preserve inline behavior', async () => {
  const instance = manager();
  globalThis.fetch = async () => { throw new Error('must not fetch'); };
  const base = document.createElement('base');
  document.head.append(base);
  instance.useStaticStyleSheet(url());
  await flush();
  expect(instance.styleElement!.isConnected).toBe(true);
  base.remove();
  class CustomManager extends StyleManager {
    public override addStyle(name: string, options: StyleOptions): void {
      super.addStyle(name, options);
    }
  }
  const custom = new CustomManager();
  managers.push(custom);
  custom.addStyle('same', rule());
  custom.useStaticStyleSheet(url());
  await flush();
  expect(custom.styleElement!.previousSibling?.nodeName).not.toBe('LINK');
});

test('destroy preserves the existing clearStyles override hook', () => {
  let cleared = 0;
  class CustomManager extends StyleManager {
    public override clearStyles(): void { cleared++; super.clearStyles(); }
  }
  const custom = new CustomManager();
  custom.addStyle('same', rule());
  custom.destroy();
  expect(cleared).toBe(1);
});
