import { beforeEach, describe, expect, it, mock } from 'bun:test';
import {
  Button,
  Component,
  Div,
  each,
  InjectionKey,
  Input,
  P,
  Span,
  VNode,
  computed,
  createApp,
  reactive,
} from '../lib';
import { RendererContext } from '../lib/core/renderer';
import { TemplateEngine } from '../lib/core/template';
import { createRouter, RouterLink, RouterView } from '../lib/router';

class ChildComponent extends Component<{ label: string }> {
  protected initState(): object {
    return {};
  }

  protected initStyles(): void {}

  protected render(): VNode {
    return {
      tag: 'span',
      props: { className: 'child' },
      children: [`Child ${this.props.label}`],
    };
  }
}

class StrategyHost extends Component {
  protected initState(): object {
    return {
      count: 0,
      name: 'Ada',
      visible: true,
    };
  }

  protected initStyles(): void {}

  protected render(): VNode {
    return {
      tag: 'div',
      props: { className: 'host', title: 'Count {{count}}' },
      children: [
        'Count {{count}}',
        {
          tag: 'section',
          directions: { show: this.state.visible },
          children: [
            {
              component: ChildComponent,
              props: { label: 'ok' },
            },
          ],
        },
        {
          tag: 'input',
          directions: { model: 'name' },
        },
      ],
    };
  }
}

class HomePage extends Component {
  protected initState(): object {
    return {};
  }

  protected initStyles(): void {}

  protected render(): VNode {
    return { tag: 'p', props: { id: 'home' }, children: ['Home'] };
  }
}

class AboutPage extends Component {
  protected initState(): object {
    return {};
  }

  protected initStyles(): void {}

  protected render(): VNode {
    return { tag: 'p', props: { id: 'about' }, children: ['About'] };
  }
}

class RoutedShell extends Component {
  protected initState(): object {
    return {};
  }

  protected initStyles(): void {}

  protected render(): VNode {
    return {
      tag: 'main',
      children: [
        {
          component: RouterLink,
          props: { to: '/about' },
          children: ['About link'],
        },
        { component: RouterView },
      ],
    };
  }
}

class KeyedList extends Component<
  Record<string, never>,
  { items: Array<{ id: string; label: string }> }
> {
  protected initState(): { items: Array<{ id: string; label: string }> } {
    return {
      items: [
        { id: 'a', label: 'Alpha' },
        { id: 'b', label: 'Beta' },
        { id: 'c', label: 'Gamma' },
      ],
    };
  }

  protected initStyles(): void {}

  protected render(): VNode {
    return {
      tag: 'ul',
      children: this.state.items.map((item) => ({
        tag: 'li',
        key: item.id,
        props: { 'data-id': item.id },
        children: [item.label],
      })),
    };
  }
}

class MixedKeyedList extends Component<
  Record<string, never>,
  { removeLeadingUnkeyedChild: boolean }
> {
  protected initState(): { removeLeadingUnkeyedChild: boolean } {
    return { removeLeadingUnkeyedChild: false };
  }

  protected initStyles(): void {}

  protected render(): VNode {
    return {
      tag: 'ul',
      children: this.state.removeLeadingUnkeyedChild
        ? [{ tag: 'li', key: 'stable', children: ['Stable'] }]
        : [
            { tag: 'li', children: ['Unkeyed'] },
            { tag: 'li', key: 'stable', children: ['Stable'] },
          ],
    };
  }
}

class SlotPanel extends Component {
  protected initState(): object {
    return {};
  }

  protected initStyles(): void {}

  protected render(): VNode {
    return {
      tag: 'article',
      props: { id: 'slot-panel' },
      children: [
        {
          tag: 'header',
          children: [{ tag: 'slot', props: { name: 'header' } }],
        },
        {
          tag: 'section',
          children: [{ tag: 'slot', props: { name: 'default' } }],
        },
        {
          tag: 'footer',
          children: [{ tag: 'slot', props: { name: 'footer' } }],
        },
      ],
    };
  }
}

class SlotHost extends Component {
  protected initState(): object {
    return {};
  }

  protected initStyles(): void {}

