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

export const ssePage: BackOneDocPage = {
  path: '/guide/sse/',
  title: t('Server-Sent Events', 'Server-Sent Events'),
  description: t(
    '基于流式响应的 SSE 实时推送：text/event-stream 与 ctx.stream()。',
    'SSE real-time push via streaming responses: text/event-stream and ctx.stream().'
  ),
  section: 'guide',
  sectionOrder: 1,
  order: 5,
  body: [
    heading(1, 'sse', t('Server-Sent Events', 'Server-Sent Events')),
    paragraph(
      t(
        'SSE 是一种基于 HTTP 的服务端推送技术：客户端通过 ',
        'SSE is an HTTP-based server-push technique: the client opens a long-lived HTTP connection via '
      ),
      inlineCode('EventSource'),
      t(
        ' 建立长连接，服务端通过 ',
        ', and the server pushes events over the response stream using the '
      ),
      inlineCode('text/event-stream'),
      t(
        ' 内容类型持续推送事件。BackOne 不需要专门的 SSE API——',
        ' content type. BackOne needs no special SSE API — '
      ),
      inlineCode('ctx.stream()'),
      t(
        ' 配合标准 Web Streams 即可实现。',
        ' paired with standard Web Streams is enough.'
      ),
    ),
    heading(2, 'basic', t('基本用法', 'Basic usage')),
    codeBlock(
      'ts',
      `import { createServer } from '@geektech/backone';

const app = createServer({ port: 3000 });

app.get('/events', (ctx) => {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode('data: hello\\n\\n'));
      controller.enqueue(encoder.encode('data: world\\n\\n'));
      controller.close();
    },
  });
  return ctx
    .set('content-type', 'text/event-stream')
    .set('cache-control', 'no-cache')
    .stream(stream);
});

await app.listen();`
    ),
    paragraph(
      t(
        '关键点：Content-Type 必须是 ',
        'Key points: Content-Type must be '
      ),
      inlineCode('text/event-stream'),
      t(
        '，建议设置 ',
        ', and it is recommended to set '
      ),
      inlineCode('Cache-Control: no-cache'),
      t(
        ' 以避免代理和浏览器缓存。每条事件以空行（',
        ' to avoid proxy and browser caching. Each event is terminated by a blank line ('
      ),
      inlineCode('\\n\\n'),
      t('）分隔。', ').'),
    ),
    heading(2, 'format', t('事件格式', 'Event format')),
    list([
      [
        inlineCode('data:'),
        t(
          ' 事件数据，可多行（每行以 data: 开头），以空行结束。',
          ' event payload, can span multiple lines (each prefixed with data:), terminated by a blank line.'
        ),
      ],
      [
        inlineCode('id:'),
        t(
          ' 事件 ID，客户端断线重连时会通过 Last-Event-ID 头发送最后收到的 ID。',
          ' event ID; on reconnect the client sends the last received ID via the Last-Event-ID header.'
        ),
      ],
      [
        inlineCode('event:'),
        t(
          ' 自定义事件名，客户端可通过 addEventListener("eventName") 监听。',
          ' custom event name; clients can listen via addEventListener("eventName").'
        ),
      ],
      [
        inlineCode('retry:'),
        t(
          ' 重连间隔（毫秒），告知客户端断线后多久重连。',
          ' reconnect interval in milliseconds, telling the client how long to wait before reconnecting.'
        ),
      ],
      [
        inlineCode(':'),
        t(
          ' 注释行，可作为心跳保活（防止代理超时断开）。',
          ' comment line, useful as a heartbeat to prevent proxy timeouts.'
        ),
      ],
    ]),
    codeBlock(
      'ts',
      `// 带 id、event 和 retry 的完整事件
const msg = [
  'id: 42',
  'event: update',
  'retry: 3000',
  'data: {"user":"alice","score":100}',
  '',
  '',
].join('\\n');
controller.enqueue(encoder.encode(msg));`
    ),
    heading(2, 'clock', t('实时时钟示例', 'Live clock example')),
    paragraph(
      t(
        '下面是一个持续推送当前时间的 SSE 端点，使用 ',
        'Below is a SSE endpoint that continuously pushes the current time, using '
      ),
      inlineCode('setInterval'),
      t(
        ' 定时入队，客户端断开时通过 ',
        ' to enqueue periodically, and cleans up the timer on client disconnect via '
      ),
      inlineCode('ctx.signal'),
      t('（AbortSignal）清理定时器。', ' (AbortSignal).'),
    ),
    codeBlock(
      'ts',
      `app.get('/clock', (ctx) => {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      const send = () => {
        const data = JSON.stringify({ time: new Date().toISOString() });
        controller.enqueue(encoder.encode(\`data: \${data}\\n\\n\`));
      };
      send();
      const timer = setInterval(send, 1000);
      ctx.request.signal.addEventListener('abort', () => {
        clearInterval(timer);
        controller.close();
      });
    },
  });
  return ctx
    .set('content-type', 'text/event-stream')
    .set('cache-control', 'no-cache')
    .stream(stream);
});`
    ),
    heading(2, 'client', t('客户端用法', 'Client usage')),
    codeBlock(
      'ts',
      `const es = new EventSource('/clock');
es.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('server time:', data.time);
};
// 自定义事件
es.addEventListener('update', (event) => {
  console.log('update:', event.data);
});
es.onerror = () => {
  console.log('connection lost, EventSource will auto-reconnect');
};`
    ),
    heading(2, 'vs-websocket', t('与 WebSocket 对比', 'Compared to WebSocket')),
    list([
      [
        t('SSE：', 'SSE: '),
        t(
          '单向（服务端→客户端），基于 HTTP，自动重连，内置事件 ID，浏览器原生支持 EventSource。适合通知、实时更新、日志流。',
          ' one-way (server→client), HTTP-based, auto-reconnect, built-in event IDs, native EventSource in browsers. Good for notifications, live updates, log streams.'
        ),
      ],
      [
        t('WebSocket：', 'WebSocket: '),
        t(
          '双向（全双工），独立协议，需要手动处理重连和心跳。适合聊天、协作编辑、游戏等需要客户端频繁发送数据的场景。',
          ' bidirectional (full-duplex), separate protocol, requires manual reconnect and heartbeat. Good for chat, collaborative editing, games where the client sends data frequently.'
        ),
      ],
    ]),
    callout('note', t('注意事项', 'Caveats'), [
      t(
        'gzip 中间件会自动跳过 text/event-stream 响应（避免压缩挂起长连接），无需额外配置。',
        'The gzip middleware automatically skips text/event-stream responses (to avoid compressing and hanging long-lived connections), so no extra config is needed.'
      ),
      t(
        '反向代理（Nginx 等）可能缓冲 SSE 响应，需设置 proxy_buffering off 或 X-Accel-Buffering: no。',
        'Reverse proxies (Nginx etc.) may buffer SSE responses; set proxy_buffering off or send X-Accel-Buffering: no.'
      ),
      t(
        '长连接应定期发送注释心跳（: ping\\n\\n），防止代理因空闲超时断开连接。',
        'Long-lived connections should periodically send comment heartbeats (: ping\\n\\n) to prevent proxies from closing idle connections.'
      ),
    ]),
  ],
};
