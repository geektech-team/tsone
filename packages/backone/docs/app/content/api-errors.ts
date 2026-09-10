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

export const errorsApiPage: BackOneDocPage = {
  path: '/api/errors/',
  title: t('HttpError API', 'HttpError API'),
  description: t(
    'HttpError 的构造与默认状态消息。',
    'HttpError construction and default status messages.'
  ),
  section: 'api',
  sectionOrder: 2,
  order: 3,
  body: [
    heading(1, 'http-error', 'HttpError'),
    paragraph(
      t(
        '携带 HTTP 状态码的错误类型，可在任意处理器/中间件中抛出，由框架统一转为 JSON 错误响应。',
        'An error type carrying an HTTP status; throw it anywhere in a handler or middleware and the framework turns it into a JSON error response.'
      )
    ),
    codeBlock(
      'ts',
      `import { HttpError } from '@geektech/backone';

throw new HttpError(403, 'Forbidden resource');`
    ),
    apiTable(t('HttpError', 'HttpError'), [
      {
        name: 'constructor',
        signature: 'new HttpError(status, message?)',
        description: t(
          'status 必填；message 缺省时使用默认状态消息。',
          'status is required; message defaults to the standard status text.'
        ),
      },
      {
        name: 'status',
        signature: 'readonly number',
        description: t('HTTP 状态码。', 'The HTTP status code.'),
      },
      {
        name: 'message',
        signature: 'string',
        description: t(
          '错误消息；5xx 在生产环境响应中被替换为 Internal Server Error。',
          'Error message; 5xx messages are replaced with Internal Server Error in production responses.'
        ),
      },
    ]),
    heading(2, 'defaults', t('默认状态消息', 'Default status messages')),
    paragraph(
      t(
        '框架内置常见状态码的默认消息（400 Bad Request、401 Unauthorized、403 Forbidden、404 Not Found、405 Method Not Allowed、409 Conflict、413 Payload Too Large、429 Too Many Requests、500 Internal Server Error 等），未覆盖的状态码回退为 ',
        'The framework ships default messages for common statuses (400 Bad Request, 401 Unauthorized, 403 Forbidden, 404 Not Found, 405 Method Not Allowed, 409 Conflict, 413 Payload Too Large, 429 Too Many Requests, 500 Internal Server Error, etc.); unknown statuses fall back to '
      ),
      inlineCode('defaultHttpMessage(status)'),
      t('。', '.')
    ),
    callout('tip', t('与中间件配合', 'With middleware'), [
      t(
        '在 use() 中 try/catch 包裹 next() 即可完全接管错误响应，包括自定义错误页与日志上报。',
        'Wrap next() in a try/catch inside use() to fully take over error responses, including custom error pages and log reporting.'
      ),
    ]),
  ],
};