  protected render(): VNode {
    return {
      component: SlotPanel,
      children: [
        {
          tag: 'h1',
          slot: 'header',
          children: ['Projected title'],
        },
        {
          tag: 'p',
          children: ['Projected body'],
        },
        {
          tag: 'small',
          slot: 'footer',
          children: ['Projected footer'],
        },
      ],
    };
  }
}

class ShortcutHost extends Component<
  Record<string, never>,
  { content: string; name: string }
> {
  protected initState(): { content: string; name: string } {
    return {
      content: 'Shortcut content',
      name: 'Ada',
    };
  }

  protected initStyles(): void {}

  protected render(): VNode {
    return Div({
      props: { className: 'shortcut-host' },
      children: [
        Span({
          props: { className: 'shortcut-label' },
          children: ['Label'],
        }),
        P({
          props: { className: 'shortcut-content' },
          children: ['{{content}}'],
        }),
        Input({
          props: { 'aria-label': 'Name' },
          directions: { model: 'name' },
        }),
        Button({
          listeners: {
            click: () => {
              this.state.content = 'Clicked';
            },
          },
          children: ['Update'],
        }),
      ],
    });
  }
}

class ModelSwitchHost extends Component<
  Record<string, never>,
  { useFirst: boolean; first: string; second: string }
> {
  protected initState(): {
    useFirst: boolean;
    first: string;
    second: string;
  } {
    return {
      useFirst: true,
      first: 'alpha',
      second: 'beta',
    };
  }

  protected initStyles(): void {}

  protected render(): VNode {
    return Input({
      directions: {
        model: this.state.useFirst ? 'first' : 'second',
      },
    });
  }
}

class ConditionalChild extends Component {
  public static mountedCount = 0;
  public static unmountedCount = 0;

  protected initState(): object {
    return {};
  }

  protected initStyles(): void {}

  protected render(): VNode {
    return { tag: 'span', props: { className: 'conditional-child' } };
  }

  protected onMounted(): void {
    ConditionalChild.mountedCount += 1;
  }

  protected onUnmounted(): void {
    ConditionalChild.unmountedCount += 1;
  }
}

class ConditionalComponentHost extends Component<
  Record<string, never>,
  { visible: boolean }
> {
  protected initState(): { visible: boolean } {
    return { visible: true };
  }

  protected initStyles(): void {}

  protected render(): VNode {
    return {
      tag: 'div',
      children: [
        {
          component: ConditionalChild,
          directions: { if: this.state.visible },
        },
      ],
    };
  }
}

class ContextTrackingConditionalChild extends ConditionalChild {
  public static contextUpdates = 0;

  public override setAppContext(context: unknown): void {
    ContextTrackingConditionalChild.contextUpdates += 1;
    super.setAppContext(context);
  }
}

class ContextTrackingConditionalHost extends Component<
  Record<string, never>,
  { visible: boolean }
> {
  protected initState(): { visible: boolean } {
    return { visible: true };
  }

  protected initStyles(): void {}

  protected render(): VNode {
    return {
      tag: 'div',
      children: [
        {
          component: ContextTrackingConditionalChild,
          directions: { if: this.state.visible },
        },
      ],
    };
  }
}

class ConditionalSlotHost extends Component<
  { children?: Array<VNode | string> },
  { visible: boolean }
> {
  protected initState(): { visible: boolean } {
    return { visible: true };
  }

  protected initStyles(): void {}

  protected render(): VNode {
    return {
      tag: 'div',
      children: [
        {
          tag: 'slot',
          props: { name: 'default' },
          directions: { if: this.state.visible },
        },
      ],
    };
  }
}

class EventChild extends Component {
  public static latest: EventChild | null = null;

  protected initState(): object {
    return {};
  }

  protected initStyles(): void {}

  protected render(): VNode {
    return { tag: 'button', children: ['Save'] };
  }

  public save(value: string): void {
    this.emit('saved', value);
  }

  protected override onMounted(): void {
    EventChild.latest = this;
  }
}

class EventHost extends Component<
  Record<string, never>,
  { useReplacementHandler: boolean }
> {
  public readonly oldHandlerCalls: string[] = [];
  public readonly replacementHandlerCalls: string[] = [];

  protected initState(): { useReplacementHandler: boolean } {
    return { useReplacementHandler: false };
  }

  protected initStyles(): void {}

  protected render(): VNode {
    return {
      component: EventChild,
      emitters: {
        saved: this.state.useReplacementHandler
          ? (value) => this.replacementHandlerCalls.push(String(value))
          : (value) => this.oldHandlerCalls.push(String(value)),
      },
    };
  }
}

