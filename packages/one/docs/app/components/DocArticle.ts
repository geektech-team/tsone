import { Component, type VNode } from '@geektech/tsone';
import {
  OneButton,
  OneCard,
  OneCheckbox,
  OneAlert,
  OneForm,
  OneFormItem,
  OneInput,
  OneSelect,
  OneSwitch,
} from '../../../lib';
import type { OneDocBlock, OneDocInline, OneDocPage } from '../content';

export interface DocArticleProps {
  page: OneDocPage;
}

export class DocArticle extends Component<DocArticleProps> {
  protected initState(): object {
    return {};
  }

  protected initStyles(): void {}

  protected render(): VNode {
    return {
      tag: 'article',
      props: { className: 'one-doc-article' },
      children: [
        {
          tag: 'p',
          props: { className: 'one-docs-section-label' },
          children: [this.props.page.section],
        },
        ...this.props.page.body.map((block) => this.renderBlock(block)),
      ],
    };
  }

  private renderBlock(block: OneDocBlock): VNode {
    switch (block.type) {
      case 'heading':
        return {
          tag: `h${block.level}`,
          props: { id: block.id },
          children: [block.text],
        };
      case 'paragraph':
        return { tag: 'p', children: this.renderInline(block.content) };
      case 'list':
        return {
          tag: 'ul',
          children: block.items.map((item) => ({
            tag: 'li',
            children: this.renderInline(item),
          })),
        };
      case 'code':
        return {
          tag: 'pre',
          children: [
            {
              tag: 'code',
              props: { className: `language-${block.language}` },
              children: [block.code],
            },
          ],
        };
      case 'callout':
        return {
          tag: 'aside',
          props: {
            className: `one-docs-callout one-docs-callout--${block.kind}`,
          },
          children: [
            { tag: 'strong', children: [block.title] },
            { tag: 'p', children: this.renderInline(block.body) },
          ],
        };
      case 'api-table':
        return {
          tag: 'div',
          props: { className: 'one-docs-api-scroll' },
          children: [
            {
              tag: 'table',
              props: { className: 'one-docs-api-table' },
              children: [
                { tag: 'caption', children: [block.caption] },
                {
                  tag: 'thead',
                  children: [
                    {
                      tag: 'tr',
                      children: [
                        {
                          tag: 'th',
                          props: { scope: 'col' },
                          children: ['名称'],
                        },
                        {
                          tag: 'th',
                          props: { scope: 'col' },
                          children: ['签名'],
                        },
                        {
                          tag: 'th',
                          props: { scope: 'col' },
                          children: ['说明'],
                        },
                      ],
                    },
                  ],
                },
                {
                  tag: 'tbody',
                  children: block.rows.map((row) => ({
                    tag: 'tr',
                    children: [
                      {
                        tag: 'td',
                        children: [{ tag: 'code', children: [row.name] }],
                      },
                      {
                        tag: 'td',
                        children: [{ tag: 'code', children: [row.signature] }],
                      },
                      { tag: 'td', children: [row.description] },
                    ],
                  })),
                },
              ],
            },
          ],
        };
      case 'demo':
        return this.renderDemo(block.component, block.interactive === true);
      default:
        return assertNever(block);
    }
  }

  private renderInline(content: OneDocInline[]): Array<VNode | string> {
    return content.map((item) => {
      if (typeof item === 'string') {
        return item;
      }

      switch (item.type) {
        case 'code':
          return { tag: 'code', children: [item.text] };
        case 'link':
          return {
            tag: 'a',
            props: { href: item.href },
            children: [item.text],
          };
        default:
          return assertNever(item);
      }
    });
  }

  private renderDemo(
    component: Extract<OneDocBlock, { type: 'demo' }>['component'],
    interactive: boolean
  ): VNode {
    return {
      tag: 'section',
      props: {
        className: 'one-docs-demo',
        'aria-label': `${component} 组件预览`,
      },
      children: [
        {
          tag: 'div',
          props: { className: 'one-docs-demo-preview' },
          children: this.renderStaticPreview(component),
        },
        ...(interactive
          ? [
              {
                tag: 'div',
                props: { 'data-one-demo': component },
              } as VNode,
            ]
          : []),
      ],
    };
  }

