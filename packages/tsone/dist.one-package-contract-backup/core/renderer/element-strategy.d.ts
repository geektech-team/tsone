import { HTMLNode } from '../vnode';
import type { RenderRuntimeContext, RenderStrategy, Renderable } from './types';
export declare class ElementRenderStrategy<TNode extends HTMLNode = HTMLNode> implements RenderStrategy<TNode> {
    private readonly listeners;
    private readonly effects;
    private readonly modelBindings;
    matches(vnode: Renderable): vnode is TNode;
    mount(vnode: TNode, context: RenderRuntimeContext): Node;
    patch(oldVNode: TNode, newVNode: TNode, currentNode: Node, context: RenderRuntimeContext): Node;
    unmount(vnode: TNode, currentNode: Node, context: RenderRuntimeContext): void;
    protected mountChildren(element: HTMLElement, vnode: TNode, context: RenderRuntimeContext): void;
    protected updateChildren(element: HTMLElement, oldVNode: TNode, newVNode: TNode, context: RenderRuntimeContext): void;
    protected unmountChildren(element: HTMLElement, vnode: TNode, context: RenderRuntimeContext): void;
    private applyProps;
    private applyDirections;
    private updateOrdinaryChildren;
    private updateKeyedChildren;
    private hasOnlyKeyedChildren;
    private assertNoDuplicateKeys;
    private getVNodeKey;
    private collectListeners;
    private updateListeners;
    private setupReactiveAttribute;
    private trackEffect;
}
