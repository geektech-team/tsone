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

export const routingPage: BackOneDocPage = {
  path: '/guide/routing/',
  title: t('路由', 'Routing'),
  description: t(
    '静态段、:param 动态段与 * 通配的路由注册与匹配规则。',
    'Route registration and matching for static segments, :param and * wildcards.'
  ),
  section: 'guide',
  sectionOrder: 1,
  order: 0,
  body: [
    heading(1, 'routing', t('路由', 'Routing')),
    paragraph(
      t(
        '路由表是一棵分段基数树（segment radix tree）：启动期注册，请求期按路径段逐段匹配，复杂度为路径段数线性，不做逐请求的正则匹配。',
        'Routes live in a segment radix tree: registered at startup, matched segment by segment per request — linear in path segments, with no per-request regex matching.'
      )
    ),
    heading(2, 'methods', t('注册方法', 'Registration methods')),
    codeBlock(
      'ts',
      `app.get('/users', handler);
app.post('/users', handler);
app.put('/users/:id', handler);
app.patch('/users/:id', handler);
app.delete('/users/:id', handler);
app.options('/users', handler);
app.head('/users', handler);
app.all('/ping', handler); // 匹配任意方法`
    ),
    heading(2, 'syntax', t('路径语法', 'Path syntax')),
    list([
      [
        inlineCode('静态段'),
        t('：', ': '),
        inlineCode('/users/list'),
        t(' 只匹配字面路径。', ' matches only the literal path.'),
      ],
      [
        inlineCode(':param'),
        t('：', ': '),
        inlineCode('/users/:id'),
        t(
          ' 捕获单段，参数值经 URL 解码后写入 ',
          ' captures one segment; the decoded value is written to '
        ),
        inlineCode('ctx.params.id'),
        t('。', '.'),
      ],
      [
        inlineCode('*'),
        t('：', ': '),
        inlineCode('/files/*'),
        t(
          ' 捕获剩余全部路径，写入 ',
          ' captures the rest of the path, written to '
        ),
        inlineCode('ctx.params.wildcard'),
        t('（如 ', ' (e.g. '),
        inlineCode('a/b/c.txt'),
        t('）。', ').'),
      ],
      [
        t('静态段优先：', 'Static segments win: '),
        inlineCode('/users/new'),
        t(' 与 ', ' and '),
        inlineCode('/users/:id'),
        t(' 同时注册时，', ' both registered — '),
        inlineCode('/users/new'),
        t(' 命中静态路由。', ' resolves to the static route.'),
      ],
    ]),
    heading(2, 'chain', t('多处理器', 'Multiple handlers')),
    paragraph(
      t(
        '同一路由可以注册多个处理器，按注册顺序执行；在处理器内调用 ',
        'A route can register multiple handlers, run in registration order; call '
      ),
      inlineCode('next()'),
      t(' 进入下一个处理器。', ' inside a handler to continue.')
    ),
    codeBlock(
      'ts',
      `app.get(
  '/admin',
  async (ctx, next) => {
    if (!ctx.request.headers.has('authorization')) {
      return ctx.json({ error: 'unauthorized' }, 401);
    }
    return next();
  },
  (ctx) => ctx.json({ ok: true })
);`
    ),
    heading(2, 'fallbacks', t('方法与兜底', 'Methods and fallbacks')),
    list([
      [
        t('HEAD 请求在没有显式 ', 'HEAD requests fall back to the '),
        inlineCode('head()'),
        t(' 路由时回退到 ', ' handler when none is registered, then to '),
        inlineCode('GET'),
        t(' 处理器。', '.'),
      ],
      [
        t(
          '路径存在但方法未注册时返回 ',
          'When the path exists but the method is unregistered, BackOne returns '
        ),
        inlineCode('405'),
        t('，并携带 ', ' with an '),
        inlineCode('Allow'),
        t(' 响应头列出允许的方法。', ' header listing allowed methods.'),
      ],
      [
        t(
          '路径与方法都不匹配时返回 ',
          'When neither path nor method matches, BackOne returns '
        ),
        inlineCode('404'),
        t(' JSON 错误。', ' with a JSON error body.'),
      ],
    ]),
    callout('note', t('匹配优先级', 'Matching precedence'), [
      t(
        '同层匹配顺序为：静态段 > :param > *。参数段与通配段在同一节点共存时互不影响。',
        'Precedence at the same level is: static segment > :param > *. Param and wildcard children can coexist at one node.'
      ),
    ]),
  ],
};
