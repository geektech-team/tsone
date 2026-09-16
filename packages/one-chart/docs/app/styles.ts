import type { StyleSheet } from '@geektech/tsone';

export const oneChartDocsStyles: StyleSheet = [
  {
    selector: ':root',
    properties: {
      colorScheme: 'light',
      '--one-chart-docs-accent': '#4e79a7',
      '--one-chart-docs-bg': '#ffffff',
      '--one-chart-docs-surface': '#f7f9fb',
      '--one-chart-docs-text': '#1b2430',
      '--one-chart-docs-muted': '#5d6b7a',
      '--one-chart-docs-border': '#dbe3ec',
      '--one-chart-docs-code-bg': '#0f172a',
      '--one-chart-docs-code-text': '#e2e8f0',
      '--one-chart-docs-callout-note': 'rgba(78, 121, 167, 0.1)',
      '--one-chart-docs-callout-tip': 'rgba(89, 161, 79, 0.1)',
    },
  },
  {
    selector: 'html[data-one-chart-theme="dark"]',
    properties: {
      colorScheme: 'dark',
      '--one-chart-docs-accent': '#8fb3d9',
      '--one-chart-docs-bg': '#0f1420',
      '--one-chart-docs-surface': '#171e2c',
      '--one-chart-docs-text': '#e5ebf4',
      '--one-chart-docs-muted': '#93a3b5',
      '--one-chart-docs-border': '#2a3445',
      '--one-chart-docs-code-bg': '#080c14',
      '--one-chart-docs-code-text': '#d7e2f0',
      '--one-chart-docs-callout-note': 'rgba(143, 179, 217, 0.12)',
      '--one-chart-docs-callout-tip': 'rgba(140, 196, 128, 0.12)',
    },
  },
  {
    selector: 'html',
    properties: {
      scrollBehavior: 'smooth',
      scrollPaddingTop: '84px',
    },
  },
  {
    selector: 'body',
    properties: {
      margin: 0,
      background: 'var(--one-chart-docs-bg)',
      color: 'var(--one-chart-docs-text)',
      fontFamily:
        "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    },
  },
  {
    selector: '.one-chart-docs-shell',
    properties: {
      minHeight: '100vh',
    },
  },
  {
    selector: '.one-chart-docs-topbar',
    properties: {
      alignItems: 'center',
      background: 'rgba(255, 255, 255, 0.96)',
      borderBottom: '1px solid var(--one-chart-docs-border)',
      boxSizing: 'border-box',
      display: 'flex',
      height: '64px',
      justifyContent: 'space-between',
      left: 0,
      padding: '0 32px',
      position: 'fixed',
      right: 0,
      top: 0,
      zIndex: 20,
    },
  },
  {
    selector: 'html[data-one-chart-theme="dark"] .one-chart-docs-topbar',
    properties: {
      background: 'rgba(15, 20, 32, 0.96)',
    },
  },
  {
    selector: '.one-chart-docs-brand',
    properties: {
      color: 'var(--one-chart-docs-text)',
      fontSize: '18px',
      fontWeight: 700,
      textDecoration: 'none',
    },
  },
  {
    selector: '.one-chart-docs-topbar-end',
    properties: {
      alignItems: 'center',
      display: 'flex',
      gap: '24px',
    },
  },
  {
    selector: '.one-chart-docs-topnav',
    properties: {
      alignItems: 'center',
      display: 'flex',
      gap: '16px',
    },
  },
  {
    selector: '.one-chart-docs-topnav a',
    properties: {
      color: 'var(--one-chart-docs-muted)',
      fontSize: '14px',
      textDecoration: 'none',
    },
  },
  {
    selector: '.one-chart-docs-theme',
    properties: {
      alignItems: 'center',
      display: 'flex',
      gap: '8px',
    },
  },
  {
    selector: '.one-chart-docs-theme-label',
    properties: {
      color: 'var(--one-chart-docs-muted)',
      fontSize: '13px',
    },
  },
  {
    selector: '.one-chart-docs-theme input[type="checkbox"]',
    properties: {
      accentColor: 'var(--one-chart-docs-accent)',
      cursor: 'pointer',
    },
  },
  {
    selector: '.one-chart-docs-layout',
    properties: {
      display: 'grid',
      gap: '32px',
      gridTemplateColumns: '240px minmax(0, 1fr) 220px',
      margin: '0 auto',
      maxWidth: '1200px',
      padding: '96px 32px 64px',
    },
  },
  {
    selector: '.one-chart-docs-sidebar',
    properties: {
      position: 'sticky',
      top: '96px',
    },
  },
  {
    selector: '.one-chart-docs-nav-section h2',
    properties: {
      color: 'var(--one-chart-docs-muted)',
      fontSize: '12px',
      fontWeight: 600,
      letterSpacing: '0.08em',
      margin: '20px 0 8px',
      textTransform: 'uppercase',
    },
  },
  {
    selector: '.one-chart-docs-nav ul',
    properties: {
      listStyle: 'none',
      margin: 0,
      padding: 0,
    },
  },
  {
    selector: '.one-chart-docs-nav-item a',
    properties: {
      borderLeft: '2px solid transparent',
      color: 'var(--one-chart-docs-muted)',
      display: 'block',
      fontSize: '14px',
      lineHeight: '1.6',
      padding: '4px 8px',
      textDecoration: 'none',
    },
  },
  {
    selector: '.one-chart-docs-nav-item a:hover',
    properties: {
      color: 'var(--one-chart-docs-text)',
    },
  },
  {
    selector: '.one-chart-docs-nav-item a.active',
    properties: {
      borderLeftColor: 'var(--one-chart-docs-accent)',
      color: 'var(--one-chart-docs-text)',
      fontWeight: 600,
    },
  },
  {
    selector: '.one-chart-docs-main',
    properties: {
      minWidth: 0,
    },
  },
  {
    selector: '.one-chart-docs-section-label',
    properties: {
      color: 'var(--one-chart-docs-accent)',
      fontSize: '13px',
      fontWeight: 600,
      letterSpacing: '0.08em',
      margin: '0 0 8px',
      textTransform: 'uppercase',
    },
  },
  {
    selector: '.one-chart-doc-article h1',
    properties: {
      fontSize: '30px',
      margin: '0 0 16px',
    },
  },
  {
    selector: '.one-chart-doc-article h2',
    properties: {
      fontSize: '20px',
      margin: '32px 0 12px',
    },
  },
  {
    selector: '.one-chart-doc-article h3',
    properties: {
      fontSize: '16px',
      margin: '24px 0 8px',
    },
  },
  {
    selector: '.one-chart-doc-article p',
    properties: {
      color: 'var(--one-chart-docs-text)',
      fontSize: '15px',
      lineHeight: '1.75',
    },
  },
  {
    selector: '.one-chart-doc-article a',
    properties: {
      color: 'var(--one-chart-docs-accent)',
    },
  },
  {
    selector: '.one-chart-doc-article code',
    properties: {
      background: 'var(--one-chart-docs-surface)',
      borderRadius: '4px',
      fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
      fontSize: '0.9em',
      padding: '2px 5px',
    },
  },
  {
    selector: '.one-chart-doc-article pre',
    properties: {
      background: 'var(--one-chart-docs-code-bg)',
      borderRadius: '8px',
      color: 'var(--one-chart-docs-code-text)',
      fontSize: '13px',
      lineHeight: '1.6',
      overflowX: 'auto',
      padding: '16px 20px',
    },
  },
  {
    selector: '.one-chart-doc-article pre code',
    properties: {
      background: 'transparent',
      color: 'inherit',
      fontSize: 'inherit',
      padding: 0,
    },
  },
  {
    selector: '.one-chart-doc-article ul',
    properties: {
      lineHeight: '1.75',
      paddingLeft: '24px',
    },
  },
  {
    selector: '.one-chart-docs-callout',
    properties: {
      borderRadius: '8px',
      fontSize: '14px',
      lineHeight: '1.6',
      margin: '20px 0',
      padding: '12px 16px',
    },
  },
  {
    selector: '.one-chart-docs-callout--note',
    properties: {
      background: 'var(--one-chart-docs-callout-note)',
      borderLeft: '3px solid var(--one-chart-docs-accent)',
    },
  },
  {
    selector: '.one-chart-docs-callout--tip',
    properties: {
      background: 'var(--one-chart-docs-callout-tip)',
      borderLeft: '3px solid #59a14f',
    },
  },
  {
    selector: '.one-chart-docs-callout p',
    properties: {
      margin: '4px 0 0',
    },
  },
  {
    selector: '.one-chart-docs-api-scroll',
    properties: {
      overflowX: 'auto',
    },
  },
  {
    selector: '.one-chart-docs-api-table',
    properties: {
      borderCollapse: 'collapse',
      fontSize: '14px',
      margin: '16px 0',
      minWidth: '560px',
      width: '100%',
    },
  },
  {
    selector: '.one-chart-docs-api-table caption',
    properties: {
      color: 'var(--one-chart-docs-muted)',
      fontSize: '13px',
      marginBottom: '8px',
      textAlign: 'left',
    },
  },
  {
    selector: '.one-chart-docs-api-table th',
    properties: {
      borderBottom: '1px solid var(--one-chart-docs-border)',
      color: 'var(--one-chart-docs-muted)',
      fontSize: '12px',
      fontWeight: 600,
      padding: '8px 12px',
      textAlign: 'left',
    },
  },
  {
    selector: '.one-chart-docs-api-table td',
    properties: {
      borderBottom: '1px solid var(--one-chart-docs-border)',
      padding: '8px 12px',
      verticalAlign: 'top',
    },
  },
  {
    selector: '.one-chart-docs-demo',
    properties: {
      margin: '20px 0',
    },
  },
  {
    selector: '.one-chart-docs-demo-preview',
    properties: {
      background: 'var(--one-chart-docs-surface)',
      border: '1px solid var(--one-chart-docs-border)',
      borderRadius: '8px',
      padding: '16px',
    },
  },
  {
    selector: '.one-chart-docs-demo-preview svg',
    properties: {
      display: 'block',
      height: 'auto',
      maxWidth: '100%',
    },
  },
  {
    selector: '.one-chart-docs-demo',
    properties: {
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
    },
  },
  {
    selector: '.one-chart-docs-demo-action',
    properties: {
      alignSelf: 'flex-start',
      background: 'var(--one-chart-docs-accent)',
      border: 'none',
      borderRadius: '6px',
      color: '#ffffff',
      cursor: 'pointer',
      fontSize: '13px',
      padding: '6px 14px',
    },
  },
  {
    selector: '.one-chart-docs-demo-source summary',
    properties: {
      color: 'var(--one-chart-docs-muted)',
      cursor: 'pointer',
      fontSize: '13px',
      userSelect: 'none',
    },
  },
  {
    selector: '.one-chart-docs-toc',
    properties: {
      fontSize: '13px',
      position: 'sticky',
      top: '96px',
    },
  },
  {
    selector: '.one-chart-docs-toc-nav strong',
    properties: {
      color: 'var(--one-chart-docs-muted)',
      display: 'block',
      fontSize: '12px',
      fontWeight: 600,
      letterSpacing: '0.08em',
      marginBottom: '8px',
      textTransform: 'uppercase',
    },
  },
  {
    selector: '.one-chart-docs-toc-nav ol',
    properties: {
      listStyle: 'none',
      margin: 0,
      padding: 0,
    },
  },
  {
    selector: '.one-chart-docs-toc-nav li',
    properties: {
      margin: '4px 0',
    },
  },
  {
    selector: '.one-chart-docs-toc-nav a',
    properties: {
      color: 'var(--one-chart-docs-muted)',
      textDecoration: 'none',
    },
  },
  {
    selector: '.one-chart-docs-toc-level-2',
    properties: {
      paddingLeft: '8px',
    },
  },
  {
    selector: '.one-chart-docs-toc-level-3',
    properties: {
      paddingLeft: '16px',
    },
  },
  {
    selector: 'html[data-one-chart-theme="dark"] .one-chart-docs-demo-action',
    properties: {
      color: '#0f1420',
    },
  },
];
