import { createBackOneDocsPageApp, type BackOneDocsPageRenderer } from './app';
import {
  normalizeBackOneDocBasePath,
  setBackOneDocBasePath,
  withBackOneDocBasePath,
} from './base';
import {
  backOneDocPages,
  BACKONE_DOC_DEFAULT_LOCALE,
  BACKONE_DOC_LOCALES,
  type BackOneDocLocale,
  type BackOneDocPage,
} from './content';

type BackOneDocsRequest =
  | {
      kind: 'page';
      page: BackOneDocPage;
      locale: BackOneDocLocale;
      basePath: string;
    }
  | { kind: 'redirect'; basePath: string };

function currentPathname(): string {
  return typeof window !== 'undefined' ? window.location.pathname : '/';
}

/**
 * 解析当前 URL 对应的文档请求。CLI 在 SSR 时会把路由注入 window.location，
 * 浏览器端则是真实地址，两种场景都按「/{basePath}/{locale}{page}」匹配。
 * 无语言前缀的根路径返回重定向（跳到默认语言首页）。
 */
function resolveBackOneDocsRequest(pathname: string): BackOneDocsRequest {
  const normalizedPathname = pathname.replace(/\/+$/, '') || '/';

  for (const locale of BACKONE_DOC_LOCALES) {
    for (const page of backOneDocPages) {
      const href = `/${locale}${page.path === '/' ? '' : page.path.replace(/\/$/, '')}`;
      if (
        normalizedPathname === href ||
        (normalizedPathname.length > href.length &&
          normalizedPathname.endsWith(href))
      ) {
        return {
          kind: 'page',
          page,
          locale,
          basePath: normalizeBackOneDocBasePath(
            normalizedPathname.slice(0, normalizedPathname.length - href.length)
          ),
        };
      }
    }
  }

  return {
    kind: 'redirect',
    basePath: normalizeBackOneDocBasePath(normalizedPathname),
  };
}

function createRootRedirectApp(basePath: string): BackOneDocsPageRenderer {
  const target = withBackOneDocBasePath(
    `/${BACKONE_DOC_DEFAULT_LOCALE}/`,
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
        '    <title>BackOne</title>',
        '  </head>',
        '  <body>',
        `    <a href="${target}">BackOne</a>`,
        '  </body>',
        '</html>',
      ].join('\n'),
  };
}

const request = resolveBackOneDocsRequest(currentPathname());
setBackOneDocBasePath(request.kind === 'page' ? request.basePath : '');

export const app: BackOneDocsPageRenderer =
  request.kind === 'redirect'
    ? createRootRedirectApp(request.basePath)
    : createBackOneDocsPageApp(request.page, backOneDocPages, request.locale);

// 浏览器端挂载 docs 客户端（主题、语言切换）；SSR（Bun）阶段跳过。
if (typeof process === 'undefined') {
  await import('./client');
}
