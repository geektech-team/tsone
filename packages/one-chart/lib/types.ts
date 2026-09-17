import type { OneChartAnimationOptions } from './animation';

/** 图表通用边距配置。 */
export interface OneChartMargin {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

/** 图表通用属性：尺寸、边距、标题、图例与调色板。 */
export interface OneChartProps {
  /** SVG 总宽度（px），默认 640。 */
  width?: number;
  /** SVG 总高度（px），默认 400。 */
  height?: number;
  /** 绘制区边距，缺省项回落到默认值。 */
  margin?: Partial<OneChartMargin> | OneChartMargin;
  /** 图表标题，显示在 SVG 顶部居中。 */
  title?: string;
  /** 是否显示图例，默认 true。 */
  showLegend?: boolean;
  /** 调色板覆盖，按系列/数据项顺序取色，越界时循环。 */
  colors?: string[];
  /** SVG 的 aria-label，缺省时使用 title。 */
  ariaLabel?: string;
  /**
   * 是否启用 tooltip，默认 true。
   * 传入对象时按 {@link OneChartTooltipOptions} 配置展示。
   */
  tooltip?: boolean | OneChartTooltipOptions;
  /**
   * 是否启用动画，默认 true：初始化时图形从起点形态生长出现、
   * 数据变更时从旧几何过渡到新几何、容器大小变更时 SVG 平滑缩放。
   * 传对象可配置时长、缓动，并单独关闭某类动画。
   */
  animation?: boolean | OneChartAnimationOptions;
}

/** 多系列图表的单系列数据（柱状图/折线图/雷达图）。 */
export interface OneChartSeries {
  name: string;
  data: number[];
}

/** 饼图数据项。 */
export interface OnePieDatum {
  name: string;
  value: number;
}

/** 漏斗图数据项。 */
export interface OneFunnelDatum {
  name: string;
  value: number;
}

/** 散点图单系列数据：每个点为 [x, y] 数值对。 */
export interface OneScatterSeries {
  name: string;
  data: Array<readonly [number, number]>;
}

/** 图例条目。 */
export interface OneChartLegendEntry {
  name: string;
  color: string;
}

/** 命中 tooltip 时携带的数据项信息。 */
export interface OneChartTooltipHit {
  /** 分类名（柱/折/雷达）、数据项名（饼/漏斗）或系列名（散点）。 */
  name: string;
  /** 系列名，饼图/漏斗图无此字段。 */
  series?: string;
  /** 数值。 */
  value: number;
  /** 百分比 0-100：饼图为占比，漏斗图为相对首级的转化率。 */
  percent?: number;
  /** 散点图的 x/y 数值，与 value 互斥使用。 */
  xValue?: number;
  yValue?: number;
}

/** tooltip 展示配置。 */
export interface OneChartTooltipOptions {
  /**
   * 自定义内容行：入参为命中信息，返回若干行文本。
   * 返回空数组或未提供时使用默认格式（系列 + 数值 / 数值 + 百分比）。
   */
  formatter?: (hit: OneChartTooltipHit) => string[];
}

/**
 * 图表绘制区渲染上下文，坐标均为 SVG 全局坐标。
 * 子类在 renderPlot 中基于该区域绘制图形。
 */
export interface OneChartRenderContext {
  x: number;
  y: number;
  width: number;
  height: number;
  /** 已按系列索引解析好的调色板。 */
  colors: string[];
}

/** 连续线性比例尺。 */
export interface OneScale {
  readonly domain: readonly [number, number];
  readonly range: readonly [number, number];
  scale(value: number): number;
  /** 生成约 count 个"整齐"刻度值。 */
  ticks(count?: number): number[];
}
