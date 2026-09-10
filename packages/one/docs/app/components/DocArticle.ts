import { Component, type VNode } from '@geektech/tsone';
import {
  OneButton,
  OneBadge,
  OneBreadcrumb,
  OneCard,
  OneCheckbox,
  OneAlert,
  OneAvatar,
  OneForm,
  OneFormItem,
  OneInput,
  OneTextarea,
  OneEmpty,
  OneLoading,
  OneProgress,
  OneRadio,
  OneRadioGroup,
  OneSelect,
  OnePagination,
  OneSwitch,
  OneTag,
  OneTabs,
  OneTimePicker,
  OneSlider,
  OneRate,
  OneUpload,
  OneTable,
  OneCollapse,
  OneSkeleton,
  OneDivider,
  OneSpace,
  OneRow,
  OneCol,
  OneSteps,
  OneDescriptions,
  OneTimeline,
  OnePopover,
  OneCascader,
} from '../../../lib';
import {
  localize,
  sectionLabel,
  type OneDocBlock,
  type OneDocInline,
  type OneDocLocale,
  type OneDocPage,
} from '../content';
import { localeHref } from '../locale';
import { pick } from '../locale';

export interface DocArticleProps {
  page: OneDocPage;
  locale: OneDocLocale;
}

export class DocArticle extends Component<DocArticleProps> {
  protected initState(): object {
    return {};
  }

  protected initStyles(): void {}

  protected render(): VNode {
    const { page, locale } = this.props;

    return {
      tag: 'article',
      props: { className: 'one-doc-article' },
      children: [
        {
          tag: 'p',
          props: { className: 'one-docs-section-label' },
          children: [sectionLabel(page.section, locale)],
        },
        ...page.body.map((block) => this.renderBlock(block)),
      ],
    };
  }