class PropUpdateChild extends Component<{ label: string }> {
  public static updateCount = 0;

  protected initState(): object {
    return {};
  }

  protected initStyles(): void {}

  protected render(): VNode {
    return { tag: 'span', children: [this.props.label] };
  }

  protected override onUpdated(): void {
    PropUpdateChild.updateCount += 1;
  }
}

class PropUpdateHost extends Component<
  Record<string, never>,
  { label: string }
> {
  protected initState(): { label: string } {
    return { label: 'Before' };
  }

  protected initStyles(): void {}

  protected render(): VNode {
    return { component: PropUpdateChild, props: { label: this.state.label } };
  }
}

class RootChangingChild extends Component<{ label: string }> {
  public static latest: RootChangingChild | null = null;
  public static mountedCount = 0;
  public static unmountedCount = 0;

  protected initState(): { useSpan: boolean } {
    return { useSpan: false };
  }

  protected initStyles(): void {}

  protected render(): VNode {
    return {
      tag: this.state.useSpan ? 'span' : 'div',
      props: { className: 'root-changing-child' },
      children: [this.props.label],
    };
  }

  protected override onMounted(): void {
    RootChangingChild.latest = this;
    RootChangingChild.mountedCount += 1;
  }

  protected override onUnmounted(): void {
    RootChangingChild.unmountedCount += 1;
  }
}

class RootChangingHost extends Component<
  Record<string, never>,
  { label: string }
> {
  protected initState(): { label: string } {
    return { label: 'Before' };
  }

  protected initStyles(): void {}

  protected render(): VNode {
    return { component: RootChangingChild, props: { label: this.state.label } };
  }
}

class UpdateEmittingChild extends Component<{ label: string }> {
  protected initState(): object {
    return {};
  }

  protected initStyles(): void {}

  protected render(): VNode {
    return { tag: 'button', children: [this.props.label] };
  }

  protected override beforeUpdate(): void {
    this.emit('saved', this.props.label);
  }
}

class UpdateEmittingHost extends Component<
  Record<string, never>,
  { mode: 'old' | 'new' }
> {
  public readonly oldHandlerCalls: string[] = [];
  public readonly replacementHandlerCalls: string[] = [];

  protected initState(): { mode: 'old' | 'new' } {
    return { mode: 'old' };
  }

  protected initStyles(): void {}

  protected render(): VNode {
    return {
      component: UpdateEmittingChild,
      props: { label: this.state.mode },
      emitters: {
        saved:
          this.state.mode === 'new'
            ? (value) => this.replacementHandlerCalls.push(String(value))
            : (value) => this.oldHandlerCalls.push(String(value)),
      },
    };
  }
}

class DuplicateKeyedList extends Component<
  Record<string, never>,
  { duplicate: boolean }
> {
  protected initState(): { duplicate: boolean } {
    return { duplicate: false };
  }

  protected initStyles(): void {}

  protected render(): VNode {
    return {
      tag: 'ul',
      children: this.state.duplicate
        ? [
            { tag: 'li', key: 'same', children: ['First'] },
            { tag: 'li', key: 'same', children: ['Second'] },
          ]
        : [
            { tag: 'li', key: 'first', children: ['First'] },
            { tag: 'li', key: 'second', children: ['Second'] },
          ],
    };
  }
}

const THEME_KEY: InjectionKey<{ name: string }> = Symbol('theme');
const MISSING_KEY: InjectionKey<string> = Symbol('missing');

class InjectionLeaf extends Component {
  public static latest: InjectionLeaf | null = null;
  public themeName = '';
  public missingValue = '';

  protected initState(): object {
    return {};
  }

  protected initStyles(): void {}

  protected render(): VNode {
    this.themeName = this.inject(THEME_KEY, { name: 'fallback' }).name;
    this.missingValue = this.inject(MISSING_KEY, 'fallback');
    return { tag: 'span', children: [this.themeName] };
  }

  protected override onMounted(): void {
    InjectionLeaf.latest = this;
  }
}

class InjectionProvider extends Component {
  protected initState(): object {
    return {};
  }

