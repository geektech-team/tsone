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
    'compose、logger、cors 与 serveStatic 的完整选项。',
    'Full options for compose, logger, cors and serveStatic.'
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
        'serveStatic 默认拒绝 .. 路径段（含 URL 编码形式），并在文件不存在时调用 next() 交给后续路由。',
        'serveStatic rejects .. segments by default (including URL-encoded forms) and calls next() when the file is missing.'
      ),
    ]),
  ],
};
