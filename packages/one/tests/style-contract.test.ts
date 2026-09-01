import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { ONE_ALERT_STYLES } from '../lib/alert/OneAlert';
import { ONE_BADGE_STYLES } from '../lib/badge/OneBadge';
import { ONE_BREADCRUMB_STYLES } from '../lib/breadcrumb/OneBreadcrumb';
import { ONE_BUTTON_STYLES } from '../lib/button/OneButton';
import { ONE_CARD_STYLES } from '../lib/card/OneCard';
import { ONE_CHECKBOX_STYLES } from '../lib/checkbox/OneCheckbox';
import { ONE_CHECKBOX_GROUP_STYLES } from '../lib/checkbox/OneCheckboxGroup';
import { ONE_DIALOG_STYLES } from '../lib/dialog/DialogOverlay';
import { ONE_EMPTY_STYLES } from '../lib/empty/OneEmpty';
import { ONE_FORM_STYLES } from '../lib/form/OneForm';
import { ONE_FORM_ITEM_STYLES } from '../lib/form/OneFormItem';
import { ONE_INPUT_STYLES } from '../lib/input/OneInput';
import { ONE_MESSAGE_STYLES } from '../lib/message/MessageOverlay';
import { ONE_PAGINATION_STYLES } from '../lib/pagination/OnePagination';
import { ONE_SELECT_STYLES } from '../lib/select/OneSelect';
import {
  ONE_THEME_DEFAULTS,
  ONE_THEME_TYPOGRAPHY_PROPERTIES,
  oneThemeBorder,
  type OneNamedStyle,
} from '../lib/styles/shared';
import { ONE_SWITCH_STYLES } from '../lib/switch/OneSwitch';
import { ONE_TABS_STYLES } from '../lib/tabs/OneTabs';
import { ONE_TAG_STYLES } from '../lib/tag/OneTag';
import { ONE_TOOLTIP_STYLES } from '../lib/tooltip/TooltipBubble';
import {
  OneAlert,
  OneBadge,
  OneBreadcrumb,
  OneButton,
  OneCard,
  OneDialog,
  OneEmpty,
  OneInput,
  OneMessage,
  OnePagination,
  OneTag,
  OneTabs,
  OneTooltip,
} from '../lib';

const COMPONENT_STYLE_GROUPS = [
  ONE_ALERT_STYLES,
  ONE_BADGE_STYLES,
  ONE_BREADCRUMB_STYLES,
  ONE_BUTTON_STYLES,
  ONE_CARD_STYLES,
  ONE_CHECKBOX_STYLES,
  ONE_CHECKBOX_GROUP_STYLES,
  ONE_DIALOG_STYLES,
  ONE_EMPTY_STYLES,
  ONE_FORM_STYLES,
  ONE_FORM_ITEM_STYLES,
  ONE_INPUT_STYLES,
  ONE_MESSAGE_STYLES,
  ONE_PAGINATION_STYLES,
  ONE_SELECT_STYLES,
  ONE_SWITCH_STYLES,
  ONE_TABS_STYLES,
  ONE_TAG_STYLES,
  ONE_TOOLTIP_STYLES,
] as const;

function styleByName(name: string): OneNamedStyle {
  const style = COMPONENT_STYLE_GROUPS.flat().find(
    (candidate) => candidate.name === name
  );
  if (!style) {
    throw new Error(`Missing style: ${name}`);
  }
  return style;
}

const EXPECTED_THEME_DEFAULTS = {
  colorPrimary: '#5fd956',
  colorPrimaryHover: '#4bc944',
  colorDanger: '#b83232',
  colorDangerHover: '#9f2d2d',
  colorInfo: '#2563eb',
  colorSuccess: '#2f7c39',
  colorWarning: '#9a6700',
  colorOverlay: 'rgba(22, 32, 24, 0.48)',
  colorSurface: '#ffffff',
  colorText: '#162018',
  colorMuted: '#647268',
  colorBorder: '#d9e8d6',
  colorFocus: '#2f7c39',
  radiusSm: '4px',
  radiusMd: '8px',
  spaceXs: '4px',
  spaceSm: '8px',
  spaceMd: '12px',
  spaceLg: '16px',
  fontSizeSm: '12px',
  fontSizeMd: '14px',
  fontSizeLg: '16px',
  shadowCard: '0 12px 30px rgba(32, 74, 38, 0.1)',
  shadowOverlay: '0 18px 48px rgba(22, 32, 24, 0.2)',
  zIndexDialog: '1000',
  zIndexMessage: '1100',
  zIndexTooltip: '1200',
  fontFamily:
    "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
} as const;

