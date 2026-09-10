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

export const createServerPage: BackOneDocPage = {
  path: '/api/create-server/',
  title: t('createServer', 'createServer'),
  description: t(
    '创建 BackOne 应用：选项、生命周期与返回的服务器对象。',
    'Create a BackOne app: options, lifecycle, and the returned server.'
  ),
  section: 'api',
  sectionOrder: 2,
  order: 0,
  body: [
    heading(1, 'create-server', 'createServer(options?)'),
    paragraph(
      t('创建并返回一个 ', 'Creates and returns a '),
      inlineCode('BackOneServer'),
      t(
        ' 实例。所有注册方法都可链式调用。',
        ' instance. Every registration method is chainable.'
      )
    ),
    codeBlock(
      'ts',
      `import { createServer } from '@geektech/backone';

const app = createServer({ port: 3000, development: true });
app.get('/ping', () => 'pong');
await app.listen();`
    ),
    heading(2, 'options', t('AppOptions', 'AppOptions')),
    apiTable(t('创建选项', 'Creation options'), [
      {
        name: 'port',
        signature: 'number',
        description: t(
          '监听端口，默认 3000；传 0 使用随机端口。',
          'Port to listen on, default 3000; pass 0 for a random port.'
        ),
      },
      {
        name: 'hostname',
        signature: 'string',
        description: t(
          '监听地址，默认 0.0.0.0。',
          'Address to bind, default 0.0.0.0.'
        ),
      },
      {
        name: 'development',
        signature: 'boolean',
        description: t(
          '开发模式：输出错误堆栈并在错误响应中携带原始 message。',
          'Dev mode: log error stacks and include the original message in error responses.'
        ),
      },
      {
        name: 'maxRequestBodySize',
        signature: 'number',
        description: t(
          '请求体大小上限（字节），默认由 Bun 决定。',
          'Max request body size in bytes; defaults to Bun’s own limit.'
        ),
      },
      {
        name: 'idleTimeout',
        signature: 'number',
        description: t(
          '空闲连接超时（秒），默认由 Bun 决定。',
          'Idle connection timeout in seconds; defaults to Bun’s own setting.'
        ),
      },
    ]),
    heading(2, 'lifecycle', t('生命周期', 'Lifecycle')),
    apiTable(t('服务器方法', 'Server methods'), [
      {
        name: 'listen',
        signature: 'listen(options?) => Promise<number>',
        description: t(
          '启动监听并返回实际端口号；重复调用会抛错。',
          'Starts listening and returns the actual port; calling twice throws.'
        ),
      },
      {
        name: 'port',
        signature: 'number | null',
        description: t(
          '当前监听端口，未启动时为 null。',
          'Current listening port, or null before listen().'
        ),
      },
      {
        name: 'close',
        signature: 'close(): void',
        description: t(
          '停止监听并关闭活跃连接。',
          'Stops listening and closes active connections.'
        ),
      },
      {
        name: 'handle',
        signature: 'handle(request) => Promise<Response>',
        description: t(
          '处理单个请求的完整管线，不监听也可直接测试。',
          'The full request pipeline for one request; testable without listening.'
        ),
      },
    ]),
    callout('tip', t('链式注册', 'Chainable registration'), [
      t(
        'get/post/put/patch/delete/options/head/all、use、useLogger、useCors、serveStatic 均返回 this。',
        'get/post/put/patch/delete/options/head/all, use, useLogger, useCors and serveStatic all return this.'
      ),
    ]),
  ],
};
