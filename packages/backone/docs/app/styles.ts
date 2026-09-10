import type { StyleSheet } from '@geektech/tsone';

const documentStyles: StyleSheet = [
  {
    selector: ':root',
    properties: {
      colorScheme: 'light',
      '--backone-docs-accent': '#0f766e',
      '--backone-docs-accent-strong': '#115e59',
      '--backone-docs-accent-soft': 'rgba(15, 118, 110, 0.1)',
      '--backone-docs-bg': '#ffffff',
      '--backone-docs-surface': '#f3f7f5',
      '--backone-docs-text': '#16201e',
      '--backone-docs-muted': '#5f6b67',
      '--backone-docs-border': '#d7e2df',
      '--backone-docs-code-bg': '#0f1a17',
      '--backone-docs-code-text': '#e7f2ee',
      '--backone-docs-link': '#0f766e',
      '--backone-docs-callout-note': '#b45309',
    },
  },
  {
    selector: 'html[data-backone-theme="dark"]',
    properties: {
      colorScheme: 'dark',
      '--backone-docs-accent': '#2dd4bf',
      '--backone-docs-accent-strong': '#5eead4',
      '--backone-docs-accent-soft': 'rgba(45, 212, 191, 0.14)',
      '--backone-docs-bg': '#0f1514',
      '--backone-docs-surface': '#18211f',
      '--backone-docs-text': '#e2ece9',
      '--backone-docs-muted': '#8ba09b',
      '--backone-docs-border': '#2a3835',
      '--backone-docs-code-bg': '#0a110f',
      '--backone-docs-code-text': '#d3eae3',
      '--backone-docs-link': '#5eead4',
      '--backone-docs-callout-note': '#d8a13c',
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
      margin: '0',
      background: 'var(--backone-docs-bg)',
      color: 'var(--backone-docs-text)',
      fontFamily:
        "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      lineHeight: '1.7',
    },
  },
  {
    selector: 'a',
    properties: {
      color: 'var(--backone-docs-link)',
      textDecoration: 'none',
    },
  },
  {
    selector: '.backone-docs-shell',
    properties: {
      minHeight: '100vh',
    },
  },
  {
    selector: '.backone-docs-topbar',
    properties: {
      position: 'sticky',
      top: '0',
      zIndex: '10',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '16px',
      height: '64px',
      padding: '0 24px',
      background: 'rgba(255, 255, 255, 0.96)',
      borderBottom: '1px solid var(--backone-docs-border)',
      backdropFilter: 'blur(8px)',
    },
  },
  {
    selector: 'html[data-backone-theme="dark"] .backone-docs-topbar',
    properties: {
      background: 'rgba(15, 21, 20, 0.96)',
    },
  },
  {
    selector: '.backone-docs-brand',
    properties: {
      fontSize: '18px',
      fontWeight: '700',
      color: 'var(--backone-docs-accent)',
      letterSpacing: '0.02em',
      whiteSpace: 'nowrap',
    },
  },
  {
    selector: '.backone-docs-topbar-end',
    properties: {
      display: 'flex',
      alignItems: 'center',
      gap: '20px',
    },
  },
  {
    selector: '.backone-docs-topnav',
    properties: {
      display: 'flex',
      gap: '16px',
      fontSize: '14px',
    },
  },
  {
    selector: '.backone-docs-topnav a',
    properties: {
      color: 'var(--backone-docs-muted)',
      padding: '6px 2px',
      borderBottom: '2px solid transparent',
    },
  },
  {
    selector: '.backone-docs-topnav a:hover',
    properties: {
      color: 'var(--backone-docs-accent)',
      borderBottomColor: 'var(--backone-docs-accent)',
    },
  },
  {
    selector: '.backone-docs-theme',
    properties: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      cursor: 'pointer',
      fontSize: '13px',
      color: 'var(--backone-docs-muted)',
      userSelect: 'none',
    },
  },
  {
    selector: '.backone-docs-theme-input',
    properties: {
      position: 'absolute',
      opacity: '0',
      pointerEvents: 'none',
    },
  },
  {
    selector: '.backone-docs-theme-track',
    properties: {
      position: 'relative',
      width: '36px',
      height: '20px',
      borderRadius: '999px',
      background: 'var(--backone-docs-border)',
      transition: 'background 0.2s ease',
      flexShrink: '0',
    },
  },
  {
    selector: '.backone-docs-theme-track::after',
    properties: {
      content: "''",
      position: 'absolute',
      top: '2px',
      left: '2px',
      width: '16px',
      height: '16px',
      borderRadius: '999px',
      background: '#ffffff',
      boxShadow: '0 1px 2px rgba(0, 0, 0, 0.25)',
      transition: 'transform 0.2s ease',
    },
  },
  {
    selector: '.backone-docs-theme-input:checked + .backone-docs-theme-track',
    properties: {
      background: 'var(--backone-docs-accent)',
    },
  },
  {
    selector:
      '.backone-docs-theme-input:checked + .backone-docs-theme-track::after',
    properties: {
      transform: 'translateX(16px)',
    },
  },
  {
    selector: '.backone-docs-lang-select',
    properties: {
      padding: '5px 8px',
      borderRadius: '8px',
      border: '1px solid var(--backone-docs-border)',
      background: 'var(--backone-docs-bg)',
      color: 'var(--backone-docs-text)',
      fontSize: '13px',
      cursor: 'pointer',
    },
  },
  {
    selector: '.backone-docs-layout',
    properties: {
      display: 'flex',
      flexWrap: 'wrap',
      alignItems: 'flex-start',
      maxWidth: '1280px',
      margin: '0 auto',
      padding: '32px 24px 64px',
      gap: '32px',
    },
  },
  {
    selector: '.backone-docs-sidebar',
    properties: {
      flex: '0 0 220px',
      minWidth: '0',
    },
  },
  {
    selector: '.backone-docs-main',
    properties: {
      flex: '1 1 480px',
      minWidth: '0',
      maxWidth: '860px',
    },
  },
  {
    selector: '.backone-docs-toc',
    properties: {
      flex: '0 0 200px',
      minWidth: '0',
      position: 'sticky',
      top: '84px',
      maxHeight: 'calc(100vh - 100px)',
      overflowY: 'auto',
    },
  },
  {
    selector: '.backone-docs-nav-section h2',
    properties: {
      fontSize: '12px',
      fontWeight: '700',
      letterSpacing: '0.08em',
      textTransform: 'uppercase',
      color: 'var(--backone-docs-muted)',
      margin: '20px 0 8px',
    },
  },
  {
    selector: '.backone-docs-nav ul',
    properties: {
      listStyle: 'none',
      margin: '0',
      padding: '0',
    },
  },
  {
    selector: '.backone-docs-nav-item',
    properties: {
      margin: '2px 0',
    },
  },
  {
    selector: '.backone-docs-nav-item a',
    properties: {
      display: 'block',
      padding: '6px 10px',
      borderRadius: '8px',
      fontSize: '14px',
      color: 'var(--backone-docs-text)',
    },
  },
  {
    selector: '.backone-docs-nav-item a:hover',
    properties: {
      background: 'var(--backone-docs-accent-soft)',
    },
  },
  {
    selector: '.backone-docs-nav-item a.active',
    properties: {
      background: 'var(--backone-docs-accent-soft)',
      color: 'var(--backone-docs-accent)',
      fontWeight: '600',
    },
  },
  {
    selector: '.backone-doc-article',
    properties: {
      minWidth: '0',
    },
  },
  {
    selector: '.backone-docs-section-label',
    properties: {
      fontSize: '13px',
      fontWeight: '600',
      color: 'var(--backone-docs-accent)',
      margin: '0 0 8px',
    },
  },
  {
    selector: '.backone-doc-article h1',
    properties: {
      fontSize: '32px',
      fontWeight: '800',
      margin: '0 0 16px',
      lineHeight: '1.25',
      letterSpacing: '-0.02em',
    },
  },
  {
    selector: '.backone-doc-article h2',
    properties: {
      fontSize: '22px',
      fontWeight: '700',
      margin: '40px 0 12px',
      paddingTop: '8px',
    },
  },
  {
    selector: '.backone-doc-article h3',
    properties: {
      fontSize: '17px',
      fontWeight: '600',
      margin: '28px 0 8px',
    },
  },
  {
    selector: '.backone-doc-article p',
    properties: {
      fontSize: '15px',
      margin: '12px 0',
    },
  },
  {
    selector: '.backone-doc-article ul',
    properties: {
      paddingLeft: '22px',
      margin: '12px 0',
    },
  },
  {
    selector: '.backone-doc-article li',
    properties: {
      fontSize: '15px',
      margin: '6px 0',
    },
  },
  {
    selector: '.backone-doc-article code',
    properties: {
      fontFamily: "'SF Mono', 'JetBrains Mono', ui-monospace, monospace",
      fontSize: '0.92em',
      background: 'var(--backone-docs-accent-soft)',
      color: 'var(--backone-docs-accent-strong)',
      padding: '1px 5px',
      borderRadius: '5px',
      wordBreak: 'break-word',
    },
  },
  {
    selector: '.backone-doc-article pre',
    properties: {
      margin: '16px 0',
      padding: '16px 18px',
      borderRadius: '10px',
      background: 'var(--backone-docs-code-bg)',
      overflowX: 'auto',
      lineHeight: '1.65',
    },
  },
  {
    selector: '.backone-doc-article pre code',
    properties: {
      display: 'block',
      background: 'transparent',
      color: 'var(--backone-docs-code-text)',
      padding: '0',
      borderRadius: '0',
      fontSize: '13.5px',
      fontFamily: "'SF Mono', 'JetBrains Mono', ui-monospace, monospace",
    },
  },
  {
    selector: '.backone-docs-callout',
    properties: {
      margin: '20px 0',
      padding: '12px 16px',
      borderRadius: '10px',
      background: 'var(--backone-docs-surface)',
      borderLeft: '3px solid var(--backone-docs-accent)',
      fontSize: '14px',
    },
  },
  {
    selector: '.backone-docs-callout--note',
    properties: {
      borderLeftColor: 'var(--backone-docs-callout-note)',
    },
  },
  {
    selector: '.backone-docs-callout strong',
    properties: {
      display: 'block',
      marginBottom: '4px',
      fontSize: '14px',
    },
  },
  {
    selector: '.backone-docs-callout p',
    properties: {
      margin: '0',
      fontSize: '14px',
    },
  },
  {
    selector: '.backone-docs-api-scroll',
    properties: {
      overflowX: 'auto',
      margin: '16px 0',
    },
  },
  {
    selector: '.backone-docs-api-table',
    properties: {
      width: '100%',
      borderCollapse: 'collapse',
      fontSize: '14px',
      background: 'var(--backone-docs-bg)',
    },
  },
  {
    selector: '.backone-docs-api-table caption',
    properties: {
      textAlign: 'left',
      fontSize: '13px',
      fontWeight: '600',
      color: 'var(--backone-docs-muted)',
      padding: '0 0 8px',
    },
  },
  {
    selector: '.backone-docs-api-table th',
    properties: {
      textAlign: 'left',
      padding: '10px 12px',
      borderBottom: '2px solid var(--backone-docs-border)',
      fontSize: '13px',
      color: 'var(--backone-docs-muted)',
      whiteSpace: 'nowrap',
    },
  },
  {
    selector: '.backone-docs-api-table td',
    properties: {
      padding: '10px 12px',
      borderBottom: '1px solid var(--backone-docs-border)',
      verticalAlign: 'top',
    },
  },
  {
    selector: '.backone-docs-api-table td code',
    properties: {
      whiteSpace: 'nowrap',
    },
  },
  {
    selector: '.backone-docs-diagram',
    properties: {
      margin: '20px 0',
    },
  },
  {
    selector: '.backone-docs-diagram-canvas',
    properties: {
      background: 'var(--backone-docs-bg)',
      border: '1px solid var(--backone-docs-border)',
      borderRadius: '10px',
      padding: '10px',
      overflowX: 'auto',
    },
  },
  {
    selector: '.backone-docs-diagram-canvas svg',
    properties: {
      display: 'block',
      width: '100%',
      height: 'auto',
      fontFamily:
        "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    },
  },
  {
    selector: '.backone-docs-diagram figcaption',
    properties: {
      marginTop: '8px',
      textAlign: 'center',
      fontSize: '13px',
      color: 'var(--backone-docs-muted)',
    },
  },
  {
    selector: '.backone-docs-toc-nav strong',
    properties: {
      display: 'block',
      fontSize: '13px',
      fontWeight: '700',
      color: 'var(--backone-docs-muted)',
      marginBottom: '10px',
    },
  },
  {
    selector: '.backone-docs-toc-nav ol',
    properties: {
      listStyle: 'none',
      margin: '0',
      padding: '0',
    },
  },
  {
    selector: '.backone-docs-toc-nav li',
    properties: {
      margin: '4px 0',
      fontSize: '13px',
    },
  },
  {
    selector: '.backone-docs-toc-nav a',
    properties: {
      color: 'var(--backone-docs-muted)',
    },
  },
  {
    selector: '.backone-docs-toc-nav a:hover',
    properties: {
      color: 'var(--backone-docs-accent)',
    },
  },
  {
    selector: '.backone-docs-toc-level-2',
    properties: {
      paddingLeft: '8px',
    },
  },
  {
    selector: '.backone-docs-toc-level-3',
    properties: {
      paddingLeft: '16px',
    },
  },
];

export const backOneDocsStyles = documentStyles;
