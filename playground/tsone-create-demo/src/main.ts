import { Component, createApp, h, type VNode } from '@geektech/tsone';

class App extends Component<object, object> {
  protected initState(): object {
    return {};
  }

  protected initStyles(): void {
    this.styleManager.addStyle('app-body', {
      selector: 'body',
      properties: {
        margin: 0,
        background: '#f7fbf6',
        color: '#142216',
        fontFamily:
          "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif",
      },
    });
    this.styleManager.addStyle('app-shell', {
      selector: '.app-shell',
      properties: {
        alignItems: 'center',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
        justifyContent: 'center',
        minHeight: '100vh',
      },
    });
    this.styleManager.addStyle('app-title', {
      selector: '.app-title',
      properties: {
        fontSize: '64px',
        letterSpacing: 0,
        lineHeight: 1.05,
        margin: 0,
      },
    });
    this.styleManager.addStyle('app-link', {
      selector: '.app-link',
      properties: {
        color: '#2f7c39',
        fontSize: '16px',
        textDecoration: 'none',
      },
      hover: {
        textDecoration: 'underline',
      },
    });
  }

  protected render(): VNode {
    return h('main', { className: 'app-shell' }, [
      h('h1', { className: 'app-title' }, ['TSone']),
      h(
        'a',
        { className: 'app-link', href: 'https://github.com/geektech-team/tsone' },
        ['GitHub']
      ),
    ]);
  }
}

export const app = createApp({
  root: App,
  document: {
    lang: 'zh-CN',
    title: 'TSone',
    description: '轻量级纯 TypeScript 前端框架',
  },
});

app.mount();
