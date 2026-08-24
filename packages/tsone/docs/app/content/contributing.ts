import {
  codeBlock,
  heading,
  inlineCode,
  list,
  paragraph,
  type DocPage,
} from './types';

export const contributingPages: DocPage[] = [
  {
    path: '/contributing/',
    title: '贡献指南',
    description:
      '了解 Bun-first 开发流程、代码规范、提交约定以及文档维护方式。',
    section: 'Contributing',
    sectionOrder: 4,
    order: 1,
    body: [
      heading(1, '贡献指南'),
      paragraph('感谢您考虑为 TSone 框架做出贡献。'),
      heading(2, '开发环境设置'),
      heading(3, '克隆仓库'),
      codeBlock(
        'bash',
        ['git clone https://github.com/geektech/tsone.git', 'cd tsone'].join(
          '\n'
        )
      ),
      heading(3, '安装依赖'),
      codeBlock('bash', 'bun install'),
      heading(3, '运行开发服务器'),
      codeBlock('bash', 'bun run dev'),
      heading(3, '构建项目'),
      codeBlock('bash', 'bun run build'),
      heading(3, '运行代码检查'),
      codeBlock('bash', 'bun run lint'),
      heading(2, '代码规范'),
      heading(3, 'TypeScript'),
      list([
        ['使用 TypeScript 进行开发'],
        ['遵循项目的 TypeScript 配置'],
        ['确保类型定义完整'],
      ]),
      heading(3, '代码风格'),
      list([
        ['遵循项目的 ESLint 配置'],
        ['使用 Prettier 格式化代码'],
        ['保持代码风格一致'],
      ]),
      heading(3, '命名约定'),
      list([
        ['类名使用 PascalCase'],
        ['函数名和变量名使用 camelCase'],
        ['常量使用 UPPER_SNAKE_CASE'],
        ['文件和目录名使用 kebab-case'],
      ]),
      heading(2, '提交规范'),
      heading(3, 'Commit 消息格式'),
      paragraph('项目使用 Conventional Commits 规范。'),
      codeBlock(
        'text',
        [
          '<type>[optional scope]: <description>',
          '',
          '[optional body]',
          '',
          '[optional footer(s)]',
        ].join('\n')
      ),
      heading(3, '类型'),
      list([
        ['feat: 新功能'],
        ['fix: 修复 bug'],
        ['docs: 文档更新'],
        ['style: 代码风格修改'],
        ['refactor: 代码重构'],
        ['test: 测试相关'],
        ['chore: 构建过程或辅助工具变动'],
      ]),
      heading(3, '示例'),
      codeBlock(
        'text',
        [
          'feat(router): 添加路由能力改进',
          '',
          'fix(core): 修复响应式系统的内存泄漏问题',
          '',
          'docs: 更新组件 API 文档',
        ].join('\n')
      ),
      heading(2, '开发流程'),
      heading(3, '1. 创建分支'),
      codeBlock('bash', 'git checkout -b feature/your-feature-name'),
      heading(3, '2. 开发功能'),
      list([['实现功能'], ['编写测试'], ['确保代码通过 lint 检查']]),
      heading(3, '3. 提交代码'),
      codeBlock(
        'bash',
        ['git add .', 'git commit -m "feat: 描述你的功能"'].join('\n')
      ),
      heading(3, '4. 推送分支'),
      codeBlock('bash', 'git push origin feature/your-feature-name'),
      heading(3, '5. 创建 Pull Request'),
      list([
        ['前往 GitHub 仓库'],
        ['点击 New Pull Request'],
        ['选择你的分支并填写描述'],
      ]),
      heading(2, '测试'),
      heading(3, '编写测试'),
      codeBlock('bash', 'bun test'),
      heading(3, '测试覆盖'),
      paragraph('尽量保持高测试覆盖率，确保代码质量。'),
      heading(2, '文档'),
      heading(3, '更新文档'),
      list([['更新 API 文档'], ['更新指南文档'], ['更新示例代码']]),
      heading(3, '文档命令'),
      codeBlock('bash', ['bun run docs', 'bun run docs:build'].join('\n')),
      heading(3, '文档维护'),
      paragraph(
        '文档内容维护在 ',
        inlineCode('docs/app/content/*.ts'),
        ' 的 typed content registry 中，并使用结构化 block helper 组织页面内容。'
      ),
      list([
        ['直接编辑 TypeScript 内容注册表，而不是 Markdown 源文件'],
        ['使用结构化 block helper 组合标题、段落、列表和代码块'],
        ['保持页面内容与可搜索文本一致'],
      ]),
      heading(2, '问题报告'),
      heading(3, 'Bug 报告'),
      list([
        ['问题描述'],
        ['复现步骤'],
        ['预期行为与实际行为'],
        ['环境信息和可能的解决方案'],
      ]),
      heading(3, '功能请求'),
      list([['功能描述'], ['为什么需要这个功能'], ['可能的实现方案']]),
      heading(2, '行为准则'),
      list([
        ['尊重他人'],
        ['接受建设性批评'],
        ['关注社区的最佳利益'],
        ['友善和耐心'],
      ]),
      heading(2, '沟通渠道'),
      list([
        ['GitHub Issues: 用于 bug 报告和功能请求'],
        ['GitHub Discussions: 用于讨论和问题解答'],
      ]),
      heading(2, '许可证'),
      paragraph('通过贡献代码，您同意你的贡献将在 MIT 许可证下发布。'),
      heading(2, '感谢'),
      paragraph('再次感谢你的贡献，你的参与将帮助 TSone 变得更好。'),
    ],
  },
];
