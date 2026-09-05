import type { StyleSheet } from '@geektech/tsone';

export const cliDocsStyles: StyleSheet = [
  {
    selector: ':root',
    properties: {
      colorScheme: 'light',
      '--cli-docs-accent': '#5fd956',
      '--cli-docs-accent-dark': '#2f9e44',
      '--cli-docs-text': '#1a1b1c',
      '--cli-docs-text-secondary': '#6b7280',
      '--cli-docs-background': '#f4f3ee',
      '--cli-docs-card': '#ffffff',
      '--cli-docs-border': '#e4e3dd',
      '--cli-docs-code-background': '#f1f0eb',
      '--cli-docs-topbar-height': '56px',
    },
  },
  {
    selector: '*',
    properties: {
      boxSizing: 'border-box',
    },
  },
  {
    selector: 'body',
    properties: {
      margin: '0',
      fontFamily:
        "'Roboto', 'PingFang SC', 'Segoe UI', Arial, sans-serif",
      color: 'var(--cli-docs-text)',
      background: 'var(--cli-docs-background)',
      lineHeight: '1.6',
      fontSize: '14px',
    },
  },
  {
    selector: 'a',
    properties: {
      color: 'var(--cli-docs-accent-dark)',
      textDecoration: 'none',
    },
  },
  {
    selector: 'a:hover',
    properties: {
      textDecoration: 'underline',
    },
  },
  {
    selector: 'code',
    properties: {
      fontFamily: "'SFMono-Regular', Menlo, Consolas, monospace",
      fontSize: '0.9em',
      background: 'var(--cli-docs-code-background)',
      borderRadius: '4px',
      padding: '0.1em 0.35em',
    },
  },
  {
    selector: '.cli-docs-shell',
    properties: {
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
    },
  },
  {
    selector: '.cli-docs-topbar',
    properties: {
      position: 'sticky',
      top: '0',
      zIndex: '10',
      height: 'var(--cli-docs-topbar-height)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 24px',
      background: 'var(--cli-docs-card)',
      borderBottom: '1px solid var(--cli-docs-border)',
    },
  },
  {
    selector: '.cli-docs-brand',
    properties: {
      fontWeight: '600',
      fontSize: '16px',
      color: 'var(--cli-docs-text)',
    },
  },
  {
    selector: '.cli-docs-topbar-end',
    properties: {
      display: 'flex',
      alignItems: 'center',
      gap: '16px',
    },
  },
  {
    selector: '.cli-docs-topnav',
    properties: {
      display: 'flex',
      gap: '16px',
    },
  },
  {
    selector: '.cli-docs-topnav a',
    properties: {
      color: 'var(--cli-docs-text-secondary)',
      fontSize: '13px',
    },
  },
  {
    selector: '.cli-docs-lang-select',
    properties: {
      fontFamily: 'inherit',
      fontSize: '13px',
      padding: '4px 8px',
      borderRadius: '8px',
      border: '1px solid var(--cli-docs-border)',
      background: 'var(--cli-docs-card)',
      color: 'var(--cli-docs-text)',
      cursor: 'pointer',
    },
  },
  {
    selector: '.cli-docs-layout',
    properties: {
      display: 'flex',
      alignItems: 'flex-start',
      gap: '0',
      flex: '1',
      maxWidth: '1200px',
      width: '100%',
      margin: '0 auto',
      padding: '0 24px',
    },
  },
  {
    selector: '.cli-docs-sidebar',
    properties: {
      width: '220px',
      flexShrink: '0',
      padding: '24px 16px 48px 0',
      position: 'sticky',
      top: 'var(--cli-docs-topbar-height)',
      maxHeight: 'calc(100vh - var(--cli-docs-topbar-height))',
      overflowY: 'auto',
    },
  },
  {
    selector: '.cli-docs-nav',
    properties: {
      display: 'flex',
      flexDirection: 'column',
      gap: '20px',
    },
  },
  {
    selector: '.cli-docs-nav-section h2',
    properties: {
      margin: '0 0 8px',
      fontSize: '12px',
      fontWeight: '600',
      color: 'var(--cli-docs-text-secondary)',
      textTransform: 'uppercase',
      letterSpacing: '0.04em',
    },
  },
  {
    selector: '.cli-docs-nav-section ul',
    properties: {
      listStyle: 'none',
      margin: '0',
      padding: '0',
      display: 'flex',
      flexDirection: 'column',
      gap: '2px',
    },
  },
  {
    selector: '.cli-docs-nav-item a',
    properties: {
      display: 'block',
      padding: '6px 10px',
      borderRadius: '8px',
      color: 'var(--cli-docs-text)',
      fontSize: '13px',
    },
  },
  {
    selector: '.cli-docs-nav-item a:hover',
    properties: {
      background: 'var(--cli-docs-card)',
      textDecoration: 'none',
    },
  },
  {
    selector: '.cli-docs-nav-item a.active',
    properties: {
      background: 'var(--cli-docs-card)',
      color: 'var(--cli-docs-accent-dark)',
      fontWeight: '600',
      boxShadow: 'inset 2px 0 0 var(--cli-docs-accent)',
    },
  },
  {
    selector: '.cli-docs-main',
    properties: {
      flex: '1',
      minWidth: '0',
      padding: '24px 32px 64px',
      background: 'var(--cli-docs-card)',
      borderRadius: '12px',
      margin: '24px 0',
      boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
    },
  },
  {
    selector: '.cli-docs-toc',
    properties: {
      width: '200px',
      flexShrink: '0',
      padding: '24px 0 48px 16px',
      position: 'sticky',
      top: 'var(--cli-docs-topbar-height)',
      maxHeight: 'calc(100vh - var(--cli-docs-topbar-height))',
      overflowY: 'auto',
    },
  },
  {
    selector: '.cli-docs-toc-nav strong',
    properties: {
      display: 'block',
      marginBottom: '8px',
      fontSize: '12px',
      color: 'var(--cli-docs-text-secondary)',
    },
  },
  {
    selector: '.cli-docs-toc-nav ol',
    properties: {
      listStyle: 'none',
      margin: '0',
      padding: '0',
      display: 'flex',
      flexDirection: 'column',
      gap: '4px',
    },
  },
  {
    selector: '.cli-docs-toc-nav a',
    properties: {
      color: 'var(--cli-docs-text-secondary)',
      fontSize: '12px',
    },
  },
  {
    selector: '.cli-docs-toc-level-2 a',
    properties: {
      paddingLeft: '0',
    },
  },
  {
    selector: '.cli-docs-toc-level-3 a',
    properties: {
      paddingLeft: '12px',
    },
  },
  {
    selector: '.cli-doc-article',
    properties: {
      maxWidth: '720px',
    },
  },
  {
    selector: '.cli-docs-section-label',
    properties: {
      margin: '0 0 4px',
      fontSize: '12px',
      fontWeight: '600',
      color: 'var(--cli-docs-accent-dark)',
      textTransform: 'uppercase',
      letterSpacing: '0.04em',
    },
  },
  {
    selector: '.cli-doc-article h1',
    properties: {
      margin: '0 0 16px',
      fontSize: '26px',
      lineHeight: '1.3',
    },
  },
  {
    selector: '.cli-doc-article h2',
    properties: {
      margin: '32px 0 12px',
      fontSize: '19px',
      lineHeight: '1.4',
      paddingBottom: '6px',
      borderBottom: '1px solid var(--cli-docs-border)',
    },
  },
  {
    selector: '.cli-doc-article h3',
    properties: {
      margin: '24px 0 8px',
      fontSize: '16px',
    },
  },
  {
    selector: '.cli-doc-article p',
    properties: {
      margin: '12px 0',
      color: 'var(--cli-docs-text)',
    },
  },
  {
    selector: '.cli-doc-article ul',
    properties: {
      margin: '12px 0',
      paddingLeft: '20px',
    },
  },
  {
    selector: '.cli-doc-article li',
    properties: {
      margin: '4px 0',
    },
  },
  {
    selector: '.cli-doc-article pre',
    properties: {
      margin: '16px 0',
      padding: '16px',
      borderRadius: '10px',
      background: '#1f2226',
      overflowX: 'auto',
    },
  },
  {
    selector: '.cli-doc-article pre code',
    properties: {
      background: 'none',
      padding: '0',
      color: '#e6e8ea',
      fontSize: '13px',
      lineHeight: '1.6',
    },
  },
  {
    selector: '.cli-docs-callout',
    properties: {
      margin: '16px 0',
      padding: '12px 16px',
      borderRadius: '10px',
      borderLeft: '3px solid var(--cli-docs-accent)',
      background: 'rgba(95, 217, 86, 0.08)',
    },
  },
  {
    selector: '.cli-docs-callout--tip',
    properties: {
      borderLeftColor: '#94d8c3',
      background: 'rgba(148, 216, 195, 0.12)',
    },
  },
  {
    selector: '.cli-docs-callout strong',
    properties: {
      display: 'block',
      marginBottom: '4px',
      fontSize: '13px',
    },
  },
  {
    selector: '.cli-docs-callout p',
    properties: {
      margin: '0',
      fontSize: '13px',
      color: 'var(--cli-docs-text)',
    },
  },
  {
    selector: '.cli-docs-api-scroll',
    properties: {
      margin: '16px 0',
      overflowX: 'auto',
    },
  },
  {
    selector: '.cli-docs-api-table',
    properties: {
      width: '100%',
      borderCollapse: 'collapse',
      fontSize: '13px',
      background: 'var(--cli-docs-card)',
    },
  },
  {
    selector: '.cli-docs-api-table caption',
    properties: {
      textAlign: 'left',
      fontWeight: '600',
      marginBottom: '8px',
      fontSize: '14px',
    },
  },
  {
    selector: '.cli-docs-api-table th',
    properties: {
      textAlign: 'left',
      padding: '8px 12px',
      borderBottom: '2px solid var(--cli-docs-border)',
      fontSize: '12px',
      color: 'var(--cli-docs-text-secondary)',
      whiteSpace: 'nowrap',
    },
  },
  {
    selector: '.cli-docs-api-table td',
    properties: {
      padding: '8px 12px',
      borderBottom: '1px solid var(--cli-docs-border)',
      verticalAlign: 'top',
    },
  },
  {
    selector: '.cli-docs-api-table td code',
    properties: {
      whiteSpace: 'nowrap',
    },
  },
];
