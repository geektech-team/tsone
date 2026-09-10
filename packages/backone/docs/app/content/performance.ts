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
  order: 4,
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
          '：路由表在启动期构建为分段基数树，请求期匹配为路径段数线性。',
          ': routes are compiled into a segment radix tree at startup; matching is linear in path segments.'
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
    heading(2, 'target', t('基准目标', 'Benchmark target')),
    callout('note', t('对照裸 Bun.serve', 'Against raw Bun.serve'), [
      t(
        '设计目标是把简单路由的框架开销控制在裸 Bun.serve 的个位数百分比以内。正式的基准工具与报告计划随后续版本发布，v0.1 阶段以测试与类型保障为主。',
        'The design target keeps framework overhead on simple routes within single-digit percentages of raw Bun.serve. A formal benchmark harness and report are planned for a later release; v0.1 focuses on tests and type safety.'
      ),
    ]),
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
