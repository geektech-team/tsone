import {
  Button,
  Component,
  Div,
  P,
  Span,
  createApp,
  h,
  type VNode,
} from '@geektech/tsone';

type NamedStyle = {
  name: string;
  selector: string;
  properties: Record<string, string | number>;
  media?: Record<string, Record<string, string | number>>;
};

interface SiteState {
  selectedFeature: number;
}

const features = [
  {
    title: '类组件',
    text: '用继承和生命周期组织 UI，保持面向对象的清晰边界。',
  },
  {
    title: '响应式',
    text: '状态变化自动驱动渲染，不需要额外运行时依赖。',
  },
  {
    title: 'Typed DOM',
    text: 'VNode、样式和文档内容都用 TypeScript 对象表达。',
  },
];

class OfficialSiteApp extends Component<object, SiteState> {
  protected initState(): SiteState {
    return { selectedFeature: 0 };
  }

  protected initStyles(): void {
    const styles: NamedStyle[] = [
      {
        name: 'site-body',
        selector: 'body',
        properties: {
          margin: 0,
          background: '#f7fbf6',
          color: '#142216',
          fontFamily:
            "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        },
      },
      {
        name: 'site-shell',
        selector: '.site-shell',
        properties: {
          minHeight: '100vh',
          padding: '28px',
        },
      },
      {
        name: 'site-nav',
        selector: '.site-nav',
        properties: {
          alignItems: 'center',
          display: 'flex',
          justifyContent: 'space-between',
          margin: '0 auto',
          maxWidth: '1120px',
        },
      },
      {
        name: 'site-brand',
        selector: '.site-brand',
        properties: {
          alignItems: 'center',
          display: 'flex',
          fontWeight: 800,
          gap: '10px',
        },
      },
      {
        name: 'site-mark',
        selector: '.site-mark',
        properties: {
          background: 'rgb(95 217 86)',
          borderRadius: '6px',
          display: 'inline-block',
          height: '22px',
          width: '22px',
        },
      },
      {
        name: 'site-nav-link',
        selector: '.site-nav-link',
        properties: {
          color: '#33513a',
          fontSize: '14px',
          marginLeft: '20px',
          textDecoration: 'none',
        },
      },
      {
        name: 'site-hero',
        selector: '.site-hero',
        properties: {
          alignItems: 'center',
          display: 'grid',
          gap: '44px',
          gridTemplateColumns: 'minmax(0, 1.05fr) minmax(340px, 0.95fr)',
          margin: '82px auto 0',
          maxWidth: '1120px',
        },
      },
      {
        name: 'site-eyebrow',
        selector: '.site-eyebrow',
        properties: {
          color: '#2f7c39',
          fontSize: '14px',
          fontWeight: 700,
          marginBottom: '14px',
        },
      },
      {
        name: 'site-title',
        selector: '.site-title',
        properties: {
          fontSize: '58px',
          letterSpacing: 0,
          lineHeight: 1.02,
          margin: 0,
        },
      },
      {
        name: 'site-copy',
        selector: '.site-copy',
        properties: {
          color: '#47624d',
          fontSize: '18px',
          lineHeight: 1.7,
          margin: '22px 0 0',
          maxWidth: '620px',
        },
      },
      {
        name: 'site-actions',
        selector: '.site-actions',
        properties: {
          display: 'flex',
          gap: '12px',
          marginTop: '30px',
        },
      },
      {
        name: 'site-button',
        selector: '.site-button',
        properties: {
          border: '1px solid #b7d8b2',
          borderRadius: '6px',
          cursor: 'pointer',
          font: 'inherit',
          fontWeight: 700,
          padding: '12px 18px',
        },
      },
      {
        name: 'site-button-primary',
        selector: '.site-button-primary',
        properties: {
          background: 'rgb(95 217 86)',
          color: '#0f210d',
        },
      },
      {
        name: 'site-button-secondary',
        selector: '.site-button-secondary',
        properties: {
          background: '#ffffff',
          color: '#213b25',
        },
      },
      {
        name: 'site-panel',
        selector: '.site-panel',
        properties: {
          background: '#ffffff',
          border: '1px solid #d9ead5',
          borderRadius: '8px',
          boxShadow: '0 24px 70px rgba(32, 74, 38, 0.12)',
          padding: '22px',
        },
      },
      {
        name: 'site-code',
        selector: '.site-code',
        properties: {
          background: '#101914',
          borderRadius: '8px',
          color: '#ddf8dc',
          lineHeight: 1.7,
          margin: 0,
          overflow: 'auto',
          padding: '18px',
        },
      },
      {
        name: 'site-feature-grid',
        selector: '.site-feature-grid',
        properties: {
          display: 'grid',
          gap: '14px',
          gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
          margin: '64px auto 0',
          maxWidth: '1120px',
        },
      },
      {
        name: 'site-feature',
        selector: '.site-feature',
        properties: {
          background: '#ffffff',
          border: '1px solid #d9ead5',
          borderRadius: '8px',
          padding: '18px',
        },
      },
      {
        name: 'site-feature-active',
        selector: '.site-feature-active',
        properties: {
          borderColor: 'rgb(95 217 86)',
          boxShadow: 'inset 0 0 0 1px rgb(95 217 86)',
        },
      },
      {
        name: 'site-mobile',
        selector: '.site-hero',
        properties: {},
        media: {
          '(max-width: 860px)': {
            gridTemplateColumns: '1fr',
            marginTop: '48px',
          },
        },
      },
    ];

    styles.forEach((style) => this.styleManager.addStyle(style.name, style));
  }

  protected render(): VNode {
    return {
      tag: 'main',
      props: { className: 'site-shell' },
      children: [this.renderNav(), this.renderHero(), this.renderFeatures()],
    };
  }

  private renderNav(): VNode {
    return h('header', { className: 'site-nav' }, [
      Div({
        props: { className: 'site-brand' },
        children: [
          Span({ props: { className: 'site-mark' } }),
          Span({ children: ['TSone'] }),
        ],
      }),
      h('nav', {}, [
        h('a', { className: 'site-nav-link', href: '#features' }, ['能力']),
        h('a', { className: 'site-nav-link', href: '../admin-dashboard/' }, [
          '后台演练',
        ]),
      ]),
    ]);
  }

  private renderHero(): VNode {
    return h('section', { className: 'site-hero' }, [
      Div({
        children: [
          Div({
            props: { className: 'site-eyebrow' },
            children: ['Bun-first · zero runtime dependencies'],
          }),
          h('h1', { className: 'site-title' }, ['纯 TypeScript 前端框架']),
          P({
            props: { className: 'site-copy' },
            children: [
              'TSone 用类组件、响应式状态和策略化 DOM 渲染，把界面开发保持在 TypeScript 的一个语言系统里。',
            ],
          }),
          Div({
            props: { className: 'site-actions' },
            children: [
              Button({
                props: { className: 'site-button site-button-primary' },
                listeners: {
                  click: () => {
                    window.location.href = '../admin-dashboard/';
                  },
                },
                children: ['查看后台演练'],
              }),
              Button({
                props: { className: 'site-button site-button-secondary' },
                listeners: {
                  click: () => {
                    this.state.selectedFeature =
                      (this.state.selectedFeature + 1) % features.length;
                  },
                },
                children: ['切换特性'],
              }),
            ],
          }),
        ],
      }),
      Div({
        props: { className: 'site-panel' },
        children: [
          h('pre', { className: 'site-code' }, [
            [
              'class App extends Component<Props, State> {',
              '  protected render(): VNode {',
              "    return Div({ children: ['Hello TSone'] });",
              '  }',
              '}',
              '',
              'const app = createApp({',
              '  root: App,',
              "  document: { title: 'TSone App' },",
              '});',
              '',
              'app.mount();',
            ].join('\n'),
          ]),
        ],
      }),
    ]);
  }

  private renderFeatures(): VNode {
    return h(
      'section',
      { id: 'features', className: 'site-feature-grid' },
      features.map((feature, index) =>
        Div({
          props: {
            className:
              index === this.state.selectedFeature
                ? 'site-feature site-feature-active'
                : 'site-feature',
          },
          children: [
            h('h2', {}, [feature.title]),
            P({ children: [feature.text] }),
          ],
        })
      )
    );
  }
}

export function createPlaygroundApp() {
  return createApp({
    root: OfficialSiteApp,
    document: {
      lang: 'zh-CN',
      title: 'TSone Playground 官网',
      description: 'TSone 纯 TypeScript 前端框架官网首页演练。',
    },
  });
}

export const app = createPlaygroundApp();
app.mount();
