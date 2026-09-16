import type { OneChartMargin, OneChartSeries, OnePieDatum } from './types';
import { OneChartDataError } from './errors';

/** 默认调色板（Tableau 10）。 */
export const ONE_CHART_DEFAULT_COLORS: readonly string[] = [
  '#4e79a7',
  '#f28e2b',
  '#e15759',
  '#76b7b2',
  '#59a14f',
  '#edc948',
  '#b07aa1',
  '#ff9da7',
  '#9c755f',
  '#bab0ac',
];

export const ONE_CHART_DEFAULT_WIDTH = 640;
export const ONE_CHART_DEFAULT_HEIGHT = 400;

export const ONE_CHART_DEFAULT_MARGIN: Readonly<OneChartMargin> = {
  top: 16,
  right: 24,
  bottom: 44,
  left: 52,
};

/** 标题与图例各自占用的顶部高度。 */
export const ONE_CHART_TITLE_HEIGHT = 34;
export const ONE_CHART_LEGEND_HEIGHT = 28;

export const ONE_CHART_FONT_FAMILY =
  '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';

export const ONE_CHART_AXIS_TEXT_COLOR = '#6b7280';
export const ONE_CHART_AXIS_LINE_COLOR = '#d1d5db';
export const ONE_CHART_GRID_COLOR = '#e5e7eb';
export const ONE_CHART_TITLE_COLOR = '#111827';
export const ONE_CHART_VALUE_TEXT_COLOR = '#374151';

/** 归一化边距：非有限值或负值回落到默认值。 */
export function normalizeOneChartMargin(
  margin?: Partial<OneChartMargin> | OneChartMargin
): OneChartMargin {
  const fallback = ONE_CHART_DEFAULT_MARGIN;
  const source = margin ?? {};
  const resolve = (key: keyof OneChartMargin): number => {
    const value = source[key];
    return typeof value === 'number' && Number.isFinite(value) && value >= 0
      ? value
      : fallback[key];
  };

  return {
    top: resolve('top'),
    right: resolve('right'),
    bottom: resolve('bottom'),
    left: resolve('left'),
  };
}

/** 归一化尺寸：非有限值或非正值回落到默认值。 */
export function normalizeOneChartSize(value: number | undefined, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0
    ? value
    : fallback;
}

/** 解析调色板：未提供时使用默认调色板。 */
export function resolveOneChartPalette(colors?: string[]): string[] {
  if (!colors || colors.length === 0) {
    return [...ONE_CHART_DEFAULT_COLORS];
  }
  return colors.filter((color) => typeof color === 'string' && color.length > 0);
}

/** 按索引取色，越界时循环。 */
export function oneChartColor(palette: readonly string[], index: number): string {
  if (palette.length === 0) {
    return ONE_CHART_DEFAULT_COLORS[index % ONE_CHART_DEFAULT_COLORS.length];
  }
  return palette[((index % palette.length) + palette.length) % palette.length];
}

/**
 * 校验笛卡尔图表（柱状/折线）数据：分类非空、系列非空、
 * 每系列数值数量与分类一致且均为有限数。
 */
export function validateOneChartSeriesData(
  categories: readonly string[],
  series: readonly OneChartSeries[],
  chartName: string
): void {
  if (!Array.isArray(categories) || categories.length === 0) {
    throw new OneChartDataError(`${chartName} 需要至少一个分类（categories）`);
  }
  if (!Array.isArray(series) || series.length === 0) {
    throw new OneChartDataError(`${chartName} 需要至少一个系列（series）`);
  }
  if (categories.some((category) => typeof category !== 'string' || !category.trim())) {
    throw new OneChartDataError(`${chartName} 的分类名必须是非空字符串`);
  }

  const expected = categories.length;
  series.forEach((item, index) => {
    if (!item || typeof item.name !== 'string' || !item.name.trim()) {
      throw new OneChartDataError(`${chartName} 第 ${index + 1} 个系列缺少名称`);
    }
    if (!Array.isArray(item.data) || item.data.length !== expected) {
      throw new OneChartDataError(
        `${chartName} 系列「${item.name}」的数据长度（${
          item.data.length
        }）与分类数量（${expected}）不一致`
      );
    }
    item.data.forEach((value: number, valueIndex: number) => {
      if (typeof value !== 'number' || !Number.isFinite(value)) {
        throw new OneChartDataError(
          `${chartName} 系列「${item.name}」第 ${valueIndex + 1} 个数值非法`
        );
      }
    });
  });
}

/** 校验饼图数据：非空、名称非空、数值为有限正数。 */
export function validateOnePieData(
  data: readonly OnePieDatum[],
  chartName: string
): void {
  if (!Array.isArray(data) || data.length === 0) {
    throw new OneChartDataError(`${chartName} 需要至少一个数据项（data）`);
  }
  data.forEach((item, index) => {
    if (!item || typeof item.name !== 'string' || !item.name.trim()) {
      throw new OneChartDataError(`${chartName} 第 ${index + 1} 个数据项缺少名称`);
    }
    if (typeof item.value !== 'number' || !Number.isFinite(item.value) || item.value <= 0) {
      throw new OneChartDataError(
        `${chartName} 数据项「${item.name}」的数值必须为有限正数`
      );
    }
  });
}

/** 归一化数值选项：有限数且满足条件才采用。 */
export function normalizeOneNumberOption(
  value: number | undefined,
  fallback: number,
  isValid: (value: number) => boolean = (value) => Number.isFinite(value)
): number {
  return typeof value === 'number' && isValid(value) ? value : fallback;
}
