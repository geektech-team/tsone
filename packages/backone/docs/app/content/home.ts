import {
  callout,
  codeBlock,
  heading,
  inlineCode,
  link,
  list,
  paragraph,
  t,
  type BackOneDocPage,
} from './types';

export const homePage: BackOneDocPage = {
  path: '/',
  title: t(
    '基于 Bun 的零依赖 TypeScript 服务端框架',
    'A zero-dependency TypeScript server framework on Bun'
  ),
  description: t(
    'BackOne 是 TSone 家族的服务端框架：纯 TypeScript、零运行时依赖，提供路由、中间件、请求上下文与静态文件服务。',
    'BackOne is the server-side framework in the TSone family: pure TypeScript with zero runtime dependencies, providing routing, middleware, request context and static file serving.'
  ),
  section: 'start',
  sectionOrder: 0,
  order: 0,
  body: [
    heading(1, 'backone', 'BackOne'),
    paragraph(
      t(
        'BackOne 是基于 Bun 的轻量级纯 TypeScript 服务端框架，与 ',
        'BackOne is a lightweight, pure TypeScript server-side framework built on Bun, sharing '
      ),
      link('@geektech/tsone', 'https://github.com/geektech-team/tsone'),
      t(
        ' 同属一个仓库家族，坚持同一套工程信条：零运行时依赖、严格类型、OOP + 策略模式 + SOLID、Bun-first。',
        ' the same engineering creed as its frontend sibling: zero runtime dependencies, strict typing, OOP + strategy pattern + SOLID, and Bun-first.'
      )
    ),
    heading(2, 'features', t('特性', 'Features')),
    list([
      [
        inlineCode('零运行时依赖'),
        t(
          '：发布包没有 dependencies 字段，框架只站在 Bun 运行时之上。',
          ': the published package has no dependencies field; the framework only sits on the Bun runtime.'
        ),
      ],
      [
        inlineCode('分段基数树路由'),
        t(
          '：支持静态段、:param 与 * 通配，匹配复杂度为路径段数线性。',
          ': segment radix-tree routing with static segments, :param and * wildcards; matching is linear in path segments.'
        ),
      ],
      [
        inlineCode('洋葱模型中间件'),
        t(
          '：统一的处理器签名与 next() 组合。',
          ': unified handler signature composed via next().'
        ),
      ],
      [
        inlineCode('惰性解析的 Context'),
        t(
          '：query 与请求体按需解析并缓存。',
          ': query and body parsed on demand and cached.'
        ),
      ],
      [
        inlineCode('零开销直通'),
        t(
          '：处理器可直接返回 Response，框架不做多余包装。',
          ': handlers may return a Response directly with no extra wrapping.'
        ),
      ],
      [
        inlineCode('内置中间件'),
        t(
          '：logger、cors 与基于 Bun.file 的静态文件服务（零拷贝）。',
          ': logger, cors, and Bun.file-based static file serving (zero-copy).'
        ),
      ],
    ]),
    heading(2, 'family', t('TSone 家族', 'The TSone family')),
    paragraph(
      t(
        'TSone（前端框架）与 BackOne（服务端框架）共享 "one" 品牌与工程规范，',
        'TSone (frontend framework) and BackOne (server-side framework) share the "one" brand and engineering conventions, '
      ),
      inlineCode('@geektech/tsone-cli'),
      t(
        ' 则提供开发服务与构建工具。',
        ' provides the dev server and build tooling.'
      )
    ),
    heading(2, 'install', t('安装', 'Installation')),
    codeBlock('bash', 'bun add @geektech/backone'),
    heading(2, 'quick-example', t('最小示例', 'Minimal example')),
    codeBlock(
      'ts',
      `import { createServer } from '@geektech/backone';

const app = createServer({ port: 3000 });

app.get('/hello', () => 'hi');
app.get('/users/:id', (ctx) => ctx.json({ id: ctx.params.id }));

await app.listen(); // => 3000`
    ),
    callout('note', t('环境要求', 'Requirements'), [
      t(
        '需要 Bun >= 1.3；框架依赖 Bun 运行时提供的 HTTP、文件与压缩能力。',
        'Requires Bun >= 1.3; the framework relies on the HTTP, file and compression capabilities provided by the Bun runtime.'
      ),
    ]),
    heading(2, 'next', t('下一步', 'Next steps')),
    paragraph(
      link(t('快速开始', 'Quick start'), '/start/'),
      t(' · ', ' · '),
      link(t('路由指南', 'Routing guide'), '/guide/routing/'),
      t(' · ', ' · '),
      link(t('API 参考', 'API reference'), '/api/create-server/')
    ),
  ],
};
