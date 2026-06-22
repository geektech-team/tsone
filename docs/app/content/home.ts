import {
  codeBlock,
  heading,
  inlineCode,
  link,
  list,
  paragraph,
  type DocPage,
} from './types';

export const homePages: DocPage[] = [
  {
    path: '/',
    title: 'TSone',
    description:
      '轻量级纯 TypeScript 前端框架，提供响应式系统、组件化和路由功能。',
    section: 'Guide',
    sectionOrder: 1,
    order: 0,
    body: [
      heading(1, 'TSone'),
      paragraph(
        '轻量级纯 TypeScript 前端框架，提供响应式系统、组件化和路由功能。'
      ),
      heading(2, '特性'),
      list([
        ['纯 TypeScript 实现，提供完整的类型支持'],
        ['高效的响应式系统'],
        ['组件化开发模式'],
        ['内置路由功能'],
        ['样式管理系统'],
        ['轻量级设计，无外部依赖'],
        [
          'Bun 原生工具链：包管理、测试、构建和文档服务均由 ',
          inlineCode('Bun'),
          ' 驱动',
        ],
      ]),
      heading(2, '快速开始'),
      paragraph('使用 Bun 安装 ', inlineCode('@geektech/tsone'), '：'),
      codeBlock('bash', 'bun add @geektech/tsone'),
      codeBlock(
        'ts',
        [
          "import { Component, VNode, createApp } from '@geektech/tsone';",
          '',
          'class App extends Component<object, { count: number }> {',
          '  protected initState(): { count: number } {',
          '    return { count: 0 };',
          '  }',
          '',
          '  protected initStyles(): void {}',
          '',
          '  protected render(): VNode {',
          '    return {',
          "      tag: 'button',",
          '      listeners: {',
          '        click: () => this.state.count++,',
          '      },',
          "      children: ['count: {{count}}'],",
          '    };',
          '  }',
          '}',
          '',
          "createApp({ root: App, rootElement: '#app' }).mount();",
        ].join('\n')
      ),
      paragraph(
        '继续阅读 ',
        link('快速开始', '/guide/getting-started/'),
        '、',
        link('核心概念', '/guide/core-concepts/'),
        ' 或直接查看 ',
        link('App API', '/api/app/'),
        '。'
      ),
    ],
  },
];
