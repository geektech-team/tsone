import { ONE_THEME_DEFAULTS } from '../../../lib/styles/shared';

export interface OneThemeTokenDoc {
  name: `--one-${string}`;
  fallback: string;
  description: string;
}

export const oneThemeTokens: readonly OneThemeTokenDoc[] = [
  {
    name: '--one-color-primary',
    fallback: ONE_THEME_DEFAULTS.colorPrimary,
    description: '主按钮默认背景色。',
  },
  {
    name: '--one-color-primary-hover',
    fallback: ONE_THEME_DEFAULTS.colorPrimaryHover,
    description: '主按钮 hover 背景色。',
  },
  {
    name: '--one-color-primary-contrast',
    fallback: ONE_THEME_DEFAULTS.colorText,
    description: '主按钮文本对比色；默认与两种主色背景均满足 WCAG AA。',
  },
  {
    name: '--one-color-secondary',
    fallback: ONE_THEME_DEFAULTS.colorSurface,
    description: '次按钮默认背景色。',
  },
  {
    name: '--one-color-secondary-hover',
    fallback: ONE_THEME_DEFAULTS.colorBorder,
    description: '次按钮 hover 背景色。',
  },
  {
    name: '--one-color-secondary-contrast',
    fallback: ONE_THEME_DEFAULTS.colorText,
    description: '次按钮文本对比色。',
  },
  {
    name: '--one-color-danger',
    fallback: ONE_THEME_DEFAULTS.colorDanger,
    description: '危险按钮与无效输入框的默认强调色。',
  },
  {
    name: '--one-color-danger-hover',
    fallback: ONE_THEME_DEFAULTS.colorDangerHover,
    description: '危险按钮 hover 背景色。',
  },
  {
    name: '--one-color-danger-contrast',
    fallback: ONE_THEME_DEFAULTS.colorSurface,
    description: '危险按钮文本对比色；默认与两种危险背景均满足 WCAG AA。',
  },
  {
    name: '--one-color-surface',
    fallback: ONE_THEME_DEFAULTS.colorSurface,
    description: '输入框、卡片与次按钮使用的基础表面色。',
  },
  {
    name: '--one-color-text',
    fallback: ONE_THEME_DEFAULTS.colorText,
    description: '组件主要文本色。',
  },
  {
    name: '--one-color-border',
    fallback: ONE_THEME_DEFAULTS.colorBorder,
    description: '输入框与卡片使用的基础边框色。',
  },
  {
    name: '--one-color-focus',
    fallback: ONE_THEME_DEFAULTS.colorFocus,
    description: '按钮与输入框的键盘焦点色。',
  },
  {
    name: '--one-radius-md',
    fallback: ONE_THEME_DEFAULTS.radiusMd,
    description: '按钮和输入框的默认圆角。',
  },
  {
    name: '--one-radius-lg',
    fallback: ONE_THEME_DEFAULTS.radiusMd,
    description: '卡片与 Dialog 等大型表面的圆角。',
  },
  {
    name: '--one-space-sm',
    fallback: ONE_THEME_DEFAULTS.spaceSm,
    description: '按钮 gap 的共享间距 fallback。',
  },
  {
    name: '--one-space-lg',
    fallback: ONE_THEME_DEFAULTS.spaceLg,
    description: '卡片区域 padding 的共享间距 fallback。',
  },
  {
    name: '--one-font-size-sm',
    fallback: ONE_THEME_DEFAULTS.fontSizeSm,
    description: '小尺寸按钮和输入框的字号。',
  },
  {
    name: '--one-font-size-md',
    fallback: ONE_THEME_DEFAULTS.fontSizeMd,
    description: '中尺寸按钮和输入框的字号。',
  },
  {
    name: '--one-font-size-lg',
    fallback: ONE_THEME_DEFAULTS.fontSizeLg,
    description: '大尺寸按钮和输入框的字号。',
  },
  {
    name: '--one-font-family',
    fallback: ONE_THEME_DEFAULTS.fontFamily,
    description: '全部 One UI 组件使用的字体栈。',
  },
  {
    name: '--one-line-height',
    fallback: '1.5',
    description: '全部 One UI 组件使用的基础行高。',
  },
  {
    name: '--one-border-width',
    fallback: '1px',
    description: '普通组件边框与分隔线使用的全局宽度。',
  },
  {
    name: '--one-border-style',
    fallback: 'solid',
    description: '普通组件边框与分隔线使用的全局样式。',
  },
  {
    name: '--one-shadow-card',
    fallback: ONE_THEME_DEFAULTS.shadowCard,
    description: '卡片阴影的共享 fallback。',
  },
  {
    name: '--one-color-info',
    fallback: ONE_THEME_DEFAULTS.colorInfo,
    description: '信息反馈的强调色。',
  },
  {
    name: '--one-color-success',
    fallback: ONE_THEME_DEFAULTS.colorSuccess,
    description: '成功反馈的强调色。',
  },
  {
    name: '--one-color-warning',
    fallback: ONE_THEME_DEFAULTS.colorWarning,
    description: '警告反馈的强调色。',
  },
  {
    name: '--one-color-overlay',
    fallback: ONE_THEME_DEFAULTS.colorOverlay,
    description: 'Dialog 遮罩背景色。',
  },
  {
    name: '--one-color-muted',
    fallback: ONE_THEME_DEFAULTS.colorMuted,
    description: '反馈组件的次要文本色。',
  },
  {
    name: '--one-radius-sm',
    fallback: ONE_THEME_DEFAULTS.radiusSm,
    description: 'Tooltip 的紧凑圆角。',
  },
  {
    name: '--one-space-xs',
    fallback: ONE_THEME_DEFAULTS.spaceXs,
    description: '反馈内容的最小共享间距。',
  },
  {
    name: '--one-space-md',
    fallback: ONE_THEME_DEFAULTS.spaceMd,
    description: 'Alert 与 Message 的中等共享间距。',
  },
  {
    name: '--one-shadow-overlay',
    fallback: ONE_THEME_DEFAULTS.shadowOverlay,
    description: 'Message、Dialog 与 Tooltip 的浮层阴影。',
  },
  {
    name: '--one-z-index-dialog',
    fallback: ONE_THEME_DEFAULTS.zIndexDialog,
    description: 'Dialog 默认层级。',
  },
  {
    name: '--one-z-index-message',
    fallback: ONE_THEME_DEFAULTS.zIndexMessage,
    description: 'Message 默认层级。',
  },
  {
    name: '--one-z-index-tooltip',
    fallback: ONE_THEME_DEFAULTS.zIndexTooltip,
    description: 'Tooltip 默认层级。',
  },
  {
    name: '--one-alert-gap',
    fallback: `var(--one-space-sm, ${ONE_THEME_DEFAULTS.spaceSm})`,
    description: 'Alert 图标、正文和操作之间的间距。',
  },
  {
    name: '--one-alert-padding',
    fallback: `var(--one-space-md, ${ONE_THEME_DEFAULTS.spaceMd})`,
    description: 'Alert 内边距。',
  },
  {
    name: '--one-alert-color',
    fallback: `var(--one-color-text, ${ONE_THEME_DEFAULTS.colorText})`,
    description: 'Alert 主要文本色。',
  },
  {
    name: '--one-alert-background',
    fallback: `var(--one-color-surface, ${ONE_THEME_DEFAULTS.colorSurface})`,
    description: 'Alert 背景色。',
  },
  {
    name: '--one-alert-border-color',
    fallback: `var(--one-color-border, ${ONE_THEME_DEFAULTS.colorBorder})`,
    description: 'Alert 默认边框色。',
  },
  {
    name: '--one-alert-radius',
    fallback: `var(--one-radius-md, ${ONE_THEME_DEFAULTS.radiusMd})`,
    description: 'Alert 圆角。',
  },
  {
    name: '--one-tooltip-background',
    fallback: `var(--one-color-text, ${ONE_THEME_DEFAULTS.colorText})`,
    description: 'Tooltip 气泡背景色。',
  },
  {
    name: '--one-tooltip-arrow-x',
    fallback: '50%',
    description: 'Tooltip 垂直方向气泡的箭头横坐标。',
  },
  {
    name: '--one-tooltip-arrow-y',
    fallback: '50%',
    description: 'Tooltip 水平方向气泡的箭头纵坐标。',
  },
  {
    name: '--one-button-gap',
    fallback: `var(--one-space-sm, ${ONE_THEME_DEFAULTS.spaceSm})`,
    description: '按钮图标、spinner 与文本之间的组件级 gap override。',
  },
  {
    name: '--one-button-padding-sm',
    fallback: `${ONE_THEME_DEFAULTS.spaceXs} ${ONE_THEME_DEFAULTS.spaceMd}`,
    description: '小尺寸按钮的组件级 padding override。',
  },
  {
    name: '--one-button-padding-md',
    fallback: `${ONE_THEME_DEFAULTS.spaceSm} ${ONE_THEME_DEFAULTS.spaceLg}`,
    description: '中尺寸按钮的组件级 padding override。',
  },
  {
    name: '--one-button-padding-lg',
    fallback: `${ONE_THEME_DEFAULTS.spaceMd} ${ONE_THEME_DEFAULTS.spaceLg}`,
    description: '大尺寸按钮的组件级 padding override。',
  },
  {
    name: '--one-input-color',
    fallback: `var(--one-color-text, ${ONE_THEME_DEFAULTS.colorText})`,
    description: '输入框文本色的组件级 override。',
  },
  {
    name: '--one-input-background',
    fallback: `var(--one-color-surface, ${ONE_THEME_DEFAULTS.colorSurface})`,
    description: '输入框默认背景色的组件级 override。',
  },
  {
    name: '--one-input-border-color',
    fallback: `var(--one-color-border, ${ONE_THEME_DEFAULTS.colorBorder})`,
    description: '输入框默认边框色的组件级 override。',
  },
  {
    name: '--one-input-disabled-background',
    fallback: `var(--one-color-surface, ${ONE_THEME_DEFAULTS.colorSurface})`,
    description: '禁用输入框背景色的组件级 override。',
  },
  {
    name: '--one-input-focus-border-color',
    fallback: `var(--one-color-focus, ${ONE_THEME_DEFAULTS.colorFocus})`,
    description: '输入框获得键盘焦点时的边框色 override。',
  },
  {
    name: '--one-input-padding-sm',
    fallback: `${ONE_THEME_DEFAULTS.spaceXs} ${ONE_THEME_DEFAULTS.spaceSm}`,
    description: '小尺寸输入框的组件级 padding override。',
  },
  {
    name: '--one-input-padding-md',
    fallback: `${ONE_THEME_DEFAULTS.spaceSm} ${ONE_THEME_DEFAULTS.spaceMd}`,
    description: '中尺寸输入框的组件级 padding override。',
  },
  {
    name: '--one-input-padding-lg',
    fallback: `${ONE_THEME_DEFAULTS.spaceMd} ${ONE_THEME_DEFAULTS.spaceLg}`,
    description: '大尺寸输入框的组件级 padding override。',
  },
  {
    name: '--one-card-color',
    fallback: `var(--one-color-text, ${ONE_THEME_DEFAULTS.colorText})`,
    description: '卡片文本色的组件级 override。',
  },
  {
    name: '--one-card-background',
    fallback: `var(--one-color-surface, ${ONE_THEME_DEFAULTS.colorSurface})`,
    description: '卡片背景色的组件级 override。',
  },
  {
    name: '--one-card-border-color',
    fallback: `var(--one-color-border, ${ONE_THEME_DEFAULTS.colorBorder})`,
    description: '卡片外框及 header/footer 分隔线的组件级 override。',
  },
  {
    name: '--one-card-radius',
    fallback: `var(--one-radius-lg, ${ONE_THEME_DEFAULTS.radiusMd})`,
    description: '卡片圆角的组件级 override。',
  },
  {
    name: '--one-card-shadow',
    fallback: `var(--one-shadow-card, ${ONE_THEME_DEFAULTS.shadowCard})`,
    description: '卡片阴影的组件级 override。',
  },
  {
    name: '--one-card-header-padding',
    fallback: `var(--one-space-lg, ${ONE_THEME_DEFAULTS.spaceLg})`,
    description: '卡片 header 区域的组件级 padding override。',
  },
  {
    name: '--one-card-body-padding',
    fallback: `var(--one-space-lg, ${ONE_THEME_DEFAULTS.spaceLg})`,
    description: '卡片 body 区域的组件级 padding override。',
  },
  {
    name: '--one-card-footer-padding',
    fallback: `var(--one-space-lg, ${ONE_THEME_DEFAULTS.spaceLg})`,
    description: '卡片 footer 区域的组件级 padding override。',
  },
];
