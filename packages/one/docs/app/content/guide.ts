import {
  apiTable,
  callout,
  codeBlock,
  heading,
  inlineCode,
  list,
  paragraph,
  type OneDocPage,
} from './types';
import { oneThemeTokens } from './theme-tokens';

export const guidePages: OneDocPage[] = [
  {
    path: '/guide/design/',
    title: '设计理念',
    description: '了解 One UI 的轻量运行时、类组件组合、可访问性与主题原则。',
    section: '指南',
    sectionOrder: 1,
    order: 0,
    body: [
      heading(1, 'design', '设计理念'),
      paragraph(
        'One UI 沿用 TSone 的纯 TypeScript 类组件模型，以清晰的小型组件构建界面。'
      ),
      heading(2, 'lightweight', '轻量级运行时'),
      paragraph(
        '组件库保持零运行时依赖；TSone 作为 peer dependency 提供 Component、VNode 与渲染生命周期。'
      ),
      heading(2, 'composition', '类组件与组合'),
      paragraph(
        '每个组件只负责一种 UI 行为，并通过 props、事件和插槽协作。组合优于额外继承，避免为了复用少量视图逻辑增加类层级。'
      ),
      heading(2, 'accessibility', '可访问性'),
      list([
        ['使用原生 button、input 和语义化 section 元素。'],
        ['将 disabled、required、readonly 与 aria-* 状态映射到 DOM。'],
        ['为键盘用户保留清晰的 focus-visible 焦点样式。'],
      ]),
      heading(2, 'css-variables', 'CSS Variables'),
      paragraph(
        '组件通过 ',
        inlineCode('--one-*'),
        ' CSS Variables 接受全局或局部主题覆盖，同时为每个公开 token 保留稳定回退值。'
      ),
    ],
  },
  {
    path: '/guide/getting-started/',
    title: '快速开始',
    description: '在一个完整 TSone 应用中导入并渲染 One UI 的三个组件。',
    section: '指南',
    sectionOrder: 1,
    order: 1,
    body: [
      heading(1, 'getting-started', '快速开始'),
      paragraph('安装两个包后，使用 TSone 的 createComponent 组合 One UI。'),
      codeBlock('bash', 'bun add @geektech/tsone @geektech/one'),
      heading(2, 'complete-app', '完整应用'),
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
      callout('tip', '保持类型信息', [
        '从包根导入公开组件与类型；样式由组件生命周期自动注册。',
      ]),
    ],
  },
  {
    path: '/guide/theming/',
    title: '主题定制',
    description: '初始化多套全局主题、切换当前主题并查看完整 CSS token。',
    section: '指南',
    sectionOrder: 1,
    order: 2,
    body: [
      heading(1, 'theming', '主题定制'),
      paragraph(
        'One UI 始终包含不可覆盖的内置 default 主题。oneTheme.init() 可以注册多套全局主题，每套自定义主题都会按 colors、typography、border 和 radius 分组，从内置 default 深度继承未填写的字段。'
      ),
      heading(2, 'initialize', '初始化多套主题'),
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
        '初始化会立即应用 defaultTheme；再次调用 init() 会替换此前注册的自定义主题。oneTheme.switch() 只接受已注册名称，并在成功写入全部变量后更新 currentTheme。'
      ),
      heading(2, 'scope-and-errors', '作用域、错误与持久化'),
      paragraph(
        '主题服务只作用于全局 document.documentElement，不提供局部主题容器。配置字段、名称或 CSS 值无效时抛出 OneThemeConfigError；切换到未知名称时抛出 OneThemeNotFoundError；没有浏览器根节点时抛出 OneThemeEnvironmentError。失败操作不会改变当前主题。'
      ),
      callout('tip', '持久化由应用负责', [
        'One UI 不会自动持久化主题，也不会自动跟随系统配色；应用可以自行保存名称，并在启动时传给 defaultTheme。',
      ]),
      heading(2, 'fallback-defaults', '读取 CSS 回退值'),
      paragraph(
        '原有的扁平 ONE_THEME_DEFAULTS 仍用于读取组件 CSS 的默认回退值；嵌套的 ONE_DEFAULT_THEME 则描述完整内置主题。'
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
      heading(2, 'tokens', '主题 token'),
      apiTable(
        'One UI 运行时 CSS 变量',
        oneThemeTokens.map((token) => ({
          name: token.name,
          signature: `Fallback: ${token.fallback}`,
          description: token.description,
        }))
      ),
      heading(2, 'global-override', '全局 CSS 变量覆盖'),
      codeBlock(
        'css',
        ':root {\n  --one-color-primary: #326bff;\n  --one-radius-md: 12px;\n}'
      ),
      heading(2, 'scoped-override', '局部 CSS 变量覆盖'),
      paragraph(
        '这只是现有 CSS 变量覆盖能力，不会创建可由 oneTheme 管理或切换的局部主题。'
      ),
      codeBlock(
        'css',
        '.checkout-panel {\n  --one-color-primary: #7c3aed;\n  --one-shadow-card: none;\n}'
      ),
    ],
  },
];
