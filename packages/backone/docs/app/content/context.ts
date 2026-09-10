import {
  callout,
  codeBlock,
  heading,
  inlineCode,
  list,
  paragraph,
  t,
  type BackOneDocPage,
} from './types';

export const contextPage: BackOneDocPage = {
  path: '/guide/context/',
  title: t('Context 与响应', 'Context and responses'),
  description: t(
    '每个请求的上下文对象：读取参数、惰性解析请求体，并构建响应。',
    'The per-request context: read params, lazily parse the body, and build responses.'
  ),
  section: 'guide',
  sectionOrder: 1,
  order: 2,
  body: [
    heading(1, 'context', t('Context', 'Context')),
    paragraph(
      t('每个请求都会创建一个 ', 'Every request gets a '),
      inlineCode('Context'),
      t(
        ' 实例。query 与请求体采用惰性解析：首次访问时解析并缓存，热路径上不会产生无谓开销。',
        ' instance. Query and body are parsed lazily: resolved on first access and cached, so the hot path never pays for unused work.'
      )
    ),
    heading(2, 'reading', t('读取请求', 'Reading the request')),
    codeBlock(
      'ts',
      `app.get('/search', async (ctx) => {
  const query = ctx.query.get('q');       // URLSearchParams（惰性解析）
  const page = Number(ctx.query.get('page') ?? '1');

  return ctx.json({ query, page });
});

app.post('/users', async (ctx) => {
  const body = await ctx.bodyJson<{ name: string }>(); // 惰性 JSON 请求体
  return ctx.json({ name: body.name }, 201);
});

app.post('/raw', async (ctx) => {
  const text = await ctx.bodyText(); // 惰性文本请求体
  return ctx.text(text);
});

app.post('/upload', async (ctx) => {
  const form = await ctx.bodyForm(); // multipart / urlencoded
  return ctx.json({ name: form.get('name') });
});`
    ),
    paragraph(
      t('JSON 解析失败会抛出 ', 'A failed JSON parse throws '),
      inlineCode('HttpError(400)'),
      t(
        '，由框架统一转为 400 响应，不会落到 500。',
        ', turned into a uniform 400 response instead of a 500.'
      )
    ),
    heading(2, 'responding', t('构建响应', 'Building responses')),
    codeBlock(
      'ts',
      `app.get('/mixed', (ctx) => {
  ctx.status = 201;                     // 默认状态码
  ctx.set('X-Custom', 'yes');           // 响应头，随构建器合并
  return ctx.json({ ok: true });        // Content-Type 自动设置
});

app.get('/page', (ctx) => ctx.html('<h1>Hello</h1>'));
app.get('/redirect', (ctx) => ctx.redirect('/login'));
app.delete('/items/:id', (ctx) => ctx.noContent()); // 204`
    ),
    heading(2, 'cookies', t('Cookie', 'Cookies')),
    codeBlock(
      'ts',
      `app.get('/theme', (ctx) => {
  const theme = ctx.cookie('theme') ?? 'default';
  return ctx.json({ theme });
});

app.post('/login', (ctx) => {
  ctx.setCookie('sid', 'abc123', {
    httpOnly: true,
    path: '/',
    maxAge: 3600,
    sameSite: 'Lax',
  });
  return ctx.json({ ok: true });
});`
    ),
    heading(2, 'fields', t('上下文字段', 'Context fields')),
    list([
      [
        inlineCode('ctx.request'),
        t('：原始 Request 对象。', ': the raw Request object.'),
      ],
      [
        inlineCode('ctx.method'),
        t('：大写请求方法。', ': the uppercase request method.'),
      ],
      [
        inlineCode('ctx.pathname'),
        t('：不含 query 的路径名。', ': the pathname without query.'),
      ],
      [
        inlineCode('ctx.params'),
        t('：路由路径参数。', ': route path parameters.'),
      ],
      [
        inlineCode('ctx.query'),
        t('：URLSearchParams，惰性解析。', ': URLSearchParams, lazily parsed.'),
      ],
      [
        inlineCode('ctx.headers'),
        t(
          '：响应头构建器，会合并进最终响应。',
          ': response header builder, merged into the final response.'
        ),
      ],
      [
        inlineCode('ctx.status'),
        t('：响应状态码，默认 200。', ': response status, defaults to 200.'),
      ],
      [
        inlineCode('ctx.state'),
        t(
          '：中间件与处理器之间共享的可变数据。',
          ': mutable data shared between middleware and handlers.'
        ),
      ],
    ]),
    callout('tip', t('直接返回 Response', 'Return a Response directly'), [
      t(
        '需要完全掌控时，直接返回 new Response(...) 即可，框架原样透传。',
        'For full control, just return new Response(...) — the framework passes it through unchanged.'
      ),
    ]),
  ],
};
