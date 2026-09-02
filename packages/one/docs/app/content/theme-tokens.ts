import { ONE_THEME_DEFAULTS } from '../../../lib/styles/shared';
import { t, type OneDocText } from './types';

export interface OneThemeTokenDoc {
  name: `--one-${string}`;
  fallback: string;
  description: OneDocText;
}

export const oneThemeTokens: readonly OneThemeTokenDoc[] = [
  {
    name: '--one-color-primary',
    fallback: ONE_THEME_DEFAULTS.colorPrimary,
    description: t('主按钮默认背景色。', 'Default background color for primary buttons.'),
  },
  {
    name: '--one-color-primary-hover',
    fallback: ONE_THEME_DEFAULTS.colorPrimaryHover,
    description: t('主按钮 hover 背景色。', 'Hover background color for primary buttons.'),
  },
  {
    name: '--one-color-primary-contrast',
    fallback: ONE_THEME_DEFAULTS.colorText,
    description: t(
      '主按钮文本对比色；默认与两种主色背景均满足 WCAG AA。',
      'Contrast text color for primary buttons; the default meets WCAG AA against both primary backgrounds.'
    ),
  },
  {
    name: '--one-color-secondary',
    fallback: ONE_THEME_DEFAULTS.colorSurface,
    description: t('次按钮默认背景色。', 'Default background color for secondary buttons.'),
  },
  {
    name: '--one-color-secondary-hover',
    fallback: ONE_THEME_DEFAULTS.colorBorder,
    description: t('次按钮 hover 背景色。', 'Hover background color for secondary buttons.'),
  },
  {
    name: '--one-color-secondary-contrast',
    fallback: ONE_THEME_DEFAULTS.colorText,
    description: t('次按钮文本对比色。', 'Contrast text color for secondary buttons.'),
  },
  {
    name: '--one-color-danger',
    fallback: ONE_THEME_DEFAULTS.colorDanger,
    description: t(
      '危险按钮与无效输入框的默认强调色。',
      'Default accent color for danger buttons and invalid inputs.'
    ),
  },
  {
    name: '--one-color-danger-hover',
    fallback: ONE_THEME_DEFAULTS.colorDangerHover,
    description: t('危险按钮 hover 背景色。', 'Hover background color for danger buttons.'),
  },
  {
    name: '--one-color-danger-contrast',
    fallback: ONE_THEME_DEFAULTS.colorSurface,
    description: t(
      '危险按钮文本对比色；默认与两种危险背景均满足 WCAG AA。',
      'Contrast text color for danger buttons; the default meets WCAG AA against both danger backgrounds.'
    ),
  },
  {
    name: '--one-color-surface',
    fallback: ONE_THEME_DEFAULTS.colorSurface,
    description: t(
      '输入框、卡片与次按钮使用的基础表面色。',
      'Base surface color used by inputs, cards and secondary buttons.'
    ),
  },
  {
    name: '--one-color-text',
    fallback: ONE_THEME_DEFAULTS.colorText,
    description: t('组件主要文本色。', 'Primary text color for components.'),
  },
  {
    name: '--one-color-border',
    fallback: ONE_THEME_DEFAULTS.colorBorder,
    description: t('输入框与卡片使用的基础边框色。', 'Base border color used by inputs and cards.'),
  },
  {
    name: '--one-color-focus',
    fallback: ONE_THEME_DEFAULTS.colorFocus,
    description: t('按钮与输入框的键盘焦点色。', 'Keyboard focus color for buttons and inputs.'),
  },
  {
    name: '--one-radius-md',
    fallback: ONE_THEME_DEFAULTS.radiusMd,
    description: t('按钮和输入框的默认圆角。', 'Default border radius for buttons and inputs.'),
  },
  {
    name: '--one-radius-lg',
    fallback: ONE_THEME_DEFAULTS.radiusMd,
    description: t('卡片与 Dialog 等大型表面的圆角。', 'Border radius for large surfaces such as Card and Dialog.'),
  },
  {
    name: '--one-space-sm',
    fallback: ONE_THEME_DEFAULTS.spaceSm,
    description: t('按钮 gap 的共享间距 fallback。', 'Shared spacing fallback for button gap.'),
  },
  {
    name: '--one-space-lg',
    fallback: ONE_THEME_DEFAULTS.spaceLg,
    description: t('卡片区域 padding 的共享间距 fallback。', 'Shared spacing fallback for card area padding.'),
  },
  {
    name: '--one-font-size-sm',
    fallback: ONE_THEME_DEFAULTS.fontSizeSm,
    description: t('小尺寸按钮和输入框的字号。', 'Font size for small buttons and inputs.'),
  },
  {
    name: '--one-font-size-md',
    fallback: ONE_THEME_DEFAULTS.fontSizeMd,
    description: t('中尺寸按钮和输入框的字号。', 'Font size for medium buttons and inputs.'),
  },
  {
    name: '--one-font-size-lg',
    fallback: ONE_THEME_DEFAULTS.fontSizeLg,
    description: t('大尺寸按钮和输入框的字号。', 'Font size for large buttons and inputs.'),
  },
  {
    name: '--one-font-family',
    fallback: ONE_THEME_DEFAULTS.fontFamily,
    description: t('全部 One UI 组件使用的字体栈。', 'Font stack used by all One UI components.'),
  },
  {
    name: '--one-line-height',
    fallback: '1.5',
    description: t('全部 One UI 组件使用的基础行高。', 'Base line height used by all One UI components.'),
  },
  {
    name: '--one-border-width',
    fallback: '1px',
    description: t('普通组件边框与分隔线使用的全局宽度。', 'Global width used by component borders and dividers.'),
  },
  {
    name: '--one-border-style',
    fallback: 'solid',
    description: t('普通组件边框与分隔线使用的全局样式。', 'Global style used by component borders and dividers.'),
  },
  {
    name: '--one-shadow-card',
    fallback: ONE_THEME_DEFAULTS.shadowCard,
    description: t('卡片阴影的共享 fallback。', 'Shared fallback for card shadow.'),
  },
  {
    name: '--one-color-info',
    fallback: ONE_THEME_DEFAULTS.colorInfo,
    description: t('信息反馈的强调色。', 'Accent color for info feedback.'),
  },
  {
    name: '--one-color-success',
    fallback: ONE_THEME_DEFAULTS.colorSuccess,
    description: t('成功反馈的强调色。', 'Accent color for success feedback.'),
  },
  {
    name: '--one-color-warning',
    fallback: ONE_THEME_DEFAULTS.colorWarning,
    description: t('警告反馈的强调色。', 'Accent color for warning feedback.'),
  },
  {
    name: '--one-color-overlay',
    fallback: ONE_THEME_DEFAULTS.colorOverlay,
    description: t('Dialog 遮罩背景色。', 'Backdrop color for Dialog.'),
  },
  {
    name: '--one-color-muted',
    fallback: ONE_THEME_DEFAULTS.colorMuted,
    description: t('反馈组件的次要文本色。', 'Secondary text color for feedback components.'),
  },
  {
    name: '--one-radius-sm',
    fallback: ONE_THEME_DEFAULTS.radiusSm,
    description: t('Tooltip 的紧凑圆角。', 'Compact border radius for Tooltip.'),
  },
  {
    name: '--one-space-xs',
    fallback: ONE_THEME_DEFAULTS.spaceXs,
    description: t('反馈内容的最小共享间距。', 'Smallest shared spacing for feedback content.'),
  },
  {
    name: '--one-space-md',
    fallback: ONE_THEME_DEFAULTS.spaceMd,
    description: t('Alert 与 Message 的中等共享间距。', 'Medium shared spacing for Alert and Message.'),
  },
  {
    name: '--one-shadow-overlay',
    fallback: ONE_THEME_DEFAULTS.shadowOverlay,
    description: t('Message、Dialog 与 Tooltip 的浮层阴影。', 'Overlay shadow for Message, Dialog and Tooltip.'),
  },
  {
    name: '--one-z-index-dialog',
    fallback: ONE_THEME_DEFAULTS.zIndexDialog,
    description: t('Dialog 默认层级。', 'Default stacking level for Dialog.'),
  },
  {
    name: '--one-z-index-message',
    fallback: ONE_THEME_DEFAULTS.zIndexMessage,
    description: t('Message 默认层级。', 'Default stacking level for Message.'),
  },
  {
    name: '--one-z-index-tooltip',
    fallback: ONE_THEME_DEFAULTS.zIndexTooltip,
    description: t('Tooltip 默认层级。', 'Default stacking level for Tooltip.'),
  },
  {
    name: '--one-alert-gap',
    fallback: `var(--one-space-sm, ${ONE_THEME_DEFAULTS.spaceSm})`,
    description: t('Alert 图标、正文和操作之间的间距。', 'Spacing between the Alert icon, body and actions.'),
  },
  {
    name: '--one-alert-padding',
    fallback: `var(--one-space-md, ${ONE_THEME_DEFAULTS.spaceMd})`,
    description: t('Alert 内边距。', 'Alert padding.'),
  },
  {
    name: '--one-alert-color',
    fallback: `var(--one-color-text, ${ONE_THEME_DEFAULTS.colorText})`,
    description: t('Alert 主要文本色。', 'Primary text color for Alert.'),
  },
  {
    name: '--one-alert-background',
    fallback: `var(--one-color-surface, ${ONE_THEME_DEFAULTS.colorSurface})`,
    description: t('Alert 背景色。', 'Alert background color.'),
  },
  {
    name: '--one-alert-border-color',
    fallback: `var(--one-color-border, ${ONE_THEME_DEFAULTS.colorBorder})`,
    description: t('Alert 默认边框色。', 'Default border color for Alert.'),
  },
  {
    name: '--one-alert-radius',
    fallback: `var(--one-radius-md, ${ONE_THEME_DEFAULTS.radiusMd})`,
    description: t('Alert 圆角。', 'Alert border radius.'),
  },
  {
    name: '--one-tooltip-background',
    fallback: `var(--one-color-text, ${ONE_THEME_DEFAULTS.colorText})`,
    description: t('Tooltip 气泡背景色。', 'Tooltip bubble background color.'),
  },
  {
    name: '--one-tooltip-arrow-x',
    fallback: '50%',
    description: t(
      'Tooltip 垂直方向气泡的箭头横坐标。',
      'Horizontal coordinate of the Tooltip arrow for vertically placed bubbles.'
    ),
  },
  {
    name: '--one-tooltip-arrow-y',
    fallback: '50%',
    description: t(
      'Tooltip 水平方向气泡的箭头纵坐标。',
      'Vertical coordinate of the Tooltip arrow for horizontally placed bubbles.'
    ),
  },
  {
    name: '--one-button-gap',
    fallback: `var(--one-space-sm, ${ONE_THEME_DEFAULTS.spaceSm})`,
    description: t(
      '按钮图标、spinner 与文本之间的组件级 gap override。',
      'Component-level gap override between the button icon, spinner and text.'
    ),
  },
  {
    name: '--one-button-padding-sm',
    fallback: `${ONE_THEME_DEFAULTS.spaceXs} ${ONE_THEME_DEFAULTS.spaceMd}`,
    description: t('小尺寸按钮的组件级 padding override。', 'Component-level padding override for small buttons.'),
  },
  {
    name: '--one-button-padding-md',
    fallback: `${ONE_THEME_DEFAULTS.spaceSm} ${ONE_THEME_DEFAULTS.spaceLg}`,
    description: t('中尺寸按钮的组件级 padding override。', 'Component-level padding override for medium buttons.'),
  },
  {
    name: '--one-button-padding-lg',
    fallback: `${ONE_THEME_DEFAULTS.spaceMd} ${ONE_THEME_DEFAULTS.spaceLg}`,
    description: t('大尺寸按钮的组件级 padding override。', 'Component-level padding override for large buttons.'),
  },
  {
    name: '--one-input-color',
    fallback: `var(--one-color-text, ${ONE_THEME_DEFAULTS.colorText})`,
    description: t('输入框文本色的组件级 override。', 'Component-level override for input text color.'),
  },
  {
    name: '--one-input-background',
    fallback: `var(--one-color-surface, ${ONE_THEME_DEFAULTS.colorSurface})`,
    description: t('输入框默认背景色的组件级 override。', 'Component-level override for the default input background color.'),
  },
  {
    name: '--one-input-border-color',
    fallback: `var(--one-color-border, ${ONE_THEME_DEFAULTS.colorBorder})`,
    description: t('输入框默认边框色的组件级 override。', 'Component-level override for the default input border color.'),
  },
  {
    name: '--one-input-disabled-background',
    fallback: `var(--one-color-surface, ${ONE_THEME_DEFAULTS.colorSurface})`,
    description: t('禁用输入框背景色的组件级 override。', 'Component-level override for the disabled input background color.'),
  },
  {
    name: '--one-input-focus-border-color',
    fallback: `var(--one-color-focus, ${ONE_THEME_DEFAULTS.colorFocus})`,
    description: t('输入框获得键盘焦点时的边框色 override。', 'Border color override when the input receives keyboard focus.'),
  },
  {
    name: '--one-input-padding-sm',
    fallback: `${ONE_THEME_DEFAULTS.spaceXs} ${ONE_THEME_DEFAULTS.spaceSm}`,
    description: t('小尺寸输入框的组件级 padding override。', 'Component-level padding override for small inputs.'),
  },
  {
    name: '--one-input-padding-md',
    fallback: `${ONE_THEME_DEFAULTS.spaceSm} ${ONE_THEME_DEFAULTS.spaceMd}`,
    description: t('中尺寸输入框的组件级 padding override。', 'Component-level padding override for medium inputs.'),
  },
  {
    name: '--one-input-padding-lg',
    fallback: `${ONE_THEME_DEFAULTS.spaceMd} ${ONE_THEME_DEFAULTS.spaceLg}`,
    description: t('大尺寸输入框的组件级 padding override。', 'Component-level padding override for large inputs.'),
  },
  {
    name: '--one-card-color',
    fallback: `var(--one-color-text, ${ONE_THEME_DEFAULTS.colorText})`,
    description: t('卡片文本色的组件级 override。', 'Component-level override for card text color.'),
  },
  {
    name: '--one-card-background',
    fallback: `var(--one-color-surface, ${ONE_THEME_DEFAULTS.colorSurface})`,
    description: t('卡片背景色的组件级 override。', 'Component-level override for the card background color.'),
  },
  {
    name: '--one-card-border-color',
    fallback: `var(--one-color-border, ${ONE_THEME_DEFAULTS.colorBorder})`,
    description: t(
      '卡片外框及 header/footer 分隔线的组件级 override。',
      'Component-level override for the card border and header/footer dividers.'
    ),
  },
  {
    name: '--one-card-radius',
    fallback: `var(--one-radius-lg, ${ONE_THEME_DEFAULTS.radiusMd})`,
    description: t('卡片圆角的组件级 override。', 'Component-level override for the card border radius.'),
  },
  {
    name: '--one-card-shadow',
    fallback: `var(--one-shadow-card, ${ONE_THEME_DEFAULTS.shadowCard})`,
    description: t('卡片阴影的组件级 override。', 'Component-level override for the card shadow.'),
  },
  {
    name: '--one-card-header-padding',
    fallback: `var(--one-space-lg, ${ONE_THEME_DEFAULTS.spaceLg})`,
    description: t('卡片 header 区域的组件级 padding override。', 'Component-level padding override for the card header area.'),
  },
  {
    name: '--one-card-body-padding',
    fallback: `var(--one-space-lg, ${ONE_THEME_DEFAULTS.spaceLg})`,
    description: t('卡片 body 区域的组件级 padding override。', 'Component-level padding override for the card body area.'),
  },
  {
    name: '--one-card-footer-padding',
    fallback: `var(--one-space-lg, ${ONE_THEME_DEFAULTS.spaceLg})`,
    description: t('卡片 footer 区域的组件级 padding override。', 'Component-level padding override for the card footer area.'),
  },
];
