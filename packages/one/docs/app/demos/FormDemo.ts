import { Component, type VNode } from '@geektech/tsone';
import {
  OneButton,
  OneForm,
  OneFormItem,
  OneInput,
  OneSelect,
  OneSwitch,
  type OneFormSubmitEvent,
} from '../../../lib';

const tagOptions = [
  { value: 'design', label: '设计' },
  { value: 'engineering', label: '工程' },
  { label: '其他', options: [{ value: 'docs', label: '文档' }] },
] as const;

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
                { required: true, message: '请输入项目名称' },
                { minLength: 3, message: '项目名称至少 3 个字符' },
                {
                  pattern: /^[a-z-]+$/,
                  message: '项目名称仅支持小写字母和连字符',
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
                label: '项目名称',
                description: '例如 one-ui',
              },
              children: [
                {
                  component: OneInput,
                  props: { ariaLabel: '项目名称', placeholder: 'one-ui' },
                },
              ],
            },
            {
              component: OneFormItem,
              props: { name: 'tags', label: '标签' },
              children: [
                {
                  component: OneSelect,
                  props: {
                    options: tagOptions,
                    multiple: true,
                    searchable: true,
                    ariaLabel: '标签',
                    placeholder: '请选择标签',
                  },
                },
              ],
            },
            {
              component: OneFormItem,
              props: { name: 'enabled', label: '启用通知' },
              children: [
                { component: OneSwitch, props: { ariaLabel: '启用通知' } },
              ],
            },
            {
              component: OneButton,
              props: { type: 'submit' },
              children: ['提交'],
            },
            {
              component: OneButton,
              props: { type: 'reset', variant: 'secondary' },
              children: ['重置'],
            },
          ],
        },
        {
          tag: 'output',
          props: { 'data-one-form-result': '' },
          children: ['尚未提交'],
        },
      ],
    };
  }
}
