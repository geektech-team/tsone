import type { StyleSheet } from '../../lib';

const primaryColor = 'rgb(95 217 86)';

export const docsStyles: StyleSheet = [
  {
    selector: ':root',
    properties: {
      colorScheme: 'light',
      '--docs-bg': '#ffffff',
      '--docs-surface': '#f8fafc',
      '--docs-text': '#162033',
      '--docs-muted': '#5f6b7a',
      '--docs-border': '#d9e2ec',
      '--docs-accent': primaryColor,
      '--docs-code-bg': '#0f172a',
      '--docs-code-text': '#e2e8f0',
    },
  },
  {
    selector: ":root[data-theme='dark']",
    properties: {
      colorScheme: 'dark',
      '--docs-bg': '#10141f',
      '--docs-surface': '#171d2b',
      '--docs-text': '#edf2f7',
      '--docs-muted': '#a8b3c2',
      '--docs-border': '#2a3446',
      '--docs-accent': primaryColor,
      '--docs-code-bg': '#060914',
      '--docs-code-text': '#dbeafe',
    },
  },
  {
    selector: 'body',
    properties: {
      margin: 0,
      background: 'var(--docs-bg)',
      color: 'var(--docs-text)',
      fontFamily:
        "ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    },
  },
  {
    selector: '.docs-shell',
    properties: {
      minHeight: '100vh',
    },
  },
  {
    selector: '.docs-topbar',
    properties: {
      alignItems: 'center',
      background: 'var(--docs-bg)',
      borderBottom: '1px solid var(--docs-border)',
      display: 'flex',
      gap: '24px',
      justifyContent: 'space-between',
      left: 0,
      minHeight: '56px',
      padding: '0 28px',
      position: 'fixed',
      right: 0,
      top: 0,
      zIndex: 10,
    },
  },
  {
    selector: '.docs-brand',
    properties: {
      color: 'var(--docs-text)',
      fontSize: '18px',
      fontWeight: 700,
      textDecoration: 'none',
    },
  },
  {
    selector: '.docs-tools',
    properties: {
      alignItems: 'center',
      display: 'flex',
      minHeight: '38px',
    },
  },
  {
    selector: '.docs-layout',
    properties: {
      display: 'block',
      minHeight: 'calc(100vh - 57px)',
      paddingTop: '57px',
    },
  },
  {
    selector: '.docs-sidebar',
    properties: {
      background: 'var(--docs-surface)',
      borderRight: '1px solid var(--docs-border)',
      bottom: 0,
      boxSizing: 'border-box',
      left: 0,
      overflowY: 'auto',
      padding: '20px 18px',
      position: 'fixed',
      top: '57px',
      width: '280px',
    },
  },
  {
    selector: '.docs-search',
    properties: {
      marginBottom: '20px',
      minHeight: '40px',
    },
  },
  {
    selector: '.docs-nav-section + .docs-nav-section',
    properties: {
      marginTop: '22px',
    },
  },
  {
    selector: '.docs-nav h2',
    properties: {
      color: 'var(--docs-muted)',
      fontSize: '12px',
      letterSpacing: 0,
      margin: '0 0 8px',
      textTransform: 'uppercase',
    },
  },
  {
    selector: '.docs-nav ul',
    properties: {
      listStyle: 'none',
      margin: 0,
      padding: 0,
    },
  },
  {
    selector: '.docs-nav a',
    properties: {
      borderRadius: '6px',
      color: 'var(--docs-muted)',
      display: 'block',
      fontSize: '14px',
      lineHeight: 1.4,
      padding: '7px 9px',
      textDecoration: 'none',
    },
  },
  {
    selector: '.docs-nav a.active,\n.docs-nav a:hover',
    properties: {
      background: 'rgba(21, 101, 192, 0.12)',
      color: 'var(--docs-accent)',
    },
  },
  {
    selector: '.docs-main',
    properties: {
      marginLeft: '280px',
      maxWidth: '920px',
      padding: '44px 56px 72px',
    },
  },
  {
    selector: '.doc-section-label',
    properties: {
      color: 'var(--docs-accent)',
      fontSize: '13px',
      fontWeight: 700,
      margin: '0 0 12px',
    },
  },
  {
    selector: '.doc-article h1',
    properties: {
      fontSize: '42px',
      lineHeight: 1.12,
      margin: '0 0 18px',
    },
  },
  {
    selector: '.doc-article h2',
    properties: {
      borderTop: '1px solid var(--docs-border)',
      fontSize: '26px',
      margin: '36px 0 14px',
      paddingTop: '28px',
    },
  },
  {
    selector: '.doc-article h3',
    properties: {
      fontSize: '20px',
      margin: '28px 0 10px',
    },
  },
  {
    selector: '.doc-article p,\n.doc-article li',
    properties: {
      color: 'var(--docs-muted)',
      fontSize: '16px',
      lineHeight: 1.75,
    },
  },
  {
    selector: '.doc-article a',
    properties: {
      color: 'var(--docs-accent)',
    },
  },
  {
    selector: '.doc-article code',
    properties: {
      background: 'var(--docs-surface)',
      border: '1px solid var(--docs-border)',
      borderRadius: '4px',
      color: 'var(--docs-text)',
      fontSize: '0.92em',
      padding: '2px 5px',
    },
  },
  {
    selector: '.doc-article pre',
    properties: {
      background: 'var(--docs-code-bg)',
      borderRadius: '8px',
      color: 'var(--docs-code-text)',
      overflow: 'auto',
      padding: '16px',
    },
  },
  {
    selector: '.doc-article pre code',
    properties: {
      background: 'transparent',
      border: 0,
      color: 'inherit',
      padding: 0,
    },
  },
  {
    selector: '.doc-api-table',
    properties: {
      borderCollapse: 'collapse',
      width: '100%',
    },
  },
  {
    selector: '.doc-api-table th,\n.doc-api-table td',
    properties: {
      borderBottom: '1px solid var(--docs-border)',
      padding: '10px',
      textAlign: 'left',
      verticalAlign: 'top',
    },
  },
  {
    selector: '.doc-callout',
    properties: {
      border: '1px solid var(--docs-border)',
      borderLeft: '4px solid var(--docs-accent)',
      borderRadius: '8px',
      padding: '14px 16px',
    },
  },
  {
    selector: '.docs-search input',
    properties: {
      border: '1px solid var(--docs-border)',
      borderRadius: '6px',
      boxSizing: 'border-box',
      color: 'var(--docs-text)',
      font: 'inherit',
      padding: '8px 10px',
      width: '100%',
    },
  },
  {
    selector: '.docs-search-results',
    properties: {
      listStyle: 'none',
      margin: '10px 0 18px',
      padding: 0,
    },
  },
  {
    selector: '.docs-search-results a',
    properties: {
      color: 'var(--docs-text)',
      display: 'block',
      fontSize: '14px',
      padding: '5px 0',
      textDecoration: 'none',
    },
  },
  {
    selector: '.docs-theme-toggle',
    properties: {
      border: '1px solid var(--docs-border)',
      borderRadius: '6px',
      background: 'var(--docs-surface)',
      color: 'var(--docs-text)',
      cursor: 'pointer',
      font: 'inherit',
      padding: '7px 10px',
    },
  },
  {
    atRule: '@media (max-width: 820px)',
    rules: [
      {
        selector: '.docs-layout',
        properties: {
          display: 'block',
        },
      },
      {
        selector: '.docs-sidebar',
        properties: {
          borderBottom: '1px solid var(--docs-border)',
          borderRight: 0,
          overflowY: 'visible',
          position: 'static',
          width: 'auto',
        },
      },
      {
        selector: '.docs-main',
        properties: {
          marginLeft: 0,
          padding: '32px 22px 56px',
        },
      },
      {
        selector: '.doc-article h1',
        properties: {
          fontSize: '34px',
        },
      },
    ],
  },
];
