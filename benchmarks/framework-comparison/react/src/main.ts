import { createElement, useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';

interface TodoItem {
  id: number;
  title: string;
  done: boolean;
}

interface BenchApi {
  add: (n: number) => void;
  toggle: (n: number) => void;
  remove: (n: number) => void;
  toggleEach: (n: number) => void;
  count: () => number;
}

let nextId = 0;

function makeItem(): TodoItem {
  const id = nextId++;
  return { id, title: `Task ${id}`, done: false };
}

const INITIAL_ITEMS = 1000;

function TodoApp() {
  const [items, setItems] = useState<TodoItem[]>(() => {
    const initial: TodoItem[] = [];
    for (let i = 0; i < INITIAL_ITEMS; i++) {
      initial.push(makeItem());
    }
    return initial;
  });

  const benchRef = useRef<BenchApi | null>(null);

  benchRef.current = {
    add: (n: number) => {
      setItems((prev) => {
        const next = prev.slice();
        for (let i = 0; i < n; i++) {
          next.push(makeItem());
        }
        return next;
      });
    },
    toggle: (n: number) => {
      setItems((prev) =>
        prev.map((item, index) =>
          index < n ? { ...item, done: !item.done } : item
        )
      );
    },
    remove: (n: number) => {
      setItems((prev) => prev.slice(n));
    },
    toggleEach: (n: number) => {
      for (let i = 0; i < n; i++) {
        setItems((prev) =>
          prev.map((item, index) =>
            index === i ? { ...item, done: !item.done } : item
          )
        );
      }
    },
    count: () => items.length,
  };

  useEffect(() => {
    (window as unknown as Record<string, unknown>).__bench = benchRef.current;
    (window as unknown as Record<string, unknown>).__appReady = true;
    (window as unknown as Record<string, unknown>).__mountMs =
      performance.now() - (window.__t0 as number);
  }, []);

  const doneCount = useMemo(
    () => items.filter((item) => item.done).length,
    [items]
  );

  return createElement('div', { className: 'app' }, [
    createElement('h1', {}, ['Todo Benchmark']),
    createElement('div', { className: 'toolbar' }, [
      createElement('button', { className: 'add' }, ['添加']),
    ]),
    createElement(
      'ul',
      { className: 'todo-list' },
      items.map((item) =>
        createElement(
          'li',
          {
            className: 'todo-row',
            'data-id': String(item.id),
            key: item.id,
          },
          [
            createElement('input', {
              type: 'checkbox',
              checked: item.done,
              onChange: () => {
                setItems((prev) =>
                  prev.map((entry) =>
                    entry.id === item.id
                      ? { ...entry, done: !entry.done }
                      : entry
                  )
                );
              },
            }),
            createElement(
              'span',
              {
                className: item.done
                  ? 'todo-title done'
                  : 'todo-title',
              },
              [item.title]
            ),
            createElement(
              'button',
              {
                className: 'remove',
                onClick: () => {
                  setItems((prev) => prev.filter((entry) => entry !== item));
                },
              },
              ['×']
            ),
          ]
        )
      )
    ),
    createElement('footer', { className: 'footer' }, [
      createElement('span', { className: 'count' }, [`共 ${items.length} 项`]),
      createElement(
        'span',
        { className: 'active-count' },
        [`未完成 ${items.length - doneCount} 项`]
      ),
    ]),
  ]);
}

createRoot(document.getElementById('app')!).render(createElement(TodoApp));
// 注意：React 19 的 createRoot 渲染是异步提交的，
// __mountMs 在组件 useEffect 中（首次 commit 后）记录。