  protected initStyles(): void {}

  protected render(): VNode {
    this.provide(THEME_KEY, { name: 'component' });
    return { component: InjectionLeaf };
  }
}

describe('framework public plan', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    window.history.replaceState({}, '', '/');
    ConditionalChild.mountedCount = 0;
    ConditionalChild.unmountedCount = 0;
    ContextTrackingConditionalChild.contextUpdates = 0;
    PropUpdateChild.updateCount = 0;
    EventChild.latest = null;
    InjectionLeaf.latest = null;
  });

  it('exports the README public API and renders through strategy-backed components', () => {
    expect(typeof Component).toBe('function');

    const container = document.createElement('div');
    const component = new StrategyHost();

    component.mount(container);

    expect(container.textContent).toContain('Count 0');
    expect(container.querySelector('.host')?.getAttribute('title')).toBe(
      'Count 0'
    );
    expect(container.querySelector('.child')?.textContent).toBe('Child ok');

    const input = container.querySelector('input');
    expect(input).toBeInstanceOf(HTMLInputElement);
    expect((input as HTMLInputElement).value).toBe('Ada');

    (input as HTMLInputElement).value = 'Grace';
    input?.dispatchEvent(new Event('input', { bubbles: true }));

    expect(component.state.name).toBe('Grace');

    component.state.count = 2;

    expect(container.textContent).toContain('Count 2');
    expect(container.querySelector('.host')?.getAttribute('title')).toBe(
      'Count 2'
    );
  });

  it('invalidates computed values when reactive dependencies change', () => {
    const state = reactive({ count: 1 });
    let runs = 0;
    const doubled = computed(() => {
      runs += 1;
      return state.count * 2;
    });

    expect(doubled.value).toBe(2);
    expect(doubled.value).toBe(2);
    expect(runs).toBe(1);

    state.count = 3;

    expect(doubled.value).toBe(6);
    expect(runs).toBe(2);
  });

  it('renders route components inside RouterView without replacing the root app', () => {
    const router = createRouter({
      routes: [
        { path: '/', component: HomePage, name: 'home' },
        { path: '/about', component: AboutPage, name: 'about' },
      ],
    });
    const listener = mock();
    const unsubscribe = router.onRouteChange(listener);
    const container = document.createElement('div');
    document.body.appendChild(container);

    const app = createApp({ root: RoutedShell, rootElement: container });
    app.use(router);
    app.mount();

    expect(container.querySelector('main')).toBeTruthy();
    expect(container.querySelector('#home')?.textContent).toBe('Home');

    container
      .querySelector('a')
      ?.dispatchEvent(
        new MouseEvent('click', { bubbles: true, cancelable: true })
      );

    expect(router.getCurrentRoute()?.path).toBe('/about');
    expect(container.querySelector('main')).toBeTruthy();
    expect(container.querySelector('#about')?.textContent).toBe('About');
    expect(listener).toHaveBeenCalledTimes(1);

    unsubscribe();
    router.push('/');

    expect(listener).toHaveBeenCalledTimes(1);
    expect(container.querySelector('#home')?.textContent).toBe('Home');
  });

  it('moves keyed child nodes instead of recreating them during reorder', () => {
    const container = document.createElement('div');
    const component = new KeyedList();

    component.mount(container);

    const before = Array.from(container.querySelectorAll('li'));
    const alphaNode = before[0];
    const betaNode = before[1];
    const gammaNode = before[2];

    component.state.items = [
      { id: 'c', label: 'Gamma' },
      { id: 'a', label: 'Alpha' },
      { id: 'b', label: 'Beta' },
    ];

    const after = Array.from(container.querySelectorAll('li'));

    expect(after.map((node) => node.getAttribute('data-id'))).toEqual([
      'c',
      'a',
      'b',
    ]);
    expect(after[0]).toBe(gammaNode);
    expect(after[1]).toBe(alphaNode);
    expect(after[2]).toBe(betaNode);
  });

  it('throws when keyed sibling updates contain duplicate keys', () => {
    const renderer = new RendererContext();
    const context = {
      templateEngine: new TemplateEngine({}),
      renderer,
      slots: {},
      registerChild: () => {},
      unregisterChild: () => {},
    };
    const oldVNode: VNode = {
      tag: 'ul',
      children: [
        { tag: 'li', key: 'first', children: ['First'] },
        { tag: 'li', key: 'second', children: ['Second'] },
      ],
    };
    const newVNode: VNode = {
      tag: 'ul',
      children: [
        { tag: 'li', key: 'same', children: ['First'] },
        { tag: 'li', key: 'same', children: ['Second'] },
      ],
    };
    const node = renderer.mount(oldVNode, context);

    expect(() => {
      renderer.patch(oldVNode, newVNode, node, context);
    }).toThrow('Duplicate key "same"');
  });

  it('uses positional fallback when removing an unkeyed child from a mixed list', () => {
    const container = document.createElement('div');
    const component = new MixedKeyedList();

    component.mount(container);
    const [unkeyedNode, keyedNode] = Array.from(
      container.querySelectorAll('li')
    );

    component.state.removeLeadingUnkeyedChild = true;

    const children = Array.from(container.querySelectorAll('li'));
    expect(children).toHaveLength(1);
    expect(children[0]).toBe(unkeyedNode);
    expect(children[0]).not.toBe(keyedNode);
    expect(children[0]?.textContent).toBe('Stable');
  });

  it('projects default and named children into slot outlets', () => {
    const container = document.createElement('div');
    const component = new SlotHost();

    component.mount(container);

    expect(container.querySelector('header')?.textContent).toBe(
      'Projected title'
    );
    expect(container.querySelector('section')?.textContent).toBe(
      'Projected body'
    );
    expect(container.querySelector('footer')?.textContent).toBe(
      'Projected footer'
    );
  });

  it('renders VNodes created by element shortcut helpers', () => {
    const container = document.createElement('div');
    const component = new ShortcutHost();

    component.mount(container);

    expect(container.querySelector('.shortcut-host')).toBeTruthy();
    expect(container.querySelector('.shortcut-label')?.textContent).toBe(
      'Label'
    );
    expect(container.querySelector('.shortcut-content')?.textContent).toBe(
      'Shortcut content'
    );

    const input = container.querySelector('input');
    expect(input).toBeInstanceOf(HTMLInputElement);
    expect((input as HTMLInputElement).value).toBe('Ada');

    container
      .querySelector('button')
      ?.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(container.querySelector('.shortcut-content')?.textContent).toBe(
      'Clicked'
    );
  });

  it('replaces old model bindings when an input switches model keys', () => {
    const container = document.createElement('div');
    const component = new ModelSwitchHost();

    component.mount(container);
    component.state.useFirst = false;

    const input = container.querySelector('input');
    expect(input).toBeInstanceOf(HTMLInputElement);

    (input as HTMLInputElement).value = 'gamma';
    input?.dispatchEvent(new Event('input', { bubbles: true }));

    expect(component.state.first).toBe('alpha');
    expect(component.state.second).toBe('gamma');
  });

  it('unmounts and remounts components controlled by directions.if', () => {
    const container = document.createElement('div');
    const component = new ConditionalComponentHost();

    component.mount(container);
    expect(container.querySelector('.conditional-child')).toBeTruthy();
    expect(ConditionalChild.mountedCount).toBe(1);

    component.state.visible = false;
    expect(container.querySelector('.conditional-child')).toBeNull();
    expect(ConditionalChild.unmountedCount).toBe(1);

    component.state.visible = true;
    expect(container.querySelector('.conditional-child')).toBeTruthy();
    expect(ConditionalChild.mountedCount).toBe(2);
  });

  it('does not propagate app context to children unmounted by directions.if', () => {
    const container = document.createElement('div');
    const component = new ContextTrackingConditionalHost();

    component.mount(container);
    component.state.visible = false;
    const updatesBeforeContextChange =
      ContextTrackingConditionalChild.contextUpdates;

    component.setAppContext({ version: 'next' });

    expect(ContextTrackingConditionalChild.contextUpdates).toBe(
      updatesBeforeContextChange
    );
  });

  it('creates keyed VNodes with each', () => {
    const nodes = each(
      [{ id: 'a' }],
      () => ({ tag: 'li' }),
      (item) => item.id
    );

    expect(nodes).toEqual([{ tag: 'li', key: 'a' }]);
  });

  it('rejects string output from each render callbacks', () => {
    expect(() =>
      each(
        ['a'],
        () => 'item',
        (item) => item
      )
    ).toThrow('each render callback must return a VNode');
  });

  it('mounts and unmounts slots controlled by directions.if', () => {
    const container = document.createElement('div');
    const component = new ConditionalSlotHost({
      children: [{ tag: 'span', props: { className: 'conditional-slot' } }],
    });

    component.mount(container);
    expect(container.querySelector('.conditional-slot')).toBeTruthy();

    component.state.visible = false;
    expect(container.querySelector('.conditional-slot')).toBeNull();

    component.state.visible = true;
    expect(container.querySelector('.conditional-slot')).toBeTruthy();
  });

  it('replaces component VNode emitters without retaining the old handler', () => {
    const container = document.createElement('div');
    const component = new EventHost();

    component.mount(container);
    EventChild.latest?.save('first');

    component.state.useReplacementHandler = true;
    EventChild.latest?.save('second');

    expect(component.oldHandlerCalls).toEqual(['first']);
    expect(component.replacementHandlerCalls).toEqual(['second']);
  });

  it('returns an unsubscribe function from component event subscriptions', () => {
    const child = new EventChild();
    const values: string[] = [];
    const unsubscribe = child.on('saved', (value) =>
      values.push(String(value))
    );

    child.save('first');
    unsubscribe();
    child.save('second');

    expect(values).toEqual(['first']);
  });

  it('clears manual component event subscriptions when a component unmounts', () => {
    const container = document.createElement('div');
    const child = new EventChild();
    const values: string[] = [];

    child.on('saved', (value) => values.push(String(value)));
    child.mount(container);
    child.unmount();
    child.save('after-unmount');

    expect(values).toEqual([]);
  });

  it('updates a same-class child once when patching its props', () => {
    const container = document.createElement('div');
    const component = new PropUpdateHost();

    component.mount(container);
    component.state.label = 'After';

    expect(PropUpdateChild.updateCount).toBe(1);
    expect(container.textContent).toBe('After');
  });

  it('retains and unmounts a child instance after its root node changes', () => {
    RootChangingChild.latest = null;
    RootChangingChild.mountedCount = 0;
    RootChangingChild.unmountedCount = 0;
    const container = document.createElement('div');
    const component = new RootChangingHost();

    component.mount(container);
    const child = RootChangingChild.latest;
    if (!child) {
      throw new Error('Expected the root-changing child to mount');
    }
    child.state.useSpan = true;
    component.state.label = 'After';

    expect(container.querySelectorAll('.root-changing-child')).toHaveLength(1);
    expect(container.querySelector('span')?.textContent).toBe('After');
    expect(RootChangingChild.mountedCount).toBe(1);

    component.unmount();

    expect(RootChangingChild.unmountedCount).toBe(1);
  });

  it('uses replacement emitters for emissions during a child props update', () => {
    const container = document.createElement('div');
    const component = new UpdateEmittingHost();

    component.mount(container);
    component.state.mode = 'new';

    expect(component.oldHandlerCalls).toEqual([]);
    expect(component.replacementHandlerCalls).toEqual(['new']);
  });

  it('propagates duplicate keyed children errors from reactive component updates', () => {
    const container = document.createElement('div');
    const component = new DuplicateKeyedList();

    component.mount(container);

    expect(() => {
      component.state.duplicate = true;
    }).toThrow('Duplicate key "same"');
  });

  it('uses the nearest component provider before an app provider', () => {
    const container = document.createElement('div');
    const app = createApp({ root: InjectionProvider, rootElement: container });
    app.provide(THEME_KEY, { name: 'app' });

    app.mount();

    expect(InjectionLeaf.latest?.themeName).toBe('component');
  });

  it('supports symbol injection keys', () => {
    const container = document.createElement('div');
    const app = createApp({ root: InjectionProvider, rootElement: container });
    app.provide(THEME_KEY, { name: 'app' });

    app.mount();

    expect(InjectionLeaf.latest?.themeName).toBe('component');
  });

  it('returns the supplied fallback for missing injection keys', () => {
    const container = document.createElement('div');
    const app = createApp({ root: InjectionProvider, rootElement: container });

    app.mount();

    expect(InjectionLeaf.latest?.missingValue).toBe('fallback');
  });
});
