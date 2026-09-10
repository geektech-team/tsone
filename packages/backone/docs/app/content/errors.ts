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

export const errorsPage: BackOneDocPage = {
  path: '/guide/errors/',
  title: t('错误处理', 'Error handling'),
  description: t(
    'HttpError、404/405 兜底与生产环境不泄漏内部信息。',
    'HttpError, 404/405 fallbacks, and no internal leakage in production.'
  ),
  section: 'guide',
  sectionOrder: 1,
  order: 3,
  body: [
    heading(1, 'errors', t('错误处理', 'Error handling')),
    paragraph(
      t('在处理器或中间件中抛出 ', 'Throw '),
      inlineCode('HttpError'),
      t(
        ' 即可控制响应状态码与消息；框架会统一转为 JSON 错误响应。',
        ' from a handler or middleware to control the status and message; the framework turns it into a uniform JSON error response.'
      )
    ),
    codeBlock(
      'ts',
      `import { HttpError } from '@geektech/backone';

app.get('/admin', (ctx) => {
  const token = ctx.request.headers.get('authorization');
  if (!token) {
    throw new HttpError(401, 'Missing authorization header');
  }
  return ctx.json({ admin: true });
});`
    ),
    heading(2, 'fallbacks', t('默认兜底', 'Default fallbacks')),
    list([
      [
        t('未匹配路径：', 'Unmatched path: '),
        inlineCode('404'),
        t('，响应 ', ', responds '),
        inlineCode('{"error":"Not Found","status":404}'),
        t('。', '.'),
      ],
      [
        t('路径存在但方法不允许：', 'Path exists but method not allowed: '),
        inlineCode('405'),
        t('，并携带 ', ', with an '),
        inlineCode('Allow'),
        t(' 响应头。', ' header.'),
      ],
      [
        t('未知异常：', 'Unknown exceptions: '),
        inlineCode('500'),
        t('，生产环境只返回 ', ', production returns only '),
        inlineCode('Internal Server Error'),
        t('，不泄漏堆栈与内部信息。', ' — no stack or internals leak.'),
      ],
    ]),
    heading(2, 'development', t('开发模式', 'Development mode')),
    paragraph(
      t('创建应用时传入 ', 'Pass '),
      inlineCode('development: true'),
      t(
        '：未知错误的堆栈会输出到控制台，错误响应携带原始 message，便于本地调试。',
        ' to log unknown error stacks to the console and include the original message in error responses for local debugging.'
      )
    ),
    codeBlock(
      'ts',
      `const app = createServer({ development: process.env.NODE_ENV !== 'production' });`
    ),
    heading(2, 'custom', t('自定义错误响应', 'Custom error responses')),
    paragraph(
      t(
        '用中间件包住链路即可接管错误响应：',
        'Wrap the chain with a middleware to take over error responses:'
      )
    ),
    codeBlock(
      'ts',
      `app.use(async (_ctx, next) => {
  try {
    return await next();
  } catch (error) {
    return new Response('custom error page', { status: 500 });
  }
});`
    ),
    callout('note', t('5xx 与 4xx', '5xx vs 4xx'), [
      t(
        'HttpError 的 status 为 4xx 时消息原样返回；为 5xx 时生产环境统一替换为 Internal Server Error。',
        'For HttpError, 4xx messages are returned as-is; 5xx messages are replaced with Internal Server Error in production.'
      ),
    ]),
  ],
};
