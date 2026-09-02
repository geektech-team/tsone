import { Component, type VNode } from '@geektech/tsone';
import {
  OneCheckbox,
  OneCheckboxGroup,
  type OneFieldValueEvent,
  type OneSelectOption,
} from '../../../lib';
import { pick } from './locale';

interface CheckboxDemoState {
  agreed: boolean;
  topics: string[];
}

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
          props: {
            checked: this.state.agreed,
            ariaLabel: pick('同意协议', 'Agree to terms'),
          },
          emitters: { change: this.handleAgreement },
          children: [pick('同意协议', 'Agree to terms')],
        },
        {
          tag: 'output',
          props: { 'data-one-checkbox-value': '' },
          children: [
            pick(
              `已同意：${String(this.state.agreed)}`,
              `Agreed: ${String(this.state.agreed)}`
            ),
          ],
        },
        {
          component: OneCheckboxGroup,
          props: {
            options: this.topicOptions(),
            value: this.state.topics,
            ariaLabel: pick('关注主题', 'Topics'),
          },
          emitters: { change: this.handleTopics },
        },
        {
          tag: 'output',
          props: { 'data-one-checkbox-group-value': '' },
          children: [
            this.state.topics.join(', ') || pick('尚未选择', 'Not selected'),
          ],
        },
      ],
    };
  }

  private topicOptions(): readonly OneSelectOption[] {
    return [
      { value: 'design', label: pick('设计', 'Design') },
      { value: 'engineering', label: pick('工程', 'Engineering') },
      {
        value: 'disabled',
        label: pick('暂不可选', 'Unavailable'),
        disabled: true,
      },
    ];
  }
}
