import { AnyComponentConstructor, Component } from '../core/component';
import { OneApp } from '../core/app';
import type { VNode } from '../core/vnode';
export { useRouter } from './instance';
export type RouteMeta = Record<string, unknown>;
export interface RouteRecord {
    path: string;
    component: AnyComponentConstructor;
    name?: string;
    meta?: RouteMeta;
}
export interface RouterOptions {
    routes: RouteRecord[];
    mode?: 'history' | 'hash';
    base?: string;
}
export interface RouteLocation {
    path: string;
    query: Record<string, string>;
    params: Record<string, string>;
    fullPath: string;
    name?: string;
    meta?: RouteMeta;
}
export type RouteChangeListener = (to: RouteLocation, from: RouteLocation | null) => void;
export declare class Router {
    protected currentRoute: RouteRecord | null;
    protected currentLocation: RouteLocation | null;
    private readonly routes;
    private app;
    private readonly mode;
    private readonly base;
    private readonly routeChangeListeners;
    private removeWindowListener?;
    constructor(options: RouterOptions | RouteRecord[]);
    install(app: OneApp): void;
    push(path: string): void;
    replace(path: string): void;
    forward(): void;
    back(): void;
    go(delta: number): void;
    getCurrentRoute(): RouteLocation | null;
    getCurrentRouteRecord(): RouteRecord | null;
    onRouteChange(listener: RouteChangeListener): () => void;
    getRoutes(): RouteRecord[];
    addRoute(route: RouteRecord): void;
    createHref(path: string): string;
    destroy(): void;
    private navigate;
    private validateRoutes;
    private initEvents;
    private handleRouteChange;
    private resolveCurrentRoute;
    private getCurrentLocation;
    private isSameLocation;
    private triggerRouteChangeListeners;
}
export interface RouterLinkProps {
    to: string;
    replace?: boolean;
    className?: string;
    activeClass?: string;
    children?: Array<VNode | string>;
}
interface RouterLinkState {
    currentPath: string;
}
export declare class RouterLink extends Component<RouterLinkProps, RouterLinkState> {
    private unsubscribe?;
    protected initState(): RouterLinkState;
    protected initStyles(): void;
    protected onMounted(): void;
    protected onUnmounted(): void;
    protected render(): VNode;
}
interface RouterViewState {
    route: RouteLocation | null;
    record: RouteRecord | null;
}
export declare class RouterView extends Component<object, RouterViewState> {
    private unsubscribe?;
    protected initState(): RouterViewState;
    protected initStyles(): void;
    protected onMounted(): void;
    protected onUnmounted(): void;
    protected render(): VNode;
}
export declare function createRouter(options: RouterOptions | RouteRecord[]): Router;
