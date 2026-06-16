import { FreeApp, AppOptions } from './core/app';

// 导出核心功能
export * from './core';

// 导出路由功能
export * from './router';

// 创建应用实例的主函数
export function createApp(options: AppOptions = {}): FreeApp {
  return new FreeApp(options);
}

// 导出框架名称和版本
export const version = '1.0.0';
export const name = 'tsone';
