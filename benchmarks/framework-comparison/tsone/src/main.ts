import {
  Component,
  createApp,
  each,
  h,
  type VNode,
} from '../../../../packages/tsone/lib/index.ts';

interface TodoItem {
  id: number;
  title: string;
  done: boolean;
}

interface TodoState {
  items: TodoItem[];
}

let nextId = 0;

function makeItem(): TodoItem {
  const id = nextId++;
  return { id, title: `Task ${id}`, done: false };
}

const INITIAL_ITEMS = 1000;

class TodoApp extends Component<object, TodoState> {
  protected initState(): TodoState {
    const items: TodoItem[] = [];
    for (let i = 0; i < INITIAL_ITEMS; i++) {
      items.push(makeItem());
    }
    return { items };
  }

  protected initStyles(): void {}

  protected onMounted(): void {
    const bench = {
      add: (n: number) => {
        const next = this.state.items.slice();
        for (let i = 0; i < n; i++) {
          next.push(makeItem());
        }
        this.state.items = next;
      },
      toggle: (n: number) => {
        this.state.items = this.state.items.map((item, index) =>
          index < n ? { ...item, done: !item.done } : item
        );
      },
      remove: (n: number) => {
        this.state.items = this.state.items.slice(n);
      },
      toggleEach: (n: number) => {
        for (let i = 0; i < n; i++) {
          const item = this.state.items[i];
          item.done = !item.done;
        }
      },
      count: () => this.state.items.length,
    };

    (window as unknown as Record<string, unknown>).__bench = bench;
    (window as unknown as Record<string, unknown>).__appReady = true;
  }

  protected render(): VNode {
    const { items } = this.state;
    let doneCount = 0;
    for (const item of items) {
      if (item.done) {
        doneCount++;
      }
    }

    return h('div', { className: 'app' }, [
      h('h1', {}, ['Todo Benchmark']),
      h('div', { className: 'toolbar' }, [
        h('button', { className: 'add' }, ['添加']),
      ]),
      h(
        'ul',
        { className: 'todo-list' },
        each(
          items,
          (item) =>
            h('li', { className: 'todo-row', 'data-id': String(item.id) }, [
              h(
                'input',
                { type: 'checkbox', checked: item.done },
                [],
                {
                  change: () => {
                    item.done = !item.done;
                  },
                }
              ),
              h(
                'span',
                { className: item.done ? 'todo-title done' : 'todo-title' },
                [item.title]
              ),
              h(
                'button',
                { className: 'remove' },
                ['×'],
                {
                  click: () => {
                    this.state.items = this.state.items.filter(
                      (entry) => entry !== item
                    );
                  },
                }
              ),
            ]),
          (item) => item.id
        )
      ),
      h('footer', { className: 'footer' }, [
        h('span', { className: 'count' }, [`共 ${items.length} 项`]),
        h('span', { className: 'active-count' }, [`未完成 ${items.length - doneCount} 项`]),
      ]),
    ]);
  }
}

const start = window.__t0 as number;
const app = createApp({ root: TodoApp, rootElement: '#app' });
app.mount();
(window as unknown as Record<string, unknown>).__mountMs =
  performance.now() - start;
