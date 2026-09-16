import {
  createOneChartDocsPageApp,
  type OneChartDocsPageRenderer,
} from './app';
import {
  normalizeOneChartDocBasePath,
  setOneChartDocBasePath,
  withOneChartDocBasePath,
} from './base';
import {
  oneChartDocPages,
  ONE_CHART_DOC_DEFAULT_LOCALE,
  ONE_CHART_DOC_LOCALES,
  type OneChartDocLocale,
  type OneChartDocPage,
} from './content';

type OneChartDocsRequest =
  | { kind: 'page'; page: OneChartDocPage; locale: OneChartDocLocale; basePath: string }
  | { kind: 'redirect'; basePath: string };

function currentPathname(): string {
  return typeof window !== 'undefined' ? window.location.pathname : '/';
}

/**
 * 解析当前 URL 对应的文档请求。CLI 在 SSR 时会把路由注入 window.location，
 * 浏览器端则是真实地址，两种场景都按「/{basePath}/{locale}{page}」匹配。
 * 无语言前缀的根路径返回重定向（跳到默认语言首页）。
 */
function resolveOneChartDocsRequest(pathname: string): OneChartDocsRequest {
  const normalizedPathname = pathname.replace(/\/+$/, '') || '/';

  for (const locale of ONE_CHART_DOC_LOCALES) {
    for (const page of oneChartDocPages) {
      const href = `/${locale}${
        page.path === '/' ? '' : page.path.replace(/\/$/, '')
      }`;
      if (
        normalizedPathname === href ||
        (normalizedPathname.length > href.length &&
          normalizedPathname.endsWith(href))
      ) {
        return {
          kind: 'page',
          page,
          locale,
          basePath: normalizeOneChartDocBasePath(
            normalizedPathname.slice(0, normalizedPathname.length - href.length)
          ),
        };
      }
    }
  }

  return {
    kind: 'redirect',
    basePath: normalizeOneChartDocBasePath(normalizedPathname),
  };
}

function createRootRedirectApp(basePath: string): OneChartDocsPageRenderer {
  const target = withOneChartDocBasePath(
    `/${ONE_CHART_DOC_DEFAULT_LOCALE}/`,
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
        '    <title>One Chart</title>',
        '  </head>',
        '  <body>',
        `    <a href="${target}">One Chart</a>`,
        '  </body>',
        '</html>',
      ].join('\n'),
  };
}

const request = resolveOneChartDocsRequest(currentPathname());
setOneChartDocBasePath(request.kind === 'page' ? request.basePath : '');

export const app: OneChartDocsPageRenderer =
  request.kind === 'redirect'
    ? createRootRedirectApp(request.basePath)
    : createOneChartDocsPageApp(request.page, oneChartDocPages, request.locale);

// 浏览器端挂载 docs 客户端（demo 交互、语言切换、主题）；SSR（Bun）阶段跳过。
if (typeof process === 'undefined') {
  await import('./client');
}
