import type { RouteRecord } from './index';
export interface RouteMatch {
    route: RouteRecord;
    params: Record<string, string>;
}
export declare function normalizePath(path: string): string;
export declare function matchRoute(routes: RouteRecord[], path: string): RouteMatch | null;
