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
  order: 3,
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
      ),
      t(
        ' 中间件需要向后续处理器传递数据时，写入 ',
        ' To pass data to later handlers, write it to '
      ),
      inlineCode('ctx.state'),
      t(' 即可。', '.')
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
        inlineCode('[YYYY-MM-DD HH:mm:ss] METHOD path status 耗时ms'),
        t('，可用 ', ', configurable via '),
        inlineCode('out'),
        t(' 自定义输出，', ' and '),
        inlineCode('timestamp: false'),
        t(' 关闭行首时间。', ' removes the leading timestamp.'),
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
          '：基于 Bun.file 的零拷贝静态文件服务，默认拦截目录穿越，自动携带 ETag/Last-Modified 并支持 Range 206。',
          ': zero-copy static file serving on Bun.file, with directory-traversal protection, automatic ETag/Last-Modified and Range 206 support.'
        ),
      ],
      [
        inlineCode('gzip'),
        t(
          '：基于 Bun.gzipSync 的响应压缩，默认阈值 1024 字节，自动跳过 SSE 与已编码响应。',
          ': response compression on Bun.gzipSync, default threshold 1024 bytes, automatically skips SSE and already-encoded responses.'
        ),
      ],
      [
        inlineCode('timeout'),
        t(
          '：请求超时中间件，超过指定毫秒数未完成则返回 504。',
          ': request timeout middleware, returns 504 when the handler exceeds the specified milliseconds.'
        ),
      ],
      [
        inlineCode('helmet'),
        t(
          '：安全响应头中间件（helmet 风格），设置 X-Content-Type-Options、X-Frame-Options、Referrer-Policy 等，每项可覆盖或禁用。',
          ': security header middleware (helmet-style), sets X-Content-Type-Options, X-Frame-Options, Referrer-Policy etc., each overridable or disablable.'
        ),
      ],
    ]),
    heading(2, 'shortcuts', t('快捷方法', 'Shortcuts')),
    codeBlock(
      'ts',
      `app.useLogger();                                  // logger()
app.useCors({ origin: ['https://app.example.com'] }); // cors()
app.useGzip({ threshold: 1024, level: 6 });          // gzip()
app.useTimeout({ ms: 5000 });                         // timeout()
app.useHelmet({ xFrameOptions: 'SAMEORIGIN' });      // helmet()
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
      t('静态响应自动携带 ', 'Static responses automatically carry '),
      inlineCode('ETag'),
      t('（弱标签 ', ' (weak tag '),
      inlineCode('W/"size-mtime"'),
      t('）、', '), '),
      inlineCode('Last-Modified'),
      t(' 与 ', ' and '),
      inlineCode('Accept-Ranges: bytes'),
      t('。客户端发送 ', '. Clients sending '),
      inlineCode('If-None-Match'),
      t(' 或 ', ' or '),
      inlineCode('If-Modified-Since'),
      t(' 条件请求时返回 ', ' conditional requests receive '),
      inlineCode('304'),
      t('；发送 ', '; sending '),
      inlineCode('Range: bytes=start-end'),
      t(' 时返回 ', ' returns '),
      inlineCode('206'),
      t(' 部分内容与 ', ' partial content with a '),
      inlineCode('Content-Range'),
      t(' 头；无效范围返回 ', ' header; invalid ranges return '),
      inlineCode('416'),
      t('。', '.')
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
