import { Component, type VNode } from '@geektech/tsone';
import {
  OneButton,
  OneForm,
  OneFormItem,
  OneInput,
  OneSelect,
  OneSwitch,
  type OneFormSubmitEvent,
  type OneSelectOption,
  type OneSelectOptionGroup,
} from '../../../lib';
import { pick } from './locale';

export class FormDemo extends Component<Record<string, never>> {
  private readonly handleSubmit = (payload: unknown): void => {
    const event = payload as OneFormSubmitEvent;
    const element = this.getElement();
    if (!(element instanceof HTMLElement)) {
      return;
    }
    const output = element.querySelector<HTMLOutputElement>(
      '[data-one-form-result]'
    );
    if (output) {
      output.textContent = JSON.stringify(event.values);
    }
  };

  protected initState(): object {
    return {};
  }

  protected initStyles(): void {}

  protected render(): VNode {
    return {
      tag: 'div',
      props: { className: 'one-docs-form-demo' },
      children: [
        {
          component: OneForm,
          props: {
            initialValues: { project: '', tags: [], enabled: false },
            rules: {
              project: [
                {
                  required: true,
                  message: pick('请输入项目名称', 'Please enter a project name'),
                },
                {
                  minLength: 3,
                  message: pick(
                    '项目名称至少 3 个字符',
                    'Project name must be at least 3 characters'
                  ),
                },
                {
                  pattern: /^[a-z-]+$/,
                  message: pick(
                    '项目名称仅支持小写字母和连字符',
                    'Project name only supports lowercase letters and hyphens'
                  ),
                },
              ],
            },
          },
          emitters: { submit: this.handleSubmit },
          children: [
            {
              component: OneFormItem,
              props: {
                name: 'project',
                label: pick('项目名称', 'Project name'),
                description: pick('例如 one-ui', 'e.g. one-ui'),
              },
              children: [
                {
                  component: OneInput,
                  props: {
                    ariaLabel: pick('项目名称', 'Project name'),
                    placeholder: 'one-ui',
                  },
                },
              ],
            },
            {
              component: OneFormItem,
              props: { name: 'tags', label: pick('标签', 'Tags') },
              children: [
                {
                  component: OneSelect,
                  props: {
                    options: this.tagOptions(),
                    multiple: true,
                    searchable: true,
                    ariaLabel: pick('标签', 'Tags'),
                    placeholder: pick('请选择标签', 'Select tags'),
                  },
                },
              ],
            },
            {
              component: OneFormItem,
              props: {
                name: 'enabled',
                label: pick('启用通知', 'Enable notifications'),
              },
              children: [
                {
                  component: OneSwitch,
                  props: {
                    ariaLabel: pick('启用通知', 'Enable notifications'),
                  },
                },
              ],
            },
            {
              component: OneButton,
              props: { type: 'submit' },
              children: [pick('提交', 'Submit')],
            },
            {
              component: OneButton,
              props: { type: 'reset', variant: 'secondary' },
              children: [pick('重置', 'Reset')],
            },
          ],
        },
        {
          tag: 'output',
          props: { 'data-one-form-result': '' },
          children: [pick('尚未提交', 'Not submitted yet')],
        },
      ],
    };
  }

  private tagOptions(): readonly (OneSelectOption | OneSelectOptionGroup)[] {
    return [
      { value: 'design', label: pick('设计', 'Design') },
      { value: 'engineering', label: pick('工程', 'Engineering') },
      {
        label: pick('其他', 'Other'),
        options: [{ value: 'docs', label: pick('文档', 'Docs') }],
      },
    ];
  }
}
