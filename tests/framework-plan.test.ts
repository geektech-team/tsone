import { beforeEach, describe, expect, it, mock } from 'bun:test';
import { Component, VNode, computed, createApp, reactive } from '../lib';
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

describe('framework public plan', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    window.history.replaceState({}, '', '/');
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
});
