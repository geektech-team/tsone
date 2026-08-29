import {
  apiTable,
  codeBlock,
  heading,
  inlineCode,
  list,
  paragraph,
  type DocPage,
} from '../types';

const apiSection = 'API';
const apiSectionOrder = 2;

export const enApiPages: DocPage[] = [
  {
    path: '/api/app/',
    title: 'App API',
    description:
      'The application entry point creates the root component, installs plugins, and mounts or unmounts the component tree.',
    section: apiSection,
    sectionOrder: apiSectionOrder,
    order: 1,
    body: [
      heading(1, 'App API'),
      paragraph(
        'The application entry point creates the root component, installs plugins, and mounts or unmounts the component tree.'
      ),
      heading(2, 'createApp'),
      apiTable([
        {
          name: 'createApp',
          signature: 'createApp(options?: AppOptions): OneApp',
          description: 'Creates a TSone application instance.',
        },
      ]),
      codeBlock(
        'ts',
        [
          "import { Component, VNode, createApp } from '@geektech/tsone';",
          '',
          'class App extends Component<object, object> {',
          '  protected initState() {',
          '    return {};',
          '  }',
          '',
          '  protected initStyles(): void {}',
          '',
          '  protected render(): VNode {',
          '    return {',
          "      tag: 'main',",
          "      children: ['Hello TSone'],",
          '    };',
          '  }',
          '}',
          '',
          'const app = createApp({',
          '  root: App,',
          '  state: {',
          "    appName: 'TSone',",
          '  },',
          '  config: {',
          '    debug: true,',
          '  },',
          '});',
          '',
          'app.mount();',
        ].join('\n')
      ),
      paragraph(
        'A minimal application can be written as ',
        inlineCode('createApp({ root: App })'),
        '.'
      ),
      paragraph(
        'After creating the application, call ',
        inlineCode('app.mount()'),
        '. When ',
        inlineCode('rootElement'),
        ' is omitted, the application mounts to #app by default. If the target element does not exist, the mount is safely skipped.'
      ),
      heading(2, 'AppOptions'),
      codeBlock(
        'ts',
        [
          'interface AppOptions<TState, TConfig> {',
          '  root?: ComponentConstructor;',
          '  rootProps?: ComponentProps;',
          '  rootElement?: string | Element;',
          '  state?: TState;',
          '  config?: TConfig;',
          '  document?: AppDocumentOptions;',
          '}',
        ].join('\n')
      ),
      list([
        [inlineCode('root'), ': the root component class'],
        [
          inlineCode('rootProps'),
          ': props passed to the root component constructor',
        ],
        [
          inlineCode('rootElement'),
          ': an optional mount-point selector or DOM element; defaults to #app',
        ],
        [inlineCode('state'), ': application-level state'],
        [inlineCode('config'), ': application-level configuration'],
        [
          inlineCode('document'),
          ': the HTML document shell configuration used to generate entry pages during dev/build',
        ],
      ]),
      heading(2, 'OneApp Methods'),
      list([
        [
          inlineCode('mount()'),
          ': mounts the root component and triggers plugin onMounted hooks',
        ],
        [
          inlineCode('unmount()'),
          ': unmounts the root component and clears the mount container',
        ],
        [inlineCode('use(plugin)'), ': installs a plugin, such as the router'],
        [inlineCode('update(state)'), ': merges an application state update'],
        [
          inlineCode('getState() / setState(state)'),
          ': reads or replaces application-level state',
        ],
        [
          inlineCode('getContext()'),
          ': returns the context containing app, version, and config',
        ],
        [
          inlineCode('updateRootComponent(App)'),
          ': replaces the root component',
        ],
        [
          inlineCode('onUnmounted(callback)'),
          ': registers a callback that runs after unmounting',
        ],
        [
          inlineCode('provide(key, value)'),
          ': provides an application-level dependency',
        ],
        [
          inlineCode('inject(key, fallback?)'),
          ': retrieves an application-level dependency',
        ],
        [
          inlineCode('renderHtmlDocument(options?)'),
          ': generates a complete HTML document from the application document configuration',
        ],
      ]),
      heading(2, 'renderHtmlDocument'),
      apiTable([
        {
          name: 'OneApp.renderHtmlDocument',
          signature:
            'app.renderHtmlDocument(options?: AppDocumentRenderOptions): string',
          description:
            'Generates a complete HTML document shell from the createApp document configuration. It includes the #app mount point by default and is suitable for playgrounds, static sites, and documentation builds.',
        },
        {
          name: 'renderHtmlDocument',
          signature: 'renderHtmlDocument(options: HtmlDocumentOptions): string',
          description:
            'The low-level document renderer, which can generate a complete HTML document shell directly from a TSone component or VNode.',
        },
      ]),
      paragraph(
        inlineCode('createApp'),
        "'s ",
        inlineCode('document'),
        ' configuration emits a #app mount node by default. Pass ',
        inlineCode('rootElement'),
        ' to override the default mount point. To replace the document content, ',
        inlineCode('body'),
        ' accepts TSone component nodes, VNodes, or text nodes. Text is escaped as text content and is not parsed as HTML.'
      ),
      paragraph(
        'In Bun/Node static-generation environments, provide a DOM-like document first, such as the Happy DOM instance used by the project documentation build script.'
      ),
      codeBlock(
        'ts',
        [
          'import {',
          '  Component,',
          '  VNode,',
          '  createApp,',
          '  type StyleSheet,',
          "} from '@geektech/tsone';",
          '',
          'interface AppProps {',
          '  message: string;',
          '}',
          '',
          'class App extends Component<AppProps, object> {',
          '  protected initState() {',
          '    return {};',
          '  }',
          '',
          '  protected initStyles(): void {}',
          '',
          '  protected render(): VNode {',
          '    return {',
          "      tag: 'main',",
          "      props: { className: 'app' },",
          '      children: [this.props.message],',
          '    };',
          '  }',
          '}',
          '',
          'const styles: StyleSheet = [',
          '  {',
          "    selector: '.app',",
          "    properties: { maxWidth: '72rem' },",
          '  },',
          '];',
          '',
          'const app = createApp({',
          '  root: App,',
          '  document: {',
          "    lang: 'en',",
          "    title: 'TSone Docs',",
          "    description: 'Static documentation generated by TSone',",
          '    styles,',
          '  },',
          '});',
          '',
          'const html = app.renderHtmlDocument({',
          "  scripts: [{ type: 'module', src: '/assets/app.js' }],",
          '});',
        ].join('\n')
      ),
      list([
        [
          inlineCode('lang'),
          ': the language tag emitted on the html element; defaults to en',
        ],
        [inlineCode('title'), ': the HTML-escaped document title'],
        [inlineCode('description'), ': an optional meta description'],
        [
          inlineCode('styles'),
          ': an array of StyleSheet objects serialized by the framework into style elements',
        ],
        [
          inlineCode('scripts'),
          ': external script configuration, such as a module client bundle',
        ],
      ]),
      heading(2, 'Development Tooling API'),
      paragraph(
        'Development and build APIs are exported by the separate ',
        inlineCode('@geektech/tsone-cli'),
        ' package, not by the @geektech/tsone framework root.'
      ),
      apiTable([
        {
          name: 'defineConfig',
          signature: 'defineConfig(config: UserConfig): UserConfig',
          description: 'Returns the same typed plain-object configuration.',
        },
        {
          name: 'resolveConfig',
          signature:
            'resolveConfig(options?: ResolveConfigOptions): Promise<ResolvedConfig>',
          description:
            'Validates and merges defaults, tsone.config.ts, direct config, and host/port/outDir overrides. Resolved root, entry, and outDir paths are absolute.',
        },
        {
          name: 'startDevServer',
          signature:
            'startDevServer(options?: StartDevServerOptions): Promise<Bun.Server>',
          description:
            'Starts the Bun HTTP development server. The caller owns the returned server and must call server.stop().',
        },
        {
          name: 'build',
          signature: 'build(options?: BuildOptions): Promise<BuildResult>',
          description:
            'Emits browser assets and index.html, then returns absolute root/outDir values and assetsBuilt.',
        },
      ]),
      codeBlock(
        'ts',
        [
          'import {',
          '  build,',
          '  defineConfig,',
          '  resolveConfig,',
          '  startDevServer,',
          "} from '@geektech/tsone-cli';",
          '',
          "const config = defineConfig({ build: { outDir: 'dist' } });",
          'const resolved = await resolveConfig({ config });',
          'const server = await startDevServer({ port: 0 });',
          '',
          'try {',
          '  console.log(server.url);',
          '} finally {',
          '  server.stop();',
          '}',
          '',
          "const result = await build({ outDir: 'release' });",
          'console.log(result.root, result.outDir, result.assetsBuilt);',
        ].join('\n')
      ),
      paragraph(
        'Configuration defaults are entry src/main.ts, server host 127.0.0.1, port 52211, an empty server.proxy, and build.outDir dist. The entry must use export const app and provide renderHtmlDocument().'
      ),
      paragraph(
        'server.proxy accepts HTTP/HTTPS string or { target, changeOrigin, rewrite } rules. Literal prefixes use the longest match first; query strings, bodies, and end-to-end headers are forwarded, and failed upstream connections return 502 Bad Gateway.'
      ),
      paragraph(
        'build.outDir must be a safe child directory of the project root. CLI v1 has no config plugins, WebSocket, HMR, SSR, public/ copying, or public minify/sourcemap configuration.'
      ),
    ],
  },
  {
    path: '/api/component/',
    title: 'Component API',
    description:
      'TSone uses an object-oriented component model in which Component<Props, State> manages props, state, and rendering.',
    section: apiSection,
    sectionOrder: apiSectionOrder,
    order: 2,
    body: [
      heading(1, 'Component API'),
      paragraph(
        'TSone uses an object-oriented component model. Each component extends ',
        inlineCode('Component<Props, State>'),
        ' and returns a VNode through ',
        inlineCode('protected render(): VNode'),
        '.'
      ),
      heading(2, 'Component<Props, State>'),
      apiTable([
        {
          name: 'Component<Props, State>',
          signature: 'abstract class Component<Props, State>',
          description:
            'The class-based component base class, providing props, state, lifecycle hooks, and rendering.',
        },
      ]),
      codeBlock(
        'ts',
        [
          "import { Component, VNode } from '@geektech/tsone';",
          '',
          'interface CounterProps {',
          '  initial?: number;',
          '}',
          '',
          'interface CounterState {',
          '  count: number;',
          '}',
          '',
          'class Counter extends Component<CounterProps, CounterState> {',
          '  protected initState(): CounterState {',
          '    return {',
          '      count: this.props.initial ?? 0,',
          '    };',
          '  }',
          '',
          '  protected initStyles(): void {}',
          '',
          '  protected render(): VNode {',
          '    return {',
          "      tag: 'button',",
          '      listeners: {',
          '        click: () => {',
          '          this.state.count += 1;',
          '        },',
          '      },',
          "      children: ['count: {{count}}'],",
          '    };',
          '  }',
          '}',
        ].join('\n')
      ),
      heading(2, 'Required Methods'),
      list([
        [
          inlineCode('protected initState(): State'),
          ': returns the initial component state, which is wrapped with reactive',
        ],
        [
          inlineCode('protected initStyles(): void'),
          ': initializes component styles and can use this.styleManager',
        ],
        [inlineCode('protected render(): VNode'), ': returns a virtual node'],
      ]),
      heading(2, 'Lifecycle'),
      list([
        [inlineCode('beforeMount()'), ': before the initial render'],
        [inlineCode('onMounted()'), ': after the DOM is mounted'],
        [
          inlineCode('beforeUpdate()'),
          ': before a state update triggers a patch',
        ],
        [inlineCode('onUpdated()'), ': after the patch is complete'],
        [inlineCode('beforeUnmount()'), ': before unmounting'],
        [inlineCode('onUnmounted()'), ': after unmounting'],
      ]),
      heading(2, 'State and Props'),
      codeBlock(
        'ts',
        [
          'component.setProps({ initial: 3 });',
          'component.setState({ count: 4 });',
        ].join('\n')
      ),
      list([
        [
          inlineCode('props'),
          ': passed when constructing the component or supplied by a parent component VNode',
        ],
        [inlineCode('state'), ': reactive state'],
        [
          inlineCode('setProps(props)'),
          ': merges updated props and triggers an update when mounted',
        ],
        [inlineCode('setState(state)'), ': merges updated state'],
      ]),
      heading(2, 'Events'),
      codeBlock(
        'ts',
        [
          "const unsubscribe = component.on('submit', (payload) => {",
          '  console.log(payload);',
          '});',
          '',
          'unsubscribe();',
        ].join('\n')
      ),
      paragraph(
        'Inside a component, use this.emit(eventName, ...args) to emit an event.'
      ),
      paragraph(
        'Use ',
        inlineCode('emitters'),
        ' on a parent component VNode to declare event handlers. During patching, old handlers are replaced or removed.'
      ),
      codeBlock(
        'ts',
        [
          '{',
          '  component: Editor,',
          '  emitters: {',
          '    saved: (payload) => this.save(payload),',
          '  },',
          '}',
        ].join('\n')
      ),
      heading(2, 'Dependency Injection'),
      paragraph(
        'Use ',
        inlineCode('InjectionKey'),
        ', ',
        inlineCode('provide'),
        ', and ',
        inlineCode('inject'),
        ' to share dependencies across the application and component tree. Component injection searches the component itself, its ancestors, and then the application.'
      ),
      codeBlock(
        'ts',
        [
          "import { InjectionKey } from '@geektech/tsone';",
          '',
          "const THEME: InjectionKey<{ mode: string }> = Symbol('theme');",
          "app.provide(THEME, { mode: 'dark' });",
          "const theme = this.inject(THEME, { mode: 'light' });",
        ].join('\n')
      ),
      heading(2, 'Conditionals, Lists, and Model Binding'),
      codeBlock(
        'ts',
        [
          "import { Input, each } from '@geektech/tsone';",
          '',
          'const children = each(',
          '  this.state.users,',
          "  (user) => ({ tag: 'li', children: [user.name] }),",
          '  (user) => user.id',
          ');',
          '',
          'const field = Input({',
          '  directions: {',
          "    model: { path: 'profile.name' },",
          '  },',
          '});',
          '',
          'const panel = {',
          '  component: ProfilePanel,',
          '  directions: { if: this.state.visible },',
          '};',
        ].join('\n')
      ),
      heading(2, 'Form Validation'),
      codeBlock(
        'ts',
        [
          "import { createForm, minLength, required, validate } from '@geektech/tsone';",
          '',
          'const form = createForm(this.state, {',
          "  'profile.name': [required('Please enter a name'), minLength(2)],",
          "  'profile.age': [validate((value) => Number(value) >= 18 || 'Age must be at least 18')],",
          '});',
          '',
          'const result = form.validate();',
          "const field = form.validateField('profile.name');",
          'form.resetErrors();',
        ].join('\n')
      ),
      heading(2, 'Slots'),
      codeBlock(
        'ts',
        [
          'class Panel extends Component<object, object> {',
          '  protected initState() {',
          '    return {};',
          '  }',
          '',
          '  protected initStyles(): void {}',
          '',
          '  protected render(): VNode {',
          '    return {',
          "      tag: 'section',",
          '      children: [',
          "        { tag: 'slot', props: { name: 'header' } },",
          "        { tag: 'slot', props: { name: 'default' } },",
          '      ],',
          '    };',
          '  }',
          '}',
        ].join('\n')
      ),
    ],
  },
  {
    path: '/api/reactive/',
    title: 'Reactive API',
    description:
      'The reactive API includes core capabilities such as reactive, effect, computed, readonly, ref, and stop.',
    section: apiSection,
    sectionOrder: apiSectionOrder,
    order: 3,
    body: [
      heading(1, 'Reactive API'),
      paragraph('This page documents the TSone reactive system API.'),
      heading(2, 'Core Function Overview'),
      apiTable([
        {
          name: 'reactive',
          signature: 'reactive<T extends object>(target: T): T',
          description: 'Creates a reactive proxy object.',
        },
        {
          name: 'effect',
          signature: 'effect(fn: () => void, options?): EffectRunner',
          description:
            'Creates an effect that reruns when its dependencies change.',
        },
        {
          name: 'computed',
          signature: 'computed<T>(getter: () => T): { value: T }',
          description: 'Creates a cached computed value.',
        },
        {
          name: 'ref',
          signature: 'ref<T>(value: T): { value: T }',
          description: 'Creates a reactive reference for a single value.',
        },
        {
          name: 'isRef',
          signature: 'isRef(value: unknown): boolean',
          description: 'Checks whether a value is a ref.',
        },
        {
          name: 'unref',
          signature: 'unref<T>(value: T | Ref<T>): T',
          description:
            'Returns value for a ref, or returns the original value otherwise.',
        },
        {
          name: 'readonly',
          signature: 'readonly<T extends object>(target: T): T',
          description: 'Creates a readonly reactive proxy object.',
        },
        {
          name: 'stop',
          signature: 'stop(effect: EffectRunner): void',
          description: 'Stops an effect from responding to further updates.',
        },
        {
          name: 'isReactive',
          signature: 'isReactive(value: unknown): boolean',
          description: 'Checks whether an object is a reactive proxy.',
        },
        {
          name: 'isReadonly',
          signature: 'isReadonly(value: unknown): boolean',
          description: 'Checks whether an object is a readonly reactive proxy.',
        },
      ]),
      heading(2, 'reactive'),
      codeBlock(
        'ts',
        [
          "import { reactive } from '@geektech/tsone';",
          '',
          'const state = reactive({',
          '  count: 0,',
          "  user: { name: 'John', age: 30 },",
          '});',
        ].join('\n')
      ),
      heading(2, 'effect'),
      codeBlock(
        'ts',
        [
          "import { effect, reactive } from '@geektech/tsone';",
          '',
          'const state = reactive({ count: 0 });',
          '',
          'effect(() => {',
          '  console.log(`Count: ${state.count}`);',
          '});',
          '',
          'state.count = 1;',
        ].join('\n')
      ),
      heading(2, 'computed'),
      codeBlock(
        'ts',
        [
          "import { computed, reactive } from '@geektech/tsone';",
          '',
          'const state = reactive({ count: 0 });',
          'const doubleCount = computed(() => state.count * 2);',
          '',
          'console.log(doubleCount.value);',
        ].join('\n')
      ),
      heading(2, 'readonly'),
      codeBlock(
        'ts',
        [
          "import { reactive, readonly } from '@geektech/tsone';",
          '',
          'const original = reactive({ count: 0 });',
          'const readOnlyState = readonly(original);',
        ].join('\n')
      ),
      heading(2, 'stop'),
      codeBlock(
        'ts',
        [
          "import { effect, reactive, stop } from '@geektech/tsone';",
          '',
          'const state = reactive({ count: 0 });',
          'const runner = effect(() => {',
          '  console.log(`Count: ${state.count}`);',
          '});',
          '',
          'stop(runner);',
        ].join('\n')
      ),
      heading(2, 'ref'),
      codeBlock(
        'ts',
        [
          "import { effect, ref } from '@geektech/tsone';",
          '',
          'const count = ref(0);',
          'effect(() => {',
          '  console.log(count.value);',
          '});',
        ].join('\n')
      ),
      heading(2, 'Example'),
      codeBlock(
        'ts',
        [
          "import { computed, effect, reactive, readonly, ref, stop } from '@geektech/tsone';",
          '',
          'const state = reactive({ count: 0 });',
          'const countRef = ref(1);',
          'const doubleCount = computed(() => state.count * 2 + countRef.value);',
          'const runner = effect(() => {',
          '  console.log(state.count, doubleCount.value);',
          '});',
          '',
          'const frozen = readonly(state);',
          'console.log(frozen.count);',
          'stop(runner);',
        ].join('\n')
      ),
    ],
  },
  {
    path: '/api/router/',
    title: 'Router API',
    description:
      'The router is installed as a plugin and manages navigation through RouterView, RouterLink, and createRouter.',
    section: apiSection,
    sectionOrder: apiSectionOrder,
    order: 4,
    body: [
      heading(1, 'Router API'),
      paragraph(
        'The TSone router is installed as a plugin, and RouterView renders the component for the current route.'
      ),
      heading(2, 'createRouter'),
      apiTable([
        {
          name: 'createRouter',
          signature:
            'createRouter(options: RouterOptions | RouteRecord[]): Router',
          description:
            'Creates a router instance and returns an installable plugin.',
        },
        {
          name: 'RouterView',
          signature: 'class RouterView extends Component',
          description: 'Renders the component matched by the current route.',
        },
        {
          name: 'RouterLink',
          signature: 'class RouterLink extends Component<RouterLinkProps>',
          description:
            'Renders a link that intercepts clicks and navigates through the router.',
        },
      ]),
      codeBlock(
        'ts',
        [
          "import { createRouter } from '@geektech/tsone/router';",
          '',
          'const router = createRouter({',
          "  mode: 'history',",
          "  base: '/',",
          '  routes: [',
          "    { path: '/', name: 'home', component: HomePage },",
          "    { path: '/users/:id', name: 'user', component: UserPage, meta: { title: 'User Details' } },",
          '  ],',
          '});',
        ].join('\n')
      ),
      paragraph(
        'A minimal configuration can be written as ',
        inlineCode('createRouter({ routes: [...] })'),
        '.'
      ),
      heading(2, 'RouterOptions'),
      codeBlock(
        'ts',
        [
          'interface RouterOptions {',
          '  routes: RouteRecord[];',
          "  mode?: 'history' | 'hash';",
          '  base?: string;',
          '}',
        ].join('\n')
      ),
      heading(2, 'RouteRecord'),
      codeBlock(
        'ts',
        [
          'interface RouteRecord {',
          '  path: string;',
          '  component: ComponentConstructor;',
          '  name?: string;',
          '  meta?: Record<string, unknown>;',
          '}',
        ].join('\n')
      ),
      paragraph('path supports dynamic parameters such as /users/:id.'),
      heading(2, 'RouterView'),
      codeBlock(
        'ts',
        [
          "import { Component, VNode } from '@geektech/tsone';",
          "import { RouterView } from '@geektech/tsone/router';",
          '',
          'class Layout extends Component<object, object> {',
          '  protected initState() {',
          '    return {};',
          '  }',
          '',
          '  protected initStyles(): void {}',
          '',
          '  protected render(): VNode {',
          '    return {',
          "      tag: 'main',",
          '      children: [{ component: RouterView }],',
          '    };',
          '  }',
          '}',
        ].join('\n')
      ),
      heading(2, 'RouterLink'),
      codeBlock(
        'ts',
        [
          "import { RouterLink } from '@geektech/tsone/router';",
          '',
          '{',
          '  component: RouterLink,',
          '  props: {',
          "    to: '/users/42',",
          "    activeClass: 'is-active',",
          "    children: ['User Details'],",
          '  },',
          '}',
        ].join('\n')
      ),
      paragraph(
        'RouterLink renders an a element and calls router.push() or router.replace() when clicked.'
      ),
      heading(2, 'Router Methods'),
      list([
        [inlineCode('push(path) / replace(path)'), ': navigates to a new path'],
        [
          inlineCode('back() / forward() / go(n)'),
          ': controls browser history',
        ],
        [
          inlineCode('getCurrentRoute()'),
          ': returns the current route location',
        ],
        [
          inlineCode('getCurrentRouteRecord()'),
          ': returns the currently matched route record',
        ],
        [
          inlineCode('onRouteChange(callback)'),
          ': registers a route-change listener',
        ],
        [inlineCode('addRoute(record)'), ': adds a route dynamically'],
        [
          inlineCode('createHref(path)'),
          ': generates a link URL from the mode and base',
        ],
        [
          inlineCode('destroy()'),
          ': removes event listeners and detaches the router reference from the application',
        ],
      ]),
    ],
  },
  {
    path: '/api/style/',
    title: 'Style API',
    description:
      'StyleManager manages component styles and writes style rules into a style element.',
    section: apiSection,
    sectionOrder: apiSectionOrder,
    order: 5,
    body: [
      heading(1, 'Style API'),
      paragraph('This page documents the TSone style management system API.'),
      heading(2, 'StyleManager'),
      apiTable([
        {
          name: 'StyleManager',
          signature: 'class StyleManager',
          description:
            'Manages component styles and writes them into a style element.',
        },
      ]),
      codeBlock(
        'ts',
        [
          "import { StyleManager } from '@geektech/tsone/style';",
          '',
          'const styleManager = new StyleManager();',
        ].join('\n')
      ),
      heading(2, 'StyleManager Methods'),
      list([
        [inlineCode('addStyle(selector, style)'), ': adds a style rule'],
        [inlineCode('removeStyle(selector)'), ': removes a specific style'],
        [inlineCode('getStyle(selector)'), ': reads a specific style'],
        [inlineCode('clearStyles()'), ': clears all styles'],
        [
          inlineCode('addStyleFromCSS(css)'),
          ': imports rules from a CSS string',
        ],
      ]),
      codeBlock(
        'ts',
        [
          "styleManager.addStyle('.button', {",
          "  selector: '.button',",
          '  properties: {',
          "    padding: '8px 16px',",
          "    backgroundColor: '#007bff',",
          "    color: '#fff',",
          '  },',
          '});',
          '',
          "styleManager.removeStyle('.button');",
          'styleManager.clearStyles();',
        ].join('\n')
      ),
      heading(2, 'Managing Styles in Components'),
      paragraph(
        'A component instance can manage local styles through this.styleManager in initStyles.'
      ),
      codeBlock(
        'ts',
        [
          'class ButtonComponent extends Component<object, object> {',
          '  protected initState() {',
          '    return {};',
          '  }',
          '',
          '  protected initStyles() {',
          "    this.styleManager.addStyle('.button:hover', {",
          "      selector: '.button:hover',",
          "      properties: { backgroundColor: '#0069d9' },",
          '    });',
          '  }',
          '',
          '  protected render(): VNode {',
          '    return {',
          "      tag: 'button',",
          "      props: { className: 'button' },",
          "      children: ['Click Me'],",
          '    };',
          '  }',
          '}',
        ].join('\n')
      ),
    ],
  },
];
