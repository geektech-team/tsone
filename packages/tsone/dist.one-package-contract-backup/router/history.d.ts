import type { RouteLocation, RouterOptions } from './index';
export type RouterMode = NonNullable<RouterOptions['mode']>;
export declare function createRouterHref(path: string, mode: RouterMode, base: string): string;
export declare function getBrowserLocation(mode: RouterMode, base: string): RouteLocation;
export declare function navigateBrowser(path: string, replace: boolean, mode: RouterMode, base: string): void;
