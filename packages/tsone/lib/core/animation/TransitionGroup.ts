import { Component } from '../component';
import {
  normalizeTransitionGroupProps,
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
    const { tag, type, duration } = normalizeTransitionGroupProps(this.props);
    const children = validateTransitionGroupChildren(this.props.children ?? []);

    return {
      tag,
      props: this.props.elementProps,
      listeners: this.props.listeners,
      children,
      transitionGroup: {
        type,
        duration,
      },
    };
  }
}
