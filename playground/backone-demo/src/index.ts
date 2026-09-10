/**
 * BackOne 服务端框架 playground 示例。
 *
 * 启动：
 *   bun run dev    # 监听文件变化自动重启
 *   bun run start  # 单次启动
 *
 * 访问 http://127.0.0.1:5390 开始体验各路由。
 */

import { createServer, HttpError, name, version } from '@geektech/backone';

const app = createServer({
  port: 5390,
  development: true,
});

// ---- 中间件（洋葱模型，按注册顺序执行） ----

// 内置：请求日志
app.useLogger();

// 内置：跨域
app.useCors();

// 内置：gzip 响应压缩（大于阈值的文本/JSON 自动压缩）
app.useGzip();

// 内置：安全响应头（helmet 风格）
app.useHelmet();

// 内置：请求超时（5 秒未完成返回 504）
app.useTimeout({ ms: 5000 });

// 自定义：记录耗时并注入响应头
app.use(async (ctx, next) => {
  const start = performance.now();
  ctx.state.requestId = `${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 8)}`;
  const response = await next();
  if (response instanceof Response) {
    response.headers.set(
      'x-server-timing',
      `${(performance.now() - start).toFixed(2)}ms`
    );
    response.headers.set('x-request-id', String(ctx.state.requestId));
  }
  return response;
});

// ---- 静态文件：/static/* -> ./public（Bun.file 零拷贝流式发送） ----

app.serveStatic('/static', './public', {
  cacheControl: 'public, max-age=3600',
  index: 'index.html',
});

// ---- 基础路由 ----

app.get('/', () => 'BackOne playground is running');

// 动态路径参数
app.get('/hello/:name', (ctx) => `hello, ${ctx.params.name}`);

// 类型化路由：泛型 params 提供 IDE 类型提示
app.get<{ id: string }>('/typed/:id', (ctx) =>
  ctx.json({ id: ctx.params.id, typed: true })
);

// gzip 压缩演示：大于 1024 字节的文本响应会被自动压缩
app.get('/large', () => 'backone-gzip-demo-'.repeat(256));

// 通配段：剩余路径写入 ctx.params.wildcard
app.get('/files/*', (ctx) => ctx.json({ wildcard: ctx.params.wildcard }));

// JSON 响应（包名与版本直接来自框架导出，避免硬编码）
app.get('/json', (ctx) =>
  ctx.json({
    framework: name,
    version,
    timestamp: Date.now(),
  })
);

// query 参数（惰性解析并缓存）
app.get('/search', (ctx) => {
  const q = ctx.query.get('q') ?? '';
  const page = Number(ctx.query.get('page') ?? '1');
  return ctx.json({ q, page });
});

// ---- 请求体（惰性解析） ----

app.post('/echo', async (ctx) => {
  const body = await ctx.bodyJson<{ message?: string }>();
  return ctx.json({ echoed: body.message ?? null });
});

app.post('/text', async (ctx) => ctx.text(await ctx.bodyText()));

// 表单请求体（multipart / urlencoded，惰性解析并缓存）
app.post('/form', async (ctx) => {
  const form = await ctx.bodyForm();
  return ctx.json(Object.fromEntries(form));
});

// ctx.state：中间件写入的数据可在处理器中读取
app.get('/request-id', (ctx) => ctx.json({ requestId: ctx.state.requestId }));

// ---- 响应头 / 状态码 / Cookie ----

app.get('/status', (ctx) => {
  ctx.status = 202;
  ctx.set('x-powered-by', 'backone');
  return ctx.json({ accepted: true });
});

app.get('/theme', (ctx) =>
  ctx.json({ theme: ctx.cookie('theme') ?? 'default' })
);

app.post('/theme', (ctx) => {
  ctx.setCookie('theme', 'dark', {
    httpOnly: true,
    path: '/',
    maxAge: 3600,
  });
  return ctx.json({ ok: true });
});

// 重定向与空响应
app.get('/old-path', (ctx) => ctx.redirect('/'));
app.delete('/cleanup', (ctx) => ctx.noContent());

// 流式响应（SSE 场景）
app.get('/events', (ctx) => {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode('data: hello from backone\n\n'));
      controller.close();
    },
  });
  return ctx.set('content-type', 'text/event-stream').stream(stream);
});

// ---- 多处理器与错误处理 ----

app.get(
  '/admin',
  (ctx, next) => {
    if (!ctx.request.headers.has('authorization')) {
      throw new HttpError(401, 'Missing authorization header');
    }
    return next();
  },
  (ctx) => ctx.json({ admin: true })
);

// 开发模式（development: true）下会输出堆栈并在响应中携带 message
app.get('/boom', () => {
  throw new Error('intentional error, see console');
});

// ---- 匹配任意方法 ----

app.all('/ping', () => 'pong');

// ---- 路由组：统一前缀 ----

app.group('/api/v1', (api) => {
  api.get('/users', () => 'users list');
  api.get<{ id: string }>('/users/:id', (ctx) =>
    ctx.json({ id: ctx.params.id, version: 'v1' })
  );
});

// ---- WebSocket ----

app.ws('/ws', {
  open: (ws) => ws.send('connected to backone websocket'),
  message: (ws, message) => ws.send(`echo: ${message}`),
  close: () => console.log('ws client closed'),
});

// 未注册的路径返回 404；路径存在但方法不匹配返回 405 + Allow 头，均由框架兜底。

// ---- 启动 ----

const port = await app.listen();
console.log(`BackOne playground: http://127.0.0.1:${port}`);
