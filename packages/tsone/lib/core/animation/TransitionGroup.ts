import { Component } from '../component';
import {
  validateTransitionGroupChildren,
  type TransitionGroupNode,
  type TransitionGroupProps,
} from './types';

export class TransitionGroup extends Component<TransitionGroupProps> {
  protected initState(): object {
    return {};
  }

  protected initStyles(): void {}

  protected render(): TransitionGroupNode {
    const children = validateTransitionGroupChildren(
      this.props.children ?? []
    );

    return {
      tag: this.props.tag ?? 'div',
      props: this.props.elementProps,
      listeners: this.props.listeners,
      children,
      transitionGroup: {
        type: this.props.type ?? 'fade',
        duration: this.props.duration ?? 300,
      },
    };
  }
}
