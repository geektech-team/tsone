import { describe, expect, it } from 'bun:test';
import {
  ONE_DEFAULT_THEME,
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
  OneThemeConfigError,
  OneThemeEnvironmentError,
  OneThemeNotFoundError,
  oneDialog,
  oneMessage,
  oneTheme,
  type OneAlertProps,
  type OneBadgeProps,
  type OneBreadcrumbProps,
  type OneButtonProps,
  type OneCardProps,
  type OneDataDisplayVariant,
  type OneDialogProps,
  type OneEmptyProps,
  type OneInputProps,
  type OneMessageOptions,
  type OneMessagePlacement,
  type OnePaginationProps,
  type OneOverlayPlacement,
  type OneTagProps,
  type OneTabsProps,
  type OneTooltipProps,
  type OneResolvedTheme,
  type OneThemeBorder,
  type OneThemeColors,
  type OneThemeDefinition,
  type OneThemeInitOptions,
  type OneThemeRadius,
  type OneThemeService,
  type OneThemeTypography,
} from '../lib';

const buttonProps: OneButtonProps = { variant: 'danger', size: 'lg' };
const inputProps: OneInputProps = { value: 'one', invalid: true };
const cardProps: OneCardProps = { title: 'One', children: ['Body'] };
const alertProps: OneAlertProps = { title: 'Info', variant: 'info' };
const messageOptions: OneMessageOptions = { content: 'Saved', duration: 0 };
const dialogProps: OneDialogProps = { title: 'Confirm', defaultOpen: false };
const tooltipProps: OneTooltipProps = {
  content: 'Help',
  placement: 'bottom-end',
  children: [{ tag: 'button', children: ['?'] }],
};
const tagProps: OneTagProps = {
  variant: 'success',
  size: 'sm',
  closable: true,
};
const badgeProps: OneBadgeProps = {
  value: 120,
  max: 99,
  variant: 'error',
};
const emptyProps: OneEmptyProps = { description: '暂无结果' };
const displayVariant: OneDataDisplayVariant = 'neutral';
const messagePlacement: OneMessagePlacement = 'top-end';
const overlayPlacement: OneOverlayPlacement = 'right-start';
const tabsProps: OneTabsProps = {
  items: [{ value: 'overview', label: '概览' }],
  defaultValue: 'overview',
};
const breadcrumbProps: OneBreadcrumbProps = {
  items: [{ label: '首页', href: '/' }, { label: '详情' }],
  maxItems: 3,
};
const paginationProps: OnePaginationProps = {
  total: 100,
  defaultPage: 2,
  showQuickJumper: true,
};
const themeDefinition: OneThemeDefinition = {
  colors: { primary: '#112233' },
  typography: { lineHeight: '1.7' },
  border: { width: '2px', style: 'dashed' },
  radius: { lg: '12px' },
};
const themeOptions: OneThemeInitOptions = {
  defaultTheme: 'brand',
  themes: { brand: themeDefinition, night: {} },
};
const themeService: OneThemeService = oneTheme;
const resolvedTheme: OneResolvedTheme = ONE_DEFAULT_THEME;
const themeColors: OneThemeColors = resolvedTheme.colors;
const themeTypography: OneThemeTypography = resolvedTheme.typography;
const themeBorder: OneThemeBorder = resolvedTheme.border;
const themeRadius: OneThemeRadius = resolvedTheme.radius;

if (false) {
  oneTheme.init(themeOptions);
  oneTheme.switch('brand');
  // @ts-expect-error switchTheme is not part of the public service
  oneTheme.switchTheme('brand');
}

// @ts-expect-error unsupported variant
const invalidButton: OneButtonProps = { variant: 'ghost' };
// @ts-expect-error unsupported size
const invalidInput: OneInputProps = { size: 'xl' };
// @ts-expect-error unsupported feedback variant
const invalidAlert: OneAlertProps = { variant: 'neutral' };
// @ts-expect-error unsupported message placement
const invalidMessagePlacement: OneMessagePlacement = 'left';
const invalidTooltipTrigger: OneTooltipProps = {
  content: 'Help',
  // @ts-expect-error unsupported tooltip trigger
  trigger: 'hover',
};
// @ts-expect-error unsupported overlay placement
const invalidOverlayPlacement: OneOverlayPlacement = 'center';
// @ts-expect-error unsupported data-display variant
const invalidTag: OneTagProps = { variant: 'info' };
// @ts-expect-error tab item values must be strings
const invalidTabs: OneTabsProps = { items: [{ value: 1, label: '错误' }] };
// @ts-expect-error total is required
const invalidPagination: OnePaginationProps = {};

describe('public component types', () => {
  it('exports constructors and approved prop shapes', () => {
    expect(typeof OneButton).toBe('function');
    expect(typeof OneInput).toBe('function');
    expect(typeof OneCard).toBe('function');
    expect(typeof OneTag).toBe('function');
    expect(typeof OneBadge).toBe('function');
    expect(typeof OneEmpty).toBe('function');
    expect(typeof OneAlert).toBe('function');
    expect(typeof OneMessage).toBe('function');
    expect(typeof OneDialog).toBe('function');
    expect(typeof OneTooltip).toBe('function');
    expect(typeof OneTabs).toBe('function');
    expect(typeof OneBreadcrumb).toBe('function');
    expect(typeof OnePagination).toBe('function');
    expect(typeof oneMessage.success).toBe('function');
    expect(typeof oneDialog.confirm).toBe('function');
    expect(typeof oneTheme.init).toBe('function');
    expect(typeof oneTheme.switch).toBe('function');
    expect(oneTheme.currentTheme).toBe('default');
    expect(ONE_DEFAULT_THEME.colors.primary).toBe('#5fd956');
    expect(OneThemeConfigError).toBeFunction();
    expect(OneThemeNotFoundError).toBeFunction();
    expect(OneThemeEnvironmentError).toBeFunction();
    expect(buttonProps.variant).toBe('danger');
    expect(inputProps.value).toBe('one');
    expect(cardProps.title).toBe('One');
    expect(tagProps.variant).toBe('success');
    expect(badgeProps.max).toBe(99);
    expect(emptyProps.description).toBe('暂无结果');
    expect(displayVariant).toBe('neutral');
    expect(new OneAlert(alertProps)).toBeInstanceOf(OneAlert);
    expect(new OneMessage(messageOptions)).toBeInstanceOf(OneMessage);
    expect(new OneDialog(dialogProps)).toBeInstanceOf(OneDialog);
    expect(new OneTooltip(tooltipProps)).toBeInstanceOf(OneTooltip);
    expect(new OneTabs(tabsProps)).toBeInstanceOf(OneTabs);
    expect(new OneBreadcrumb(breadcrumbProps)).toBeInstanceOf(OneBreadcrumb);
    expect(new OnePagination(paginationProps)).toBeInstanceOf(OnePagination);
    expect(messagePlacement).toBe('top-end');
    expect(overlayPlacement).toBe('right-start');
    expect(themeService).toBe(oneTheme);
    expect(themeColors.primary).toBe('#5fd956');
    expect(themeTypography.lineHeight).toBe('1.5');
    expect(themeBorder.width).toBe('1px');
    expect(themeRadius.lg).toBe('8px');
    void invalidButton;
    void invalidInput;
    void invalidAlert;
    void invalidMessagePlacement;
    void invalidTooltipTrigger;
    void invalidOverlayPlacement;
    void invalidTag;
    void invalidTabs;
    void invalidPagination;
  });
});
