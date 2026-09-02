import { ComponentNode, SlotProvider } from './vnode';
export { ElementRenderStrategy } from './renderer/element-strategy';
export type { ComponentInstance, RenderRuntimeContext, RenderStrategy, Renderable, RendererHost, } from './renderer/types';
import type { RenderRuntimeContext, RenderStrategy, Renderable } from './renderer/types';
export declare class RendererContext {
    private readonly strategies;
    constructor();
    mount(vnode: Renderable, context: RenderRuntimeContext): Node;
    patch(oldVNode: Renderable, newVNode: Renderable, currentNode: Node, context: RenderRuntimeContext): Node;
    unmount(vnode: Renderable, currentNode: Node, context: RenderRuntimeContext): void;
    private findStrategy;
}
export declare class TextRenderStrategy implements RenderStrategy<string> {
    matches(vnode: Renderable): vnode is string;
    mount(vnode: string, context: RenderRuntimeContext): Node;
    patch(oldVNode: string, newVNode: string, currentNode: Node, context: RenderRuntimeContext): Node;
    unmount(): void;
}
export declare class ComponentRenderStrategy implements RenderStrategy<ComponentNode> {
    private readonly instances;
    private readonly instanceNodes;
    private readonly emitterUnsubscribers;
    matches(vnode: Renderable): vnode is ComponentNode;
    mount(vnode: ComponentNode, context: RenderRuntimeContext): Node;
    patch(oldVNode: ComponentNode, newVNode: ComponentNode, currentNode: Node, context: RenderRuntimeContext): Node;
    unmount(_vnode: ComponentNode, currentNode: Node, context: RenderRuntimeContext): void;
    private createProps;
    private syncEmitters;
    private clearEmitters;
    private trackInstanceNode;
    private clearInstanceNodes;
}
export declare class SlotRenderStrategy implements RenderStrategy<SlotProvider> {
    private readonly renderedChildren;
    matches(vnode: Renderable): vnode is SlotProvider;
    mount(vnode: SlotProvider, context: RenderRuntimeContext): Node;
    patch(oldVNode: SlotProvider, newVNode: SlotProvider, currentNode: Node, context: RenderRuntimeContext): Node;
    unmount(_vnode: SlotProvider, currentNode: Node, context: RenderRuntimeContext): void;
    private resolveChildren;
    private replaceSlotChildren;
    private mountSlotChildren;
    private unmountSlotChildren;
}
