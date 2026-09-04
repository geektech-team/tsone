import { codeBlock, heading, link, paragraph, t, type OneDocPage } from './types';

export const homePage: OneDocPage = {
  path: '/',
  title: t('轻量级 TSone 组件库', 'A lightweight TSone component library'),
  description: t(
    'One UI 为 TSone 类组件应用提供轻量、可组合且可主题化的基础组件。',
    'One UI provides lightweight, composable and themeable base components for TSone class-component applications.'
  ),
  section: 'start',
  sectionOrder: 0,
  order: 0,
  body: [
    heading(1, 'one-ui', 'One UI'),
    paragraph(
      t(
        'One UI 是面向 TSone 类组件应用的轻量级 UI 组件库，保持浏览器运行时零外部依赖，并以真实 TypeScript API 提供可访问、可组合的基础组件。',
        'One UI is a lightweight UI component library for TSone class-component applications. It keeps zero external dependencies in the browser runtime and ships accessible, composable base components behind a real TypeScript API.'
      )
    ),
    heading(2, 'install', t('安装', 'Installation')),
    codeBlock('bash', 'bun add @geektech/tsone @geektech/one'),
    heading(2, 'components', t('组件', 'Components')),
    paragraph(
      link('OneButton', '/components/button/'),
      t(' 处理操作与提交，', ' handles actions and submission, '),
      link('OneInput', '/components/form/input/'),
      t(' 处理文本输入，', ' handles text input, '),
      link('OneCard', '/components/card/'),
      t(' 组合标题、正文和操作区域；', ' composes title, body and action areas; '),
      link('OneAlert', '/components/feedback/alert/'),
      t('、', ', '),
      link('OneMessage', '/components/feedback/message/'),
      t('、', ', '),
      link('OneDialog', '/components/feedback/dialog/'),
      t(' 和 ', ' and '),
      link('OneTooltip', '/components/feedback/tooltip/'),
      t(' 提供反馈与浮层能力。', ' provide feedback and overlay capabilities.')
    ),
  ],
};
