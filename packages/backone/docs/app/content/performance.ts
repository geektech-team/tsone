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

export const performancePage: BackOneDocPage = {
  path: '/guide/performance/',
  title: t('高性能设计', 'Performance design'),
  description: t(
    'BackOne 的高性能取舍：站在 Bun 之上、避免热路径上的无谓分配。',
    'BackOne’s performance trade-offs: stand on Bun, avoid needless work on the hot path.'
  ),
  section: 'guide',
  sectionOrder: 1,
  order: 6,
  body: [
    heading(1, 'performance', t('高性能设计', 'Performance design')),
    paragraph(
      t(
        'BackOne 不重复实现 HTTP 解析与事件循环——这些由 Bun 运行时负责。框架层只做路由、中间件编排与响应序列化，并把每一步的热路径开销压到最小。',
        'BackOne does not re-implement HTTP parsing or the event loop — the Bun runtime owns those. The framework only handles routing, middleware orchestration and response serialization, keeping hot-path overhead minimal at every step.'
      )
    ),
    heading(2, 'principles', t('设计原则', 'Design principles')),
    list([
      [
        inlineCode('路由预编译'),
        t(
          '：路由表在启动期构建为分段基数树，请求期匹配为路径段数线性；同一路径的多处理器链在注册后预编译为单个函数。',
          ': routes are compiled into a segment radix tree at startup; matching is linear in path segments. Multi-handler chains per route are pre-compiled into a single function after registration.'
        ),
      ],
      [
        inlineCode('中间件链预编译'),
        t(
          '：use() 注册后立即组合为预编译链，请求期不再分配数组或重建闭包，3 个中间件的额外开销约 9%。',
          ': the middleware chain is composed once after use(); requests allocate no arrays and rebuild no closures. Three middlewares add roughly 9% overhead.'
        ),
      ],
      [
        inlineCode('零 new URL 热路径'),
        t(
          '：pathname 用字符串切分提取，query 用 URLSearchParams 直接解析，避免每请求完整 URL 解析。',
          ': pathname is extracted by string slicing and query by URLSearchParams, avoiding a full URL parse per request.'
        ),
      ],
      [
        inlineCode('惰性解析'),
        t(
          '：query、JSON 与文本请求体只在首次访问时解析并缓存。',
          ': query, JSON and text bodies are parsed only on first access and cached.'
        ),
      ],
      [
        inlineCode('零开销直通'),
        t(
          '：处理器直接返回 Response 时不经过任何包装层。',
          ': returning a Response passes through with zero wrapping.'
        ),
      ],
      [
        inlineCode('零拷贝静态文件'),
        t(
          '：静态文件通过 Bun.file 流式发送，不经内存复制。',
          ': static files stream via Bun.file without memory copies.'
        ),
      ],
      [
        inlineCode('流式优先'),
        t(
          '：SSE、大文件等场景直接返回 ReadableStream。',
          ': SSE, large files and similar return a ReadableStream directly.'
        ),
      ],
      [
        inlineCode('内置压缩'),
        t(
          '：Bun 自带 gzip 能力，压缩无需引入第三方依赖。',
          ': Bun ships gzip, so compression needs no third-party dependency.'
        ),
      ],
    ]),
    heading(2, 'streaming', t('流式响应', 'Streaming responses')),
    codeBlock(
      'ts',
      `app.get('/events', (ctx) => {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode('data: hello\\n\\n'));
      controller.close();
    },
  });
  return ctx.stream(stream);
});`
    ),
    heading(2, 'target', t('基准与实测', 'Benchmark and measurements')),
    callout(
      'note',
      t('微观基准（bun run bench）', 'Micro-benchmark (bun run bench)'),
      [
        t(
          '基准工具直接调用 server.handle() 测量纯 CPU 开销（不经网络），结果稳定可复现。当前实测：无中间件约 100 万 handle/s，3 个自定义中间件开销约 9.4%；logger+cors 的额外开销主要来自这些中间件的实际工作（performance.now、响应头读写），而非框架管线。加 --network 可运行对照裸 Bun.serve 的网络基准，但含 fetch 客户端与网络栈噪声，波动较大。',
          'The benchmark calls server.handle() directly to measure pure CPU cost (no network), giving stable reproducible numbers. Current measurements: roughly 1M handle/s without middleware, about 9.4% overhead with three custom middlewares. The extra cost of logger+cors comes from those middlewares real work (performance.now, header reads/writes), not the framework pipeline. Pass --network for a raw-Bun.serve comparison, but it includes fetch client and network noise and fluctuates more.'
        ),
      ]
    ),
    heading(2, 'antipatterns', t('避免反模式', 'Avoiding anti-patterns')),
    list([
      [
        t(
          '不要在热路径上做同步阻塞操作（如同步读文件、CPU 密集计算）。',
          'Do not block the event loop with sync work on the hot path (sync file reads, CPU-heavy computation).'
        ),
      ],
      [
        t(
          '不要在处理器内重复解析同一份 query 或 body——Context 已经缓存。',
          'Do not re-parse the same query or body inside a handler — the Context caches them.'
        ),
      ],
      [
        t(
          '按需使用中间件：每个全局中间件都会参与每次请求。',
          'Install middleware deliberately: every global middleware runs on every request.'
        ),
      ],
    ]),
  ],
};
