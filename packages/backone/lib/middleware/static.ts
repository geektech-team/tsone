/**
 * 静态文件服务中间件：基于 Bun.file 流式发送，零拷贝。
 * 默认开启目录穿越防护（拒绝 .. 段）。
 */

import { join } from 'node:path';
import type { Handler } from '../types';

export interface StaticOptions {
  /** Cache-Control 响应头，默认 'public, max-age=3600'；传 false 不设置 */
  cacheControl?: string | false;
  /** 目录访问时的回退文件（相对 rootDir），例如 'index.html' */
  index?: string;
}

const MIME_TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.wasm': 'application/wasm',
  '.map': 'application/json',
};

export function serveStatic(
  prefix: string,
  rootDir: string,
  options: StaticOptions = {}
): Handler {
  const cacheControl = options.cacheControl ?? 'public, max-age=3600';

  return async (ctx, next) => {
    if (prefix !== '/' && !ctx.pathname.startsWith(prefix)) {
      return next();
    }

    const relative =
      prefix === '/'
        ? ctx.pathname.slice(1)
        : ctx.pathname.slice(prefix.length).replace(/^\/+/, '');

    const segments = relative.split('/').filter(Boolean).map(safeDecode);
    if (segments.some((segment) => segment === '..')) {
      return next();
    }

    const candidates = [join(rootDir, ...segments)];
    if (options.index !== undefined && segments.length === 0) {
      candidates.push(join(rootDir, options.index));
    }

    for (const candidate of candidates) {
      const file = Bun.file(candidate);
      if (!(await file.exists())) {
        continue;
      }
      const headers = new Headers();
      if (cacheControl !== false) {
        headers.set('Cache-Control', cacheControl);
      }
      const extension = candidate
        .slice(candidate.lastIndexOf('.'))
        .toLowerCase();
      const contentType = MIME_TYPES[extension];
      if (contentType !== undefined) {
        headers.set('Content-Type', contentType);
      }
      return new Response(file, { headers });
    }

    return next();
  };
}

function safeDecode(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}
