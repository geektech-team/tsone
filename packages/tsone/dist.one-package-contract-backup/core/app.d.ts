import { ComponentConstructor, ComponentProps, InjectionKey, InjectionResult } from './component';
import { type HtmlDocumentBody, type HtmlDocumentOptions } from './document';
import type { Router } from '../router';
export interface Plugin {
    install: (app: OneApp, ...args: unknown[]) => void;
    onMounted?: (app: OneApp) => void;
    onUpdated?: (app: OneApp) => void;
    onBeforeUnmount?: (app: OneApp) => void;
}
export type AppDocumentOptions = Partial<Omit<HtmlDocumentOptions, 'body'>> & {
    body?: HtmlDocumentBody;
};
export type AppDocumentRenderOptions = AppDocumentOptions;
export interface AppOptions<TState = Record<string, unknown>, TConfig = Record<string, unknown>, TRootProps extends ComponentProps = ComponentProps> {
    /** 根组件构造函数 */
    root?: ComponentConstructor<TRootProps>;
    /** 根组件 props */
    rootProps?: TRootProps;
    /** 应用挂载点，默认 #app */
    rootElement?: string | Element;
    /** 全局状态 */
    state?: TState;
    /** 全局配置 */
    config?: TConfig;
    /** HTML 文档壳配置，用于 dev/build 生成入口页面 */
    document?: AppDocumentOptions;
}
export interface AppContext<TConfig = Record<string, unknown>> {
    app: OneApp;
    version: string;
    config: TConfig;
    router?: Router;
}
export declare class OneApp<TState extends object = Record<string, unknown>, TConfig extends object = Record<string, unknown>, TRootProps extends ComponentProps = ComponentProps> {
    private options;
    private container;
    private rootInstance;
    private mounted;
    private templateEngine;
    private readonly appContext;
    private readonly providers;
    private plugins;
    private unmountedCallback?;
    router?: Router;
    constructor(options?: AppOptions<TState, TConfig, TRootProps>);
    private handleError;
    /**
     * 渲染错误UI
     */
    private renderErrorUI;
    /**
     * 使用插件
     */
    use(plugin: Plugin, ...args: unknown[]): this;
    /**
     * 挂载应用
     */
    mount(): void;
    /**
     * 卸载应用
     */
    unmount(): void;
    /**
     * 应用是否正在运行
     */
    isRunning(): boolean;
    /**
     * 更新根组件
     */
    updateRootComponent(component: ComponentConstructor<TRootProps>): void;
    /**
     * 更新应用状态
     */
    update(state?: Partial<TState>): this;
    /**
     * 获取应用上下文
     */
    getContext(): AppContext<TConfig>;
    provide<T>(key: InjectionKey<T>, value: T): this;
    inject<T>(key: InjectionKey<T>): T | undefined;
    inject<T>(key: InjectionKey<T>, fallback: T): T;
    resolveInjection<T>(key: InjectionKey<T>): InjectionResult<T>;
    /**
     * 获取应用状态
     */
    getState(): TState | undefined;
    /**
     * 设置应用状态
     */
    setState(newState: TState): this;
    /**
     * 监听应用卸载
     */
    onUnmounted(callback: () => void): this;
    /**
     * 生成应用入口 HTML 文档
     */
    renderHtmlDocument(options?: AppDocumentRenderOptions): string;
    /**
     * 解析根元素
     */
    private resolveRootElement;
    private resolveMountContainer;
    private createMountDocumentBody;
    private createMountElementFromSelector;
    private mergeDocumentScripts;
    private onMounted;
    private onUpdated;
    private onBeforeUnmount;
}
/**
 * 创建应用实例
 */
export declare function createApp<TState extends object = Record<string, unknown>, TConfig extends object = Record<string, unknown>, TRootProps extends ComponentProps = ComponentProps>(options?: AppOptions<TState, TConfig, TRootProps>): OneApp<TState, TConfig, TRootProps>;
