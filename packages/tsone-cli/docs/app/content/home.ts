import {
  codeBlock,
  heading,
  inlineCode,
  link,
  paragraph,
  t,
  type CliDocPage,
} from './types';

export const homePage: CliDocPage = {
  path: '/',
  title: t('TSone 的 Bun 原生开发工具链', 'Bun-native tooling for TSone'),
  description: t(
    'TSone CLI 为 TSone 应用提供 Bun 原生的开发服务、生产构建与项目脚手架。',
    'TSone CLI provides Bun-native development serving, production builds and project scaffolding for TSone applications.'
  ),
  section: 'start',
  sectionOrder: 0,
  order: 0,
  body: [
    heading(1, 'tsone-cli', 'TSone CLI'),
    paragraph(
      t(
        'TSone CLI（@geektech/tsone-cli）是 TSone 框架的 Bun 原生开发和构建工具：一条命令启动带文件监听与浏览器热更新的开发服务，一条命令产出可发布的生产构建，并提供项目脚手架。它需要 Bun >= 1.3.0。',
        'TSone CLI (@geektech/tsone-cli) is the Bun-native development and build tool for the TSone framework: one command starts a dev server with file watching and browser reload, one command produces a publishable production build, and it ships project scaffolding. It requires Bun >= 1.3.0.'
      )
    ),
    heading(2, 'install', t('安装', 'Installation')),
    paragraph(
      t(
        '安装框架与开发工具链：',
        'Install the framework and its development tooling together:'
      )
    ),
    codeBlock('bash', 'bun add @geektech/tsone @geektech/tsone-cli'),
    heading(2, 'start', t('快速开始', 'Quick start')),
    paragraph(
      t('新建项目并启动开发服务：', 'Create a project and start dev serving:'),
      inlineCode('tsone create'),
      t('，然后 ', ' and then '),
      inlineCode('tsone dev'),
      t('。', '.'),
    ),
    paragraph(
      t('继续阅读 ', 'Continue with '),
      link(t('快速开始', 'Getting started'), '/getting-started/'),
      t('、', ', '),
      link(t('命令参考', 'Commands'), '/commands/'),
      t(' 与 ', ' and '),
      link(t('配置', 'Configuration'), '/config/'),
      t('。', '.'),
    ),
  ],
};
