import { ElementRenderStrategy } from '../renderer/element-strategy';
import type { RenderRuntimeContext, Renderable } from '../renderer/types';
import { type TransitionGroupNode } from './types';
export declare class TransitionGroupRenderStrategy extends ElementRenderStrategy<TransitionGroupNode> {
    private readonly entries;
    private readonly animations;
    matches(vnode: Renderable): vnode is TransitionGroupNode;
    protected mountChildren(element: HTMLElement, groupVNode: TransitionGroupNode, context: RenderRuntimeContext): void;
    protected updateChildren(element: HTMLElement, _oldVNode: TransitionGroupNode, newVNode: TransitionGroupNode, context: RenderRuntimeContext): void;
    protected unmountChildren(element: HTMLElement, vnode: TransitionGroupNode, context: RenderRuntimeContext): void;
    private playEnter;
    private startExit;
    private finishExit;
    private placeActiveEntries;
}
