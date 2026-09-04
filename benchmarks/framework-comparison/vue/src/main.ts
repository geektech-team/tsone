import { createApp, defineComponent, h, reactive, computed, onMounted } from 'vue';

interface TodoItem {
  id: number;
  title: string;
  done: boolean;
}

let nextId = 0;

function makeItem(): TodoItem {
  const id = nextId++;
  return { id, title: `Task ${id}`, done: false };
}

const INITIAL_ITEMS = 1000;

const TodoApp = defineComponent({
  setup() {
    const items = reactive<TodoItem[]>([]);
    for (let i = 0; i < INITIAL_ITEMS; i++) {
      items.push(makeItem());
    }

    const doneCount = computed(
      () => items.filter((item) => item.done).length
    );

    onMounted(() => {
      const bench = {
        add: (n: number) => {
          for (let i = 0; i < n; i++) {
            items.push(makeItem());
          }
        },
        toggle: (n: number) => {
          for (let i = 0; i < n; i++) {
            items[i].done = !items[i].done;
          }
        },
        remove: (n: number) => {
          items.splice(0, n);
        },
        toggleEach: (n: number) => {
          for (let i = 0; i < n; i++) {
            items[i].done = !items[i].done;
          }
        },
        count: () => items.length,
      };

      (window as unknown as Record<string, unknown>).__bench = bench;
      (window as unknown as Record<string, unknown>).__appReady = true;
    });

    return () =>
      h('div', { class: 'app' }, [
        h('h1', {}, ['Todo Benchmark']),
        h('div', { class: 'toolbar' }, [
          h('button', { class: 'add' }, ['添加']),
        ]),
        h(
          'ul',
          { class: 'todo-list' },
          items.map((item) =>
            h(
              'li',
              { class: 'todo-row', 'data-id': String(item.id), key: item.id },
              [
                h('input', {
                  type: 'checkbox',
                  checked: item.done,
                  onChange: () => {
                    item.done = !item.done;
                  },
                }),
                h(
                  'span',
                  {
                    class: item.done
                      ? 'todo-title done'
                      : 'todo-title',
                  },
                  [item.title]
                ),
                h(
                  'button',
                  {
                    class: 'remove',
                    onClick: () => {
                      const index = items.indexOf(item);
                      if (index >= 0) {
                        items.splice(index, 1);
                      }
                    },
                  },
                  ['×']
                ),
              ]
            )
          )
        ),
        h('footer', { class: 'footer' }, [
          h('span', { class: 'count' }, [`共 ${items.length} 项`]),
          h(
            'span',
            { class: 'active-count' },
            [`未完成 ${items.length - doneCount.value} 项`]
          ),
        ]),
      ]);
  },
});

const start = window.__t0 as number;
createApp(TodoApp).mount('#app');
(window as unknown as Record<string, unknown>).__mountMs =
  performance.now() - start;
