import { Component, type VNode } from '@geektech/tsone';
import type {
  OneChartLegendEntry,
  OneChartMargin,
  OneChartProps,
  OneChartRenderContext,
} from './types';
import {
  ONE_CHART_AXIS_TEXT_COLOR,
  ONE_CHART_DEFAULT_HEIGHT,
  ONE_CHART_DEFAULT_WIDTH,
  ONE_CHART_FONT_FAMILY,
  ONE_CHART_LEGEND_HEIGHT,
  ONE_CHART_TITLE_COLOR,
  ONE_CHART_TITLE_HEIGHT,
  normalizeOneChartMargin,
  normalizeOneChartSize,
  resolveOneChartPalette,
  oneChartColor,
} from './theme';
import { svgElement, svgG, svgRect, svgText } from './svg';

const LEGEND_SWATCH_SIZE = 10;
const LEGEND_SWATCH_GAP = 6;
const LEGEND_ITEM_GAP = 18;
const LEGEND_FONT_SIZE = 12;

function estimateTextWidth(text: string): number {
  let latin = 0;
  let wide = 0;
  for (const char of text) {
    if (char.charCodeAt(0) > 0xff) {
      wide += 1;
    } else {
      latin += 1;
    }
  }
  return wide * LEGEND_FONT_SIZE + latin * LEGEND_FONT_SIZE * 0.62;
}

/**
 * 图表抽象基类：负责 SVG 根节点、尺寸/边距布局、标题与图例，
 * 绘制区内容由子类通过 {@link renderPlot} 提供。
 * 所有输出均为 SVG，不依赖 Canvas。
 */
export abstract class OneChart<
  TProps extends OneChartProps = OneChartProps,
> extends Component<TProps> {
  protected initState(): object {
    return {};
  }

  protected initStyles(): void {}

  /** 图表显示名，用于 aria-label 兜底与校验报错。 */
  protected abstract get chartName(): string;

  protected get chartWidth(): number {
    return normalizeOneChartSize(this.props.width, ONE_CHART_DEFAULT_WIDTH);
  }

  protected get chartHeight(): number {
    return normalizeOneChartSize(this.props.height, ONE_CHART_DEFAULT_HEIGHT);
  }

  protected get chartMargin(): OneChartMargin {
    return normalizeOneChartMargin(this.props.margin);
  }

  protected get chartTitle(): string | undefined {
    const title = this.props.title;
    return typeof title === 'string' && title.trim() ? title : undefined;
  }

  protected get showChartLegend(): boolean {
    return this.props.showLegend !== false;
  }

  protected get plotX(): number {
    return this.chartMargin.left;
  }

  protected get plotY(): number {
    const titleHeight = this.chartTitle ? ONE_CHART_TITLE_HEIGHT : 0;
    const legendHeight = this.showChartLegend && this.legendEntries().length > 0
      ? ONE_CHART_LEGEND_HEIGHT
      : 0;
    return titleHeight + legendHeight + this.chartMargin.top;
  }

  protected get plotWidth(): number {
    return Math.max(0, this.chartWidth - this.chartMargin.left - this.chartMargin.right);
  }

  protected get plotHeight(): number {
    return Math.max(0, this.chartHeight - this.plotY - this.chartMargin.bottom);
  }

  /** 图例条目，子类按需覆盖。 */
  protected legendEntries(): OneChartLegendEntry[] {
    return [];
  }

  protected palette(): string[] {
    return resolveOneChartPalette(this.props.colors);
  }

  protected colorFor(index: number): string {
    return oneChartColor(this.palette(), index);
  }

  protected render(): VNode {
    const width = this.chartWidth;
    const height = this.chartHeight;
    const title = this.chartTitle;
    const ariaLabel = this.props.ariaLabel ?? title ?? this.chartName;

    const context: OneChartRenderContext = {
      x: this.plotX,
      y: this.plotY,
      width: this.plotWidth,
      height: this.plotHeight,
      colors: this.palette(),
    };

    return svgElement(
      'svg',
      {
        width,
        height,
        viewBox: `0 0 ${width} ${height}`,
        role: 'img',
        'aria-label': ariaLabel,
        'font-family': ONE_CHART_FONT_FAMILY,
      },
      [
        ...(title ? [this.renderTitle(title, width)] : []),
        ...(this.showChartLegend && this.legendEntries().length > 0
          ? [this.renderLegend()]
          : []),
        ...this.renderPlot(context),
      ]
    );
  }

  /** 子类实现绘制区内容，坐标基于渲染上下文。 */
  protected abstract renderPlot(context: OneChartRenderContext): VNode[];

  private renderTitle(title: string, width: number): VNode {
    return svgText(title, {
      x: width / 2,
      y: 22,
      'text-anchor': 'middle',
      'font-size': 16,
      'font-weight': 600,
      fill: ONE_CHART_TITLE_COLOR,
    });
  }

  private renderLegend(): VNode {
    const entries = this.legendEntries();
    const totalWidth = entries.reduce(
      (sum, entry) => sum + estimateTextWidth(entry.name) + LEGEND_SWATCH_SIZE + LEGEND_SWATCH_GAP + LEGEND_ITEM_GAP,
      0
    );
    const startX = (this.chartWidth - totalWidth) / 2;
    const centerY = this.chartTitle ? ONE_CHART_TITLE_HEIGHT + ONE_CHART_LEGEND_HEIGHT / 2 : ONE_CHART_LEGEND_HEIGHT / 2 + this.chartMargin.top;

    let cursor = Math.max(0, startX);
    const items = entries.map((entry) => {
      const itemWidth = estimateTextWidth(entry.name) + LEGEND_SWATCH_SIZE + LEGEND_SWATCH_GAP;
      const group = svgG([
        svgRect({
          x: cursor,
          y: centerY - LEGEND_SWATCH_SIZE / 2,
          width: LEGEND_SWATCH_SIZE,
          height: LEGEND_SWATCH_SIZE,
          rx: 2,
          fill: entry.color,
        }),
        svgText(entry.name, {
          x: cursor + LEGEND_SWATCH_SIZE + LEGEND_SWATCH_GAP,
          y: centerY + LEGEND_FONT_SIZE / 2 - 1,
          'font-size': LEGEND_FONT_SIZE,
          fill: ONE_CHART_AXIS_TEXT_COLOR,
        }),
      ]);
      cursor += itemWidth + LEGEND_ITEM_GAP;
      return group;
    });

    return svgG(items, { 'aria-hidden': 'true' });
  }
}
