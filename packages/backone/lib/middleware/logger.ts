/** 请求日志中间件：输出 method path status 耗时 */

import type { Handler } from '../types';

export interface LoggerOptions {
  /** 自定义输出函数，默认 console.log */
  out?: (line: string) => void;
}

export function logger(options: LoggerOptions = {}): Handler {
  const out = options.out ?? ((line: string) => console.log(line));

  return async (ctx, next) => {
    const start = performance.now();
    const result = await next();
    const status = result instanceof Response ? result.status : ctx.status;
    const elapsed = (performance.now() - start).toFixed(2);
    out(`${ctx.method} ${ctx.pathname} ${status} ${elapsed}ms`);
    return result;
  };
}
