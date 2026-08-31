import type { StyleSheet } from '@geektech/tsone';
import { ONE_BUTTON_STYLES } from '../../lib/button/OneButton';
import { ONE_CARD_STYLES } from '../../lib/card/OneCard';
import { ONE_INPUT_STYLES } from '../../lib/input/OneInput';
import { ONE_CHECKBOX_STYLES } from '../../lib/checkbox/OneCheckbox';
import { ONE_FORM_ITEM_STYLES } from '../../lib/form/OneFormItem';
import { ONE_FORM_STYLES } from '../../lib/form/OneForm';
import { ONE_SELECT_STYLES } from '../../lib/select/OneSelect';
import { ONE_SWITCH_STYLES } from '../../lib/switch/OneSwitch';
import { ONE_ALERT_STYLES } from '../../lib/alert/OneAlert';
import { ONE_DIALOG_STYLES } from '../../lib/dialog/DialogOverlay';
import { ONE_MESSAGE_STYLES } from '../../lib/message/MessageOverlay';
import { ONE_TOOLTIP_STYLES } from '../../lib/tooltip/TooltipBubble';
import { oneStylesToSheet } from '../../lib/styles/shared';

const documentStyles: StyleSheet = [
  {
    selector: ':root',
    properties: {
      colorScheme: 'light',
      '--one-docs-green': '#5fd956',
      '--one-docs-green-strong': '#2f7c39',
      '--one-docs-bg': '#ffffff',
      '--one-docs-surface': '#f6faf5',
      '--one-docs-text': '#162018',
      '--one-docs-muted': '#647268',
      '--one-docs-border': '#d9e8d6',
      '--one-docs-code-bg': '#102016',
      '--one-docs-code-text': '#e8f5e7',
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
      background: 'var(--one-docs-bg)',
      color: 'var(--one-docs-text)',
      fontFamily:
        "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    },
  },
  {
    selector: '.one-docs-shell',
    properties: {
      minHeight: '100vh',
    },
  },
  {
    selector: '.one-docs-topbar',
    properties: {
      alignItems: 'center',
      background: 'rgba(255, 255, 255, 0.96)',
      borderBottom: '1px solid var(--one-docs-border)',
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
    selector: '.one-docs-brand',
    properties: {
      color: 'var(--one-docs-text)',
      fontSize: '19px',
      fontWeight: 750,
      letterSpacing: '-0.02em',
      textDecoration: 'none',
    },
  },
  {
    selector: '.one-docs-brand::before',
    properties: {
      background: 'var(--one-docs-green)',
      borderRadius: '50%',
      content: "''",
      display: 'inline-block',
      height: '10px',
      marginRight: '10px',
      width: '10px',
    },
  },
  {
    selector: '.one-docs-topnav',
    properties: {
      alignItems: 'center',
      display: 'flex',
      gap: '24px',
    },
  },
  {
    selector: '.one-docs-topnav a',
    properties: {
      color: 'var(--one-docs-muted)',
      fontSize: '14px',
      fontWeight: 500,
      textDecoration: 'none',
    },
  },
  {
    selector: '.one-docs-topnav a:hover',
    properties: {
      color: 'var(--one-docs-green-strong)',
    },
  },
  {
    selector: '.one-docs-layout',
    properties: {
      boxSizing: 'border-box',
      display: 'grid',
      gap: 0,
      gridTemplateColumns: '240px minmax(0, 1fr) 180px',
      margin: '0 auto',
      maxWidth: '1440px',
      minHeight: '100vh',
      paddingTop: '64px',
    },
  },
  {
    selector: '.one-docs-sidebar',
    properties: {
      alignSelf: 'start',
      background: 'var(--one-docs-surface)',
      borderRight: '1px solid var(--one-docs-border)',
      boxSizing: 'border-box',
      height: 'calc(100vh - 64px)',
      overflowY: 'auto',
      padding: '28px 20px 48px',
      position: 'sticky',
      top: '64px',
      width: '240px',
    },
  },
  {
    selector: '.one-docs-nav-section + .one-docs-nav-section',
    properties: {
      marginTop: '26px',
    },
  },
  {
    selector: '.one-docs-nav h2',
    properties: {
      color: 'var(--one-docs-muted)',
      fontSize: '12px',
      letterSpacing: '0.08em',
      margin: '0 0 8px',
      textTransform: 'uppercase',
    },
  },
  {
    selector: '.one-docs-nav ul,\n.one-docs-toc ol',
    properties: {
      listStyle: 'none',
      margin: 0,
      padding: 0,
    },
  },
  {
    selector: '.one-docs-nav a',
    properties: {
      borderRadius: '6px',
      color: 'var(--one-docs-muted)',
      display: 'block',
      fontSize: '14px',
      lineHeight: 1.4,
      padding: '8px 10px',
      textDecoration: 'none',
    },
  },
  {
    selector: '.one-docs-nav a.active,\n.one-docs-nav a:hover',
    properties: {
      background: 'rgba(95, 217, 86, 0.14)',
      color: 'var(--one-docs-green-strong)',
    },
  },
  {
    selector: '.one-docs-main',
    properties: {
      boxSizing: 'border-box',
      minWidth: 0,
      padding: '52px 56px 88px',
    },
  },
  {
    selector: '.one-doc-article',
    properties: {
      margin: '0 auto',
      maxWidth: '760px',
    },
  },
  {
    selector: '.one-docs-toc',
    properties: {
      alignSelf: 'start',
      boxSizing: 'border-box',
      padding: '52px 20px 40px 0',
      position: 'sticky',
      top: '64px',
      width: '180px',
    },
  },
  {
    selector: '.one-docs-toc-nav > strong',
    properties: {
      color: 'var(--one-docs-text)',
      display: 'block',
      fontSize: '13px',
      marginBottom: '10px',
    },
  },
  {
    selector: '.one-docs-toc a',
    properties: {
      borderLeft: '2px solid var(--one-docs-border)',
      color: 'var(--one-docs-muted)',
      display: 'block',
      fontSize: '12px',
      lineHeight: 1.45,
      padding: '5px 0 5px 10px',
      textDecoration: 'none',
    },
  },
  {
    selector: '.one-docs-toc a:hover',
    properties: {
      borderLeftColor: 'var(--one-docs-green)',
      color: 'var(--one-docs-green-strong)',
    },
  },
  {
    selector: '.one-docs-toc-level-2 a',
    properties: {
      paddingLeft: '18px',
    },
  },
  {
    selector: '.one-docs-toc-level-3 a',
    properties: {
      paddingLeft: '26px',
    },
  },
  {
    selector: '.one-docs-section-label',
    properties: {
      color: 'var(--one-docs-green-strong)',
      fontSize: '13px',
      fontWeight: 700,
      margin: '0 0 12px',
    },
  },
  {
    selector: '.one-doc-article h1',
    properties: {
      fontSize: '42px',
      letterSpacing: '-0.035em',
      lineHeight: 1.12,
      margin: '0 0 18px',
    },
  },
  {
    selector: '.one-doc-article h2',
    properties: {
      borderTop: '1px solid var(--one-docs-border)',
      fontSize: '26px',
      lineHeight: 1.25,
      margin: '42px 0 16px',
      paddingTop: '32px',
    },
  },
  {
    selector: '.one-doc-article h3',
    properties: {
      fontSize: '20px',
      margin: '30px 0 12px',
    },
  },
  {
    selector: '.one-doc-article p,\n.one-doc-article li',
    properties: {
      color: 'var(--one-docs-muted)',
      fontSize: '16px',
      lineHeight: 1.75,
    },
  },
  {
    selector: '.one-doc-article a',
    properties: {
      color: 'var(--one-docs-green-strong)',
    },
  },
  {
    selector: '.one-doc-article code',
    properties: {
      background: 'var(--one-docs-surface)',
      border: '1px solid var(--one-docs-border)',
      borderRadius: '4px',
      color: 'var(--one-docs-text)',
      fontSize: '0.92em',
      padding: '2px 5px',
    },
  },
  {
    selector: '.one-doc-article pre',
    properties: {
      background: 'var(--one-docs-code-bg)',
      borderRadius: '10px',
      color: 'var(--one-docs-code-text)',
      lineHeight: 1.6,
      overflow: 'auto',
      padding: '18px 20px',
    },
  },
  {
    selector: '.one-doc-article pre code',
    properties: {
      background: 'transparent',
      border: 0,
      color: 'inherit',
      padding: 0,
    },
  },
  {
    selector: '.one-docs-callout',
    properties: {
      background: 'var(--one-docs-surface)',
      border: '1px solid var(--one-docs-border)',
      borderLeft: '4px solid var(--one-docs-green)',
      borderRadius: '8px',
      margin: '20px 0',
      padding: '14px 16px',
    },
  },
  {
    selector: '.one-docs-callout p',
    properties: {
      margin: '6px 0 0',
    },
  },
  {
    selector: '.one-docs-api-scroll',
    properties: {
      overflowX: 'auto',
    },
  },
  {
    selector: '.one-docs-api-table',
    properties: {
      borderCollapse: 'collapse',
      fontSize: '14px',
      minWidth: '640px',
      width: '100%',
    },
  },
  {
    selector: '.one-docs-api-table caption',
    properties: {
      color: 'var(--one-docs-text)',
      fontSize: '14px',
      fontWeight: 700,
      padding: '16px 10px 8px',
      textAlign: 'left',
    },
  },
  {
    selector: '.one-docs-api-table th,\n.one-docs-api-table td',
    properties: {
      borderBottom: '1px solid var(--one-docs-border)',
      padding: '11px 10px',
      textAlign: 'left',
      verticalAlign: 'top',
    },
  },
  {
    selector: '.one-docs-api-table th',
    properties: {
      color: 'var(--one-docs-text)',
      fontSize: '12px',
    },
  },
  {
    selector: '.one-docs-api-table td',
    properties: {
      color: 'var(--one-docs-muted)',
    },
  },
  {
    selector: '.one-docs-demo',
    properties: {
      border: '1px solid var(--one-docs-border)',
      borderRadius: '10px',
      margin: '24px 0',
      overflow: 'hidden',
    },
  },
  {
    selector: '.one-docs-demo-preview',
    properties: {
      alignItems: 'center',
      display: 'flex',
      flexWrap: 'wrap',
      gap: '14px',
      padding: '24px',
    },
  },
  {
    selector: '.one-docs-demo-preview > .one-input',
    properties: {
      maxWidth: '220px',
    },
  },
  {
    selector: '.one-docs-demo-preview > .one-card',
    properties: {
      maxWidth: '440px',
      width: '100%',
    },
  },
  {
    selector: '.one-docs-demo-preview > .one-alert',
    properties: { width: '100%' },
  },
  {
    selector: '.one-docs-demo-preview > .one-message',
    properties: { maxWidth: '420px', width: '100%' },
  },
  {
    selector: '.one-docs-demo-preview > .one-dialog',
    properties: { maxWidth: '520px', width: '100%' },
  },
  {
    selector: '.one-docs-demo-preview > .one-tooltip__bubble',
    properties: { position: 'relative', left: 0, top: 0 },
  },
  {
    selector: '[data-one-demo]',
    properties: {
      borderTop: '1px dashed var(--one-docs-border)',
      minHeight: '1px',
    },
  },
  {
    selector: '.one-docs-feedback-stack',
    properties: {
      display: 'grid',
      gap: '12px',
      padding: '24px',
    },
  },
  {
    selector: '.one-docs-feedback-actions, .one-docs-dialog-demo',
    properties: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: '10px',
      padding: '24px',
    },
  },
  {
    selector: '.one-docs-dialog-container',
    properties: {
      position: 'relative',
      width: '100%',
      height: '240px',
      overflow: 'hidden',
      border: '1px dashed var(--one-docs-border)',
      borderRadius: '8px',
    },
  },
  {
    selector: '.one-docs-tooltip-demo',
    properties: {
      display: 'grid',
      gap: '14px',
      padding: '24px',
    },
  },
  {
    selector: '.one-docs-tooltip-edge',
    properties: {
      position: 'relative',
      minHeight: '120px',
      border: '1px dashed var(--one-docs-border)',
      borderRadius: '8px',
      padding: '8px',
    },
  },
  {
    atRule: '@media (max-width: 900px)',
    rules: [
      {
        selector: '.one-docs-topbar',
        properties: {
          padding: '0 20px',
        },
      },
      {
        selector: '.one-docs-layout',
        properties: {
          gridTemplateColumns: 'minmax(0, 1fr)',
        },
      },
      {
        selector: '.one-docs-sidebar',
        properties: {
          borderBottom: '1px solid var(--one-docs-border)',
          borderRight: 0,
          height: 'auto',
          overflowY: 'visible',
          position: 'static',
          width: 'auto',
        },
      },
      {
        selector: '.one-docs-main',
        properties: {
          padding: '38px 22px 64px',
        },
      },
      {
        selector: '.one-docs-toc',
        properties: {
          display: 'none',
        },
      },
      {
        selector: '.one-doc-article h1',
        properties: {
          fontSize: '34px',
        },
      },
    ],
  },
];

export const oneDocsStyles: StyleSheet = [
  ...oneStylesToSheet(ONE_BUTTON_STYLES),
  ...oneStylesToSheet(ONE_INPUT_STYLES),
  ...oneStylesToSheet(ONE_CARD_STYLES),
  ...oneStylesToSheet(ONE_FORM_STYLES),
  ...oneStylesToSheet(ONE_FORM_ITEM_STYLES),
  ...oneStylesToSheet(ONE_SELECT_STYLES),
  ...oneStylesToSheet(ONE_CHECKBOX_STYLES),
  ...oneStylesToSheet(ONE_SWITCH_STYLES),
  ...oneStylesToSheet(ONE_ALERT_STYLES),
  ...oneStylesToSheet(ONE_MESSAGE_STYLES),
  ...oneStylesToSheet(ONE_DIALOG_STYLES),
  ...oneStylesToSheet(ONE_TOOLTIP_STYLES),
  ...documentStyles,
];
