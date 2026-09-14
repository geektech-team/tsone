import { Component, type VNode } from '@geektech/tsone';
import {
  OneTree,
  type OneTreeCheckEvent,
  type OneTreeSelectEvent,
} from '../../../lib';
import { pick } from './locale';

interface TreeDemoState {
  selected: string | null;
  checked: string[];
}

const DEMO_DATA = [
  {
    value: 'design',
    label: pick('设计', 'Design'),
    children: [
      { value: 'visual', label: pick('视觉', 'Visual') },
      { value: 'interaction', label: pick('交互', 'Interaction') },
    ],
  },
  {
    value: 'engineering',
    label: pick('工程', 'Engineering'),
    children: [
      { value: 'frontend', label: pick('前端', 'Frontend') },
      {
        value: 'quality',
        label: pick('质量', 'Quality'),
        disabled: true,
        children: [{ value: 'qa', label: 'QA' }],
      },
    ],
  },
];

export class TreeDemo extends Component<Record<string, never>, TreeDemoState> {
  private readonly handleSelect = (payload: unknown): void => {
    const event = payload as OneTreeSelectEvent;
    this.setState({ selected: event.value });
  };

  private readonly handleCheck = (payload: unknown): void => {
    const event = payload as OneTreeCheckEvent;
    this.setState({ checked: event.value });
  };

  protected initState(): TreeDemoState {
    return { selected: null, checked: [] };
  }

  protected initStyles(): void {}

  protected render(): VNode {
    return {
      tag: 'div',
      props: { className: 'one-docs-tree-demo' },
      children: [
        {
          component: OneTree,
          props: {
            defaultExpanded: ['design'],
            data: DEMO_DATA,
          },
        },
        {
          component: OneTree,
          props: {
            defaultExpanded: ['engineering'],
            selected: this.state.selected,
            data: DEMO_DATA,
          },
          emitters: { select: this.handleSelect },
        },
        {
          component: OneTree,
          props: {
            checkable: true,
            defaultExpanded: ['engineering'],
            checked: this.state.checked,
            data: DEMO_DATA,
          },
          emitters: { check: this.handleCheck },
        },
        {
          tag: 'output',
          props: { 'data-one-tree-result': '' },
          children: [
            pick(
              `选中：${this.state.selected ?? '无'}；勾选：${
                this.state.checked.join('、') || '无'
              }`,
              `Selected: ${this.state.selected ?? 'none'}; Checked: ${
                this.state.checked.join(', ') || 'none'
              }`
            ),
          ],
        },
      ],
    };
  }
}
