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
  private readonly updateEffect: ReactiveEffect;
  private appContext: unknown = null;

  protected styleManager: StyleManager;
  public state: TState;
  public mounted = false;

  constructor(protected props: TProps = {} as TProps) {
    this.styleManager = new StyleManager();
    this.state = reactive(this.initState() ?? {});
    this.templateEngine = new TemplateEngine(this.state);
    this.initStyles();

    this.updateEffect = effect(() => {
      this.trackStateProperties();
      if (this.mounted) {
        this.update();
      }
    });
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

    try {
      this.beforeUpdate();
      const newVNode = this.render();
      this.el = this.renderer.patch(
        this.vnode,
        newVNode,
        this.el,
        this.createRenderContext()
      );
      this.vnode = newVNode;
      this.onUpdated();
    } catch (error) {
      console.error('组件更新错误:', error);
    }
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
    this.templateEngine.clearBindings();
    this.styleManager.clearStyles();
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

  public on(eventName: string, listener: ComponentEventListener): void {
    if (!this.eventListeners[eventName]) {
      this.eventListeners[eventName] = new Set();
    }
    this.eventListeners[eventName].add(listener);
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
        component.setAppContext?.(this.appContext);
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
