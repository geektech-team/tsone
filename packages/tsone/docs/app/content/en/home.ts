import {
  codeBlock,
  heading,
  inlineCode,
  link,
  list,
  paragraph,
  type DocPage,
} from '../types';

export const enHomePages: DocPage[] = [
  {
    path: '/',
    title: 'TSone',
    description:
      'A lightweight, pure TypeScript frontend framework with reactivity, components, and routing.',
    section: 'Guide',
    sectionOrder: 1,
    order: 0,
    body: [
      heading(1, 'TSone'),
      paragraph(
        'A lightweight, pure TypeScript frontend framework with reactivity, components, and routing.'
      ),
      heading(2, 'Features'),
      list([
        ['Built with pure TypeScript and complete type support'],
        ['An efficient reactivity system'],
        ['A component-based development model'],
        ['Built-in routing'],
        ['A style management system'],
        ['A lightweight design with no external dependencies'],
        [
          'A Bun-native toolchain: package management, testing, building, and documentation are all powered by ',
          inlineCode('Bun'),
        ],
      ]),
      heading(2, 'Quick Start'),
      paragraph('Install ', inlineCode('@geektech/tsone'), ' with Bun:'),
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
          "      children: ['Count: {{count}}'],",
          '    };',
          '  }',
          '}',
          '',
          'createApp({ root: App }).mount();',
        ].join('\n')
      ),
      paragraph(
        'Continue with ',
        link('Getting Started', '/guide/getting-started/'),
        ', ',
        link('Core Concepts', '/guide/core-concepts/'),
        ', or go straight to the ',
        link('App API', '/api/app/'),
        '.'
      ),
    ],
  },
];
