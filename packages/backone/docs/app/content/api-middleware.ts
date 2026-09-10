import {
  apiTable,
  callout,
  codeBlock,
  heading,
  paragraph,
  t,
  type BackOneDocPage,
} from './types';

export const middlewareApiPage: BackOneDocPage = {
  path: '/api/middleware/',
  title: t('中间件 API', 'Middleware API'),
  description: t(
    'compose、logger、cors、gzip 与 serveStatic 的完整选项。',
    'Full options for compose, logger, cors, gzip and serveStatic.'
  ),
  section: 'api',
  sectionOrder: 2,
  order: 2,
  body: [
    heading(1, 'middleware-api', t('中间件 API', 'Middleware API')),
    heading(2, 'compose', 'compose(handlers)'),
    paragraph(
      t(
        '洋葱模型组合器：按顺序执行处理器，next() 进入下一层，返回值逐层冒泡。',
        'The onion-model composer: runs handlers in order, next() enters the next layer, return values bubble outward.'
      )
    ),
    codeBlock(
      'ts',
      `import { compose } from '@geektech/backone';

const chain = compose([auth, logger, handler]);`
    ),
    heading(2, 'logger', 'logger(options?)'),
    apiTable(t('LoggerOptions', 'LoggerOptions'), [
      {
        name: 'out',
        signature: '(line: string) => void',
        description: t(
          '自定义输出函数，默认 console.log。',
          'Custom output function, default console.log.'
        ),
      },
      {
        name: 'timestamp',
        signature: 'boolean',
        description: t(
          '是否在行首输出 YYYY-MM-DD HH:mm:ss 时间，默认 true。',
          'Whether to prefix each line with YYYY-MM-DD HH:mm:ss time, default true.'
        ),
      },
    ]),
    heading(2, 'cors', 'cors(options?)'),
    apiTable(t('CorsOptions', 'CorsOptions'), [
      {
        name: 'origin',
        signature: 'string | string[] | (origin) => string',
        description: t(
          '允许的来源，默认 *；函数形式按请求 Origin 动态决定。',
          'Allowed origins, default *; a function decides per request Origin.'
        ),
      },
      {
        name: 'methods',
        signature: 'string[]',
        description: t('允许的方法列表。', 'Allowed methods.'),
      },
      {
        name: 'allowedHeaders',
        signature: 'string[]',
        description: t('允许的请求头。', 'Allowed request headers.'),
      },
      {
        name: 'exposeHeaders',
        signature: 'string[]',
        description: t(
          '暴露给浏览器的响应头。',
          'Response headers exposed to browsers.'
        ),
      },
      {
        name: 'credentials',
        signature: 'boolean',
        description: t('允许携带凭证。', 'Allow credentials.'),
      },
      {
        name: 'maxAge',
        signature: 'number',
        description: t(
          '预检结果缓存秒数。',
          'Preflight cache duration in seconds.'
        ),
      },
    ]),
    heading(2, 'gzip', 'gzip(options?)'),
    apiTable(t('GzipOptions', 'GzipOptions'), [
      {
        name: 'threshold',
        signature: 'number',
        description: t(
          '最小压缩字节数，低于此值不压缩，默认 1024。',
          'Minimum body byte length to compress, default 1024.'
        ),
      },
      {
        name: 'level',
        signature: '1 | 2 | ... | 9',
        description: t(
          '压缩级别 1-9，默认 6。',
          'Compression level 1-9, default 6.'
        ),
      },
      {
        name: 'types',
        signature: 'string[]',
        description: t(
          '可压缩的 Content-Type 前缀列表，默认 text/、application/json、application/javascript、application/xml、image/svg+xml。',
          'Compressible Content-Type prefix list, default text/, application/json, application/javascript, application/xml, image/svg+xml.'
        ),
      },
    ]),
    callout('note', t('自动跳过', 'Automatic skips'), [
      t(
        'gzip 中间件自动跳过：客户端不支持 gzip、已有 content-encoding、text/event-stream（SSE）、Content-Type 不在可压缩列表、body 低于阈值。',
        'The gzip middleware automatically skips: clients without gzip support, existing content-encoding, text/event-stream (SSE), non-compressible Content-Type, and bodies below threshold.'
      ),
    ]),
    heading(2, 'timeout', 'timeout(options?)'),
    apiTable(t('TimeoutOptions', 'TimeoutOptions'), [
      {
        name: 'ms',
        signature: 'number',
        description: t(
          '超时毫秒数，默认 5000。',
          'Timeout in milliseconds, default 5000.'
        ),
      },
      {
        name: 'status',
        signature: 'number',
        description: t(
          '超时响应状态码，默认 504。',
          'Timeout response status code, default 504.'
        ),
      },
      {
        name: 'message',
        signature: 'string',
        description: t(
          '超时响应消息，默认 "Gateway Timeout"。',
          'Timeout response message, default "Gateway Timeout".'
        ),
      },
    ]),
    callout('note', t('超时行为', 'Timeout behavior'), [
      t(
        'timeout 基于 Promise.race，超时后立即返回 504；后台执行的处理器仍会继续运行但其响应被忽略。可传数字简写 timeout(5000)。',
        'timeout uses Promise.race and returns 504 immediately on timeout; the handler continues running in the background but its response is ignored. Accepts a number shorthand timeout(5000).'
      ),
    ]),
    heading(2, 'helmet', 'helmet(options?)'),
    apiTable(t('HelmetOptions', 'HelmetOptions'), [
      {
        name: 'xContentTypeOptions',
        signature: 'string | false',
        description: t(
          'X-Content-Type-Options，默认 nosniff。',
          'X-Content-Type-Options, default nosniff.'
        ),
      },
      {
        name: 'xFrameOptions',
        signature: 'string | false',
        description: t(
          'X-Frame-Options，默认 DENY。',
          'X-Frame-Options, default DENY.'
        ),
      },
      {
        name: 'referrerPolicy',
        signature: 'string | false',
        description: t(
          'Referrer-Policy，默认 no-referrer。',
          'Referrer-Policy, default no-referrer.'
        ),
      },
      {
        name: 'strictTransportSecurity',
        signature: 'string | false',
        description: t(
          'Strict-Transport-Security，默认不设置。',
          'Strict-Transport-Security, not set by default.'
        ),
      },
      {
        name: 'contentSecurityPolicy',
        signature: 'string | false',
        description: t(
          'Content-Security-Policy，默认不设置。',
          'Content-Security-Policy, not set by default.'
        ),
      },
    ]),
    callout('note', t('不覆盖显式设置', 'No override of explicit headers'), [
      t(
        'helmet 不会覆盖处理器已显式设置的安全头；每项选项设为 false 可禁用该头。',
        'helmet does not override security headers explicitly set by the handler; set any option to false to disable that header.'
      ),
    ]),
    heading(2, 'serveStatic', 'serveStatic(prefix, rootDir, options?)'),
    apiTable(t('StaticOptions', 'StaticOptions'), [
      {
        name: 'cacheControl',
        signature: 'string | false',
        description: t(
          'Cache-Control 响应头，默认 public, max-age=3600；传 false 不设置。',
          'Cache-Control header, default public, max-age=3600; false disables it.'
        ),
      },
      {
        name: 'index',
        signature: 'string',
        description: t(
          '目录访问时的回退文件（相对 rootDir），如 index.html。',
          'Fallback file for directory requests (relative to rootDir), e.g. index.html.'
        ),
      },
    ]),
    callout('note', t('目录穿越防护', 'Traversal protection'), [
      t(
        'serveStatic 默认拒绝 .. 路径段（含 URL 编码形式），并在文件不存在时调用 next() 交给后续路由。静态响应自动携带 ETag、Last-Modified、Accept-Ranges，支持 If-None-Match/If-Modified-Since 304 与 Range 206。',
        'serveStatic rejects .. segments by default (including URL-encoded forms) and calls next() when the file is missing. Static responses automatically carry ETag, Last-Modified and Accept-Ranges, supporting If-None-Match/If-Modified-Since 304 and Range 206.'
      ),
    ]),
  ],
};
