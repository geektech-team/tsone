import { Component, type VNode } from '@geektech/tsone';
import {
  OneCheckbox,
  OneCheckboxGroup,
  type OneFieldValueEvent,
} from '../../../lib';

interface CheckboxDemoState {
  agreed: boolean;
  topics: string[];
}

const topicOptions = [
  { value: 'design', label: '设计' },
  { value: 'engineering', label: '工程' },
  { value: 'disabled', label: '暂不可选', disabled: true },
] as const;

export class CheckboxDemo extends Component<
  Record<string, never>,
  CheckboxDemoState
> {
  private readonly handleAgreement = (payload: unknown): void => {
    const event = payload as OneFieldValueEvent<boolean>;
    this.setState({ agreed: event.value });
  };

  private readonly handleTopics = (payload: unknown): void => {
    const event = payload as OneFieldValueEvent<string[]>;
    this.setState({ topics: event.value });
  };

  protected initState(): CheckboxDemoState {
    return { agreed: false, topics: [] };
  }

  protected initStyles(): void {}

  protected render(): VNode {
    return {
      tag: 'div',
      props: { className: 'one-docs-checkbox-demo' },
      children: [
        {
          component: OneCheckbox,
          props: { checked: this.state.agreed, ariaLabel: '同意协议' },
          emitters: { change: this.handleAgreement },
          children: ['同意协议'],
        },
        {
          tag: 'output',
          props: { 'data-one-checkbox-value': '' },
          children: [`已同意：${String(this.state.agreed)}`],
        },
        {
          component: OneCheckboxGroup,
          props: {
            options: topicOptions,
            value: this.state.topics,
            ariaLabel: '关注主题',
          },
          emitters: { change: this.handleTopics },
        },
        {
          tag: 'output',
          props: { 'data-one-checkbox-group-value': '' },
          children: [this.state.topics.join(', ') || '尚未选择'],
        },
      ],
    };
  }
}
