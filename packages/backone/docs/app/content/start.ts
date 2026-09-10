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

export const startPage: BackOneDocPage = {
  path: '/start/',
  title: t('快速开始', 'Quick start'),
  description: t(
    '用 BackOne 在十行内启动一个 JSON API 服务。',
    'Launch a JSON API server with BackOne in ten lines.'
  ),
  section: 'start',
  sectionOrder: 0,
  order: 1,
  body: [
    heading(1, 'quick-start', t('快速开始', 'Quick start')),
    paragraph(
      t(
        '创建一个 TypeScript 入口文件，引入 ',
        'Create a TypeScript entry file and import '
      ),
      inlineCode('createServer'),
      t(
        '，注册路由后调用 listen() 即可。',
        ', register routes, and call listen().'
      )
    ),
    codeBlock(
      'ts',
      `import { createServer } from '@geektech/backone';

const app = createServer({ port: 3000 });

// 中间件：按注册顺序先执行
app.useLogger();

// 路由：支持静态段、:param 与 * 通配
app.get('/', () => 'hello world');
app.get('/users/:id', (ctx) => ctx.json({ id: ctx.params.id }));
app.post('/echo', async (ctx) => ctx.json(await ctx.bodyJson()));

// 静态文件：Bun.file 零拷贝
app.serveStatic('/public', './public');

await app.listen();`
    ),
    paragraph(t('用 Bun 直接运行：', 'Run it directly with Bun:')),
    codeBlock('bash', 'bun run index.ts'),
    heading(
      2,
      'handler-returns',
      t('处理器返回值约定', 'Handler return values')
    ),
    list([
      [
        inlineCode('Response'),
        t(
          '：直接透传，状态码与响应头完全由你控制。',
          ': passed through directly, status and headers fully under your control.'
        ),
      ],
      [
        inlineCode('string / number / boolean'),
        t('：按文本响应。', ': responded as text.'),
      ],
      [inlineCode('object'), t('：按 JSON 响应。', ': responded as JSON.')],
      [
        inlineCode('undefined / null'),
        t(
          '：返回 204 No Content（除非你设置了其他状态码）。',
          ': responds 204 No Content (unless another status was set).'
        ),
      ],
    ]),
    heading(2, 'port', t('端口与监听', 'Ports and listening')),
    paragraph(
      t(
        'listen() 返回实际端口号：传 ',
        'listen() returns the actual port: passing '
      ),
      inlineCode('port: 0'),
      t(
        ' 会使用系统分配的随机端口，适合测试与自动化环境。',
        ' uses a random OS-assigned port, handy for tests and automation.'
      )
    ),
    codeBlock(
      'ts',
      `const port = await app.listen({ port: 0 });
console.log(port); // 随机端口
app.close(); // 停止监听并关闭连接`
    ),
    callout('tip', t('下一站', 'Where to go next'), [
      link(t('路由语法', 'Routing syntax'), '/guide/routing/'),
      t(' · ', ' · '),
      link(t('Context 与响应构建', 'Context and responses'), '/guide/context/'),
      t(' · ', ' · '),
      link(t('中间件', 'Middleware'), '/guide/middleware/'),
    ]),
  ],
};
