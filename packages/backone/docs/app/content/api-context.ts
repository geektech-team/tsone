import {
  apiTable,
  callout,
  codeBlock,
  heading,
  inlineCode,
  paragraph,
  t,
  type BackOneDocPage,
} from './types';

export const contextApiPage: BackOneDocPage = {
  path: '/api/context/',
  title: t('Context API', 'Context API'),
  description: t(
    'Context 的属性、请求读取与响应构建方法。',
    'Context properties, request readers, and response builders.'
  ),
  section: 'api',
  sectionOrder: 2,
  order: 1,
  body: [
    heading(1, 'context-api', t('Context API', 'Context API')),
    paragraph(
      t('每个请求一个 ', 'One '),
      inlineCode('Context'),
      t(
        ' 实例，由框架创建并注入处理器。响应构建器会合并 ',
        ' instance per request, created and injected by the framework. Response builders merge '
      ),
      inlineCode('ctx.headers'),
      t(' 与 ', ' and '),
      inlineCode('ctx.status'),
      t('。', '.')
    ),
    heading(2, 'properties', t('属性', 'Properties')),
    apiTable(t('Context 属性', 'Context properties'), [
      {
        name: 'request',
        signature: 'Request',
        description: t('原始请求对象。', 'The raw Request object.'),
      },
      {
        name: 'method',
        signature: 'HttpMethod',
        description: t('大写请求方法。', 'Uppercase request method.'),
      },
      {
        name: 'pathname',
        signature: 'string',
        description: t('不含 query 的路径名。', 'Pathname without query.'),
      },
      {
        name: 'params',
        signature: 'Readonly<Record<string, string>>',
        description: t('路由路径参数。', 'Route path parameters.'),
      },
      {
        name: 'query',
        signature: 'URLSearchParams',
        description: t(
          'query 参数，惰性解析并缓存。',
          'Query parameters, lazily parsed and cached.'
        ),
      },
      {
        name: 'headers',
        signature: 'Headers',
        description: t('响应头构建器。', 'Response header builder.'),
      },
      {
        name: 'status',
        signature: 'number',
        description: t(
          '响应状态码，默认 200，可读写。',
          'Response status, default 200, readable and writable.'
        ),
      },
      {
        name: 'state',
        signature: 'Record<string, unknown>',
        description: t(
          '中间件与处理器之间共享的可变数据。',
          'Mutable data shared between middleware and handlers.'
        ),
      },
    ]),
    heading(2, 'readers', t('请求读取', 'Request readers')),
    apiTable(t('读取方法', 'Reader methods'), [
      {
        name: 'getHeader',
        signature: 'getHeader(name): string | null',
        description: t('读取请求头。', 'Reads a request header.'),
      },
      {
        name: 'cookie',
        signature: 'cookie(name): string | null',
        description: t('读取请求 Cookie。', 'Reads a request cookie.'),
      },
      {
        name: 'setCookie',
        signature: 'setCookie(name, value, options?): this',
        description: t(
          '追加 Set-Cookie 响应头，支持 HttpOnly/Secure/SameSite 等选项。',
          'Appends a Set-Cookie header, with HttpOnly/Secure/SameSite options.'
        ),
      },
      {
        name: 'bodyJson',
        signature: 'bodyJson<T>(): Promise<T>',
        description: t(
          '惰性解析并缓存 JSON 请求体；解析失败抛 HttpError(400)。',
          'Lazily parses and caches the JSON body; throws HttpError(400) on parse failure.'
        ),
      },
      {
        name: 'bodyText',
        signature: 'bodyText(): Promise<string>',
        description: t(
          '惰性解析并缓存文本请求体。',
          'Lazily parses and caches the text body.'
        ),
      },
      {
        name: 'bodyForm',
        signature: 'bodyForm(): Promise<BackOneFormData>',
        description: t(
          '惰性解析并缓存表单请求体（multipart/form-data 或 urlencoded）。',
          'Lazily parses and caches the form body (multipart/form-data or urlencoded).'
        ),
      },
    ]),
    heading(2, 'builders', t('响应构建', 'Response builders')),
    apiTable(t('构建方法', 'Builder methods'), [
      {
        name: 'json',
        signature: 'json(data, status?): Response',
        description: t(
          'JSON 响应，自动设置 Content-Type。',
          'JSON response with Content-Type set.'
        ),
      },
      {
        name: 'text',
        signature: 'text(data, status?): Response',
        description: t('纯文本响应。', 'Plain text response.'),
      },
      {
        name: 'html',
        signature: 'html(data, status?): Response',
        description: t('HTML 响应。', 'HTML response.'),
      },
      {
        name: 'stream',
        signature: 'stream(body, status?): Response',
        description: t(
          '流式响应，适合 SSE 与大文件。',
          'Streaming response, for SSE and large files.'
        ),
      },
      {
        name: 'redirect',
        signature: 'redirect(url, status?): Response',
        description: t(
          '重定向响应，默认 302。',
          'Redirect response, default 302.'
        ),
      },
      {
        name: 'noContent',
        signature: 'noContent(): Response',
        description: t('204 No Content。', '204 No Content.'),
      },
      {
        name: 'set',
        signature: 'set(name, value): this',
        description: t(
          '设置响应头（链式）。',
          'Sets a response header (chainable).'
        ),
      },
    ]),
    codeBlock(
      'ts',
      `app.get('/demo', (ctx) => {
  ctx.status = 202;
  ctx.set('X-Trace', 'abc');
  return ctx.json({ ok: true }); // 202 + X-Trace + application/json
});`
    ),
    callout('note', t('状态码默认值', 'Default status'), [
      t(
        '构建器不传 status 时使用 ctx.status；直接返回原始值（如 ctx.json(...)）同理。',
        'Builders default to ctx.status when status is omitted; the same applies when returning raw values like ctx.json(...).'
      ),
    ]),
  ],
};
