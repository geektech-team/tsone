import {
  apiTable,
  callout,
  demo,
  heading,
  inlineCode,
  list,
  paragraph,
  type OneDocPage,
} from './types';

export const navigationPages: OneDocPage[] = [
  {
    path: '/components/navigation/',
    title: '导航组件',
    description: '使用 Tabs、Breadcrumb 和 Pagination 帮助用户定位与移动。',
    section: '组件',
    sectionOrder: 2,
    order: 12,
    body: [
      heading(1, 'navigation', '导航组件'),
      paragraph(
        '导航组件保持当前位置可见，并使用原生链接、按钮和 ARIA 语义提供可预测的键盘操作。'
      ),
      demo('tabs'),
      heading(2, 'choose', '如何选择'),
      list([
        ['同一页面内切换并列内容时使用 OneTabs。'],
        ['表达当前位置的层级路径时使用 OneBreadcrumb。'],
        ['在大量同类记录之间翻页时使用 OnePagination。'],
      ]),
      heading(2, 'components', '组件'),
      apiTable('导航组件', [
        {
          name: 'OneTabs',
          signature: 'new OneTabs(props: OneTabsProps)',
          description: '带动态面板插槽的水平标签页。',
        },
        {
          name: 'OneBreadcrumb',
          signature: 'new OneBreadcrumb(props: OneBreadcrumbProps)',
          description: '支持原生链接与折叠展开的层级路径。',
        },
        {
          name: 'OnePagination',
          signature: 'new OnePagination(props: OnePaginationProps)',
          description: '支持页大小与快速跳转的分页控件。',
        },
      ]),
    ],
  },
  {
    path: '/components/navigation/tabs/',
    title: 'OneTabs',
    description: '在同一上下文中切换并列内容，支持受控状态和完整键盘导航。',
    section: '组件',
    sectionOrder: 2,
    order: 13,
    body: [
      heading(1, 'onetabs', 'OneTabs'),
      paragraph(
        'OneTabs 根据 OneTabItem.value 匹配同名动态插槽；value 用于受控状态，defaultValue 用于非受控初始状态。'
      ),
      demo('tabs'),
      heading(2, 'keyboard-aria', '键盘与 ARIA'),
      paragraph(
        '标签列表使用 role=tablist，标签和面板通过 aria-controls 与 aria-labelledby 关联。ArrowLeft、ArrowRight 会循环移动并激活，Home 和 End 跳到首尾可用标签。'
      ),
      callout('tip', '禁用标签', [
        'disabled 标签不会获得焦点，也不会通过点击或方向键发出 change。',
      ]),
      heading(2, 'api', 'API'),
      apiTable('OneTabsProps', [
        {
          name: 'items',
          signature: 'items: readonly OneTabItem[]',
          description: '标签项；重复 value 只保留第一项。',
        },
        {
          name: 'value',
          signature: 'value?: string',
          description: '受控选中值。',
        },
        {
          name: 'defaultValue',
          signature: 'defaultValue?: string',
          description: '非受控初始值。',
        },
        {
          name: 'id',
          signature: 'id?: string',
          description: '稳定的标签与面板 ID 前缀。',
        },
        {
          name: 'ariaLabel',
          signature: 'ariaLabel?: string',
          description: 'tablist 的可访问名称。',
        },
        {
          name: 'children',
          signature: 'children?: Array<VNode | string>',
          description: 'slot 名与 item.value 相同的动态面板内容。',
        },
      ]),
      apiTable('OneTabItem 与事件', [
        {
          name: 'OneTabItem',
          signature: '{ value: string; label: string; disabled?: boolean }',
          description: '标签项公开类型。',
        },
        {
          name: 'change',
          signature: '(event: OneTabsChangeEvent) => void',
          description: '事件包含 value: string 与 originalEvent: Event。',
        },
      ]),
    ],
  },
  {
    path: '/components/navigation/breadcrumb/',
    title: 'OneBreadcrumb',
    description: '展示当前位置的层级路径，并保留原生链接导航语义。',
    section: '组件',
    sectionOrder: 2,
    order: 14,
    body: [
      heading(1, 'onebreadcrumb', 'OneBreadcrumb'),
      paragraph(
        '第一个 current 项作为当前位置；没有显式 current 时使用最后一项。非当前位置的 href 使用原生链接。'
      ),
      demo('breadcrumb'),
      heading(2, 'collapse', '折叠与分隔符'),
      paragraph(
        inlineCode('maxItems'),
        ' 保留首项、当前位置和末项，省略按钮可展开全部路径。separator 插槽优先于 separator 文本。'
      ),
      heading(2, 'keyboard-aria', '键盘与 ARIA'),
      paragraph(
        '外层 nav 使用 aria-label，当前位置使用 aria-current=page；链接和展开按钮均保留原生 Tab、Enter 与 Space 行为。'
      ),
      heading(2, 'api', 'API'),
      apiTable('OneBreadcrumbProps', [
        {
          name: 'items',
          signature: 'items: readonly OneBreadcrumbItem[]',
          description: '按来源顺序显示的层级项目。',
        },
        {
          name: 'separator',
          signature: 'separator?: string',
          description: '文本分隔符，默认 /。',
        },
        {
          name: 'maxItems',
          signature: 'maxItems?: number',
          description: '折叠前最多保留的项目数，最小为 3。',
        },
        {
          name: 'ariaLabel',
          signature: 'ariaLabel?: string',
          description: '导航的可访问名称，默认“面包屑”。',
        },
        {
          name: 'children',
          signature: 'children?: Array<VNode | string>',
          description: '可提供 separator 命名插槽。',
        },
      ]),
      apiTable('OneBreadcrumbItem 与事件', [
        {
          name: 'OneBreadcrumbItem',
          signature: '{ label: string; href?: string; current?: boolean }',
          description: '层级项目公开类型。',
        },
        {
          name: 'itemClick',
          signature: '(event: OneBreadcrumbClickEvent) => void',
          description:
            '在原生导航前发出 item、index 和 originalEvent；可调用 preventDefault。',
        },
      ]),
    ],
  },
  {
    path: '/components/navigation/pagination/',
    title: 'OnePagination',
    description: '在大量记录间切换页码，并统一处理页大小和快速跳转。',
    section: '组件',
    sectionOrder: 2,
    order: 15,
    body: [
      heading(1, 'onepagination', 'OnePagination'),
      paragraph(
        'page 与 pageSize 可分别受控；defaultPage 与 defaultPageSize 提供非受控初始状态。所有变更统一发出 change。'
      ),
      demo('pagination'),
      heading(2, 'behavior', '页码窗口与收敛'),
      paragraph(
        '页码窗口始终保留首尾页，并按 siblingCount 显示当前页附近页码。改变 pageSize 或快速跳转时，目标页会收敛到有效范围。'
      ),
      heading(2, 'keyboard-aria', '键盘与 ARIA'),
      paragraph(
        '导航、上一页、下一页、数字页、每页条数和快速跳转均有明确 aria-label；当前页使用 aria-current=page。Enter 提交快速跳转，disabled 会禁用所有交互控件。'
      ),
      heading(2, 'api', 'API'),
      apiTable('OnePaginationProps', [
        {
          name: 'total',
          signature: 'total: number',
          description: '记录总数。',
        },
        {
          name: 'page',
          signature: 'page?: number',
          description: '受控当前页。',
        },
        {
          name: 'defaultPage',
          signature: 'defaultPage?: number',
          description: '非受控初始页。',
        },
        {
          name: 'pageSize',
          signature: 'pageSize?: number',
          description: '受控每页条数。',
        },
        {
          name: 'defaultPageSize',
          signature: 'defaultPageSize?: number',
          description: '非受控初始每页条数，默认 10。',
        },
        {
          name: 'pageSizeOptions',
          signature: 'pageSizeOptions?: readonly number[]',
          description: '每页条数选项。',
        },
        {
          name: 'siblingCount',
          signature: 'siblingCount?: number',
          description: '当前页两侧保留页数，默认 1。',
        },
        {
          name: 'showQuickJumper',
          signature: 'showQuickJumper?: boolean',
          description: '显示快速跳转输入框。',
        },
        {
          name: 'disabled',
          signature: 'disabled?: boolean',
          description: '禁用所有控件。',
        },
        {
          name: 'ariaLabel',
          signature: 'ariaLabel?: string',
          description: '导航可访问名称，默认“分页”。',
        },
      ]),
      apiTable('OnePagination 事件', [
        {
          name: 'change',
          signature: '(event: OnePaginationChangeEvent) => void',
          description:
            '事件包含 page: number、pageSize: number 与 originalEvent: Event。',
        },
      ]),
    ],
  },
];
