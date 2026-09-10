import {
  codeBlock,
  heading,
  inlineCode,
  link,
  list,
  paragraph,
  t,
  type BackOneDocPage,
} from './types';

export const middlewarePage: BackOneDocPage = {
  path: '/guide/middleware/',
  title: t('中间件', 'Middleware'),
  description: t(
    '洋葱模型中间件链与内置的 logger、cors、serveStatic。',
    'The onion-model middleware chain and the built-in logger, cors and serveStatic.'
  ),
  section: 'guide',
  sectionOrder: 1,
  order: 2,
  body: [
    heading(1, 'middleware', t('中间件', 'Middleware')),
    paragraph(
      t(
        '中间件与处理器使用同一签名，通过 ',
        'Middleware and handlers share one signature, composed via '
      ),
      inlineCode('app.use(...)'),
      t(' 按注册顺序进入链路。调用 ', ' in registration order. Calling '),
      inlineCode('next()'),
      t(
        ' 进入下一层，返回值从内向外逐层冒泡——即洋葱模型。',
        ' enters the next layer, and return values bubble outward — the onion model.'
      )
    ),
    codeBlock(
      'ts',
      `app.use(async (ctx, next) => {
  const start = performance.now();
  const result = await next();
  if (result instanceof Response) {
    result.headers.set('X-Server-Timing', String(performance.now() - start));
  }
  return result;
});`
    ),
    heading(2, 'builtins', t('内置中间件', 'Built-in middleware')),
    list([
      [
        inlineCode('logger'),
        t('：输出 ', ': logs '),
        inlineCode('METHOD path status 耗时ms'),
        t('，可用 ', ', configurable via '),
        inlineCode('out'),
        t(' 自定义输出。', '.'),
      ],
      [
        inlineCode('cors'),
        t(
          '：注入跨域头并处理 OPTIONS 预检，支持来源白名单与凭证。',
          ': injects CORS headers and handles OPTIONS preflight, with origin allow-lists and credentials.'
        ),
      ],
      [
        inlineCode('serveStatic'),
        t(
          '：基于 Bun.file 的零拷贝静态文件服务，默认拦截目录穿越。',
          ': zero-copy static file serving on Bun.file, with directory-traversal protection by default.'
        ),
      ],
    ]),
    heading(2, 'shortcuts', t('快捷方法', 'Shortcuts')),
    codeBlock(
      'ts',
      `app.useLogger();                                  // logger()
app.useCors({ origin: ['https://app.example.com'] }); // cors()
app.serveStatic('/public', './public', {
  cacheControl: 'public, max-age=3600',
});`
    ),
    heading(2, 'static', t('静态文件', 'Static files')),
    paragraph(
      t(
        'serveStatic 将 URL 前缀映射到磁盘目录，找不到文件时调用 ',
        'serveStatic maps a URL prefix to a directory on disk; when the file is missing it calls '
      ),
      inlineCode('next()'),
      t('，让后续路由继续处理。', ' so later routes can handle the request.')
    ),
    codeBlock(
      'ts',
      `app.serveStatic('/assets', './static', {
        cacheControl: 'public, max-age=86400',
        index: 'index.html',
      });`
    ),
    paragraph(
      link(
        t('完整选项见 API 参考', 'See the API reference for full options'),
        '/api/middleware/'
      ),
      t('。', '.')
    ),
  ],
};
