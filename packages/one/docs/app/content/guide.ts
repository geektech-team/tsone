import {
  apiTable,
  callout,
  codeBlock,
  heading,
  inlineCode,
  list,
  paragraph,
  t,
  type OneDocPage,
} from './types';
import { oneThemeTokens } from './theme-tokens';

export const guidePages: OneDocPage[] = [
  {
    path: '/guide/design/',
    title: t('设计理念', 'Design principles'),
    description: t(
      '了解 One UI 的轻量运行时、类组件组合、可访问性与主题原则。',
      'Learn One UI principles for lightweight runtime, class composition, accessibility and theming.'
    ),
    section: 'guide',
    sectionOrder: 1,
    order: 0,
    body: [
      heading(1, 'design', t('设计理念', 'Design principles')),
      paragraph(
        t(
          'One UI 沿用 TSone 的纯 TypeScript 类组件模型，以清晰的小型组件构建界面。',
          'One UI follows the pure TypeScript class-component model of TSone, building interfaces from clear, small components.'
        )
      ),
      heading(2, 'lightweight', t('轻量级运行时', 'Lightweight runtime')),
      paragraph(
        t(
          '组件库保持零运行时依赖；TSone 作为 peer dependency 提供 Component、VNode 与渲染生命周期。',
          'The component library keeps zero runtime dependencies; TSone, as a peer dependency, provides Component, VNode and the render lifecycle.'
        )
      ),
      heading(2, 'composition', t('类组件与组合', 'Class components and composition')),
      paragraph(
        t(
          '每个组件只负责一种 UI 行为，并通过 props、事件和插槽协作。组合优于额外继承，避免为了复用少量视图逻辑增加类层级。',
          'Each component owns a single UI behavior and collaborates through props, events and slots. Composition is preferred over extra inheritance, avoiding deeper class hierarchies just to reuse a little view logic.'
        )
      ),
      heading(2, 'accessibility', t('可访问性', 'Accessibility')),
      list([
        [t('使用原生 button、input 和语义化 section 元素。', 'Use native button, input and semantic section elements.')],
        [t('将 disabled、required、readonly 与 aria-* 状态映射到 DOM。', 'Map disabled, required, readonly and aria-* states onto the DOM.')],
        [t('为键盘用户保留清晰的 focus-visible 焦点样式。', 'Keep a clear focus-visible style for keyboard users.')],
      ]),
      heading(2, 'css-variables', 'CSS Variables'),
      paragraph(
        t('组件通过 ', 'Components accept global or local theme overrides through the '),
        inlineCode('--one-*'),
        t(
          ' CSS Variables 接受全局或局部主题覆盖，同时为每个公开 token 保留稳定回退值。',
          ' CSS Variables, while keeping a stable fallback value for every public token.'
        )
      ),
    ],
  },
  {
    path: '/guide/getting-started/',
    title: t('快速开始', 'Getting started'),
    description: t(
      '在一个完整 TSone 应用中导入并渲染 One UI 的三个组件。',
      'Import and render three One UI components inside a complete TSone application.'
    ),
    section: 'guide',
    sectionOrder: 1,
    order: 1,
    body: [
      heading(1, 'getting-started', t('快速开始', 'Getting started')),
      paragraph(
        t(
          '安装两个包后，使用 TSone 的 createComponent 组合 One UI。',
          'After installing both packages, compose One UI with the TSone createComponent helper.'
        )
      ),
      codeBlock('bash', 'bun add @geektech/tsone @geektech/one'),
      heading(2, 'complete-app', t('完整应用', 'Complete application')),
      codeBlock(
        'ts',
        [
          "import { Component, createApp, createComponent, type VNode } from '@geektech/tsone';",
          "import { OneButton, OneCard, OneInput } from '@geektech/one';",
          '',
          'class App extends Component {',
          '  protected initState(): object {',
          '    return {};',
          '  }',
          '',
          '  protected initStyles(): void {}',
          '',
          '  protected render(): VNode {',
          '    return {',
          "      tag: 'main',",
          '      children: [',
          "        createComponent(OneButton, { variant: 'primary' }, ['保存']),",
          "        createComponent(OneInput, { placeholder: '项目名称', ariaLabel: '项目名称' }),",
          "        createComponent(OneCard, { title: 'One UI' }, [",
          "          '三个组件已经在同一个 TSone 应用中渲染。',",
          '        ]),',
          '      ],',
          '    };',
          '  }',
          '}',
          '',
          'createApp({ root: App }).mount();',
        ].join('\n')
      ),
      callout('tip', t('保持类型信息', 'Keep type information'), [
        t(
          '从包根导入公开组件与类型；样式由组件生命周期自动注册。',
          'Import public components and types from the package root; styles are registered automatically by the component lifecycle.'
        ),
      ]),
    ],
  },
  {
    path: '/guide/theming/',
    title: t('主题定制', 'Theming'),
    description: t(
      '初始化多套全局主题、切换当前主题并查看完整 CSS token。',
      'Initialize multiple global themes, switch the active theme and inspect every CSS token.'
    ),
    section: 'guide',
    sectionOrder: 1,
    order: 2,
    body: [
      heading(1, 'theming', t('主题定制', 'Theming')),
      paragraph(
        t(
          'One UI 始终包含不可覆盖的内置 default 主题。oneTheme.init() 可以注册多套全局主题，每套自定义主题都会按 colors、typography、border 和 radius 分组，从内置 default 深度继承未填写的字段。',
          'One UI always ships a built-in default theme that cannot be overridden. oneTheme.init() registers multiple global themes; each custom theme is grouped by colors, typography, border and radius, and deep-inherits any unfilled field from the built-in default.'
        )
      ),
      heading(2, 'initialize', t('初始化多套主题', 'Initialize multiple themes')),
      codeBlock(
        'ts',
        [
          "import { OneButton, oneTheme } from '@geektech/one';",
          '',
          'oneTheme.init({',
          "  defaultTheme: 'brand',",
          '  themes: {',
          '    brand: {',
          "      colors: { primary: '#326bff', primaryHover: '#2457dc' },",
          "      typography: { fontFamily: 'Inter, sans-serif', lineHeight: '1.6' },",
          "      border: { color: '#cbd5e1', width: '1px', style: 'solid' },",
          "      radius: { sm: '4px', md: '8px', lg: '12px' },",
          '    },',
          '    night: {',
          "      colors: { surface: '#101510', text: '#f4f8f4', muted: '#a8b3aa' },",
          '    },',
          '  },',
          '});',
          '',
          "const defaultButton = new OneButton({ children: ['默认主题'] });",
          "const nightButton = new OneButton({ children: ['夜间主题'] });",
          "defaultButton.on('click', () => oneTheme.switch('default'));",
          "nightButton.on('click', () => oneTheme.switch('night'));",
          'console.log(oneTheme.currentTheme);',
        ].join('\n')
      ),
      paragraph(
        t(
          '初始化会立即应用 defaultTheme；再次调用 init() 会替换此前注册的自定义主题。oneTheme.switch() 只接受已注册名称，并在成功写入全部变量后更新 currentTheme。',
          'Initialization applies the defaultTheme immediately; calling init() again replaces previously registered custom themes. oneTheme.switch() only accepts registered names and updates currentTheme after writing every variable successfully.'
        )
      ),
      heading(2, 'scope-and-errors', t('作用域、错误与持久化', 'Scope, errors and persistence')),
      paragraph(
        t(
          '主题服务只作用于全局 document.documentElement，不提供局部主题容器。配置字段、名称或 CSS 值无效时抛出 OneThemeConfigError；切换到未知名称时抛出 OneThemeNotFoundError；没有浏览器根节点时抛出 OneThemeEnvironmentError。失败操作不会改变当前主题。',
          'The theme service only affects the global document.documentElement and offers no scoped theme container. Invalid config fields, names or CSS values throw OneThemeConfigError; switching to an unknown name throws OneThemeNotFoundError; a missing browser root throws OneThemeEnvironmentError. A failed operation never changes the active theme.'
        )
      ),
      callout('tip', t('持久化由应用负责', 'Persistence is up to the application'), [
        t(
          'One UI 不会自动持久化主题，也不会自动跟随系统配色；应用可以自行保存名称，并在启动时传给 defaultTheme。',
          'One UI neither persists the theme automatically nor follows the system color scheme; the application can save the name itself and pass it to defaultTheme at startup.'
        ),
      ]),
      heading(2, 'fallback-defaults', t('读取 CSS 回退值', 'Read CSS fallback values')),
      paragraph(
        t(
          '原有的扁平 ONE_THEME_DEFAULTS 仍用于读取组件 CSS 的默认回退值；嵌套的 ONE_DEFAULT_THEME 则描述完整内置主题。',
          'The legacy flat ONE_THEME_DEFAULTS still reads the default fallback values used by component CSS; the nested ONE_DEFAULT_THEME describes the complete built-in theme.'
        )
      ),
      codeBlock(
        'ts',
        [
          "import { ONE_THEME_DEFAULTS } from '@geektech/one';",
          '',
          'const primaryColor = ONE_THEME_DEFAULTS.colorPrimary;',
          'const cardRadius = ONE_THEME_DEFAULTS.radiusMd;',
        ].join('\n')
      ),
      heading(2, 'tokens', t('主题 token', 'Theme tokens')),
      apiTable(
        t('One UI 运行时 CSS 变量', 'One UI runtime CSS variables'),
        oneThemeTokens.map((token) => ({
          name: token.name,
          signature: `Fallback: ${token.fallback}`,
          description: token.description,
        }))
      ),
      heading(2, 'global-override', t('全局 CSS 变量覆盖', 'Global CSS variable override')),
      codeBlock(
        'css',
        ':root {\n  --one-color-primary: #326bff;\n  --one-radius-md: 12px;\n}'
      ),
      heading(2, 'scoped-override', t('局部 CSS 变量覆盖', 'Scoped CSS variable override')),
      paragraph(
        t(
          '这只是现有 CSS 变量覆盖能力，不会创建可由 oneTheme 管理或切换的局部主题。',
          'This is only the existing CSS variable override capability; it does not create a scoped theme that oneTheme can manage or switch.'
        )
      ),
      codeBlock(
        'css',
        '.checkout-panel {\n  --one-color-primary: #7c3aed;\n  --one-shadow-card: none;\n}'
      ),
    ],
  },
];
