import { OneApp, AppOptions } from './core/app';

// 导出核心功能
export * from './core';

// 导出路由功能
export * from './router';

// 创建应用实例的主函数
export function createApp(options: AppOptions = {}): OneApp {
  return new OneApp(options);
}

// 导出框架名称和版本
export const version = '0.0.1';
export const name = '@geektech/tsone';
