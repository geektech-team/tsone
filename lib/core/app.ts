import { Component, ComponentConstructor } from './component';
import type { Router } from '../router';

import { TemplateEngine } from './template';

// 插件接口定义
export interface Plugin {
  install: (app: FreeApp, ...args: unknown[]) => void;
  onMounted?: (app: FreeApp) => void;
  onUpdated?: (app: FreeApp) => void;
  onBeforeUnmount?: (app: FreeApp) => void;
}

// 泛型化AppOptions接口
export interface AppOptions<
  TState = Record<string, unknown>,
  TConfig = Record<string, unknown>,
> {
  /** 根组件构造函数 */
  root?: ComponentConstructor;
  /** 应用挂载点 */
  rootElement?: string | Element;
  /** 全局状态 */
  state?: TState;
  /** 全局配置 */
  config?: TConfig;
}

// 泛型化AppContext接口
export interface AppContext<TConfig = Record<string, unknown>> {
  app: FreeApp;
  version: string;
  config: TConfig;
  router?: Router;
}

// 泛型化FreeApp类
export class FreeApp<
  TState extends object = Record<string, unknown>,
  TConfig extends object = Record<string, unknown>,
> {
  private container: HTMLElement;
  private rootInstance: Component | null = null;
  private mounted: boolean = false;
  private templateEngine: TemplateEngine | null = null;
  private readonly appContext: AppContext<TConfig>;
  private plugins: Array<{ plugin: Plugin; args: unknown[] }> = [];
  private unmountedCallback?: () => void;
  public router?: Router;

  constructor(private options: AppOptions<TState, TConfig> = {}) {
    // 默认使用 body 作为容器
    this.container = document.body;

    this.appContext = {
      app: this as unknown as FreeApp,
      version: '1.0.0',
      config: options.config || ({} as TConfig),
    };
  }

  private handleError(error: Error): void {
    console.error('应用错误:', error);
    // 渲染错误UI
    this.renderErrorUI(error);
    // 不立即卸载应用，而是显示错误信息
  }

  /**
   * 渲染错误UI
   */
  private renderErrorUI(error: Error): void {
    this.container.innerHTML = `
      <div style="padding: 20px; background-color: #ffebee; color: #c62828; font-family: Arial, sans-serif;">
        <h3>应用错误</h3>
        <p>${error.message}</p>
        <pre style="background-color: #fff; padding: 10px; border-radius: 4px; overflow: auto;">${error.stack}</pre>
      </div>
    `;
  }

  /**
   * 使用插件
   */
  public use(plugin: Plugin, ...args: unknown[]): this {
    if (typeof plugin.install !== 'function') {
      throw new Error('插件必须提供 install 方法');
    }
    plugin.install(this as unknown as FreeApp, ...args);
    this.plugins.push({ plugin, args });
    return this;
  }

  /**
   * 挂载应用
   */
  public mount(): void {
    if (this.mounted) {
      console.warn('应用已经处于运行状态');
      return;
    }

    try {
      // 添加全局应用实例
      (globalThis as { __APP__?: unknown }).__APP__ = this;

      // 确定挂载点
      if (this.options.rootElement) {
        const rootElement = this.resolveRootElement(this.options.rootElement);
        if (rootElement) {
          this.container = rootElement as HTMLElement;
        } else {
          throw new Error(`无法找到挂载点: ${this.options.rootElement}`);
        }
      }

      // 只有在有根组件时才创建实例
      if (this.options.root) {
        this.rootInstance = new this.options.root();

        // 设置应用上下文
        if ('setAppContext' in this.rootInstance) {
          this.rootInstance.setAppContext(this.appContext);
        }

        // 如果有全局状态，传递给组件
        if (this.options.state && 'setState' in this.rootInstance) {
          this.rootInstance.setState(this.options.state);
        }

        this.rootInstance.mount(this.container);

        // 创建模板引擎实例
        this.templateEngine = new TemplateEngine(this.options.state || {});
      }

      this.mounted = true;

      // 触发生命周期钩子
      this.onMounted();
    } catch (error) {
      this.handleError(error as Error);
    }
  }

  /**
   * 卸载应用
   */
  public unmount(): void {
    if (!this.mounted) {
      console.warn('应用未处于运行状态');
      return;
    }

    try {
      // 触发卸载前钩子
      this.onBeforeUnmount();

      if (this.rootInstance) {
        // 调用组件卸载方法
        if ('unmount' in this.rootInstance) {
          this.rootInstance.unmount();
        }

        this.rootInstance = null;
        this.mounted = false;
        delete (globalThis as { __APP__?: unknown }).__APP__;
      }

      // 清除模板引擎
      if (this.templateEngine) {
        this.templateEngine.clearBindings();
        this.templateEngine = null;
      }

      // 清空容器
      this.container.innerHTML = '';

      // 触发卸载后钩子
      if (this.unmountedCallback) {
        this.unmountedCallback();
      }
    } catch (error) {
      console.error('Failed to unmount app:', error);
    }
  }

  /**
   * 应用是否正在运行
   */
  public isRunning(): boolean {
    return this.mounted;
  }

  /**
   * 更新根组件
   */
  public updateRootComponent(component: ComponentConstructor): void {
    if (this.mounted) {
      this.unmount();
    }
    this.options.root = component;
    this.mount();
  }

  /**
   * 更新应用状态
   */
  public update(state?: Partial<TState>): this {
    if (!this.mounted) {
      console.warn('Cannot update unmounted app');
      return this;
    }

    try {
      // 更新状态
      if (state && this.options.state) {
        this.options.state = { ...this.options.state, ...state };

        // 更新组件状态
        if (this.rootInstance && 'setState' in this.rootInstance) {
          this.rootInstance.setState(state);
        }

        // 更新模板引擎状态
        if (this.templateEngine) {
          // 如果存在templateEngine，更新其状态
          this.templateEngine.state = this.options.state;
        }
      }

      // 触发更新钩子
      this.onUpdated();
    } catch (error) {
      console.error('Failed to update app:', error);
    }

    return this;
  }

  /**
   * 获取应用上下文
   */
  public getContext(): AppContext<TConfig> {
    return this.appContext;
  }

  /**
   * 获取应用状态
   */
  public getState(): TState | undefined {
    return this.options.state;
  }

  /**
   * 设置应用状态
   */
  public setState(newState: TState): this {
    this.options.state = newState;
    if (this.mounted) {
      this.update();
    }
    return this;
  }

  /**
   * 监听应用卸载
   */
  public onUnmounted(callback: () => void): this {
    this.unmountedCallback = callback;
    return this;
  }

  /**
   * 解析根元素
   */
  private resolveRootElement(selector?: string | Element): Element | null {
    if (!selector) {
      return null;
    }

    if (typeof selector === 'string') {
      return document.querySelector(selector);
    }

    return selector instanceof Element ? selector : null;
  }

  // 生命周期钩子
  private onMounted(): void {
    // 触发插件的mounted钩子
    this.plugins.forEach(({ plugin: pluginObj }) => {
      if (pluginObj && typeof pluginObj.onMounted === 'function') {
        pluginObj.onMounted(this as unknown as FreeApp);
      }
    });
  }

  private onUpdated(): void {
    // 触发插件的updated钩子
    this.plugins.forEach(({ plugin: pluginObj }) => {
      if (pluginObj && typeof pluginObj.onUpdated === 'function') {
        pluginObj.onUpdated(this as unknown as FreeApp);
      }
    });
  }

  private onBeforeUnmount(): void {
    // 触发插件的beforeUnmount钩子
    this.plugins.forEach(({ plugin: pluginObj }) => {
      if (pluginObj && typeof pluginObj.onBeforeUnmount === 'function') {
        pluginObj.onBeforeUnmount(this as unknown as FreeApp);
      }
    });
  }
}

/**
 * 创建应用实例
 */
export function createApp<
  TState extends object = Record<string, unknown>,
  TConfig extends object = Record<string, unknown>,
>(options: AppOptions<TState, TConfig> = {}): FreeApp<TState, TConfig> {
  return new FreeApp<TState, TConfig>(options);
}
