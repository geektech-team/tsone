import {
  Button,
  Component,
  Div,
  P,
  Span,
  TransitionGroup,
  createApp,
  each,
  h,
  type VNode,
} from '@geektech/tsone';

type NamedStyle = {
  name: string;
  selector: string;
  properties: Record<string, string | number>;
  media?: Record<string, Record<string, string | number>>;
};

interface DashboardState {
  queueIndex: number;
}

const metrics = [
  { label: '活跃项目', value: '18', delta: '+12%' },
  { label: '本周部署', value: '146', delta: '+31%' },
  { label: '错误率', value: '0.08%', delta: '-4%' },
  { label: '平均响应', value: '84ms', delta: '-11%' },
];

const projects = [
  { name: '官网首页', owner: 'Design', status: '运行中', health: '99.9%' },
  { name: '文档系统', owner: 'DX', status: '构建中', health: '98.4%' },
  { name: '后台管理页', owner: 'Ops', status: '待审核', health: '96.7%' },
];

const queue = ['准备构建', '类型检查', '发布预览'];

class AdminDashboardApp extends Component<object, DashboardState> {
  protected initState(): DashboardState {
    return { queueIndex: 1 };
  }

  protected initStyles(): void {
    const styles: NamedStyle[] = [
      {
        name: 'admin-body',
        selector: 'body',
        properties: {
          margin: 0,
          background: '#f4f7f4',
          color: '#162018',
          fontFamily:
            "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        },
      },
      {
        name: 'admin-shell',
        selector: '.admin-shell',
        properties: {
          display: 'grid',
          gridTemplateColumns: '220px minmax(0, 1fr)',
          minHeight: '100vh',
        },
      },
      {
        name: 'admin-sidebar',
        selector: '.admin-sidebar',
        properties: {
          background: '#111b13',
          color: '#eaf8e8',
          padding: '22px',
        },
      },
      {
        name: 'admin-brand',
        selector: '.admin-brand',
        properties: {
          fontSize: '18px',
          fontWeight: 800,
          marginBottom: '28px',
        },
      },
      {
        name: 'admin-nav-item',
        selector: '.admin-nav-item',
        properties: {
          borderRadius: '6px',
          color: '#bdd7ba',
          display: 'block',
          marginBottom: '8px',
          padding: '10px 12px',
        },
      },
      {
        name: 'admin-nav-active',
        selector: '.admin-nav-active',
        properties: {
          background: 'rgb(95 217 86)',
          color: '#10200f',
          fontWeight: 700,
        },
      },
      {
        name: 'admin-main',
        selector: '.admin-main',
        properties: {
          padding: '26px',
        },
      },
      {
        name: 'admin-topbar',
        selector: '.admin-topbar',
        properties: {
          alignItems: 'center',
          display: 'flex',
          justifyContent: 'space-between',
          marginBottom: '22px',
        },
      },
      {
        name: 'admin-title',
        selector: '.admin-title',
        properties: {
          fontSize: '26px',
          margin: 0,
        },
      },
      {
        name: 'admin-button',
        selector: '.admin-button',
        properties: {
          background: 'rgb(95 217 86)',
          border: 0,
          borderRadius: '6px',
          color: '#10200f',
          cursor: 'pointer',
          font: 'inherit',
          fontWeight: 700,
          padding: '10px 14px',
        },
      },
      {
        name: 'admin-metrics',
        selector: '.admin-metrics',
        properties: {
          display: 'grid',
          gap: '14px',
          gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
          marginBottom: '18px',
        },
      },
      {
        name: 'admin-card',
        selector: '.admin-card',
        properties: {
          background: '#ffffff',
          border: '1px solid #dbe8d9',
          borderRadius: '8px',
          padding: '16px',
        },
      },
      {
        name: 'admin-card-label',
        selector: '.admin-card-label',
        properties: {
          color: '#647268',
          fontSize: '13px',
          margin: 0,
        },
      },
      {
        name: 'admin-card-value',
        selector: '.admin-card-value',
        properties: {
          fontSize: '28px',
          fontWeight: 800,
          margin: '10px 0 4px',
        },
      },
      {
        name: 'admin-delta',
        selector: '.admin-delta',
        properties: {
          color: '#2f7c39',
          fontSize: '13px',
          fontWeight: 700,
        },
      },
      {
        name: 'admin-content-grid',
        selector: '.admin-content-grid',
        properties: {
          display: 'grid',
          gap: '18px',
          gridTemplateColumns: 'minmax(0, 1.3fr) minmax(280px, 0.7fr)',
        },
      },
      {
        name: 'admin-table',
        selector: '.admin-table',
        properties: {
          borderCollapse: 'collapse',
          width: '100%',
        },
      },
      {
        name: 'admin-cell',
        selector: '.admin-table th, .admin-table td',
        properties: {
          borderBottom: '1px solid #e1ebe0',
          padding: '12px 8px',
          textAlign: 'left',
        },
      },
      {
        name: 'admin-status',
        selector: '.admin-status',
        properties: {
          background: '#e9f8e7',
          borderRadius: '6px',
          color: '#246d2c',
          display: 'inline-block',
          fontSize: '12px',
          padding: '4px 8px',
        },
      },
      {
        name: 'admin-queue-item',
        selector: '.admin-queue-item',
        properties: {
          alignItems: 'center',
          display: 'flex',
          gap: '10px',
          marginTop: '14px',
        },
      },
      {
        name: 'admin-dot',
        selector: '.admin-dot',
        properties: {
          background: '#c8d8c5',
          borderRadius: '50%',
          height: '10px',
          width: '10px',
        },
      },
      {
        name: 'admin-dot-active',
        selector: '.admin-dot-active',
        properties: {
          background: 'rgb(95 217 86)',
        },
      },
      {
        name: 'admin-mobile',
        selector: '.admin-shell',
        properties: {},
        media: {
          '(max-width: 920px)': {
            display: 'block',
          },
        },
      },
      {
        name: 'admin-metrics-mobile',
        selector: '.admin-metrics',
        properties: {},
        media: {
          '(max-width: 920px)': {
            gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
          },
        },
      },
    ];

    styles.forEach((style) => this.styleManager.addStyle(style.name, style));
  }

  protected render(): VNode {
    return Div({
      props: { className: 'admin-shell' },
      children: [
        this.renderSidebar(),
        Div({
          props: { className: 'admin-main' },
          children: [
            this.renderTopbar(),
            this.renderMetrics(),
            this.renderContent(),
          ],
        }),
      ],
    });
  }

  private renderSidebar(): VNode {
    return h('aside', { className: 'admin-sidebar' }, [
      Div({ props: { className: 'admin-brand' }, children: ['TSone 控制台'] }),
      Span({
        props: { className: 'admin-nav-item admin-nav-active' },
        children: ['总览'],
      }),
      Span({ props: { className: 'admin-nav-item' }, children: ['项目'] }),
      Span({ props: { className: 'admin-nav-item' }, children: ['部署'] }),
      Span({ props: { className: 'admin-nav-item' }, children: ['设置'] }),
    ]);
  }

  private renderTopbar(): VNode {
    return h('header', { className: 'admin-topbar' }, [
      Div({
        children: [
          h('h1', { className: 'admin-title' }, ['运营总览']),
          P({ children: ['用一个 TSone 页面观察项目健康度和发布节奏。'] }),
        ],
      }),
      Button({
        props: { className: 'admin-button' },
        listeners: {
          click: () => {
            this.state.queueIndex = (this.state.queueIndex + 1) % queue.length;
          },
        },
        children: ['推进队列'],
      }),
    ]);
  }

  private renderMetrics(): VNode {
    return Div({
      props: { className: 'admin-metrics' },
      children: metrics.map((metric) =>
        Div({
          props: { className: 'admin-card' },
          children: [
            P({
              props: { className: 'admin-card-label' },
              children: [metric.label],
            }),
            Div({
              props: { className: 'admin-card-value' },
              children: [metric.value],
            }),
            Span({
              props: { className: 'admin-delta' },
              children: [metric.delta],
            }),
          ],
        })
      ),
    });
  }

  private renderContent(): VNode {
    return Div({
      props: { className: 'admin-content-grid' },
      children: [
        Div({
          props: { className: 'admin-card' },
          children: [
            h('h2', {}, ['项目健康度']),
            h('table', { className: 'admin-table' }, [
              h('thead', {}, [
                h('tr', {}, [
                  h('th', {}, ['项目']),
                  h('th', {}, ['负责人']),
                  h('th', {}, ['状态']),
                  h('th', {}, ['健康度']),
                ]),
              ]),
              h(
                'tbody',
                {},
                projects.map((project) =>
                  h('tr', {}, [
                    h('td', {}, [project.name]),
                    h('td', {}, [project.owner]),
                    h('td', {}, [
                      Span({
                        props: { className: 'admin-status' },
                        children: [project.status],
                      }),
                    ]),
                    h('td', {}, [project.health]),
                  ])
                )
              ),
            ]),
          ],
        }),
        Div({
          props: { className: 'admin-card' },
          children: [
            h('h2', {}, ['部署队列']),
            {
              component: TransitionGroup,
              props: { type: 'slide-up', duration: 260 },
              children: each(
                [
                  queue[this.state.queueIndex],
                  queue[(this.state.queueIndex + 1) % queue.length],
                ],
                (item, index) =>
                  Div({
                    props: { className: 'admin-queue-item' },
                    children: [
                      Span({
                        props: {
                          className:
                            index === 0
                              ? 'admin-dot admin-dot-active'
                              : 'admin-dot',
                        },
                      }),
                      Span({ children: [item] }),
                    ],
                  }),
                (item) => item
              ),
            },
          ],
        }),
      ],
    });
  }
}

export function createPlaygroundApp() {
  return createApp({
    root: AdminDashboardApp,
    document: {
      lang: 'zh-CN',
      title: 'TSone Playground 后台',
      description:
        'TSone 后台管理页演练，展示 TSone 在业务控制台里的基础体验。',
    },
  });
}

export const app = createPlaygroundApp();
app.mount();
