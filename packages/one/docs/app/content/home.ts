import { codeBlock, heading, link, paragraph, type OneDocPage } from './types';

export const homePage: OneDocPage = {
  path: '/',
  title: '轻量级 TSone 组件库',
  description:
    'One UI 为 TSone 类组件应用提供轻量、可组合且可主题化的基础组件。',
  section: '开始',
  sectionOrder: 0,
  order: 0,
  body: [
    heading(1, 'one-ui', 'One UI'),
    paragraph(
      'One UI 是面向 TSone 类组件应用的轻量级 UI 组件库，保持浏览器运行时零外部依赖，并以真实 TypeScript API 提供可访问、可组合的基础组件。'
    ),
    heading(2, 'install', '安装'),
    codeBlock('bash', 'bun add @geektech/tsone @geektech/one'),
    heading(2, 'components', '组件'),
    paragraph(
      link('OneButton', '/components/button/'),
      ' 处理操作与提交，',
      link('OneInput', '/components/input/'),
      ' 处理文本输入，',
      link('OneCard', '/components/card/'),
      ' 组合标题、正文和操作区域。'
    ),
  ],
};
