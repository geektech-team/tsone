import {
  apiTable,
  callout,
  demo,
  heading,
  inlineCode,
  list,
  paragraph,
  t,
  type OneDocPage,
} from './types';

export const navigationPages: OneDocPage[] = [
  {
    path: '/components/navigation/',
    title: t('导航组件', 'Navigation'),
    description: t(
      '使用 Tabs、Breadcrumb 和 Pagination 帮助用户定位与移动。',
      'Use Tabs, Breadcrumb and Pagination to help users orient and move.'
    ),
    section: 'components',
    sectionOrder: 2,
    order: 22,
    body: [
      heading(1, 'navigation', t('导航组件', 'Navigation')),
      paragraph(
        t(
          '导航组件保持当前位置可见，并使用原生链接、按钮和 ARIA 语义提供可预测的键盘操作。',
          'Navigation components keep the current position visible and provide predictable keyboard operation through native links, buttons and ARIA semantics.'
        )
      ),
      demo('tabs'),
      heading(2, 'choose', t('如何选择', 'How to choose')),
      list([
        [t('同一页面内切换并列内容时使用 OneTabs。', 'Use OneTabs to switch between sibling content within the same page.')],
        [t('表达当前位置的层级路径时使用 OneBreadcrumb。', 'Use OneBreadcrumb to express the hierarchical path of the current position.')],
        [t('在大量同类记录之间翻页时使用 OnePagination。', 'Use OnePagination to page through many records of the same kind.')],
      ]),
      heading(2, 'components', t('组件', 'Components')),
      apiTable(t('导航组件', 'Navigation components'), [
        {
          name: 'OneTabs',
          signature: 'new OneTabs(props: OneTabsProps)',
          description: t('带动态面板插槽的水平标签页。', 'Horizontal tabs with dynamic panel slots.'),
        },
        {
          name: 'OneBreadcrumb',
          signature: 'new OneBreadcrumb(props: OneBreadcrumbProps)',
          description: t('支持原生链接与折叠展开的层级路径。', 'Hierarchical path with native links and collapse/expand.'),
        },
        {
          name: 'OnePagination',
          signature: 'new OnePagination(props: OnePaginationProps)',
          description: t('支持页大小与快速跳转的分页控件。', 'Pagination control with page size and quick jump.'),
        },
      ]),
    ],
  },
  {
    path: '/components/navigation/tabs/',
    title: 'OneTabs',
    description: t(
      '在同一上下文中切换并列内容，支持受控状态和完整键盘导航。',
      'Switches sibling content within the same context, with controlled state and full keyboard navigation.'
    ),
    section: 'components',
    sectionOrder: 2,
    order: 23,
    body: [
      heading(1, 'onetabs', 'OneTabs'),
      paragraph(
        t(
          'OneTabs 根据 OneTabItem.value 匹配同名动态插槽；value 用于受控状态，defaultValue 用于非受控初始状态。',
          'OneTabs matches same-named dynamic slots by OneTabItem.value; value drives the controlled state and defaultValue the uncontrolled initial state.'
        )
      ),
      demo('tabs'),
      heading(2, 'keyboard-aria', t('键盘与 ARIA', 'Keyboard and ARIA')),
      paragraph(
        t(
          '标签列表使用 role=tablist，标签和面板通过 aria-controls 与 aria-labelledby 关联。ArrowLeft、ArrowRight 会循环移动并激活，Home 和 End 跳到首尾可用标签。',
          'The tab list uses role=tablist; tabs and panels are associated via aria-controls and aria-labelledby. ArrowLeft and ArrowRight cycle and activate, while Home and End jump to the first and last available tab.'
        )
      ),
      callout('tip', t('禁用标签', 'Disabled tabs'), [
        t(
          'disabled 标签不会获得焦点，也不会通过点击或方向键发出 change。',
          'Disabled tabs do not receive focus and do not emit change via click or arrow keys.'
        ),
      ]),
      heading(2, 'api', 'API'),
      apiTable('OneTabsProps', [
        {
          name: 'items',
          signature: 'items: readonly OneTabItem[]',
          description: t('标签项；重复 value 只保留第一项。', 'Tab items; duplicate values keep only the first entry.'),
        },
        {
          name: 'value',
          signature: 'value?: string',
          description: t('受控选中值。', 'Controlled selected value.'),
        },
        {
          name: 'defaultValue',
          signature: 'defaultValue?: string',
          description: t('非受控初始值。', 'Uncontrolled initial value.'),
        },
        {
          name: 'id',
          signature: 'id?: string',
          description: t('稳定的标签与面板 ID 前缀。', 'Stable ID prefix for tabs and panels.'),
        },
        {
          name: 'ariaLabel',
          signature: 'ariaLabel?: string',
          description: t('tablist 的可访问名称。', 'Accessible name of the tablist.'),
        },
        {
          name: 'children',
          signature: 'children?: Array<VNode | string>',
          description: t('slot 名与 item.value 相同的动态面板内容。', 'Dynamic panel content whose slot name matches item.value.'),
        },
      ]),
      apiTable(t('OneTabItem 与事件', 'OneTabItem and events'), [
        {
          name: 'OneTabItem',
          signature: '{ value: string; label: string; disabled?: boolean }',
          description: t('标签项公开类型。', 'Public tab item type.'),
        },
        {
          name: 'change',
          signature: '(event: OneTabsChangeEvent) => void',
          description: t('事件包含 value: string 与 originalEvent: Event。', 'The event carries value: string and originalEvent: Event.'),
        },
      ]),
    ],
  },
  {
    path: '/components/navigation/breadcrumb/',
    title: 'OneBreadcrumb',
    description: t(
      '展示当前位置的层级路径，并保留原生链接导航语义。',
      'Shows the hierarchical path of the current position and keeps native link navigation semantics.'
    ),
    section: 'components',
    sectionOrder: 2,
    order: 24,
    body: [
      heading(1, 'onebreadcrumb', 'OneBreadcrumb'),
      paragraph(
        t(
          '第一个 current 项作为当前位置；没有显式 current 时使用最后一项。非当前位置的 href 使用原生链接。',
          'The first current item marks the current position; without an explicit current, the last item is used. href on non-current items renders native links.'
        )
      ),
      demo('breadcrumb'),
      heading(2, 'collapse', t('折叠与分隔符', 'Collapse and separator')),
      paragraph(
        inlineCode('maxItems'),
        t(' 保留首项、当前位置和末项，省略按钮可展开全部路径。separator 插槽优先于 separator 文本。', ' keeps the first item, current position and last item; the ellipsis button expands the full path. The separator slot takes precedence over separator text.')
      ),
      heading(2, 'keyboard-aria', t('键盘与 ARIA', 'Keyboard and ARIA')),
      paragraph(
        t(
          '外层 nav 使用 aria-label，当前位置使用 aria-current=page；链接和展开按钮均保留原生 Tab、Enter 与 Space 行为。',
          'The outer nav uses aria-label and the current position uses aria-current=page; links and the expand button keep native Tab, Enter and Space behavior.'
        )
      ),
      heading(2, 'api', 'API'),
      apiTable('OneBreadcrumbProps', [
        {
          name: 'items',
          signature: 'items: readonly OneBreadcrumbItem[]',
          description: t('按来源顺序显示的层级项目。', 'Hierarchical items shown in source order.'),
        },
        {
          name: 'separator',
          signature: 'separator?: string',
          description: t('文本分隔符，默认 /。', 'Text separator; default /.'),
        },
        {
          name: 'maxItems',
          signature: 'maxItems?: number',
          description: t('折叠前最多保留的项目数，最小为 3。', 'Maximum items kept before collapsing; minimum 3.'),
        },
        {
          name: 'ariaLabel',
          signature: 'ariaLabel?: string',
          description: t('导航的可访问名称，默认“面包屑”。', 'Accessible name of the navigation; default "breadcrumb".'),
        },
        {
          name: 'children',
          signature: 'children?: Array<VNode | string>',
          description: t('可提供 separator 命名插槽。', 'Can provide a separator named slot.'),
        },
      ]),
      apiTable(t('OneBreadcrumbItem 与事件', 'OneBreadcrumbItem and events'), [
        {
          name: 'OneBreadcrumbItem',
          signature: '{ label: string; href?: string; current?: boolean }',
          description: t('层级项目公开类型。', 'Public hierarchical item type.'),
        },
        {
          name: 'itemClick',
          signature: '(event: OneBreadcrumbClickEvent) => void',
          description: t(
            '在原生导航前发出 item、index 和 originalEvent；可调用 preventDefault。',
            'Emits item, index and originalEvent before native navigation; preventDefault can be called.'
          ),
        },
      ]),
    ],
  },
  {
    path: '/components/navigation/pagination/',
    title: 'OnePagination',
    description: t(
      '在大量记录间切换页码，并统一处理页大小和快速跳转。',
      'Switches pages across many records and unifies page size and quick jump.'
    ),
    section: 'components',
    sectionOrder: 2,
    order: 25,
    body: [
      heading(1, 'onepagination', 'OnePagination'),
      paragraph(
        t(
          'page 与 pageSize 可分别受控；defaultPage 与 defaultPageSize 提供非受控初始状态。所有变更统一发出 change。',
          'page and pageSize can each be controlled; defaultPage and defaultPageSize provide the uncontrolled initial state. All changes emit change.'
        )
      ),
      demo('pagination'),
      heading(2, 'behavior', t('页码窗口与收敛', 'Page window and clamping')),
      paragraph(
        t(
          '页码窗口始终保留首尾页，并按 siblingCount 显示当前页附近页码。改变 pageSize 或快速跳转时，目标页会收敛到有效范围。',
          'The page window always keeps the first and last pages and shows nearby pages according to siblingCount. When pageSize changes or a quick jump happens, the target page is clamped to a valid range.'
        )
      ),
      heading(2, 'keyboard-aria', t('键盘与 ARIA', 'Keyboard and ARIA')),
      paragraph(
        t(
          '导航、上一页、下一页、数字页、每页条数和快速跳转均有明确 aria-label；当前页使用 aria-current=page。Enter 提交快速跳转，disabled 会禁用所有交互控件。',
          'Navigation, previous, next, page numbers, page size and quick jump all have explicit aria-labels; the current page uses aria-current=page. Enter submits quick jump, and disabled disables all interactive controls.'
        )
      ),
      heading(2, 'api', 'API'),
      apiTable('OnePaginationProps', [
        {
          name: 'total',
          signature: 'total: number',
          description: t('记录总数。', 'Total number of records.'),
        },
        {
          name: 'page',
          signature: 'page?: number',
          description: t('受控当前页。', 'Controlled current page.'),
        },
        {
          name: 'defaultPage',
          signature: 'defaultPage?: number',
          description: t('非受控初始页。', 'Uncontrolled initial page.'),
        },
        {
          name: 'pageSize',
          signature: 'pageSize?: number',
          description: t('受控每页条数。', 'Controlled page size.'),
        },
        {
          name: 'defaultPageSize',
          signature: 'defaultPageSize?: number',
          description: t('非受控初始每页条数，默认 10。', 'Uncontrolled initial page size; default 10.'),
        },
        {
          name: 'pageSizeOptions',
          signature: 'pageSizeOptions?: readonly number[]',
          description: t('每页条数选项。', 'Page size options.'),
        },
        {
          name: 'siblingCount',
          signature: 'siblingCount?: number',
          description: t('当前页两侧保留页数，默认 1。', 'Number of pages kept on each side of the current page; default 1.'),
        },
        {
          name: 'showQuickJumper',
          signature: 'showQuickJumper?: boolean',
          description: t('显示快速跳转输入框。', 'Shows the quick jump input.'),
        },
        {
          name: 'disabled',
          signature: 'disabled?: boolean',
          description: t('禁用所有控件。', 'Disables all controls.'),
        },
        {
          name: 'ariaLabel',
          signature: 'ariaLabel?: string',
          description: t('导航可访问名称，默认“分页”。', 'Accessible name of the navigation; default "pagination".'),
        },
      ]),
      apiTable(t('OnePagination 事件', 'OnePagination events'), [
        {
          name: 'change',
          signature: '(event: OnePaginationChangeEvent) => void',
          description: t(
            '事件包含 page: number、pageSize: number 与 originalEvent: Event。',
            'The event carries page: number, pageSize: number and originalEvent: Event.'
          ),
        },
      ]),
    ],
  },
];
