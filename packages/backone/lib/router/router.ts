/**
 * Router：路由注册与匹配。
 * 启动期注册（get/post/...），请求期通过 match() 解析出处理器与参数。
 */

import { Trie } from './trie';
import type { Handler, HttpMethod, RouteMethod } from '../types';

const ALL_HTTP_METHODS: HttpMethod[] = [
  'GET',
  'HEAD',
  'POST',
  'PUT',
  'PATCH',
  'DELETE',
  'OPTIONS',
];

export interface RouterMatch {
  /** 路径参数 */
  params: Readonly<Record<string, string>>;
  /** 当前方法可执行的处理器链；为空表示方法不匹配 */
  handlers: Handler[];
  /** 该路径已注册的方法（用于 405 Allow 头） */
  allowed: HttpMethod[];
}

export class Router {
  readonly #trie = new Trie();

  get(path: string, ...handlers: Handler[]): this {
    return this.add('GET', path, handlers);
  }

  post(path: string, ...handlers: Handler[]): this {
    return this.add('POST', path, handlers);
  }

  put(path: string, ...handlers: Handler[]): this {
    return this.add('PUT', path, handlers);
  }

  patch(path: string, ...handlers: Handler[]): this {
    return this.add('PATCH', path, handlers);
  }

  delete(path: string, ...handlers: Handler[]): this {
    return this.add('DELETE', path, handlers);
  }

  options(path: string, ...handlers: Handler[]): this {
    return this.add('OPTIONS', path, handlers);
  }

  head(path: string, ...handlers: Handler[]): this {
    return this.add('HEAD', path, handlers);
  }

  /** 匹配任意 HTTP 方法 */
  all(path: string, ...handlers: Handler[]): this {
    return this.add('ALL', path, handlers);
  }

  add(method: RouteMethod, path: string, handlers: Handler[]): this {
    if (handlers.length === 0) {
      throw new Error(`Route "${path}" requires at least one handler`);
    }
    for (const handler of handlers) {
      this.#trie.insert(path, method, handler);
    }
    return this;
  }

  match(method: string, pathname: string): RouterMatch | null {
    const result = this.#trie.match(pathname);
    if (result === null) {
      return null;
    }
    const { node, params } = result;
    const registered = node.handlers;
    if (registered === null) {
      return { params, handlers: [], allowed: [] };
    }

    const upper = method.toUpperCase() as HttpMethod;
    const direct = registered.get(upper);
    if (direct !== undefined) {
      return {
        params,
        handlers: [...direct],
        allowed: this.#allowed(registered),
      };
    }
    if (upper === 'HEAD') {
      const getHandlers = registered.get('GET');
      if (getHandlers !== undefined) {
        return {
          params,
          handlers: [...getHandlers],
          allowed: this.#allowed(registered),
        };
      }
    }
    const allHandlers = registered.get('ALL');
    if (allHandlers !== undefined) {
      return {
        params,
        handlers: [...allHandlers],
        allowed: this.#allowed(registered),
      };
    }
    return { params, handlers: [], allowed: this.#allowed(registered) };
  }

  #allowed(registered: Map<RouteMethod, Handler[]>): HttpMethod[] {
    if (registered.has('ALL')) {
      return [...ALL_HTTP_METHODS];
    }
    return ALL_HTTP_METHODS.filter((method) => registered.has(method));
  }
}
