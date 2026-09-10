/**
 * BackOneServer：服务端应用入口。
 * 负责路由注册、中间件编排与 Bun.serve 生命周期；
 * handle() 是独立于监听的请求管线，可直接用于测试。
 */

import type { Server } from 'bun';
import { Context } from './context';
import { HttpError } from './errors';
import { compose } from './middleware/compose';
import { cors } from './middleware/cors';
import { logger } from './middleware/logger';
import { serveStatic } from './middleware/static';
import { Router } from './router/router';
import type { AppOptions, Handler, RouteMethod } from './types';
import type { CorsOptions } from './middleware/cors';
import type { LoggerOptions } from './middleware/logger';
import type { StaticOptions } from './middleware/static';

const JSON_TYPE = 'application/json; charset=utf-8';

export class BackOneServer {
  readonly #router = new Router();
  readonly #middlewares: Handler[] = [];
  readonly #options: AppOptions;
  #server: Server<unknown> | null = null;

  constructor(options: AppOptions = {}) {
    this.#options = options;
  }

  // ---- 路由注册 ----

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
    this.#router.add(method, path, handlers);
    return this;
  }

  // ---- 中间件 ----

  use(...middlewares: Handler[]): this {
    this.#middlewares.push(...middlewares);
    return this;
  }

  useLogger(options: LoggerOptions = {}): this {
    return this.use(logger(options));
  }

  useCors(options: CorsOptions = {}): this {
    return this.use(cors(options));
  }

  serveStatic(
    prefix: string,
    rootDir: string,
    options: StaticOptions = {}
  ): this {
    return this.use(serveStatic(prefix, rootDir, options));
  }

  // ---- 请求管线 ----

  /** 处理单个请求：路由匹配 → 中间件链 → 响应序列化 */
  async handle(request: Request): Promise<Response> {
    const ctx = new Context(request);
    const match = this.#router.match(request.method, ctx.pathname);
    ctx.setParams(match?.params ?? {});

    // 中间件链始终执行（静态文件等中间件需要拦截未匹配路径）；
    // 链尾按匹配结果追加 404 / 405 / 路由处理器。
    const tail: Handler[] = [];
    if (match === null) {
      tail.push(() => this.#errorResponse(new HttpError(404)));
    } else if (match.handlers.length === 0) {
      const allowed = match.allowed.join(', ');
      tail.push(
        () => new Response(null, { status: 405, headers: { Allow: allowed } })
      );
    } else {
      tail.push(...match.handlers);
    }

    const chain = [...this.#middlewares, ...tail];
    try {
      const result = await compose(chain)(ctx, () => undefined);
      return this.#toResponse(ctx, result);
    } catch (error) {
      const httpError =
        error instanceof HttpError
          ? error
          : new HttpError(500, undefined, { cause: error });
      return this.#errorResponse(httpError);
    }
  }

  // ---- 生命周期 ----

  /** 启动监听，返回实际端口号 */
  async listen(
    options: Pick<AppOptions, 'port' | 'hostname'> = {}
  ): Promise<number> {
    if (this.#server !== null) {
      throw new Error('BackOne server is already listening');
    }
    const serverOptions: Parameters<typeof Bun.serve>[0] = {
      port: options.port ?? this.#options.port ?? 3000,
      hostname: options.hostname ?? this.#options.hostname,
      fetch: (request) => this.handle(request),
    };
    if (this.#options.maxRequestBodySize !== undefined) {
      serverOptions.maxRequestBodySize = this.#options.maxRequestBodySize;
    }
    if (this.#options.idleTimeout !== undefined) {
      serverOptions.idleTimeout = this.#options.idleTimeout;
    }
    this.#server = Bun.serve(serverOptions);
    const { port } = this.#server;
    if (port === undefined) {
      throw new Error('BackOne failed to determine listening port');
    }
    return port;
  }

  /** 当前监听端口；未启动时为 null */
  get port(): number | null {
    return this.#server?.port ?? null;
  }

  /** 停止监听并关闭连接 */
  close(): void {
    this.#server?.stop(true);
    this.#server = null;
  }

  // ---- 内部 ----

  #toResponse(ctx: Context, value: unknown): Response {
    if (value instanceof Response) {
      return value;
    }
    if (value === undefined || value === null) {
      const status = ctx.status === 200 ? 204 : ctx.status;
      return new Response(null, { status, headers: ctx.headers });
    }
    if (typeof value === 'string') {
      return ctx.text(value);
    }
    if (typeof value === 'number' || typeof value === 'boolean') {
      return ctx.text(String(value));
    }
    if (typeof value === 'object') {
      return ctx.json(value);
    }
    return ctx.text(String(value), 500);
  }

  #errorResponse(error: HttpError): Response {
    const development = this.#options.development === true;
    const isServerError = error.status >= 500;
    if (isServerError && development) {
      console.error(error, error.cause);
    }
    const message =
      isServerError && !development ? 'Internal Server Error' : error.message;
    return new Response(
      JSON.stringify({ error: message, status: error.status }),
      {
        status: error.status,
        headers: { 'Content-Type': JSON_TYPE },
      }
    );
  }
}

/** 创建 BackOne 服务端应用 */
export function createServer(options: AppOptions = {}): BackOneServer {
  return new BackOneServer(options);
}
