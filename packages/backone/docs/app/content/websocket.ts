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

export const websocketPage: BackOneDocPage = {
  path: '/guide/websocket/',
  title: t('WebSocket', 'WebSocket'),
  description: t(
    '基于 Bun 原生 WebSocket 的实时通信，按路径注册处理器。',
    'Real-time communication on Bun native WebSocket, with path-registered handlers.'
  ),
  section: 'guide',
  sectionOrder: 1,
  order: 4,
  body: [
    heading(1, 'websocket', t('WebSocket', 'WebSocket')),
    paragraph(
      t(
        'BackOne 直接复用 Bun 内置的 WebSocket 升级能力，不引入任何第三方库。通过 ',
        'BackOne reuses Bun built-in WebSocket upgrade directly, with no third-party dependency. Register a handler via '
      ),
      inlineCode('app.ws(path, handler)'),
      t('，请求携带 ', '. Requests carrying an '),
      inlineCode('Upgrade: websocket'),
      t(
        ' 头且路径已注册时，框架自动调用 ',
        ' header on a registered path trigger an automatic '
      ),
      inlineCode('server.upgrade()'),
      t(' 并返回 101。', ' and return 101.')
    ),
    heading(2, 'usage', t('基本用法', 'Basic usage')),
    codeBlock(
      'ts',
      `import { createServer } from '@geektech/backone';

const app = createServer({ port: 3000 });

app.ws('/echo', {
  open(ws) {
    ws.send('connected');
  },
  message(ws, message) {
    ws.send(\`echo: \${message}\`);
  },
  close(ws, code, reason) {
    console.log('closed', code, reason);
  },
});

await app.listen();`
    ),
    heading(2, 'handler', t('处理器回调', 'Handler callbacks')),
    list([
      [
        inlineCode('open(ws)'),
        t('：连接建立时触发。', ': fired when the connection opens.'),
      ],
      [
        inlineCode('message(ws, message)'),
        t(
          '：收到文本或二进制消息时触发，',
          ': fired on text or binary messages; '
        ),
        inlineCode('ws.send()'),
        t(' 发送回客户端。', ' sends data back to the client.'),
      ],
      [
        inlineCode('close(ws, code, reason)'),
        t('：连接关闭时触发。', ': fired when the connection closes.'),
      ],
      [
        inlineCode('drain(ws)'),
        t(
          '：连接从背压中恢复可写时触发。',
          ': fired when the connection recovers from backpressure and becomes writable.'
        ),
      ],
    ]),
    heading(2, 'client', t('客户端连接', 'Client connection')),
    paragraph(
      t(
        '浏览器或 Bun 客户端使用标准 ',
        'Browser or Bun clients use the standard '
      ),
      inlineCode('new WebSocket(url)'),
      t(
        ' 连接，路径需与注册路径完全匹配。未注册路径的升级请求会走正常 HTTP 路由（通常返回 404）。',
        '; the path must match the registered path exactly. Upgrade requests on unregistered paths fall through to normal HTTP routing (typically 404).'
      )
    ),
    callout('note', t('零依赖', 'Zero dependency'), [
      t(
        'WebSocket 能力完全来自 Bun 运行时，框架只做路径分发与升级封装，运行时无外部依赖。',
        'WebSocket capability comes entirely from the Bun runtime; the framework only does path dispatch and upgrade wrapping, with no external runtime dependency.'
      ),
    ]),
  ],
};
