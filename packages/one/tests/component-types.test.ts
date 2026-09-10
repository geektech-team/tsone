import { describe, expect, it } from 'bun:test';
import {
  ONE_DEFAULT_LOCALE,
  ONE_I18N_MESSAGES,
  OneI18nConfigError,
  OneLocalizedComponent,
  createOneI18n,
  oneI18n,
  ONE_DEFAULT_THEME,
  OneAlert,
  OneAvatar,
  OneBadge,
  OneBreadcrumb,
  OneButton,
  OneCard,
  OneCol,
  OneDialog,
  OneEmpty,
  OneInput,
  OneLoading,
  OneMessage,
  OnePagination,
  OneProgress,
  OneRadio,
  OneRadioGroup,
  OneRow,
  OneTag,
  OneTabs,
  OneTextarea,
  OneTimePicker,
  OneTooltip,
  OneSlider,
  OneRate,
  OneUpload,
  OneTable,
  OneCollapse,
  OneSkeleton,
  OneThemeConfigError,
  OneThemeEnvironmentError,
  OneThemeNotFoundError,
  oneDialog,
  oneMessage,
  oneTheme,
  type OneI18nLocale,
  type OneI18nMessages,
  type OneI18nParams,
  type OneAlertProps,
  type OneAvatarProps,
  type OneAvatarShape,
  type OneBadgeProps,
  type OneBreadcrumbProps,
  type OneButtonProps,
  type OneCardProps,
  type OneColProps,
  type OneDataDisplayVariant,
  type OneDialogProps,
  type OneEmptyProps,
  type OneInputProps,
  type OneLoadingProps,
  type OneMessageOptions,
  type OneMessagePlacement,
  type OnePaginationProps,
  type OneOverlayPlacement,
  type OneProgressProps,
  type OneRadioGroupProps,
  type OneRadioProps,
  type OneRowProps,
  type OneTagProps,
  type OneTabsProps,
  type OneTimePickerProps,
  type OneTooltipProps,
  type OneSliderProps,
  type OneSliderValueEvent,
  type OneRateProps,
  type OneRateValueEvent,
  type OneUploadProps,
  type OneUploadFile,
  type OneUploadChangeEvent,
  type OneTableProps,
  type OneTableRow,
  type OneTableColumn,
  type OneTextareaProps,
  type OneTextareaValueEvent,
  type OneCollapseProps,
  type OneCollapseItem,
  type OneCollapseChangeEvent,
  type OneSkeletonProps,
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
const radioProps: OneRadioProps = { value: 'design', defaultChecked: true };
const radioGroupProps: OneRadioGroupProps = {
  options: [{ value: 'design', label: '设计' }],
  defaultValue: 'design',
};
const timePickerProps: OneTimePickerProps = {
  defaultValue: '09:30',
  step: 1,
};
const avatarProps: OneAvatarProps = {
  src: '/avatar.png',
  alt: '头像',
  size: 'lg',
  shape: 'square',
};
const avatarShape: OneAvatarShape = 'circle';
const progressProps: OneProgressProps = {
  percent: 80,
  variant: 'success',
  showText: true,
};
const loadingProps: OneLoadingProps = {
  size: 'lg',
  variant: 'primary',
  label: '加载中',
};
const sliderProps: OneSliderProps = {
  defaultValue: 40,
  min: 0,
  max: 100,
  showValue: true,
};
const rateProps: OneRateProps = {
  defaultValue: 4,
  count: 10,
  allowClear: true,
};
const uploadProps: OneUploadProps = { multiple: true, max: 3 };
const uploadFile: OneUploadFile = { id: 'a', name: '报告.pdf', size: 2 };
const tableProps: OneTableProps = {
  data: [{ name: '林晚' }],
  columns: [{ key: 'name' }],
};
const tableRow: OneTableRow = { name: '林晚' };
const tableColumn: OneTableColumn = { key: 'role', title: '角色' };
const collapseProps: OneCollapseProps = {
  defaultActive: ['a'],
  items: [{ value: 'a', title: '基础' }],
};
const collapseItem: OneCollapseItem = { value: 'a', title: '基础' };
const skeletonProps: OneSkeletonProps = { rows: 2, avatar: true };
const rowProps: OneRowProps = {
  gutter: [16, 16],
  align: 'center',
  justify: 'space-between',
};
const colProps: OneColProps = { span: 8, offset: 8 };
const textareaProps: OneTextareaProps = { rows: 5, defaultValue: 'bio' };
const textareaValue: OneTextareaValueEvent = {
  value: 'updated',
  originalEvent: new Event('input'),
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
// @ts-expect-error unsupported avatar shape
const invalidAvatar: OneAvatarProps = { shape: 'triangle' };
// @ts-expect-error unsupported data-display variant
const invalidProgress: OneProgressProps = { variant: 'info' };
// @ts-expect-error upload files must carry a name
const invalidUpload: OneUploadProps = { defaultValue: [{ id: 'a' }] };
// @ts-expect-error slider max must be a number
const invalidSlider: OneSliderProps = { max: '100' };
// @ts-expect-error unsupported row align
const invalidRow: OneRowProps = { align: 'middle' };
// @ts-expect-error unsupported row justify
const invalidJustify: OneRowProps = { justify: 'space-split' };

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
    expect(typeof OneRadio).toBe('function');
    expect(typeof OneRadioGroup).toBe('function');
    expect(typeof OneTimePicker).toBe('function');
    expect(typeof OneAvatar).toBe('function');
    expect(typeof OneProgress).toBe('function');
    expect(typeof OneLoading).toBe('function');
    expect(typeof OneSlider).toBe('function');
    expect(typeof OneRate).toBe('function');
    expect(typeof OneUpload).toBe('function');
    expect(typeof OneTable).toBe('function');
    expect(typeof OneCollapse).toBe('function');
    expect(typeof OneSkeleton).toBe('function');
    expect(typeof OneRow).toBe('function');
    expect(typeof OneCol).toBe('function');
    expect(typeof OneTextarea).toBe('function');
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
    expect(new OneRadio(radioProps)).toBeInstanceOf(OneRadio);
    expect(new OneRadioGroup(radioGroupProps)).toBeInstanceOf(OneRadioGroup);
    expect(new OneTimePicker(timePickerProps)).toBeInstanceOf(OneTimePicker);
    expect(new OneAvatar(avatarProps)).toBeInstanceOf(OneAvatar);
    expect(new OneProgress(progressProps)).toBeInstanceOf(OneProgress);
    expect(new OneLoading(loadingProps)).toBeInstanceOf(OneLoading);
    expect(new OneSlider(sliderProps)).toBeInstanceOf(OneSlider);
    expect(new OneRate(rateProps)).toBeInstanceOf(OneRate);
    expect(new OneUpload(uploadProps)).toBeInstanceOf(OneUpload);
    expect(new OneTable(tableProps)).toBeInstanceOf(OneTable);
    expect(new OneCollapse(collapseProps)).toBeInstanceOf(OneCollapse);
    expect(new OneSkeleton(skeletonProps)).toBeInstanceOf(OneSkeleton);
    expect(new OneRow(rowProps)).toBeInstanceOf(OneRow);
    expect(new OneCol(colProps)).toBeInstanceOf(OneCol);
    expect(new OneTextarea(textareaProps)).toBeInstanceOf(OneTextarea);
    expect(uploadFile.name).toBe('报告.pdf');
    expect(tableRow.name).toBe('林晚');
    expect(tableColumn.title).toBe('角色');
    expect(collapseItem.title).toBe('基础');
    const sliderValue: OneSliderValueEvent = {
      value: 1,
      originalEvent: new Event('input'),
    };
    const rateValue: OneRateValueEvent = {
      value: 5,
      originalEvent: new Event('click'),
    };
    const uploadChange: OneUploadChangeEvent = {
      files: [],
      originalEvent: new Event('change'),
    };
    const collapseChange: OneCollapseChangeEvent = {
      value: [],
      originalEvent: new Event('click'),
    };
    expect(sliderValue.value).toBe(1);
    expect(rateValue.value).toBe(5);
    expect(uploadChange.files).toHaveLength(0);
    expect(collapseChange.value).toEqual([]);
    expect(textareaValue.value).toBe('updated');
    expect(messagePlacement).toBe('top-end');
    expect(overlayPlacement).toBe('right-start');
    expect(avatarShape).toBe('circle');
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
    void invalidAvatar;
    void invalidProgress;
    void invalidUpload;
    void invalidSlider;
    void invalidRow;
    void invalidJustify;
  });

  it('exports i18n types and values with correct signatures', () => {
    const i18n = createOneI18n({ locale: 'en' });
    const translated: string = i18n.t('one.empty.description', {});
    const locale: OneI18nLocale = oneI18n.getLocale();
    const messages: OneI18nMessages = ONE_I18N_MESSAGES.en;
    const params: OneI18nParams = { name: 'One' };
    const error = new OneI18nConfigError('boom');

    expect(translated).toBe('No data');
    expect(locale).toBe(ONE_DEFAULT_LOCALE);
    expect(messages['one.empty.description']).toBe('No data');
    expect(params.name).toBe('One');
    expect(error.message).toBe('boom');
    void OneLocalizedComponent;
  });
});
