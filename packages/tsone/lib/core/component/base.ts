import { StyleManager } from '../../style/StyleManager';
import { ReactiveEffect, effect, reactive, stop } from '../reactive';
import {
  ComponentInstance,
  RenderRuntimeContext,
  RendererContext,
} from '../renderer';
import { TemplateEngine } from '../template';
import type { VNode } from '../vnode';

export type ComponentProps = object;

export type ComponentState = object;

export type ComponentEventListener = (...args: unknown[]) => void;

export type InjectionKey<T> = (string | symbol) & {
  readonly __injectionType?: T;
};

export interface InjectionResult<T> {
  found: boolean;
  value: T | undefined;
}

export type ComponentConstructor<
  TProps extends ComponentProps = ComponentProps,
  TState extends ComponentState = ComponentState,
> = new (props?: TProps) => Component<TProps, TState>;

export type AnyComponentConstructor = new (
  props?: never
) => Component<ComponentProps, ComponentState>;

export abstract class Component<
  TProps extends ComponentProps = ComponentProps,
  TState extends ComponentState = ComponentState,
> implements ComponentInstance
{
  private vnode: VNode | null = null;
  private el: Node | null = null;
  private readonly renderer = new RendererContext();
  private readonly templateEngine: TemplateEngine;
  private readonly childComponents = new Set<ComponentInstance>();
  private readonly eventListeners: Record<string, Set<ComponentEventListener>> =
    {};
  private readonly providers = new Map<string | symbol, unknown>();
  private readonly updateEffect: ReactiveEffect;
  private appContext: unknown = null;
  private parentComponent: ComponentInstance | null = null;
  private elementChangeListener:
    | ((previousElement: Node, nextElement: Node) => void)
    | null = null;

  protected styleManager: StyleManager;
  public state: TState;
  public mounted = false;

  constructor(protected props: TProps = {} as TProps) {
    this.styleManager = new StyleManager();
    this.state = reactive(this.initState() ?? {});
    this.templateEngine = new TemplateEngine(this.state);
    this.initStyles();

    this.updateEffect = effect(
      () => {
        this.trackStateProperties();
        if (this.mounted) {
          this.update();
        }
      },
      { throwOnError: true }
    );
  }

  protected abstract initState(): TState;
  protected abstract initStyles(): void;
  protected abstract render(): VNode;

  public mount(container: HTMLElement): void {
    if (!container || !(container instanceof HTMLElement)) {
      throw new Error('Invalid container element');
    }

    try {
      container.appendChild(this.mountToNode());
    } catch (error) {
      console.error('组件渲染错误:', error);
      throw error;
    }
  }

  public mountToNode(): Node {
    if (this.mounted && this.el) {
      return this.el;
    }

    this.beforeMount();
    this.vnode = this.render();
    this.el = this.renderer.mount(this.vnode, this.createRenderContext());
    this.mounted = true;
    this.onMounted();
    return this.el;
  }

  public update(): void {
    if (!this.el || !this.vnode) {
      return;
    }

    this.beforeUpdate();
    const newVNode = this.render();
    const previousElement = this.el;
    this.el = this.renderer.patch(
      this.vnode,
      newVNode,
      this.el,
      this.createRenderContext()
    );
    if (previousElement !== this.el) {
      this.elementChangeListener?.(previousElement, this.el);
    }
    this.vnode = newVNode;
    this.onUpdated();
  }

  public unmount(): void {
    if (!this.mounted) {
      return;
    }

    this.beforeUnmount();

    if (this.vnode && this.el) {
      this.renderer.unmount(this.vnode, this.el, this.createRenderContext());
    }

    this.childComponents.clear();
    Object.keys(this.eventListeners).forEach((eventName) => {
      this.eventListeners[eventName].clear();
      delete this.eventListeners[eventName];
    });
    this.providers.clear();
    this.parentComponent = null;
    this.elementChangeListener = null;
    this.templateEngine.clearBindings();
    this.styleManager.destroy();
    stop(this.updateEffect);

    if (this.el?.parentNode) {
      this.el.parentNode.removeChild(this.el);
    }

    this.el = null;
    this.vnode = null;
    this.mounted = false;
    this.onUnmounted();
  }

  public setProps(props: Partial<TProps>): void {
    this.props = {
      ...this.props,
      ...props,
    };

    if (this.mounted) {
      this.update();
    }
  }

  public setState(state: Partial<TState>): void {
    Object.assign(this.state, state);
  }

  public setAppContext(context: unknown): void {
    this.appContext = context;
    this.childComponents.forEach((child) => {
      child.setAppContext?.(context);
    });
  }

  public setParentComponent(parent: ComponentInstance | null): void {
    this.parentComponent = parent;
  }

  public setElementChangeListener(
    listener: (previousElement: Node, nextElement: Node) => void
  ): void {
    this.elementChangeListener = listener;
  }

  public provide<T>(key: InjectionKey<T>, value: T): void {
    this.providers.set(key, value);
  }

  public inject<T>(key: InjectionKey<T>): T | undefined;
  public inject<T>(key: InjectionKey<T>, fallback: T): T;
  public inject<T>(key: InjectionKey<T>, fallback?: T): T | undefined {
    const result = this.resolveInjection(key);
    return result.found ? result.value : fallback;
  }

  public resolveInjection<T>(key: InjectionKey<T>): InjectionResult<T> {
    if (this.providers.has(key)) {
      return { found: true, value: this.providers.get(key) as T | undefined };
    }

    if (this.parentComponent?.resolveInjection) {
      return this.parentComponent.resolveInjection(key);
    }

    return this.resolveAppInjection(key);
  }

  public getElement(): Node | null {
    return this.el;
  }

  protected beforeMount(): void {}

  protected onMounted(): void {}

  protected beforeUpdate(): void {}

  protected onUpdated(): void {}

  protected beforeUnmount(): void {}

  protected onUnmounted(): void {}

  protected getContext(): unknown {
    return this.appContext;
  }

  protected get router() {
    return this.getRouterFrom(this.appContext) ?? this.getRouterFromGlobalApp();
  }

  protected emit(eventName: string, ...args: unknown[]): void {
    this.eventListeners[eventName]?.forEach((listener) => {
      listener(...args);
    });
  }

  public on(eventName: string, listener: ComponentEventListener): () => void {
    if (!this.eventListeners[eventName]) {
      this.eventListeners[eventName] = new Set();
    }
    this.eventListeners[eventName].add(listener);

    return () => this.off(eventName, listener);
  }

  public off(eventName: string, listener: ComponentEventListener): void {
    this.eventListeners[eventName]?.delete(listener);
  }

  private createRenderContext(): RenderRuntimeContext {
    return {
      appContext: this.appContext,
      templateEngine: this.templateEngine,
      renderer: this.renderer,
      slots: this.collectSlots(),
      registerChild: (component) => {
        this.childComponents.add(component);
        component.setParentComponent?.(this);
        component.setAppContext?.(this.appContext);
      },
      unregisterChild: (component) => {
        this.childComponents.delete(component);
        component.setParentComponent?.(null);
      },
    };
  }

  private collectSlots(): Record<string, Array<VNode | string>> {
    const slots: Record<string, Array<VNode | string>> = { default: [] };
    const children =
      (this.props as { children?: Array<VNode | string> }).children ?? [];

    children.forEach((child) => {
      const slotName = this.getSlotName(child);
      if (!slots[slotName]) {
        slots[slotName] = [];
      }
      slots[slotName].push(this.normalizeSlotChild(child));
    });

    return slots;
  }

  private getSlotName(child: VNode | string): string {
    if (typeof child === 'string') {
      return 'default';
    }

    return 'slot' in child && typeof child.slot === 'string'
      ? child.slot
      : 'default';
  }

  private normalizeSlotChild(child: VNode | string): VNode | string {
    if (typeof child === 'string' || !('slot' in child)) {
      return child;
    }

    const clone = { ...child };
    delete clone.slot;
    return clone as VNode;
  }

  private trackStateProperties(): void {
    this.trackReactiveValue(this.state, new Set<object>());
  }

  private getRouterFrom(value: unknown): unknown {
    if (!value || typeof value !== 'object' || !('router' in value)) {
      return undefined;
    }

    return (value as { router?: unknown }).router;
  }

  private getRouterFromGlobalApp(): unknown {
    const globalApp = (globalThis as { __APP__?: unknown }).__APP__;
    return this.getRouterFrom(globalApp);
  }

  private resolveAppInjection<T>(key: InjectionKey<T>): InjectionResult<T> {
    if (!this.appContext || typeof this.appContext !== 'object') {
      return { found: false, value: undefined };
    }

    const app = (
      this.appContext as {
        app?: {
          resolveInjection?: (
            injectionKey: InjectionKey<T>
          ) => InjectionResult<T>;
        };
      }
    ).app;

    return app?.resolveInjection?.(key) ?? { found: false, value: undefined };
  }

  private trackReactiveValue(value: unknown, seen: Set<object>): void {
    if (!value || typeof value !== 'object' || seen.has(value)) {
      return;
    }

    seen.add(value);

    if (Array.isArray(value)) {
      value.length;
    }

    Object.keys(value).forEach((key) => {
      const child = (value as Record<string, unknown>)[key];
      this.trackReactiveValue(child, seen);
    });
  }
}
