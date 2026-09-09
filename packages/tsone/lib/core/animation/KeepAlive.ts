import { Component } from '../component';
import { type VNode } from '../vnode';

export interface KeepAliveProps {
  /**
   * 当前活跃子组件的 key。切换 activeKey 时，其他子组件保持挂载
   * 但通过 display:none 隐藏，切换回来时状态与 DOM 均保留。
   */
  activeKey: string | number;
  tag?: string;
  children?: Array<VNode | string>;
}

/**
 * KeepAlive：缓存子组件。所有带 key 的子组件保持挂载（状态与 DOM 保留），
 * 仅活跃项可见。适用于 tab 切换、列表编辑等需要保留状态的场景。
 */
export class KeepAlive extends Component<KeepAliveProps> {
  protected initState(): object {
    return {};
  }

  protected initStyles(): void {}

  protected render(): VNode {
    const tag = this.props.tag ?? 'div';
    const activeKey = this.props.activeKey;
    const children = this.props.children ?? [];

    return {
      tag,
      props: { 'data-keep-alive': '' },
      children: children.map((child) => {
        if (typeof child === 'string' || child.key === undefined) {
          throw new Error('KeepAlive children must have unique keys');
        }
        return {
          tag: 'div',
          props: { class: 'keep-alive-item' },
          key: child.key,
          directions: { show: child.key === activeKey },
          children: [child],
        };
      }),
    };
  }
}
