import {
  createOneDocsPageApp,
  type OneDocsPageRenderer,
} from './app';
import {
  normalizeOneDocBasePath,
  setOneDocBasePath,
  withOneDocBasePath,
} from './base';
import {
  oneDocPages,
  ONE_DOC_DEFAULT_LOCALE,
  ONE_DOC_LOCALES,
  type OneDocLocale,
  type OneDocPage,
} from './content';

type OneDocsRequest =
  | { kind: 'page'; page: OneDocPage; locale: OneDocLocale; basePath: string }
  | { kind: 'redirect'; basePath: string };

function currentPathname(): string {
  return typeof window !== 'undefined' ? window.location.pathname : '/';
}

/**
 * 解析当前 URL 对应的文档请求。CLI 在 SSR 时会把路由注入 window.location，
 * 浏览器端则是真实地址，两种场景都按「/{basePath}/{locale}{page}」匹配。
 * 无语言前缀的根路径返回重定向（跳到默认语言首页）。
 */
function resolveOneDocsRequest(pathname: string): OneDocsRequest {
  const normalizedPathname = pathname.replace(/\/+$/, '') || '/';

  for (const locale of ONE_DOC_LOCALES) {
    for (const page of oneDocPages) {
      const href =
        `/${locale}${page.path === '/' ? '' : page.path.replace(/\/$/, '')}`;
      if (
        normalizedPathname === href ||
        (normalizedPathname.length > href.length &&
          normalizedPathname.endsWith(href))
      ) {
        return {
          kind: 'page',
          page,
          locale,
          basePath: normalizeOneDocBasePath(
            normalizedPathname.slice(0, normalizedPathname.length - href.length)
          ),
        };
      }
    }
  }

  return {
    kind: 'redirect',
    basePath: normalizeOneDocBasePath(normalizedPathname),
  };
}

function createRootRedirectApp(basePath: string): OneDocsPageRenderer {
  const target = withOneDocBasePath(
    `/${ONE_DOC_DEFAULT_LOCALE}/`,
    basePath
  );

  return {
    renderHtmlDocument: () =>
      [
        '<!doctype html>',
        '<html lang="zh-CN">',
        '  <head>',
        '    <meta charset="utf-8" />',
        `    <meta http-equiv="refresh" content="0; url=${target}" />`,
        '    <title>One UI</title>',
        '  </head>',
        '  <body>',
        `    <a href="${target}">One UI</a>`,
        '  </body>',
        '</html>',
      ].join('\n'),
  };
}

const request = resolveOneDocsRequest(currentPathname());
setOneDocBasePath(request.kind === 'page' ? request.basePath : '');

export const app: OneDocsPageRenderer =
  request.kind === 'redirect'
    ? createRootRedirectApp(request.basePath)
    : createOneDocsPageApp(request.page, oneDocPages, request.locale);

// 浏览器端挂载 docs 客户端（demo 交互、语言切换、主题）；SSR（Bun）阶段跳过。
if (typeof process === 'undefined') {
  await import('./client');
}
