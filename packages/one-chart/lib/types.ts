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

/** 图例条目。 */
export interface OneChartLegendEntry {
  name: string;
  color: string;
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