  private renderBlock(block: OneDocBlock): VNode {
    const { locale } = this.props;

    switch (block.type) {
      case 'heading':
        return {
          tag: `h${block.level}`,
          props: { id: block.id },
          children: [localize(block.text, locale)],
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
            { tag: 'strong', children: [localize(block.title, locale)] },
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
                { tag: 'caption', children: [localize(block.caption, locale)] },
                {
                  tag: 'thead',
                  children: [
                    {
                      tag: 'tr',
                      children: [
                        {
                          tag: 'th',
                          props: { scope: 'col' },
                          children: [pick('名称', 'Name', locale)],
                        },
                        {
                          tag: 'th',
                          props: { scope: 'col' },
                          children: [pick('签名', 'Signature', locale)],
                        },
                        {
                          tag: 'th',
                          props: { scope: 'col' },
                          children: [pick('说明', 'Description', locale)],
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
                      {
                        tag: 'td',
                        children: [localize(row.description, locale)],
                      },
                    ],
                  })),
                },
              ],
            },
          ],
        };
      case 'demo':
        return this.renderDemo(
          block.component,
          block.interactive === true,
          block.source
        );
      default:
        return assertNever(block);
    }
  }

  private renderInline(content: OneDocInline[]): Array<VNode | string> {
    const { locale } = this.props;

    return content.map((item) => {
      if (typeof item === 'string') {
        return item;
      }

      if ('type' in item) {
        if (item.type === 'code') {
          return { tag: 'code', children: [item.text] };
        }
        return {
          tag: 'a',
          props: { href: this.localizeHref(item.href) },
          children: [localize(item.text, locale)],
        };
      }

      return localize(item, locale);
    });
  }

  private renderDemo(
    component: Extract<OneDocBlock, { type: 'demo' }>['component'],
    interactive: boolean,
    source: Extract<OneDocBlock, { type: 'demo' }>['source']
  ): VNode {
    const { locale } = this.props;

    return {
      tag: 'section',
      props: {
        className: 'one-docs-demo',
        'aria-label': pick(
          `${component} 组件预览`,
          `${component} demo`,
          locale
        ),
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
        {
          tag: 'details',
          props: {
            className: 'one-docs-demo-source',
            'data-one-demo-source': component,
          },
          children: [
            {
              tag: 'summary',
              children: [
                {
                  tag: 'span',
                  props: { className: 'one-docs-demo-source__show' },
                  children: [pick('查看代码', 'View code', locale)],
                },
                {
                  tag: 'span',
                  props: { className: 'one-docs-demo-source__hide' },
                  children: [pick('收起代码', 'Hide code', locale)],
                },
              ],
            },
            {
              tag: 'pre',
              children: [
                {
                  tag: 'code',
                  props: { className: `language-${source.language}` },
                  children: [source.code],
                },
              ],
            },
          ],
        },
      ],
    };
  }

  private renderStaticPreview(
    component: Extract<OneDocBlock, { type: 'demo' }>['component']
  ): VNode[] {
    const { locale } = this.props;

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
            props: {
              value: pick('受控值', 'Controlled value', locale),
              ariaLabel: pick('受控输入', 'Controlled input', locale),
            },
          },
          {
            component: OneInput,
            props: {
              defaultValue: pick('非受控值', 'Uncontrolled value', locale),
              ariaLabel: pick('非受控输入', 'Uncontrolled input', locale),
            },
          },
          {
            component: OneInput,
            props: {
              placeholder: pick('必填输入', 'Required input', locale),
              required: true,
              invalid: true,
              ariaLabel: pick('无效输入', 'Invalid input', locale),
            },
          },
        ];
      case 'textarea':
        return [
          {
            component: OneTextarea,
            props: {
              defaultValue: pick('多行文本内容', 'Multi-line text', locale),
              ariaLabel: pick('备注', 'Notes', locale),
            },
          },
          {
            component: OneTextarea,
            props: {
              rows: 5,
              placeholder: pick('请输入补充说明', 'Type additional notes', locale),
              ariaLabel: pick('补充说明', 'Additional notes', locale),
            },
          },
        ];
      case 'card':
        return [
          {
            component: OneCard,
            props: { title: pick('后备标题', 'Fallback title', locale) },
            children: [
              {
                tag: 'strong',
                slot: 'header',
                children: [pick('显式 header', 'Explicit header', locale)],
              },
              {
                tag: 'p',
                children: [pick('default 主体内容', 'default body content', locale)],
              },
              {
                tag: 'span',
                slot: 'footer',
                children: [pick('footer 操作区', 'footer action area', locale)],
              },
            ],
          },
        ];
      case 'tag':
        return [
          {
            component: OneTag,
            props: { variant: 'success', closable: true, size: 'sm' },
            children: [pick('已发布', 'Published', locale)],
          },
          {
            component: OneTag,
            props: { variant: 'neutral', size: 'md' },
            children: [pick('默认', 'Default', locale)],
          },
          {
            component: OneTag,
            props: { variant: 'warning', size: 'lg' },
            children: [pick('待检查', 'Needs review', locale)],
          },
        ];
      case 'badge':
        return [
          {
            component: OneBadge,
            props: { value: 8 },
            children: [pick('消息', 'Messages', locale)],
          },
          {
            component: OneBadge,
            props: { value: 120, max: 99, variant: 'error' },
            children: [pick('待办', 'To-do', locale)],
          },
          {
            component: OneBadge,
            props: {
              dot: true,
              ariaLabel: pick('有新通知', 'New notifications', locale),
              variant: 'success',
            },
            children: [pick('通知', 'Notifications', locale)],
          },
          {
            component: OneBadge,
            props: { value: 'NEW' },
          },
        ];
      case 'empty':
        return [
          {
            component: OneEmpty,
            props: {
              description: pick('暂无搜索结果', 'No search results', locale),
            },
            children: [
              {
                component: OneButton,
                slot: 'actions',
                props: { size: 'sm' },
                children: [pick('创建项目', 'Create project', locale)],
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
              rules: {
                name: [
                  {
                    required: true,
                    message: pick('请输入名称', 'Please enter a name', locale),
                  },
                ],
              },
            },
            children: [
              {
                component: OneFormItem,
                props: { name: 'name', label: pick('名称', 'Name', locale) },
                children: [
                  {
                    component: OneInput,
                    props: { ariaLabel: pick('名称', 'Name', locale) },
                  },
                ],
              },
              {
                component: OneButton,
                props: { type: 'submit' },
                children: [pick('提交', 'Submit', locale)],
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
              ariaLabel: pick('城市', 'City', locale),
              options: [
                { value: 'beijing', label: pick('北京', 'Beijing', locale) },
                {
                  label: pick('海外', 'Overseas', locale),
                  options: [
                    { value: 'tokyo', label: pick('东京', 'Tokyo', locale) },
                  ],
                },
              ],
            },
          },
        ];
      case 'checkbox':
        return [
          {
            component: OneCheckbox,
            props: { ariaLabel: pick('同意协议', 'Agree to terms', locale) },
            children: [pick('同意协议', 'Agree to terms', locale)],
          },
        ];
      case 'switch':
        return [
          {
            component: OneSwitch,
            props: {
              ariaLabel: pick('启用通知', 'Enable notifications', locale),
            },
          },
        ];
      case 'radio':
        return [
          {
            component: OneRadio,
            props: {
              value: 'design',
              defaultChecked: true,
              ariaLabel: pick('设计', 'Design', locale),
            },
            children: [pick('设计', 'Design', locale)],
          },
          {
            component: OneRadioGroup,
            props: {
              defaultValue: 'weekly',
              ariaLabel: pick('通知频率', 'Notification frequency', locale),
              options: [
                { value: 'daily', label: pick('每天', 'Daily', locale) },
                { value: 'weekly', label: pick('每周', 'Weekly', locale) },
              ],
            },
          },
        ];
      case 'time-picker':
        return [
          {
            component: OneTimePicker,
            props: {
              defaultValue: '09:30',
              ariaLabel: pick('开始时间', 'Start time', locale),
            },
          },
        ];
      case 'loading':
        return [
          {
            component: OneLoading,
            props: { label: pick('加载中', 'Loading', locale) },
          },
          {
            component: OneLoading,
            props: {
              size: 'lg',
              variant: 'primary',
              label: pick('提交中', 'Submitting', locale),
            },
          },
        ];
      case 'avatar':
        return [
          {
            component: OneAvatar,
            props: { text: 'M', variant: 'primary' },
          },
          {
            component: OneAvatar,
            props: {
              text: pick('设计', 'Design', locale),
              shape: 'square',
              variant: 'success',
            },
          },
        ];
      case 'progress':
        return [
          {
            component: OneProgress,
            props: {
              percent: 65,
              showText: true,
              ariaLabel: pick('完成进度', 'Completion progress', locale),
            },
          },
          {
            component: OneProgress,
            props: {
              percent: 30,
              variant: 'success',
              ariaLabel: pick('成功进度', 'Success progress', locale),
            },
          },
        ];
      case 'tabs':
        return [
          {
            component: OneTabs,
            props: {
              defaultValue: 'overview',
              ariaLabel: pick('项目设置', 'Project settings', locale),
              items: [
                { value: 'overview', label: pick('概览', 'Overview', locale) },
                { value: 'security', label: pick('安全', 'Security', locale) },
              ],
            },
            children: [
              {
                tag: 'p',
                slot: 'overview',
                children: [pick('概览内容', 'Overview content', locale)],
              },
              {
                tag: 'p',
                slot: 'security',
                children: [pick('安全内容', 'Security content', locale)],
              },
            ],
          },
        ];
      case 'breadcrumb':
        return [
          {
            component: OneBreadcrumb,
            props: {
              ariaLabel: pick('项目路径', 'Project path', locale),
              items: [
                { label: pick('首页', 'Home', locale), href: '/' },
                { label: pick('项目', 'Projects', locale), href: '/projects' },
                { label: pick('详情', 'Details', locale), current: true },
              ],
            },
          },
        ];
      case 'pagination':
        return [
          {
            component: OnePagination,
            props: { total: 95, page: 3, pageSize: 10 },
          },
        ];
      case 'alert':
        return [
          {
            component: OneAlert,
            props: {
              title: pick('保存成功', 'Saved successfully', locale),
              description: pick(
                '更改已经同步。',
                'Changes have been synced.',
                locale
              ),
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
                children: [pick('保存成功', 'Saved successfully', locale)],
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
                children: [pick('保存更改？', 'Save changes?', locale)],
              },
              {
                tag: 'div',
                props: { className: 'one-dialog__body' },
                children: [
                  pick(
                    '确认后将同步当前设置。',
                    'Your current settings will be synced after confirmation.',
                    locale
                  ),
                ],
              },
              {
                tag: 'footer',
                props: { className: 'one-dialog__footer' },
                children: [
                  {
                    tag: 'button',
                    props: { className: 'one-dialog__cancel', type: 'button' },
                    children: [pick('取消', 'Cancel', locale)],
                  },
                  {
                    tag: 'button',
                    props: { className: 'one-dialog__confirm', type: 'button' },
                    children: [pick('确认', 'Confirm', locale)],
                  },
                ],
              },
            ],
          },
        ];
      case 'tooltip':
        return [
          { component: OneButton, children: [pick('复制', 'Copy', locale)] },
          {
            tag: 'div',
            props: {
              className: 'one-tooltip__bubble',
              role: 'tooltip',
              'data-placement': 'top',
            },
            children: [
              pick('复制链接', 'Copy link', locale),
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
      case 'slider':
        return [
          {
            component: OneSlider,
            props: {
              defaultValue: 60,
              min: 0,
              max: 100,
              showValue: true,
              ariaLabel: pick('音量', 'Volume', locale),
            },
          },
        ];
      case 'rate':
        return [
          {
            component: OneRate,
            props: {
              defaultValue: 3,
              ariaLabel: pick('评分', 'Rating', locale),
            },
          },
        ];
      case 'upload':
        return [
          {
            component: OneUpload,
            props: {
              defaultValue: [
                { id: 'preview-report', name: '报告.pdf', size: 240 * 1024 },
              ],
              ariaLabel: pick('附件', 'Attachments', locale),
              children: [pick('选择文件', 'Choose files', locale)],
            },
          },
        ];
      case 'table':
        return [
          {
            component: OneTable,
            props: {
              hover: true,
              ariaLabel: pick('团队成员', 'Team members', locale),
              data: [
                {
                  name: pick('林晚', 'Eve Lin', locale),
                  role: pick('设计', 'Design', locale),
                  status: pick('在线', 'Online', locale),
                },
                {
                  name: pick('苏北', 'Ben Su', locale),
                  role: pick('前端', 'Frontend', locale),
                  status: pick('忙碌', 'Busy', locale),
                },
              ],
              columns: [
                { key: 'name', title: pick('姓名', 'Name', locale) },
                { key: 'role', title: pick('角色', 'Role', locale) },
                { key: 'status', title: pick('状态', 'Status', locale) },
              ],
            },
          },
        ];
      case 'collapse':
        return [
          {
            component: OneCollapse,
            props: {
              accordion: true,
              defaultActive: ['basic'],
              items: [
                {
                  value: 'basic',
                  title: pick('基础用法', 'Basic usage', locale),
                  children: [
                    pick(
                      '一次只能展开一项。',
                      'Only one panel opens at a time.',
                      locale
                    ),
                  ],
                },
                {
                  value: 'advanced',
                  title: pick('高级用法', 'Advanced usage', locale),
                  children: [pick('更多内容。', 'More content.', locale)],
                },
              ],
            },
          },
        ];
      case 'skeleton':
        return [
          {
            component: OneSkeleton,
            props: {
              rows: 3,
              title: true,
              ariaLabel: pick('加载中', 'Loading', locale),
            },
          },
        ];
      case 'divider':
        return [
          {
            component: OneDivider,
            props: { text: pick('或', 'or', locale) },
          },
          {
            component: OneDivider,
            props: {},
          },
          {
            component: OneDivider,
            props: { direction: 'vertical' },
          },
        ];
      case 'space':
        return [
          {
            component: OneSpace,
            props: { size: 'md', wrap: true },
            children: [
              {
                component: OneButton,
                props: { variant: 'primary', size: 'sm' },
                children: [pick('保存', 'Save', locale)],
              },
              {
                component: OneButton,
                props: { size: 'sm' },
                children: [pick('取消', 'Cancel', locale)],
              },
              {
                component: OneButton,
                props: { variant: 'danger', size: 'sm' },
                children: [pick('删除', 'Delete', locale)],
              },
            ],
          },
        ];
      case 'grid':
        return [
          {
            component: OneRow,
            props: { gutter: [16, 16] },
            children: [
              {
                component: OneCol,
                props: { span: 12 },
                children: [
                  {
                    tag: 'div',
                    props: { className: 'one-docs-grid-box' },
                    children: ['12'],
                  },
                ],
              },
              {
                component: OneCol,
                props: { span: 12 },
                children: [
                  {
                    tag: 'div',
                    props: { className: 'one-docs-grid-box' },
                    children: ['12'],
                  },
                ],
              },
            ],
          },
          {
            component: OneRow,
            props: { gutter: [16, 16] },
            children: [
              {
                component: OneCol,
                props: { span: 8, offset: 8 },
                children: [
                  {
                    tag: 'div',
                    props: { className: 'one-docs-grid-box' },
                    children: [pick('8 偏移 8', '8 + offset 8', locale)],
                  },
                ],
              },
            ],
          },
        ];
      case 'steps':
        return [
          {
            component: OneSteps,
            props: {
              current: 1,
              items: [
                { title: pick('填写信息', 'Fill details', locale) },
                {
                  title: pick('确认订单', 'Confirm order', locale),
                  description: pick('核对收货地址', 'Check the address', locale),
                },
                { title: pick('完成支付', 'Pay', locale) },
              ],
            },
          },
        ];
      case 'descriptions':
        return [
          {
            component: OneDescriptions,
            props: {
              title: pick('订单信息', 'Order info', locale),
              column: 2,
              bordered: true,
              items: [
                { label: pick('订单号', 'Order ID', locale), value: 'A-1024' },
                { label: pick('状态', 'Status', locale), value: pick('已发货', 'Shipped', locale) },
                { label: pick('收件人', 'Recipient', locale), value: pick('张三', 'Zhang San', locale) },
                { label: pick('金额', 'Amount', locale), value: '¥ 128.00' },
              ],
            },
          },
        ];
      case 'timeline':
        return [
          {
            component: OneTimeline,
            props: {
              items: [
                {
                  title: pick('创建订单', 'Order created', locale),
                  time: '09-01 10:00',
                  content: pick('订单已创建', 'Order created', locale),
                },
                {
                  title: pick('已发货', 'Shipped', locale),
                  color: 'success',
                  content: pick('快递已揽收', 'Parcel picked up', locale),
                },
              ],
            },
          },
        ];
      case 'popover':
        return [
          {
            component: OnePopover,
            props: {
              content: pick('这是一段浮层说明，点击外部或按 Escape 关闭。', 'Popover content; click outside or press Escape to close.', locale),
              defaultOpen: true,
            },
            children: [
              {
                tag: 'button',
                props: { className: 'one-button one-button--secondary one-button--md' },
                children: [pick('点击打开', 'Open popover', locale)],
              },
            ],
          },
        ];
      case 'cascader':
        return [
          {
            component: OneCascader,
            props: {
              placeholder: pick('请选择地区', 'Select a region', locale),
              options: [
                {
                  value: 'zhejiang',
                  label: pick('浙江', 'Zhejiang', locale),
                  children: [
                    {
                      value: 'hangzhou',
                      label: pick('杭州', 'Hangzhou', locale),
                      children: [
                        { value: 'xihu', label: pick('西湖区', 'Xihu', locale) },
                        { value: 'yuhang', label: pick('余杭区', 'Yuhang', locale) },
                      ],
                    },
                    { value: 'ningbo', label: pick('宁波', 'Ningbo', locale) },
                  ],
                },
                {
                  value: 'jiangsu',
                  label: pick('江苏', 'Jiangsu', locale),
                  children: [{ value: 'nanjing', label: pick('南京', 'Nanjing', locale) }],
                },
              ],
            },
          },
        ];
      default:
        return assertNever(component);
    }
  }

  private localizeHref(href: string): string {
    if (
      href.startsWith('#') ||
      href.startsWith('http://') ||
      href.startsWith('https://') ||
      href.startsWith('//') ||
      href.startsWith('mailto:') ||
      href.startsWith('javascript:')
    ) {
      return href;
    }

    const { locale } = this.props;
    return localeHref(href, locale);
  }
}

function assertNever(value: never): never {
  throw new Error(`Unsupported One UI docs content: ${String(value)}`);
}
