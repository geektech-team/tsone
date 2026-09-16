import { Component, type VNode } from '@geektech/tsone';
import {
  OneMenu,
  type OneMenuOpenChangeEvent,
  type OneMenuSelectEvent,
} from '../../../lib';
import { pick } from './locale';

interface MenuDemoState {
  selected: string;
  open: string[];
}

const ITEMS = [
  { value: 'overview', label: pick('概览', 'Overview') },
  {
    value: 'city',
    label: pick('城市', 'City'),
    children: [
      { value: 'ranking', label: pick('排行榜', 'Ranking') },
      { value: 'compare', label: pick('对比', 'Compare') },
    ],
  },
  {
    value: 'data',
    label: pick('数据', 'Data'),
    children: [
      { value: 'chart', label: pick('图表', 'Charts') },
      { value: 'export', label: pick('导出', 'Export') },
    ],
  },
  { value: 'settings', label: pick('设置', 'Settings') },
];

export class MenuDemo extends Component<Record<string, never>, MenuDemoState> {
  private readonly handleSelect = (payload: unknown): void => {
    const event = payload as OneMenuSelectEvent;
    this.setState({ selected: event.value });
  };

  private readonly handleOpenChange = (payload: unknown): void => {
    const event = payload as OneMenuOpenChangeEvent;
    this.setState({ open: event.value });
  };

  protected initState(): MenuDemoState {
    return {
      selected: 'ranking',
      open: ['city'],
    };
  }

  protected initStyles(): void {}

  protected render(): VNode {
    return {
      tag: 'div',
      props: { className: 'one-docs-menu-demo' },
      children: [
        {
          component: OneMenu,
          props: {
            items: ITEMS,
            value: this.state.selected,
            open: this.state.open,
            ariaLabel: pick('示例菜单', 'Example menu'),
          },
          emitters: {
            select: this.handleSelect,
            openChange: this.handleOpenChange,
          },
        },
        {
          tag: 'output',
          props: { 'data-one-menu-result': '' },
          children: [
            pick(
              `已选择：${this.state.selected}`,
              `Selected: ${this.state.selected}`
            ),
          ],
        },
      ],
    };
  }
}