function hexFallback(value: string | number | undefined): string {
  if (typeof value !== 'string') {
    throw new Error(`Expected a CSS string, received ${String(value)}`);
  }

  const matches = value.match(/#[0-9a-f]{6}/gi);
  const fallback = matches?.[matches.length - 1];
  if (!fallback) {
    throw new Error(`Missing hex fallback in ${value}`);
  }
  return fallback.toLowerCase();
}

function relativeLuminance(hex: string): number {
  const channels = hex
    .slice(1)
    .match(/.{2}/g)
    ?.map((channel) => Number.parseInt(channel, 16) / 255);
  if (!channels || channels.length !== 3) {
    throw new Error(`Invalid RGB hex color: ${hex}`);
  }

  const [red, green, blue] = channels.map((channel) =>
    channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4
  );
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}

function contrastRatio(foreground: string, background: string): number {
  const luminances = [
    relativeLuminance(foreground),
    relativeLuminance(background),
  ].sort((left, right) => right - left);
  return (luminances[0] + 0.05) / (luminances[1] + 0.05);
}

describe('One UI style contract', () => {
  let container: HTMLElement;
  let components: Array<
    | OneButton
    | OneInput
    | OneCard
    | OneTag
    | OneBadge
    | OneEmpty
    | OneAlert
    | OneMessage
    | OneDialog
    | OneTooltip
    | OneTabs
    | OneBreadcrumb
    | OnePagination
  >;

  beforeEach(() => {
    document.head.innerHTML = '';
    container = document.createElement('div');
    document.body.appendChild(container);
    components = [];
  });

  afterEach(() => {
    components.forEach((component) => component.unmount());
    container.remove();
  });

  it('publishes the exact immutable theme defaults', () => {
    expect(ONE_THEME_DEFAULTS).toEqual(EXPECTED_THEME_DEFAULTS);
    expect(Object.keys(ONE_THEME_DEFAULTS)).toEqual(
      Object.keys(EXPECTED_THEME_DEFAULTS)
    );
  });

  it('applies global theme typography to every semantic component root', () => {
    const roots = [
      'one-alert-base',
      'one-badge-base',
      'one-breadcrumb-base',
      'one-button-base',
      'one-card-base',
      'one-checkbox-base',
      'one-checkbox-group-base',
      'one-dialog-panel',
      'one-empty-base',
      'one-form-base',
      'one-form-item-base',
      'one-input-base',
      'one-message-base',
      'one-pagination-base',
      'one-select-base',
      'one-switch-base',
      'one-tabs-base',
      'one-tag-base',
      'one-tooltip-bubble',
    ];

    roots.forEach((name) => {
      expect(styleByName(name).properties.fontFamily).toBe(
        ONE_THEME_TYPOGRAPHY_PROPERTIES.fontFamily
      );
      expect(styleByName(name).properties.lineHeight).toBe(
        ONE_THEME_TYPOGRAPHY_PROPERTIES.lineHeight
      );
    });
  });

  it('uses global theme width and style for normal component borders', () => {
    expect(oneThemeBorder('red')).toBe(
      'var(--one-border-width, 1px) var(--one-border-style, solid) red'
    );
    const borders = [
      ['one-alert-base', 'border'],
      ['one-badge-neutral', 'border'],
      ['one-button-base', 'border'],
      ['one-card-base', 'border'],
      ['one-card-header', 'borderBottom'],
      ['one-card-footer', 'borderTop'],
      ['one-dialog-panel', 'border'],
      ['one-dialog-header', 'borderBottom'],
      ['one-dialog-footer', 'borderTop'],
      ['one-dialog-button', 'border'],
      ['one-input-base', 'border'],
      ['one-message-base', 'border'],
      ['one-pagination-button', 'border'],
      ['one-pagination-control', 'border'],
      ['one-select-trigger', 'border'],
      ['one-select-menu', 'border'],
      ['one-tabs-list', 'borderBottom'],
      ['one-tag-base', 'border'],
    ] as const;

    borders.forEach(([name, property]) => {
      const value = styleByName(name).properties[property];
      expect(value).toContain('var(--one-border-width, 1px)');
      expect(value).toContain('var(--one-border-style, solid)');
    });
    expect(styleByName('one-empty-illustration').properties.border).toContain(
      '2px solid'
    );
    expect(styleByName('one-button-spinner').properties.border).toBe(
      '2px solid currentColor'
    );
  });

  it('uses the large radius token for cards and dialogs', () => {
    expect(styleByName('one-card-base').properties.borderRadius).toContain(
      'var(--one-radius-lg, 8px)'
    );
    expect(styleByName('one-dialog-panel').properties.borderRadius).toContain(
      'var(--one-radius-lg, 8px)'
    );
  });

  it('scopes generated component CSS and uses public token fallbacks', () => {
    components = [
      new OneButton({ children: ['Save'] }),
      new OneInput({ value: 'One' }),
      new OneCard({ title: 'One', children: ['Body'] }),
      new OneTag({ children: ['Published'] }),
      new OneBadge({ value: 8, children: ['Inbox'] }),
      new OneEmpty(),
      new OneAlert({ title: 'Info' }),
      new OneMessage({ content: 'Saved', defaultOpen: true, duration: 0 }),
      new OneDialog({ title: 'Confirm', defaultOpen: true }),
      new OneTooltip({
        content: 'Help',
        defaultOpen: true,
        children: [{ tag: 'button', children: ['?'] }],
      }),
      new OneTabs({ items: [{ value: 'a', label: 'A' }] }),
      new OneBreadcrumb({ items: [{ label: '当前' }] }),
      new OnePagination({ total: 100 }),
    ];
    components.forEach((component) => component.mount(container));

    const css = Array.from(document.head.querySelectorAll('style'))
      .map((style) => style.textContent ?? '')
      .join('\n');
    const selectors = css
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.endsWith('{'))
      .map((line) => line.slice(0, -1).trim());

    expect(selectors.length).toBeGreaterThan(0);
    selectors.forEach((selector) => {
      expect(selector.startsWith('.one-')).toBe(true);
    });
    expect(css).toContain('var(--one-color-primary, #5fd956)');
    expect(css).toContain('var(--one-radius-md, 8px)');
    expect(css).toContain('.one-tag');
    expect(css).toContain('.one-badge__content');
    expect(css).toContain('.one-empty');
    expect(css).toContain('.one-tabs__tab');
    expect(css).toContain('.one-breadcrumb__link');
    expect(css).toContain('.one-pagination__button');
    expect(css).not.toMatch(/(^|})\s*(button|a|nav)\s*\{/);
    expect(css).not.toMatch(/(^|[}\s,])(body|html)(?=[\s,{])/m);
  });

  it('keeps primary and danger fallback text contrast at WCAG AA', () => {
    const combinations = [
      {
        styleName: 'one-button-primary',
        foreground: '#162018',
        background: '#5fd956',
        hoverBackground: '#4bc944',
      },
      {
        styleName: 'one-button-danger',
        foreground: '#ffffff',
        background: '#b83232',
        hoverBackground: '#9f2d2d',
      },
    ];

    combinations.forEach((combination) => {
      const style = ONE_BUTTON_STYLES.find(
        (candidate) => candidate.name === combination.styleName
      );
      if (!style) {
        throw new Error(`Missing style: ${combination.styleName}`);
      }

      const foreground = hexFallback(style.properties.color);
      const background = hexFallback(style.properties.backgroundColor);
      const hoverBackground = hexFallback(style.hover?.backgroundColor);
      expect({ foreground, background, hoverBackground }).toEqual({
        foreground: combination.foreground,
        background: combination.background,
        hoverBackground: combination.hoverBackground,
      });
      expect(contrastRatio(foreground, background)).toBeGreaterThanOrEqual(4.5);
      expect(contrastRatio(foreground, hoverBackground)).toBeGreaterThanOrEqual(
        4.5
      );
    });
  });
});
