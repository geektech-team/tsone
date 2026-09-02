import { Component } from '../component';
import { type TransitionGroupNode, type TransitionGroupProps } from './types';
export declare class TransitionGroup extends Component<TransitionGroupProps> {
    protected initState(): object;
    protected initStyles(): void;
    protected render(): TransitionGroupNode;
}