  private renderStaticPreview(
    component: Extract<OneDocBlock, { type: 'demo' }>['component']
  ): VNode[] {
    switch (component) {
      case 'button':
        return [
          {
            component: OneButton,
            props: { variant: 'primary', size: 'sm' },
            children: ['Primary'],
          },
          {
            component: OneButton,
            props: {
              variant: 'secondary',
              size: 'md',
            },
            children: ['Secondary'],
          },
          {
            component: OneButton,
            props: { variant: 'danger', size: 'lg' },
            children: ['Danger'],
          },
          {
            component: OneButton,
            props: { disabled: true },
            children: ['Disabled'],
          },
          {
            component: OneButton,
            props: { loading: true },
            children: ['Loading'],
          },
        ];
      case 'input':
        return [
          {
            component: OneInput,
            props: { value: '受控值', ariaLabel: '受控输入' },
          },
          {
            component: OneInput,
            props: { defaultValue: '非受控值', ariaLabel: '非受控输入' },
          },
          {
            component: OneInput,
            props: {
              placeholder: '必填输入',
              required: true,
              invalid: true,
              ariaLabel: '无效输入',
            },
          },
        ];
      case 'card':
        return [
          {
            component: OneCard,
            props: { title: '后备标题' },
            children: [
              {
                tag: 'strong',
                slot: 'header',
                children: ['显式 header'],
              },
              { tag: 'p', children: ['default 主体内容'] },
              {
                tag: 'span',
                slot: 'footer',
                children: ['footer 操作区'],
              },
            ],
          },
        ];
      case 'form':
        return [
          {
            component: OneForm,
            props: {
              initialValues: { name: '' },
              rules: { name: [{ required: true, message: '请输入名称' }] },
            },
            children: [
              {
                component: OneFormItem,
                props: { name: 'name', label: '名称' },
                children: [
                  { component: OneInput, props: { ariaLabel: '名称' } },
                ],
              },
              {
                component: OneButton,
                props: { type: 'submit' },
                children: ['提交'],
              },
            ],
          },
        ];
      case 'select':
        return [
          {
            component: OneSelect,
            props: {
              multiple: true,
              searchable: true,
              ariaLabel: '城市',
              options: [
                { value: 'beijing', label: '北京' },
                { label: '海外', options: [{ value: 'tokyo', label: '东京' }] },
              ],
            },
          },
        ];
      case 'checkbox':
        return [
          {
            component: OneCheckbox,
            props: { ariaLabel: '同意协议' },
            children: ['同意协议'],
          },
        ];
      case 'switch':
        return [{ component: OneSwitch, props: { ariaLabel: '启用通知' } }];
      case 'alert':
        return [
          {
            component: OneAlert,
            props: {
              title: '保存成功',
              description: '更改已经同步。',
              variant: 'success',
              closable: true,
            },
          },
        ];
      case 'message':
        return [
          {
            tag: 'div',
            props: {
              className: 'one-message one-message--success',
              role: 'status',
              'data-one-message-placement': 'top',
            },
            children: [
              {
                tag: 'div',
                props: { className: 'one-message__content' },
                children: ['保存成功'],
              },
            ],
          },
        ];
      case 'dialog':
        return [
          {
            tag: 'section',
            props: {
              className: 'one-dialog',
              role: 'dialog',
              'aria-modal': 'false',
              'aria-labelledby': 'one-docs-dialog-title',
            },
            children: [
              {
                tag: 'header',
                props: {
                  className: 'one-dialog__header',
                  id: 'one-docs-dialog-title',
                },
                children: ['保存更改？'],
              },
              {
                tag: 'div',
                props: { className: 'one-dialog__body' },
                children: ['确认后将同步当前设置。'],
              },
              {
                tag: 'footer',
                props: { className: 'one-dialog__footer' },
                children: [
                  {
                    tag: 'button',
                    props: { className: 'one-dialog__cancel', type: 'button' },
                    children: ['取消'],
                  },
                  {
                    tag: 'button',
                    props: { className: 'one-dialog__confirm', type: 'button' },
                    children: ['确认'],
                  },
                ],
              },
            ],
          },
        ];
      case 'tooltip':
        return [
          { tag: 'button', props: { type: 'button' }, children: ['复制'] },
          {
            tag: 'div',
            props: {
              className: 'one-tooltip__bubble',
              role: 'tooltip',
              'data-placement': 'top',
            },
            children: [
              '复制链接',
              {
                tag: 'span',
                props: {
                  className: 'one-tooltip__arrow',
                  'aria-hidden': 'true',
                },
              },
            ],
          },
        ];
      default:
        return assertNever(component);
    }
  }
}

function assertNever(value: never): never {
  throw new Error(`Unsupported One UI docs content: ${String(value)}`);
}
