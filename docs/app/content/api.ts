import {
  apiTable,
  codeBlock,
  heading,
  inlineCode,
  list,
  paragraph,
  type DocPage,
} from './types';

const apiSection = 'API';
const apiSectionOrder = 2;

export const apiPages: DocPage[] = [
  {
    path: '/api/app/',
    title: 'App API',
    description: '应用入口负责创建根组件、安装插件、挂载和卸载组件树。',
    section: apiSection,
    sectionOrder: apiSectionOrder,
    order: 1,
    body: [
      heading(1, '应用 API'),
      paragraph('应用入口负责创建根组件、安装插件、挂载和卸载组件树。'),
      heading(2, 'createApp'),
      apiTable([
        {
          name: 'createApp',
          signature: 'createApp(options?: AppOptions): OneApp',
          description: '创建 TSone 应用实例。',
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
          "  rootElement: '#app',",
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
        '最小应用可以写成 ',
        inlineCode('createApp({ root: App })'),
        '。'
      ),
      heading(2, 'AppOptions'),
      codeBlock(
        'ts',
        [
          'interface AppOptions<TState, TConfig> {',
          '  root?: ComponentConstructor;',
          '  rootElement?: string | Element;',
          '  state?: TState;',
          '  config?: TConfig;',
          '}',
        ].join('\n')
      ),
      list([
        [inlineCode('root'), ': 根组件类'],
        [inlineCode('rootElement'), ': 挂载点选择器或 DOM 元素'],
        [inlineCode('state'), ': 应用级状态'],
        [inlineCode('config'), ': 应用级配置'],
      ]),
      heading(2, 'OneApp 方法'),
      list([
        [inlineCode('mount()'), ': 挂载根组件并触发插件 onMounted'],
        [inlineCode('unmount()'), ': 卸载根组件并清空挂载容器'],
        [inlineCode('use(plugin)'), ': 安装插件，例如路由'],
        [inlineCode('update(state)'), ': 合并更新应用状态'],
        [inlineCode('getState() / setState(state)'), ': 读取或替换应用级状态'],
        [
          inlineCode('getContext()'),
          ': 返回包含 app、version 和 config 的上下文',
        ],
        [inlineCode('updateRootComponent(App)'), ': 替换根组件'],
        [inlineCode('onUnmounted(callback)'), ': 注册卸载后的回调'],
      ]),
    ],
  },
  {
    path: '/api/component/',
    title: 'Component API',
    description:
      'TSone 使用面向对象组件模型，通过 Component<Props, State> 管理 props、state 和 render。',
    section: apiSection,
    sectionOrder: apiSectionOrder,
    order: 2,
    body: [
      heading(1, '组件 API'),
      paragraph(
        'TSone 使用面向对象组件模型。每个组件继承 ',
        inlineCode('Component<Props, State>'),
        '，并通过 ',
        inlineCode('protected render(): VNode'),
        ' 返回 VNode。'
      ),
      heading(2, 'Component<Props, State>'),
      apiTable([
        {
          name: 'Component<Props, State>',
          signature: 'abstract class Component<Props, State>',
          description:
            '基于类的组件基类，提供 props、state、生命周期和 render。',
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
      heading(2, '必须实现的方法'),
      list([
        [
          inlineCode('protected initState(): State'),
          ': 返回组件初始状态，状态会被 reactive 包装',
        ],
        [
          inlineCode('protected initStyles(): void'),
          ': 初始化组件样式，可使用 this.styleManager',
        ],
        [inlineCode('protected render(): VNode'), ': 返回虚拟节点'],
      ]),
      heading(2, '生命周期'),
      list([
        [inlineCode('beforeMount()'), ': 首次渲染前'],
        [inlineCode('onMounted()'), ': DOM 挂载后'],
        [inlineCode('beforeUpdate()'), ': 状态更新触发 patch 前'],
        [inlineCode('onUpdated()'), ': patch 完成后'],
        [inlineCode('beforeUnmount()'), ': 卸载前'],
        [inlineCode('onUnmounted()'), ': 卸载后'],
      ]),
      heading(2, '状态和属性'),
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
          ': 构造组件时传入，也可由父组件 VNode 的 props 提供',
        ],
        [inlineCode('state'), ': 响应式状态'],
        [inlineCode('setProps(props)'), ': 合并更新属性，已挂载时触发更新'],
        [inlineCode('setState(state)'), ': 合并更新状态'],
      ]),
      heading(2, '事件'),
      codeBlock(
        'ts',
        [
          "component.on('submit', (payload) => {",
          '  console.log(payload);',
          '});',
          '',
          "component.off('submit', listener);",
        ].join('\n')
      ),
      paragraph('组件内部可使用 this.emit(eventName, ...args) 触发事件。'),
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
      '响应式 API 包含 reactive、effect、computed、readonly、ref、stop 等核心能力。',
    section: apiSection,
    sectionOrder: apiSectionOrder,
    order: 3,
    body: [
      heading(1, '响应式 API'),
      paragraph('本文档介绍 TSone 响应式系统的 API。'),
      heading(2, '核心函数总览'),
      apiTable([
        {
          name: 'reactive',
          signature: 'reactive<T extends object>(target: T): T',
          description: '创建响应式代理对象。',
        },
        {
          name: 'effect',
          signature: 'effect(fn: () => void, options?): EffectRunner',
          description: '创建副作用函数，在依赖变化时重新执行。',
        },
        {
          name: 'computed',
          signature: 'computed<T>(getter: () => T): { value: T }',
          description: '创建带缓存的计算属性。',
        },
        {
          name: 'ref',
          signature: 'ref<T>(value: T): { value: T }',
          description: '创建单值响应式引用。',
        },
        {
          name: 'readonly',
          signature: 'readonly<T extends object>(target: T): T',
          description: '创建只读响应式代理对象。',
        },
        {
          name: 'stop',
          signature: 'stop(effect: EffectRunner): void',
          description: '停止一个副作用函数继续响应更新。',
        },
        {
          name: 'isReactive',
          signature: 'isReactive(value: unknown): boolean',
          description: '检查对象是否为响应式代理。',
        },
        {
          name: 'isReadonly',
          signature: 'isReadonly(value: unknown): boolean',
          description: '检查对象是否为只读响应式代理。',
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
      heading(2, '示例'),
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
      '路由以插件形式安装，并通过 RouterView、RouterLink 和 createRouter 管理导航。',
    section: apiSection,
    sectionOrder: apiSectionOrder,
    order: 4,
    body: [
      heading(1, '路由 API'),
      paragraph(
        'TSone 路由以插件形式安装，并通过 RouterView 渲染当前路由组件。'
      ),
      heading(2, 'createRouter'),
      apiTable([
        {
          name: 'createRouter',
          signature:
            'createRouter(options: RouterOptions | RouteRecord[]): Router',
          description: '创建路由实例并返回可安装插件。',
        },
        {
          name: 'RouterView',
          signature: 'class RouterView extends Component',
          description: '渲染当前路由匹配到的组件。',
        },
        {
          name: 'RouterLink',
          signature: 'class RouterLink extends Component<RouterLinkProps>',
          description: '渲染可拦截点击并通过路由导航的链接。',
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
          "    { path: '/users/:id', name: 'user', component: UserPage, meta: { title: '用户详情' } },",
          '  ],',
          '});',
        ].join('\n')
      ),
      paragraph(
        '最小配置可以写成 ',
        inlineCode('createRouter({ routes: [...] })'),
        '。'
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
      paragraph('path 支持动态参数，例如 /users/:id。'),
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
          "    children: ['用户详情'],",
          '  },',
          '}',
        ].join('\n')
      ),
      paragraph(
        'RouterLink 会生成 a 标签，点击后调用 router.push() 或 router.replace()。'
      ),
      heading(2, 'Router 方法'),
      list([
        [inlineCode('push(path) / replace(path)'), ': 导航到新路径'],
        [inlineCode('back() / forward() / go(n)'), ': 操作浏览器历史记录'],
        [inlineCode('getCurrentRoute()'), ': 返回当前路由位置'],
        [inlineCode('getCurrentRouteRecord()'), ': 返回当前匹配到的路由记录'],
        [inlineCode('onRouteChange(callback)'), ': 注册路由变化监听'],
        [inlineCode('addRoute(record)'), ': 动态添加路由'],
        [inlineCode('createHref(path)'), ': 根据模式与 base 生成链接地址'],
        [inlineCode('destroy()'), ': 移除事件监听并解除应用上的路由引用'],
      ]),
    ],
  },
  {
    path: '/api/style/',
    title: 'Style API',
    description: 'StyleManager 负责管理组件样式并把样式规则写入 style 元素。',
    section: apiSection,
    sectionOrder: apiSectionOrder,
    order: 5,
    body: [
      heading(1, '样式 API'),
      paragraph('本文档介绍 TSone 样式管理系统的 API。'),
      heading(2, 'StyleManager'),
      apiTable([
        {
          name: 'StyleManager',
          signature: 'class StyleManager',
          description: '管理组件样式并写入 style 元素。',
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
      heading(2, 'StyleManager 方法'),
      list([
        [inlineCode('addStyle(selector, style)'), ': 添加样式规则'],
        [inlineCode('removeStyle(selector)'), ': 移除指定样式'],
        [inlineCode('getStyle(selector)'), ': 读取指定样式'],
        [inlineCode('clearStyles()'), ': 清空所有样式'],
        [inlineCode('addStyleFromCSS(css)'), ': 从 CSS 字符串批量导入规则'],
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
      heading(2, '组件内样式管理'),
      paragraph(
        '组件实例可在 initStyles 中通过 this.styleManager 管理局部样式。'
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
