import type { DocPage } from '../types';

export const enGuidePages: DocPage[] = [
  {
    path: '/guide/getting-started/',
    title: 'Getting Started',
    description:
      'Install TSone, create your first class-component application, and start an example with Bun.',
    section: 'Guide',
    sectionOrder: 1,
    order: 1,
    body: [
      {
        type: 'heading',
        level: 1,
        text: 'Getting Started',
      },
      {
        type: 'paragraph',
        content: ['This guide helps you get started quickly with TSone.'],
      },
      {
        type: 'heading',
        level: 2,
        text: 'Installation',
      },
      {
        type: 'paragraph',
        content: ['Install the TSone framework and CLI with Bun >=1.3.0:'],
      },
      {
        type: 'code',
        language: 'bash',
        code: 'bun add @geektech/tsone @geektech/tsone-cli',
      },
      {
        type: 'heading',
        level: 2,
        text: 'Create Your First Application',
      },
      {
        type: 'heading',
        level: 3,
        text: '1. Create a Simple Component',
      },
      {
        type: 'code',
        language: 'ts',
        code: "import { Component, VNode, createApp } from '@geektech/tsone';\n\ninterface AppState {\n  count: number;\n}\n\nclass App extends Component<object, AppState> {\n  protected initState(): AppState {\n    return { count: 0 };\n  }\n\n  protected initStyles(): void {\n    this.styleManager.addStyle('.app', {\n      selector: '.app',\n      properties: {\n        textAlign: 'center',\n        padding: '20px',\n      },\n    });\n  }\n\n  protected render(): VNode {\n    return {\n      tag: 'div',\n      props: { className: 'app' },\n      children: [\n        { tag: 'h1', children: ['Count: {{count}}'] },\n        {\n          tag: 'button',\n          props: { className: 'btn' },\n          listeners: {\n            click: () => this.state.count++,\n          },\n          children: ['Increment Count'],\n        },\n      ],\n    };\n  }\n}",
      },
      {
        type: 'heading',
        level: 3,
        text: '2. Create and Mount the Application',
      },
      {
        type: 'code',
        language: 'ts',
        code: "export const app = createApp({\n  root: App,\n  state: {\n    appName: 'TSone Example',\n  },\n  document: { title: 'TSone Example' },\n});\n\napp.mount();",
      },
      {
        type: 'paragraph',
        content: [
          'You do not need to pass rootElement for the default mount point. createApp uses #app by default, so call app.mount() after creating the application; mounting safely does nothing when the element is not present.',
        ],
      },
      {
        type: 'paragraph',
        content: [
          'Save the entry as src/main.ts. The CLI requires the named export form export const app, and the exported value must provide renderHtmlDocument().',
        ],
      },
      {
        type: 'heading',
        level: 3,
        text: '3. Generate the Document Shell from TypeScript',
      },
      {
        type: 'code',
        language: 'ts',
        code: "const app = createApp({\n  root: App,\n  document: {\n    lang: 'en',\n    title: 'TSone Example',\n    description: 'A TSone counter application',\n    body: { tag: 'div', props: { id: 'app' } },\n    scripts: [{ type: 'module', src: './index.ts' }],\n  },\n});\n\nconst html = app.renderHtmlDocument();\napp.mount();",
      },
      {
        type: 'heading',
        level: 2,
        text: 'Configure Development and Builds',
      },
      {
        type: 'paragraph',
        content: [
          'Add an optional plain-object default export in tsone.config.ts. The defaults are entry src/main.ts, host 127.0.0.1, port 52211, an empty server.proxy, and build.outDir dist.',
        ],
      },
      {
        type: 'code',
        language: 'ts',
        code: "import { defineConfig } from '@geektech/tsone-cli';\n\nexport default defineConfig({\n  server: {\n    proxy: {\n      '/api': {\n        target: 'http://localhost:3000',\n        changeOrigin: true,\n        rewrite: (path) => path.replace(/^\\/api/, ''),\n      },\n    },\n  },\n  build: { outDir: 'dist' },\n});",
      },
      {
        type: 'paragraph',
        content: [
          "A proxy may use the string shorthand '/backend': 'http://localhost:4000'. The development server serves HTTP only. Proxy targets may use HTTP or HTTPS. Literal prefixes use the longest match first. Query strings, bodies, and end-to-end headers are forwarded, changeOrigin updates Host, rewrite changes the pathname, and an unreachable upstream returns 502 Bad Gateway.",
        ],
      },
      {
        type: 'heading',
        level: 2,
        text: 'Run the Application',
      },
      {
        type: 'code',
        language: 'bash',
        code: 'tsone dev [--host <host>] [--port <port>]\ntsone build [--out-dir <path>]',
      },
      {
        type: 'paragraph',
        content: [
          'dev accepts only host/port overrides and build accepts only out-dir. Separated and equals forms such as --port 3000 and --port=3000 are supported. build.outDir must stay a child of the project root.',
        ],
      },
      {
        type: 'paragraph',
        content: [
          'CLI v1 has no config plugins, WebSocket, HMR, SSR, public/ copying, or public minify/sourcemap settings.',
        ],
      },
      {
        type: 'heading',
        level: 2,
        text: 'Next Steps',
      },
      {
        type: 'list',
        items: [
          [
            'Learn about ',
            {
              type: 'link',
              text: 'Core Concepts',
              href: '/guide/core-concepts/',
            },
          ],
          [
            'Learn ',
            {
              type: 'link',
              text: 'Component System',
              href: '/guide/component-system/',
            },
          ],
          [
            'Explore ',
            {
              type: 'link',
              text: 'Reactive System',
              href: '/guide/reactive-system/',
            },
          ],
          [
            'Master ',
            {
              type: 'link',
              text: 'Routing',
              href: '/guide/router-system/',
            },
          ],
          [
            'Learn about ',
            {
              type: 'link',
              text: 'Style Management',
              href: '/guide/style-management/',
            },
          ],
        ],
      },
    ],
  },
  {
    path: '/guide/core-concepts/',
    title: 'Core Concepts',
    description:
      'Understand how application instances, class components, reactivity, routing, and style management work together.',
    section: 'Guide',
    sectionOrder: 1,
    order: 2,
    body: [
      {
        type: 'heading',
        level: 1,
        text: 'Core Concepts',
      },
      {
        type: 'paragraph',
        content: [
          'This document introduces the core concepts of TSone to help you understand its design and how it works.',
        ],
      },
      {
        type: 'heading',
        level: 2,
        text: '1. Application Instance',
      },
      {
        type: 'paragraph',
        content: [
          'An application instance is the entry point for a TSone application. Create one with ',
          {
            type: 'code',
            text: 'createApp',
          },
          '.',
        ],
      },
      {
        type: 'code',
        language: 'ts',
        code: "import { createApp } from '@geektech/tsone';\n\nconst app = createApp({\n  state: {\n    appName: 'My App',\n  },\n});\n\napp.mount();",
      },
      {
        type: 'heading',
        level: 2,
        text: '2. Components',
      },
      {
        type: 'paragraph',
        content: [
          'All components extend ',
          {
            type: 'code',
            text: 'Component<Props, State>',
          },
          ' and use ',
          {
            type: 'code',
            text: 'protected render(): VNode',
          },
          ' to describe the UI.',
        ],
      },
      {
        type: 'heading',
        level: 3,
        text: 'Component Lifecycle',
      },
      {
        type: 'list',
        items: [
          [
            {
              type: 'code',
              text: 'beforeMount()',
            },
            ': called before the component mounts',
          ],
          [
            {
              type: 'code',
              text: 'onMounted()',
            },
            ': called after the component mounts',
          ],
          [
            {
              type: 'code',
              text: 'beforeUpdate()',
            },
            ': called before the component updates',
          ],
          [
            {
              type: 'code',
              text: 'onUpdated()',
            },
            ': called after the component updates',
          ],
          [
            {
              type: 'code',
              text: 'beforeUnmount()',
            },
            ': called before the component unmounts',
          ],
          [
            {
              type: 'code',
              text: 'onUnmounted()',
            },
            ': called after the component unmounts',
          ],
        ],
      },
      {
        type: 'heading',
        level: 3,
        text: 'Component Rendering',
      },
      {
        type: 'paragraph',
        content: [
          'A component returns virtual nodes from ',
          {
            type: 'code',
            text: 'render()',
          },
          '; the renderer selects a text, element, component, or slot strategy based on the VNode type.',
        ],
      },
      {
        type: 'heading',
        level: 2,
        text: '3. Reactivity System',
      },
      {
        type: 'paragraph',
        content: [
          'TSone reactivity is implemented with Proxy. Common APIs include ',
          {
            type: 'code',
            text: 'reactive',
          },
          ', ',
          {
            type: 'code',
            text: 'effect',
          },
          ', ',
          {
            type: 'code',
            text: 'computed',
          },
          ', ',
          {
            type: 'code',
            text: 'readonly',
          },
          ', ',
          {
            type: 'code',
            text: 'ref',
          },
          ', and ',
          {
            type: 'code',
            text: 'stop',
          },
          '.',
        ],
      },
      {
        type: 'heading',
        level: 3,
        text: 'Core APIs',
      },
      {
        type: 'list',
        items: [
          [
            {
              type: 'code',
              text: 'reactive(target)',
            },
            ': creates a reactive object',
          ],
          [
            {
              type: 'code',
              text: 'effect(fn)',
            },
            ': creates an effect function',
          ],
          [
            {
              type: 'code',
              text: 'computed(fn)',
            },
            ': creates a computed value',
          ],
          [
            {
              type: 'code',
              text: 'readonly(target)',
            },
            ': creates a readonly reactive object',
          ],
          [
            {
              type: 'code',
              text: 'ref(value)',
            },
            ': creates a reactive reference that wraps one value',
          ],
        ],
      },
      {
        type: 'heading',
        level: 2,
        text: '4. Virtual DOM',
      },
      {
        type: 'paragraph',
        content: [
          'The virtual DOM is a lightweight abstraction of the real DOM.',
        ],
      },
      {
        type: 'heading',
        level: 3,
        text: 'Virtual DOM Structure',
      },
      {
        type: 'code',
        language: 'ts',
        code: "const vnode = {\n  tag: 'div',\n  props: { className: 'container' },\n  listeners: {\n    click: () => console.log('clicked'),\n  },\n  children: [\n    'Hello World',\n    { tag: 'button', children: ['Click Me'] },\n  ],\n};\n\nconst componentVnode = {\n  component: MyComponent,\n  props: { title: 'My Component' },\n};",
      },
      {
        type: 'heading',
        level: 2,
        text: '5. Routing',
      },
      {
        type: 'paragraph',
        content: [
          'Create a router instance with ',
          {
            type: 'code',
            text: 'createRouter',
          },
          ', then use ',
          {
            type: 'code',
            text: 'RouterView',
          },
          ' and ',
          {
            type: 'code',
            text: 'RouterLink',
          },
          ' for rendering and navigation.',
        ],
      },
      {
        type: 'heading',
        level: 3,
        text: 'Route Configuration',
      },
      {
        type: 'code',
        language: 'ts',
        code: "import { createRouter } from '@geektech/tsone/router';\n\nconst router = createRouter({\n  routes: [\n    { path: '/', component: HomeComponent, meta: { title: 'Home' } },\n    { path: '/about', component: AboutComponent, meta: { title: 'About Us' } },\n  ],\n  mode: 'history',\n  base: '/',\n});",
      },
      {
        type: 'heading',
        level: 2,
        text: '6. Style Management',
      },
      {
        type: 'paragraph',
        content: [
          'TSone provides a built-in ',
          {
            type: 'code',
            text: 'StyleManager',
          },
          '. Each component instance can manage styles through ',
          {
            type: 'code',
            text: 'this.styleManager',
          },
          '.',
        ],
      },
      {
        type: 'heading',
        level: 3,
        text: 'Style Definition',
      },
      {
        type: 'code',
        language: 'ts',
        code: "protected initStyles() {\n  this.styleManager.addStyle('.container', {\n    selector: '.container',\n    properties: {\n      width: '100%',\n      maxWidth: '1200px',\n      margin: '0 auto',\n    },\n  });\n}",
      },
      {
        type: 'heading',
        level: 2,
        text: '7. Plugin System',
      },
      {
        type: 'paragraph',
        content: [
          'Install plugins with app.use() to extend application context and components.',
        ],
      },
      {
        type: 'heading',
        level: 3,
        text: 'Plugin Example',
      },
      {
        type: 'code',
        language: 'ts',
        code: "const myPlugin = {\n  install(app: { myMethod?: () => void }) {\n    app.myMethod = () => {\n      console.log('My plugin method');\n    };\n  },\n};\n\napp.use(myPlugin);",
      },
      {
        type: 'heading',
        level: 2,
        text: '8. Event System',
      },
      {
        type: 'paragraph',
        content: [
          'Components can notify through emit/on, and on returns an unsubscribe function.',
        ],
      },
      {
        type: 'heading',
        level: 3,
        text: 'Event Example',
      },
      {
        type: 'code',
        language: 'ts',
        code: "this.emit('custom-event', 'event data');\n\nconst unsubscribe = component.on('custom-event', (data) => {\n  console.log('Event received:', data);\n});\nunsubscribe();",
      },
      {
        type: 'heading',
        level: 2,
        text: '9. Conditions, Lists, Dependencies, and Forms',
      },
      {
        type: 'paragraph',
        content: [
          'VNode ',
          {
            type: 'code',
            text: 'directions.if',
          },
          ' controls mounting for elements, components, and slots; ',
          {
            type: 'code',
            text: 'each',
          },
          ' provides stable keys for lists.',
        ],
      },
      {
        type: 'code',
        language: 'ts',
        code: "const rows = each(\n  this.state.rows,\n  (row) => ({ tag: 'li', children: [row.name] }),\n  (row) => row.id\n);\n\nconst sidebar = {\n  component: Sidebar,\n  directions: { if: this.state.open },\n};",
      },
      {
        type: 'paragraph',
        content: [
          'Applications or components can provide dependencies with ',
          {
            type: 'code',
            text: 'provide',
          },
          '. Child components use ',
          {
            type: 'code',
            text: 'inject',
          },
          ' to retrieve the closest value.',
        ],
      },
      {
        type: 'code',
        language: 'ts',
        code: "const LOCALE: InjectionKey<string> = Symbol('locale');\napp.provide(LOCALE, 'zh-CN');\nconst locale = this.inject(LOCALE, 'en-US');",
      },
      {
        type: 'paragraph',
        content: [
          'Native form nodes bind state through ',
          {
            type: 'code',
            text: 'directions.model',
          },
          '. Validation is handled by a separate ',
          {
            type: 'code',
            text: 'createForm',
          },
          ' controller.',
        ],
      },
      {
        type: 'code',
        language: 'ts',
        code: "const name = Input({ directions: { model: 'profile.name' } });\nconst form = createForm(this.state, {\n  'profile.name': [required('Please enter a name'), minLength(2)],\n});\nconst result = form.validate();",
      },
      {
        type: 'heading',
        level: 2,
        text: 'Summary',
      },
      {
        type: 'paragraph',
        content: [
          "Together, these concepts form TSone's application model. Continue with ",
          {
            type: 'link',
            text: 'Component System',
            href: '/guide/component-system/',
          },
          ', ',
          {
            type: 'link',
            text: 'Reactive System',
            href: '/guide/reactive-system/',
          },
          ' and ',
          {
            type: 'link',
            text: 'Routing',
            href: '/guide/router-system/',
          },
          ' for more concrete code patterns.',
        ],
      },
    ],
  },
  {
    path: '/guide/component-system/',
    title: 'Component System',
    description:
      'Learn class components based on Component<Props, State>, lifecycle hooks, events, and slots.',
    section: 'Guide',
    sectionOrder: 1,
    order: 3,
    body: [
      {
        type: 'heading',
        level: 1,
        text: 'Component System',
      },
      {
        type: 'paragraph',
        content: [
          "TSone's component system lets you split UI into independent, reusable class components.",
        ],
      },
      {
        type: 'heading',
        level: 2,
        text: 'Component Definition',
      },
      {
        type: 'paragraph',
        content: [
          'Define a component by extending ',
          {
            type: 'code',
            text: 'Component<Props, State>',
          },
          ' and implementing ',
          {
            type: 'code',
            text: 'initState()',
          },
          ', ',
          {
            type: 'code',
            text: 'initStyles()',
          },
          ', and ',
          {
            type: 'code',
            text: 'protected render(): VNode',
          },
          '.',
        ],
      },
      {
        type: 'heading',
        level: 3,
        text: 'Basic Component Structure',
      },
      {
        type: 'code',
        language: 'ts',
        code: "import { Component, VNode } from '@geektech/tsone';\n\ninterface MessageState {\n  message: string;\n}\n\nclass MyComponent extends Component<object, MessageState> {\n  protected initState(): MessageState {\n    return { message: 'Hello, TSone!' };\n  }\n\n  protected initStyles(): void {\n    this.styleManager.addStyle('.my-component', {\n      selector: '.my-component',\n      properties: {\n        color: '#333',\n        fontSize: '16px',\n        padding: '10px',\n      },\n    });\n  }\n\n  protected render(): VNode {\n    return {\n      tag: 'div',\n      props: { className: 'my-component' },\n      children: ['{{message}}'],\n    };\n  }\n}",
      },
      {
        type: 'heading',
        level: 2,
        text: 'Component Lifecycle',
      },
      {
        type: 'heading',
        level: 3,
        text: 'Mounting Phase',
      },
      {
        type: 'list',
        items: [
          [
            {
              type: 'code',
              text: 'beforeMount()',
            },
            ': called before the component is mounted in the DOM',
          ],
          [
            {
              type: 'code',
              text: 'onMounted()',
            },
            ': called after the component is mounted in the DOM',
          ],
        ],
      },
      {
        type: 'heading',
        level: 3,
        text: 'Update Phase',
      },
      {
        type: 'list',
        items: [
          [
            {
              type: 'code',
              text: 'beforeUpdate()',
            },
            ': called before component state updates',
          ],
          [
            {
              type: 'code',
              text: 'onUpdated()',
            },
            ': called after component state updates',
          ],
        ],
      },
      {
        type: 'heading',
        level: 3,
        text: 'Unmounting Phase',
      },
      {
        type: 'list',
        items: [
          [
            {
              type: 'code',
              text: 'beforeUnmount()',
            },
            ': called before the component is removed from the DOM',
          ],
          [
            {
              type: 'code',
              text: 'onUnmounted()',
            },
            ': called after the component is removed from the DOM',
          ],
        ],
      },
      {
        type: 'heading',
        level: 3,
        text: 'Lifecycle Example',
      },
      {
        type: 'code',
        language: 'ts',
        code: "class LifecycleComponent extends Component<object, { count: number }> {\n  protected initState() {\n    return { count: 0 };\n  }\n\n  protected initStyles(): void {}\n\n  protected beforeMount() {\n    console.log('Component will mount');\n  }\n\n  protected onMounted() {\n    console.log('Component mounted');\n  }\n\n  protected beforeUpdate() {\n    console.log('Component will update');\n  }\n\n  protected onUpdated() {\n    console.log('Component updated');\n  }\n\n  protected render(): VNode {\n    return {\n      tag: 'button',\n      children: ['Count: {{count}}'],\n      listeners: {\n        click: () => this.state.count++,\n      },\n    };\n  }\n}",
      },
      {
        type: 'heading',
        level: 2,
        text: 'Component Props',
      },
      {
        type: 'heading',
        level: 3,
        text: 'Define a Props Interface',
      },
      {
        type: 'code',
        language: 'ts',
        code: "interface ButtonProps {\n  text: string;\n  disabled?: boolean;\n  size?: 'small' | 'medium' | 'large';\n}\n\nclass Button extends Component<ButtonProps, object> {\n  protected initState() {\n    return {};\n  }\n\n  protected initStyles(): void {}\n\n  protected render(): VNode {\n    const { text, disabled = false, size = 'medium' } = this.props;\n    return {\n      tag: 'button',\n      props: {\n        className: `btn btn-${size}` ,\n        disabled,\n      },\n      children: [text],\n    };\n  }\n}",
      },
      {
        type: 'heading',
        level: 3,
        text: 'Use Component Props',
      },
      {
        type: 'code',
        language: 'ts',
        code: "class ParentComponent extends Component<object, object> {\n  protected initState() {\n    return {};\n  }\n\n  protected initStyles(): void {}\n\n  protected render(): VNode {\n    return {\n      tag: 'div',\n      children: [\n        {\n          component: Button,\n          props: { text: 'Click Me', size: 'large' },\n        },\n      ],\n    };\n  }\n}",
      },
      {
        type: 'heading',
        level: 2,
        text: 'Component Events',
      },
      {
        type: 'heading',
        level: 3,
        text: 'Emit an Event',
      },
      {
        type: 'code',
        language: 'ts',
        code: "class CounterComponent extends Component<object, { count: number }> {\n  protected initState() {\n    return { count: 0 };\n  }\n\n  protected initStyles(): void {}\n\n  protected handleIncrement() {\n    this.state.count++;\n    this.emit('increment', this.state.count);\n  }\n\n  protected render(): VNode {\n    return {\n      tag: 'button',\n      listeners: { click: () => this.handleIncrement() },\n      children: ['+'],\n    };\n  }\n}",
      },
      {
        type: 'heading',
        level: 3,
        text: 'Listen for an Event',
      },
      {
        type: 'code',
        language: 'ts',
        code: "class ParentCounter extends Component<object, object> {\n  protected initState() {\n    return {};\n  }\n\n  protected initStyles(): void {}\n\n  protected handleCounterChange(value: number) {\n    console.log('Counter changed:', value);\n  }\n\n  protected render(): VNode {\n    return {\n      tag: 'div',\n      children: [\n        {\n          component: CounterComponent,\n          listeners: {\n            increment: (value: number) => this.handleCounterChange(value),\n          },\n        },\n      ],\n    };\n  }\n}",
      },
      {
        type: 'heading',
        level: 2,
        text: 'Component Nesting',
      },
      {
        type: 'code',
        language: 'ts',
        code: "class App extends Component<object, object> {\n  protected initState() {\n    return {};\n  }\n\n  protected initStyles(): void {}\n\n  protected render(): VNode {\n    return {\n      tag: 'div',\n      props: { className: 'app' },\n      children: [\n        { tag: 'header', children: [{ component: NavigationComponent }] },\n        { tag: 'main', children: [{ component: HomeComponent }] },\n      ],\n    };\n  }\n}",
      },
      {
        type: 'heading',
        level: 2,
        text: 'Component State Management',
      },
      {
        type: 'heading',
        level: 3,
        text: 'Initialize State',
      },
      {
        type: 'code',
        language: 'ts',
        code: "protected initState() {\n  return {\n    count: 0,\n    user: { name: 'John', age: 30 },\n    items: ['Item 1', 'Item 2', 'Item 3'],\n  };\n}",
      },
      {
        type: 'heading',
        level: 3,
        text: 'Update State',
      },
      {
        type: 'code',
        language: 'ts',
        code: "this.state.count = 1;\nthis.state.user.name = 'Jane';\nthis.state.items.push('Item 4');",
      },
      {
        type: 'heading',
        level: 2,
        text: 'Component Style Management',
      },
      {
        type: 'paragraph',
        content: ['Each component instance owns its own styleManager.'],
      },
      {
        type: 'heading',
        level: 3,
        text: 'Add Styles',
      },
      {
        type: 'code',
        language: 'ts',
        code: "protected initStyles() {\n  this.styleManager.addStyle('.button', {\n    selector: '.button',\n    properties: {\n      padding: '8px 16px',\n      backgroundColor: '#007bff',\n      color: '#fff',\n    },\n  });\n\n  this.styleManager.addStyle('.button:hover', {\n    selector: '.button:hover',\n    properties: { backgroundColor: '#0069d9' },\n  });\n}",
      },
      {
        type: 'heading',
        level: 3,
        text: 'Remove Styles',
      },
      {
        type: 'code',
        language: 'ts',
        code: "this.styleManager.removeStyle('.button');\nthis.styleManager.clearStyles();",
      },
      {
        type: 'heading',
        level: 2,
        text: 'Component Context',
      },
      {
        type: 'paragraph',
        content: [
          'Components can read global configuration through application context and access the router through the router getter.',
        ],
      },
      {
        type: 'heading',
        level: 3,
        text: 'Get Context',
      },
      {
        type: 'code',
        language: 'ts',
        code: "const context = this.getContext();\nconst router = this.router;\n\nrouter?.push('/about');\nconsole.log(context?.config);",
      },
      {
        type: 'heading',
        level: 2,
        text: 'Best Practices',
      },
      {
        type: 'heading',
        level: 3,
        text: 'Component Design Principles',
      },
      {
        type: 'list',
        items: [
          ['Single responsibility: each component should handle one concern'],
          ['Reusability: design general-purpose, reusable components'],
          ['Maintainability: keep component code concise and clear'],
          ['Performance: avoid unnecessary rendering and computation'],
        ],
      },
      {
        type: 'heading',
        level: 3,
        text: 'Component Naming Conventions',
      },
      {
        type: 'list',
        items: [
          ['Use PascalCase for component class names'],
          ["Follow the repository's existing naming style for component files"],
          ['Use kebab-case for component style class names'],
        ],
      },
      {
        type: 'heading',
        level: 3,
        text: 'Performance Tips',
      },
      {
        type: 'list',
        items: [
          ['Avoid creating unnecessary objects in render'],
          ['Keep only properties requiring reactive updates in state'],
          ['Use computed for complex derived values'],
          ['Keep component nesting shallow'],
        ],
      },
      {
        type: 'heading',
        level: 2,
        text: 'Summary',
      },
      {
        type: 'paragraph',
        content: [
          'With class components, lifecycle hooks, events, slots, and local style management, TSone maintains a clear object-oriented component model.',
        ],
      },
    ],
  },
  {
    path: '/guide/reactive-system/',
    title: 'Reactive System',
    description: 'Master reactive, effect, computed, readonly, ref, and stop.',
    section: 'Guide',
    sectionOrder: 1,
    order: 4,
    body: [
      {
        type: 'heading',
        level: 1,
        text: 'Reactive System',
      },
      {
        type: 'paragraph',
        content: [
          "TSone's reactivity system lets you create reactive state and automatically update the UI when it changes.",
        ],
      },
      {
        type: 'heading',
        level: 2,
        text: 'Core Concepts',
      },
      {
        type: 'heading',
        level: 3,
        text: 'Reactive Objects',
      },
      {
        type: 'paragraph',
        content: [
          'reactive creates reactive objects that automatically track dependencies when properties are read and changed.',
        ],
      },
      {
        type: 'heading',
        level: 3,
        text: 'Effect Functions',
      },
      {
        type: 'paragraph',
        content: [
          'effect creates effect functions that run again when dependencies change.',
        ],
      },
      {
        type: 'heading',
        level: 3,
        text: 'Dependency Tracking',
      },
      {
        type: 'paragraph',
        content: [
          'The framework records reactive properties accessed while an effect runs.',
        ],
      },
      {
        type: 'heading',
        level: 2,
        text: 'Core APIs',
      },
      {
        type: 'heading',
        level: 3,
        text: 'reactive',
      },
      {
        type: 'code',
        language: 'ts',
        code: "import { reactive } from '@geektech/tsone';\n\nconst state = reactive({\n  count: 0,\n  user: { name: 'John', age: 30 },\n});\n\nconsole.log(state.count);\nstate.count = 1;",
      },
      {
        type: 'heading',
        level: 3,
        text: 'effect',
      },
      {
        type: 'code',
        language: 'ts',
        code: "import { effect, reactive } from '@geektech/tsone';\n\nconst state = reactive({ count: 0 });\n\neffect(() => {\n  console.log(`Count: ${state.count}`);\n});\n\nstate.count = 1;\nstate.count = 2;",
      },
      {
        type: 'heading',
        level: 3,
        text: 'computed',
      },
      {
        type: 'code',
        language: 'ts',
        code: "import { computed, reactive } from '@geektech/tsone';\n\nconst state = reactive({ count: 0 });\nconst doubleCount = computed(() => state.count * 2);\n\nconsole.log(doubleCount.value);\nstate.count = 1;\nconsole.log(doubleCount.value);",
      },
      {
        type: 'heading',
        level: 3,
        text: 'readonly',
      },
      {
        type: 'code',
        language: 'ts',
        code: "import { reactive, readonly } from '@geektech/tsone';\n\nconst original = reactive({ count: 0 });\nconst readOnlyState = readonly(original);\n\nconsole.log(readOnlyState.count);\noriginal.count = 1;",
      },
      {
        type: 'heading',
        level: 3,
        text: 'ref',
      },
      {
        type: 'code',
        language: 'ts',
        code: "import { effect, ref } from '@geektech/tsone';\n\nconst count = ref(0);\n\neffect(() => {\n  console.log(`Count: ${count.value}`);\n});\n\ncount.value += 1;",
      },
      {
        type: 'heading',
        level: 2,
        text: 'How Reactivity Works',
      },
      {
        type: 'paragraph',
        content: [
          'TSone uses JavaScript Proxy to intercept get/set operations, collect dependencies, and dispatch updates.',
        ],
      },
      {
        type: 'heading',
        level: 3,
        text: 'Dependency Tracking Process',
      },
      {
        type: 'list',
        items: [
          ['Run effect and mark it as the active effect'],
          ['Read reactive or ref values inside effect'],
          ['Record the dependency relationship'],
          ['Schedule the corresponding effect again when values change'],
        ],
      },
      {
        type: 'heading',
        level: 2,
        text: 'Advanced Usage',
      },
      {
        type: 'heading',
        level: 3,
        text: 'Nested Reactive Objects',
      },
      {
        type: 'code',
        language: 'ts',
        code: "const state = reactive({\n  user: { name: 'John', address: { city: 'New York' } },\n});\n\neffect(() => {\n  console.log(`${state.user.name} lives in ${state.user.address.city}`);\n});\n\nstate.user.address.city = 'Los Angeles';",
      },
      {
        type: 'heading',
        level: 3,
        text: 'Reactive Arrays',
      },
      {
        type: 'code',
        language: 'ts',
        code: "const state = reactive({ items: ['Item 1', 'Item 2'] });\n\neffect(() => {\n  console.log(state.items.join(', '));\n});\n\nstate.items.push('Item 3');\nstate.items[0] = 'Updated Item 1';",
      },
      {
        type: 'heading',
        level: 3,
        text: 'Conditional Dependencies',
      },
      {
        type: 'code',
        language: 'ts',
        code: "const state = reactive({ showCount: true, count: 0, message: 'Hello' });\n\neffect(() => {\n  if (state.showCount) {\n    console.log(`Count: ${state.count}`);\n  } else {\n    console.log(state.message);\n  }\n});",
      },
      {
        type: 'heading',
        level: 3,
        text: 'Stop an Effect',
      },
      {
        type: 'code',
        language: 'ts',
        code: "import { effect, reactive, stop } from '@geektech/tsone';\n\nconst state = reactive({ count: 0 });\nconst runner = effect(() => {\n  console.log(`Count: ${state.count}`);\n});\n\nstop(runner);",
      },
      {
        type: 'heading',
        level: 2,
        text: 'Best Practices',
      },
      {
        type: 'heading',
        level: 3,
        text: 'State Design',
      },
      {
        type: 'list',
        items: [
          ['Put only data that drives the UI into reactive objects'],
          [
            'Organize state by business module and avoid meaningless deep nesting',
          ],
          ['Prefer computed for complex derived values'],
        ],
      },
      {
        type: 'heading',
        level: 3,
        text: 'Performance Optimization',
      },
      {
        type: 'list',
        items: [
          ['Use computed caching for expensive calculations'],
          [
            'Avoid expensive calculations or chained side-effect writes in effect',
          ],
          ['Use readonly for data that should not be written'],
        ],
      },
      {
        type: 'heading',
        level: 3,
        text: 'Common Pitfalls',
      },
      {
        type: 'list',
        items: [
          ['Do not replace an entire reactive object directly'],
          ['Do not unconditionally modify dependency state inside effect'],
          [
            'Nested objects become reactive automatically; do not call reactive again manually',
          ],
        ],
      },
      {
        type: 'heading',
        level: 2,
        text: 'Integration with Components',
      },
      {
        type: 'code',
        language: 'ts',
        code: "class CounterComponent extends Component<object, { count: number }> {\n  protected initState() {\n    return { count: 0 };\n  }\n\n  protected initStyles(): void {}\n\n  protected render(): VNode {\n    return {\n      tag: 'button',\n      children: ['Count: {{count}}'],\n      listeners: { click: () => this.state.count++ },\n    };\n  }\n}",
      },
      {
        type: 'heading',
        level: 2,
        text: 'Summary',
      },
      {
        type: 'paragraph',
        content: [
          'With reactive, effect, computed, readonly, ref, and stop, TSone provides a unified reactive foundation for component state and standalone data models.',
        ],
      },
    ],
  },
  {
    path: '/guide/router-system/',
    title: 'Routing',
    description:
      'Build multi-page frontend experiences with createRouter, RouterView, and RouterLink.',
    section: 'Guide',
    sectionOrder: 1,
    order: 5,
    body: [
      {
        type: 'heading',
        level: 1,
        text: 'Routing',
      },
      {
        type: 'paragraph',
        content: [
          'TSone includes a routing system for showing different content at different URL paths.',
        ],
      },
      {
        type: 'heading',
        level: 2,
        text: 'Core Concepts',
      },
      {
        type: 'heading',
        level: 3,
        text: 'Router Instance',
      },
      {
        type: 'paragraph',
        content: [
          'A router instance is created with createRouter and manages route configuration and navigation.',
        ],
      },
      {
        type: 'heading',
        level: 3,
        text: 'Route Configuration',
      },
      {
        type: 'paragraph',
        content: [
          'Route configuration is a set of RouteRecord values that map paths to components.',
        ],
      },
      {
        type: 'heading',
        level: 3,
        text: 'Route Navigation',
      },
      {
        type: 'paragraph',
        content: [
          'You can navigate programmatically or declaratively with RouterLink.',
        ],
      },
      {
        type: 'heading',
        level: 2,
        text: 'Basic Usage',
      },
      {
        type: 'heading',
        level: 3,
        text: 'Import the Router',
      },
      {
        type: 'code',
        language: 'ts',
        code: "import { createRouter, RouterLink, RouterView } from '@geektech/tsone/router';",
      },
      {
        type: 'heading',
        level: 3,
        text: 'Create a Router Instance',
      },
      {
        type: 'code',
        language: 'ts',
        code: "import { createApp } from '@geektech/tsone';\nimport { createRouter, RouterView } from '@geektech/tsone/router';\n\nconst router = createRouter({\n  routes: [\n    { path: '/', name: 'home', component: HomeComponent, meta: { title: 'Home' } },\n    { path: '/about', name: 'about', component: AboutComponent, meta: { title: 'About Us' } },\n    { path: '/user/:id', name: 'user', component: UserComponent, meta: { title: 'User Details' } },\n  ],\n  mode: 'history',\n  base: '/',\n});\n\nconst app = createApp({\n  root: class Layout extends Component<object, object> {\n    protected initState() {\n      return {};\n    }\n\n    protected initStyles(): void {}\n\n    protected render(): VNode {\n      return {\n        tag: 'main',\n        children: [{ component: RouterView }],\n      };\n    }\n  },\n});\n\napp.use(router);\napp.mount();",
      },
      {
        type: 'heading',
        level: 2,
        text: 'Route Configuration Options',
      },
      {
        type: 'heading',
        level: 3,
        text: 'Route Rules',
      },
      {
        type: 'list',
        items: [
          [
            {
              type: 'code',
              text: 'path',
            },
            ': URL path pattern',
          ],
          [
            {
              type: 'code',
              text: 'name',
            },
            ': route name',
          ],
          [
            {
              type: 'code',
              text: 'component',
            },
            ': associated component',
          ],
          [
            {
              type: 'code',
              text: 'meta',
            },
            ': metadata',
          ],
        ],
      },
      {
        type: 'heading',
        level: 3,
        text: 'Path Patterns',
      },
      {
        type: 'list',
        items: [
          [
            {
              type: 'code',
              text: '/about',
            },
            ': static path',
          ],
          [
            {
              type: 'code',
              text: '/user/:id',
            },
            ': dynamic path parameter',
          ],
          [
            {
              type: 'code',
              text: '*',
            },
            ': wildcard fallback',
          ],
        ],
      },
      {
        type: 'heading',
        level: 2,
        text: 'Route Navigation',
      },
      {
        type: 'heading',
        level: 3,
        text: 'Programmatic Navigation',
      },
      {
        type: 'code',
        language: 'ts',
        code: "router.push('/about');\nrouter.replace('/login');\nrouter.back();\nrouter.forward();\nrouter.go(-1);",
      },
      {
        type: 'heading',
        level: 3,
        text: 'Declarative Navigation',
      },
      {
        type: 'code',
        language: 'ts',
        code: "{\n  component: RouterLink,\n  props: {\n    to: '/user/42',\n    activeClass: 'is-active',\n    children: ['User Details'],\n  },\n}",
      },
      {
        type: 'heading',
        level: 2,
        text: 'Route Parameters',
      },
      {
        type: 'heading',
        level: 3,
        text: 'Read Route Parameters',
      },
      {
        type: 'code',
        language: 'ts',
        code: "class UserComponent extends Component<object, { userId: string }> {\n  protected initState() {\n    return { userId: '' };\n  }\n\n  protected initStyles(): void {}\n\n  protected onMounted() {\n    const route = this.router?.getCurrentRoute();\n    this.state.userId = String(route?.params.id ?? '');\n  }\n\n  protected render(): VNode {\n    return {\n      tag: 'h1',\n      children: ['User Details {{userId}}'],\n    };\n  }\n}",
      },
      {
        type: 'heading',
        level: 3,
        text: 'Listen for Route Parameter Changes',
      },
      {
        type: 'code',
        language: 'ts',
        code: "const stopListening = router.onRouteChange((to) => {\n  console.log('route changed to', to.path);\n});\n\nstopListening();",
      },
      {
        type: 'heading',
        level: 2,
        text: 'Route Metadata',
      },
      {
        type: 'code',
        language: 'ts',
        code: "const router = createRouter({\n  routes: [\n    { path: '/', component: HomeComponent, meta: { title: 'Home' } },\n    { path: '/dashboard', component: DashboardComponent, meta: { title: 'Dashboard' } },\n  ],\n});",
      },
      {
        type: 'heading',
        level: 2,
        text: 'Routing Modes',
      },
      {
        type: 'heading',
        level: 3,
        text: 'History Mode',
      },
      {
        type: 'code',
        language: 'ts',
        code: "const router = createRouter({\n  mode: 'history',\n  routes: [...],\n});",
      },
      {
        type: 'paragraph',
        content: [
          'History mode uses the HTML5 History API and requires the server to fall back to the application entry point.',
        ],
      },
      {
        type: 'heading',
        level: 3,
        text: 'Hash Mode',
      },
      {
        type: 'code',
        language: 'ts',
        code: "const router = createRouter({\n  mode: 'hash',\n  routes: [...],\n});",
      },
      {
        type: 'paragraph',
        content: [
          'Hash mode does not require server URL rewrites and is suitable for static hosting.',
        ],
      },
      {
        type: 'heading',
        level: 2,
        text: 'Nested Routes',
      },
      {
        type: 'paragraph',
        content: [
          'Parent components can use RouterView to display child-route content.',
        ],
      },
      {
        type: 'code',
        language: 'ts',
        code: "class DashboardComponent extends Component<object, object> {\n  protected initState() {\n    return {};\n  }\n\n  protected initStyles(): void {}\n\n  protected render(): VNode {\n    return {\n      tag: 'div',\n      children: [\n        { tag: 'h1', children: ['Dashboard'] },\n        { component: RouterView },\n      ],\n    };\n  }\n}",
      },
      {
        type: 'heading',
        level: 2,
        text: 'Router API',
      },
      {
        type: 'heading',
        level: 3,
        text: 'Router Instance Methods',
      },
      {
        type: 'list',
        items: [
          [
            {
              type: 'code',
              text: 'push(location)',
            },
            ': navigate to a location',
          ],
          [
            {
              type: 'code',
              text: 'replace(location)',
            },
            ': replace the current history entry',
          ],
          [
            {
              type: 'code',
              text: 'back() / forward() / go(n)',
            },
            ': use browser history',
          ],
          [
            {
              type: 'code',
              text: 'onRouteChange(callback)',
            },
            ': listen for route changes',
          ],
          [
            {
              type: 'code',
              text: 'getCurrentRoute()',
            },
            ': read current route information',
          ],
          [
            {
              type: 'code',
              text: 'createHref(path)',
            },
            ': generate an href',
          ],
        ],
      },
      {
        type: 'heading',
        level: 3,
        text: 'Router Object Properties',
      },
      {
        type: 'list',
        items: [
          [
            {
              type: 'code',
              text: 'currentRoute',
            },
            ': current route information',
          ],
          [
            {
              type: 'code',
              text: 'routes',
            },
            ': route configuration',
          ],
          [
            {
              type: 'code',
              text: 'mode',
            },
            ': routing mode',
          ],
          [
            {
              type: 'code',
              text: 'base',
            },
            ': base path',
          ],
        ],
      },
      {
        type: 'heading',
        level: 2,
        text: 'Best Practices',
      },
      {
        type: 'heading',
        level: 3,
        text: 'Route Organization',
      },
      {
        type: 'list',
        items: [
          ['Manage route configuration centrally'],
          ['Use named routes for key pages'],
          ['Use dynamic parameters and meta appropriately'],
        ],
      },
      {
        type: 'heading',
        level: 3,
        text: 'Performance Optimization',
      },
      {
        type: 'list',
        items: [
          ['Keep route component boundaries clear'],
          ['Avoid expensive work in onRouteChange'],
          ['Split page-level components when needed'],
        ],
      },
      {
        type: 'heading',
        level: 3,
        text: 'Common Issues',
      },
      {
        type: 'list',
        items: [
          [
            'History-mode refresh returns 404: configure a server fallback rule',
          ],
          [
            'Route parameter changes do not update: listen for route changes and refresh data',
          ],
          [
            'Nested routes do not display: confirm the parent renders RouterView',
          ],
        ],
      },
      {
        type: 'heading',
        level: 2,
        text: 'Summary',
      },
      {
        type: 'paragraph',
        content: [
          'TSone routing provides clear, lightweight navigation through createRouter, RouterView, and RouterLink.',
        ],
      },
    ],
  },
  {
    path: '/guide/style-management/',
    title: 'Style Management',
    description:
      'Learn about StyleManager, component style injection, dynamic styles, and global style practices.',
    section: 'Guide',
    sectionOrder: 1,
    order: 6,
    body: [
      {
        type: 'heading',
        level: 1,
        text: 'Style Management',
      },
      {
        type: 'paragraph',
        content: [
          'TSone provides a built-in style management system that uses StyleManager to manage component styles.',
        ],
      },
      {
        type: 'heading',
        level: 2,
        text: 'Core Concepts',
      },
      {
        type: 'heading',
        level: 3,
        text: 'StyleManager',
      },
      {
        type: 'paragraph',
        content: [
          'Every component instance has a styleManager for adding, changing, and removing styles.',
        ],
      },
      {
        type: 'heading',
        level: 3,
        text: 'Style Objects',
      },
      {
        type: 'list',
        items: [
          [
            {
              type: 'code',
              text: 'selector',
            },
            ': CSS selector',
          ],
          [
            {
              type: 'code',
              text: 'properties',
            },
            ': mapping of CSS properties to values',
          ],
        ],
      },
      {
        type: 'heading',
        level: 2,
        text: 'Basic Usage',
      },
      {
        type: 'heading',
        level: 3,
        text: 'Use in a Component',
      },
      {
        type: 'code',
        language: 'ts',
        code: "import { Component, VNode } from '@geektech/tsone';\n\nclass ButtonComponent extends Component<object, object> {\n  protected initState() {\n    return {};\n  }\n\n  protected initStyles() {\n    this.styleManager.addStyle('.button', {\n      selector: '.button',\n      properties: {\n        padding: '8px 16px',\n        backgroundColor: '#007bff',\n        color: '#fff',\n        borderRadius: '4px',\n      },\n    });\n\n    this.styleManager.addStyle('.button:hover', {\n      selector: '.button:hover',\n      properties: { backgroundColor: '#0069d9' },\n    });\n  }\n\n  protected render(): VNode {\n    return {\n      tag: 'button',\n      props: { className: 'button' },\n      children: ['Click Me'],\n    };\n  }\n}",
      },
      {
        type: 'heading',
        level: 2,
        text: 'Style Management API',
      },
      {
        type: 'heading',
        level: 3,
        text: 'Add Styles',
      },
      {
        type: 'code',
        language: 'ts',
        code: "this.styleManager.addStyle('.container', {\n  selector: '.container',\n  properties: {\n    width: '100%',\n    maxWidth: '1200px',\n    margin: '0 auto',\n    padding: '0 15px',\n  },\n});",
      },
      {
        type: 'heading',
        level: 3,
        text: 'Remove Styles',
      },
      {
        type: 'code',
        language: 'ts',
        code: "this.styleManager.removeStyle('.container');",
      },
      {
        type: 'heading',
        level: 3,
        text: 'Clear All Styles',
      },
      {
        type: 'code',
        language: 'ts',
        code: 'this.styleManager.clearStyles();',
      },
      {
        type: 'heading',
        level: 3,
        text: 'Get Styles',
      },
      {
        type: 'code',
        language: 'ts',
        code: "const buttonStyle = this.styleManager.getStyle('.button');\nconsole.log(buttonStyle);",
      },
      {
        type: 'heading',
        level: 2,
        text: 'Advanced Usage',
      },
      {
        type: 'heading',
        level: 3,
        text: 'Style Priority',
      },
      {
        type: 'list',
        items: [
          ['More specific selectors have higher priority'],
          ['With equal specificity, rules added later override earlier rules'],
        ],
      },
      {
        type: 'heading',
        level: 3,
        text: 'Responsive Styles',
      },
      {
        type: 'code',
        language: 'ts',
        code: "this.styleManager.addStyle('@media (max-width: 768px)', {\n  selector: '@media (max-width: 768px)',\n  properties: {\n    '.container': { padding: '10px' },\n  },\n});",
      },
      {
        type: 'heading',
        level: 3,
        text: 'Dynamic Styles',
      },
      {
        type: 'code',
        language: 'ts',
        code: "class DynamicStyleComponent extends Component<object, { isActive: boolean }> {\n  protected initState() {\n    return { isActive: false };\n  }\n\n  protected initStyles() {\n    this.styleManager.addStyle('.box.active', {\n      selector: '.box.active',\n      properties: { backgroundColor: '#007bff' },\n    });\n  }\n\n  protected render(): VNode {\n    return {\n      tag: 'div',\n      props: {\n        className: `box ${this.state.isActive ? 'active' : ''}`,\n      },\n      listeners: {\n        click: () => {\n          this.state.isActive = !this.state.isActive;\n        },\n      },\n      children: ['Click to toggle'],\n    };\n  }\n}",
      },
      {
        type: 'heading',
        level: 3,
        text: 'Global Styles',
      },
      {
        type: 'code',
        language: 'ts',
        code: "import { createApp } from '@geektech/tsone';\n\nconst app = createApp();\n\napp.styleManager.addStyle('body', {\n  selector: 'body',\n  properties: {\n    fontFamily: '-apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, sans-serif',\n    fontSize: '16px',\n    lineHeight: '1.5',\n  },\n});",
      },
      {
        type: 'heading',
        level: 2,
        text: 'How Style Management Works',
      },
      {
        type: 'heading',
        level: 3,
        text: 'Style Injection',
      },
      {
        type: 'list',
        items: [
          ['Create a style element'],
          ['Convert style rules to a CSS string'],
          ['Write CSS into the style element'],
          ['Inject the style element into the document head'],
        ],
      },
      {
        type: 'heading',
        level: 3,
        text: 'Style Updates',
      },
      {
        type: 'list',
        items: [
          ['Update internal style storage'],
          ['Regenerate the CSS string'],
          ['Refresh the style element content'],
        ],
      },
      {
        type: 'heading',
        level: 2,
        text: 'Best Practices',
      },
      {
        type: 'heading',
        level: 3,
        text: 'Style Organization',
      },
      {
        type: 'list',
        items: [
          ['Each component should primarily manage its own styles'],
          ['Use semantic class names'],
          ['Keep related rules together'],
        ],
      },
      {
        type: 'heading',
        level: 3,
        text: 'Performance Optimization',
      },
      {
        type: 'list',
        items: [
          ['Add styles together in initStyles() whenever possible'],
          ['Reduce frequent runtime style additions and removals'],
          ['Avoid overly complex selectors'],
        ],
      },
      {
        type: 'heading',
        level: 3,
        text: 'Common Issues',
      },
      {
        type: 'list',
        items: [
          ['Styles do not apply: check selectors and overrides'],
          ['Style conflicts: increase selector specificity or add a namespace'],
          [
            'Dynamic style performance: consider CSS variables for high-frequency changes',
          ],
        ],
      },
      {
        type: 'heading',
        level: 2,
        text: 'Summary',
      },
      {
        type: 'paragraph',
        content: [
          'StyleManager provides lightweight, composable component style management for both local styles and application-wide global styles.',
        ],
      },
    ],
  },
];
