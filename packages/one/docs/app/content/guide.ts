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
    description: '查看 One UI 的完整主题 token 和全局、局部覆盖方式。',
    section: '指南',
    sectionOrder: 1,
    order: 2,
    body: [
      heading(1, 'theming', '主题定制'),
      paragraph(
        'ONE_THEME_DEFAULTS 导出全部默认回退值；对应的 CSS Variables 可以在任意作用域覆盖。'
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
      heading(2, 'global-override', '全局覆盖'),
      codeBlock(
        'css',
        ':root {\n  --one-color-primary: #326bff;\n  --one-radius-md: 12px;\n}'
      ),
      heading(2, 'scoped-override', '局部覆盖'),
      codeBlock(
        'css',
        '.checkout-panel {\n  --one-color-primary: #7c3aed;\n  --one-shadow-card: none;\n}'
      ),
    ],
  },
];
