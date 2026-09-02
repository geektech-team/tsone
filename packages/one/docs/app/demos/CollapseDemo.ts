import { Component, type VNode } from '@geektech/tsone';
import { OneCollapse, type OneCollapseChangeEvent } from '../../../lib';
import { pick } from './locale';

interface CollapseDemoState {
  active: string[];
}

export class CollapseDemo extends Component<
  Record<string, never>,
  CollapseDemoState
> {
  private readonly handleChange = (payload: unknown): void => {
    const event = payload as OneCollapseChangeEvent;
    this.setState({ active: event.value });
  };

  protected initState(): CollapseDemoState {
    return { active: ['design'] };
  }

  protected initStyles(): void {}

  protected render(): VNode {
    return {
      tag: 'div',
      props: { className: 'one-docs-collapse-demo' },
      children: [
        {
          component: OneCollapse,
          props: {
            accordion: true,
            defaultActive: ['basic'],
            items: [
              {
                value: 'basic',
                title: pick('基础用法', 'Basic usage'),
                children: [pick('使用 accordion 模式，一次只能展开一项。', 'With accordion mode only one panel opens at a time.')],
              },
              {
                value: 'controlled',
                title: pick('受控面板', 'Controlled panel'),
                children: [pick('由外部状态控制展开项。', 'Expanded panels are driven by external state.')],
              },
            ],
          },
        },
        {
          component: OneCollapse,
          props: {
            active: this.state.active,
            items: [
              {
                value: 'design',
                title: pick('设计', 'Design'),
                children: [pick('负责视觉与交互规范。', 'Owns visual and interaction guidelines.')],
              },
              {
                value: 'engineering',
                title: pick('工程', 'Engineering'),
                children: [pick('负责框架与构建链路。', 'Owns the framework and build pipeline.')],
              },
              {
                value: 'quality',
                title: pick('质量', 'Quality'),
                disabled: true,
                children: [pick('该面板已禁用。', 'This panel is disabled.')],
              },
            ],
          },
          emitters: { change: this.handleChange },
        },
        {
          tag: 'output',
          props: { 'data-one-collapse-result': '' },
          children: [
            pick(
              `展开：${this.state.active.join('、') || '无'}`,
              `Active: ${this.state.active.join(', ') || 'none'}`
            ),
          ],
        },
      ],
    };
  }
}
