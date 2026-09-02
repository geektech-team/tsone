import { Router } from './index';
/**
 * 设置全局路由实例
 * @param r 路由实例
 */
export declare function setRouter(r: Router): void;
/**
 * 获取路由实例
 * @returns 路由实例
 * @throws 当路由未初始化时抛出错误
 */
export declare function useRouter(): Router;
/**
 * 安全地获取路由实例，如果未初始化则返回null
 * @returns 路由实例或null
 */
export declare function getRouter(): Router | null;
/**
 * 检查路由是否已初始化
 * @returns 是否已初始化
 */
export declare function hasRouter(): boolean;
/**
 * 重置路由实例（主要用于测试）
 */
export declare function resetRouter(): void;
