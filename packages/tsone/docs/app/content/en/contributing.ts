import {
  codeBlock,
  heading,
  inlineCode,
  list,
  paragraph,
  type DocPage,
} from '../types';

export const enContributingPages: DocPage[] = [
  {
    path: '/contributing/',
    title: 'Contributing',
    description:
      'Learn the Bun-first development workflow, coding standards, commit conventions, and documentation maintenance process.',
    section: 'Contributing',
    sectionOrder: 4,
    order: 1,
    body: [
      heading(1, 'Contributing'),
      paragraph('Thank you for considering a contribution to TSone.'),
      heading(2, 'Development Environment'),
      heading(3, 'Clone the Repository'),
      codeBlock(
        'bash',
        ['git clone https://github.com/geektech/tsone.git', 'cd tsone'].join(
          '\n'
        )
      ),
      heading(3, 'Install Dependencies'),
      codeBlock('bash', 'bun install'),
      heading(3, 'Run the Development Server'),
      codeBlock('bash', 'bun run dev'),
      paragraph(
        'Development playgrounds live in the root playground/ directory. The official site home page and admin dashboard are managed by separate package.json files.'
      ),
      heading(3, 'Build the Project'),
      codeBlock('bash', 'bun run build'),
      heading(3, 'Run Linting'),
      codeBlock('bash', 'bun run lint'),
      heading(2, 'Coding Standards'),
      heading(3, 'TypeScript'),
      list([
        ['Use TypeScript for development'],
        ["Follow the project's TypeScript configuration"],
        ['Keep type definitions complete'],
      ]),
      heading(3, 'Code Style'),
      list([
        ["Follow the project's ESLint configuration"],
        ['Format code with Prettier'],
        ['Keep the code style consistent'],
      ]),
      heading(3, 'Naming Conventions'),
      list([
        ['Use PascalCase for class names'],
        ['Use camelCase for function and variable names'],
        ['Use UPPER_SNAKE_CASE for constants'],
        ['Use kebab-case for file and directory names'],
      ]),
      heading(2, 'Commit Conventions'),
      heading(3, 'Commit Message Format'),
      paragraph('The project follows Conventional Commits.'),
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
      heading(3, 'Types'),
      list([
        ['feat: a new feature'],
        ['fix: a bug fix'],
        ['docs: documentation changes'],
        ['style: code style changes'],
        ['refactor: code refactoring'],
        ['test: test changes'],
        ['chore: build process or auxiliary tool changes'],
      ]),
      heading(3, 'Examples'),
      codeBlock(
        'text',
        [
          'feat(router): improve routing capabilities',
          '',
          'fix(core): fix a memory leak in the reactivity system',
          '',
          'docs: update the Component API documentation',
        ].join('\n')
      ),
      heading(2, 'Development Workflow'),
      heading(3, '1. Create a Branch'),
      codeBlock('bash', 'git checkout -b feature/your-feature-name'),
      heading(3, '2. Develop the Feature'),
      list([
        ['Implement the feature'],
        ['Write tests'],
        ['Make sure the code passes linting'],
      ]),
      heading(3, '3. Commit Your Changes'),
      codeBlock(
        'bash',
        ['git add .', 'git commit -m "feat: describe your feature"'].join('\n')
      ),
      heading(3, '4. Push the Branch'),
      codeBlock('bash', 'git push origin feature/your-feature-name'),
      heading(3, '5. Create a Pull Request'),
      list([
        ['Open the GitHub repository'],
        ['Click New Pull Request'],
        ['Select your branch and provide a description'],
      ]),
      heading(2, 'Testing'),
      heading(3, 'Write Tests'),
      codeBlock('bash', 'bun test'),
      heading(3, 'Test Coverage'),
      paragraph('Aim for high test coverage to maintain code quality.'),
      heading(2, 'Documentation'),
      heading(3, 'Update Documentation'),
      list([
        ['Update API documentation'],
        ['Update guides'],
        ['Update example code'],
      ]),
      heading(3, 'Documentation Commands'),
      codeBlock('bash', ['bun run docs', 'bun run docs:build'].join('\n')),
      heading(3, 'Documentation Maintenance'),
      paragraph(
        'Chinese content lives in ',
        inlineCode('packages/tsone/docs/app/content/zh/'),
        ', while English content lives in ',
        inlineCode('packages/tsone/docs/app/content/en/'),
        '. Both use the typed content registry and structured block helpers, and every page must have the same logical route in both directories. Chinese and English catalogs each contain exactly 14 logical routes; add or remove a route in both catalogs in the same change.'
      ),
      list([
        ['Keep content links locale-neutral and never write /en/ manually'],
        ['Chinese public routes are unprefixed; English routes use /en/'],
        [
          'Browser-language detection runs only at /; manual selection takes precedence and persists',
        ],
        [
          'bun run docs:build fails strictly for missing, extra, duplicate, empty, or mixed-language pages',
        ],
      ]),
      heading(2, 'Issue Reports'),
      heading(3, 'Bug Reports'),
      list([
        ['A description of the issue'],
        ['Steps to reproduce it'],
        ['Expected and actual behavior'],
        ['Environment details and possible solutions'],
      ]),
      heading(3, 'Feature Requests'),
      list([
        ['A description of the feature'],
        ['Why the feature is needed'],
        ['Possible implementation approaches'],
      ]),
      heading(2, 'Code of Conduct'),
      list([
        ['Treat others with respect'],
        ['Accept constructive criticism'],
        ["Focus on the community's best interests"],
        ['Be kind and patient'],
      ]),
      heading(2, 'Communication Channels'),
      list([
        ['GitHub Issues: bug reports and feature requests'],
        ['GitHub Discussions: discussions and questions'],
      ]),
      heading(2, 'License'),
      paragraph(
        'By contributing code, you agree that your contribution will be released under the MIT License.'
      ),
      heading(2, 'Thank You'),
      paragraph(
        'Thank you again for contributing. Your participation helps make TSone better.'
      ),
    ],
  },
];
