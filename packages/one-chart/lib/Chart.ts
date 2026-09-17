import { Component, type VNode } from '@geektech/tsone';
import type {
  OneChartLegendEntry,
  OneChartMargin,
  OneChartProps,
  OneChartRenderContext,
  OneChartTooltipHit,
} from './types';
import {
  ONE_CHART_AXIS_TEXT_COLOR,
  ONE_CHART_DEFAULT_HEIGHT,
  ONE_CHART_DEFAULT_WIDTH,
  ONE_CHART_FONT_FAMILY,
  ONE_CHART_LEGEND_HEIGHT,
  ONE_CHART_TITLE_COLOR,
  ONE_CHART_TITLE_HEIGHT,
  ONE_CHART_TOOLTIP_BACKGROUND,
  ONE_CHART_TOOLTIP_BORDER,
  ONE_CHART_TOOLTIP_OFFSET_X,
  ONE_CHART_TOOLTIP_OFFSET_Y,
  ONE_CHART_TOOLTIP_TEXT,
  normalizeOneChartMargin,
  normalizeOneChartSize,
  resolveOneChartPalette,
  oneChartColor,
} from './theme';
import { svgElement, svgG, svgRect, svgText } from './svg';
import { oneDefaultValueFormat, onePercentLabel } from './format';

const LEGEND_SWATCH_SIZE = 10;
const LEGEND_SWATCH_GAP = 6;
const LEGEND_ITEM_GAP = 18;
const LEGEND_FONT_SIZE = 12;

const TOOLTIP_PADDING = 8;
const TOOLTIP_LINE_HEIGHT = 16;
const TOOLTIP_TITLE_HEIGHT = 17;
const TOOLTIP_SWATCH_SIZE = 8;
const TOOLTIP_SWATCH_GAP = 6;
const TOOLTIP_FONT_SIZE = 11;

/** tooltip 渲染状态：内容与可见性。位置由 DOM 直改，不进入状态。 */
interface OneChartTooltipState {
  tooltipVisible: boolean;
  tooltipTitle: string;
  tooltipEntries: Array<{ color: string; text: string }>;
}

function estimateTextWidth(text: string, fontSize: number): number {
  let latin = 0;
  let wide = 0;
  for (const char of text) {
    if (char.charCodeAt(0) > 0xff) {
      wide += 1;
    } else {
      latin += 1;
    }
  }
  return wide * fontSize + latin * fontSize * 0.62;
}

/** 从事件目标向上查找命中的 tooltip 元素。 */
function findOneChartTipTarget(target: EventTarget | null): Element | null {
  let node = target instanceof Element ? target : null;
  while (node) {
    if (node.hasAttribute('data-one-chart-tip-title')) {
      return node;
    }
    node = node.parentElement;
  }
  return null;
}

/**
 * 图表抽象基类：负责 SVG 根节点、尺寸/边距布局、标题与图例，
 * 绘制区内容由子类通过 {@link renderPlot} 提供。
 * 所有输出均为 SVG，不依赖 Canvas。
 */
export abstract class OneChart<
  TProps extends OneChartProps = OneChartProps,
> extends Component<TProps> {
  protected initState(): OneChartTooltipState {
    return {
      tooltipVisible: false,
      tooltipTitle: '',
      tooltipEntries: [],
    };
  }

  /** tooltip 浮层节点与尺寸的运行时缓存。 */
  private tooltipGroupNode: Element | null = null;
  private tooltipBoxSize = { width: 0, height: 0 };
  private currentTooltipSignature: string | null = null;

  protected initStyles(): void {}

  /** 图表显示名，用于 aria-label 兜底与校验报错。 */
  protected abstract get chartName(): string;

  /** tooltip 是否启用：props.tooltip 不为 false。 */
  protected get tooltipEnabled(): boolean {
    return this.props.tooltip !== false;
  }

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
        'data-one-chart-tip-root': '',
      },
      [
        ...(title ? [this.renderTitle(title, width)] : []),
        ...(this.showChartLegend && this.legendEntries().length > 0
          ? [this.renderLegend()]
          : []),
        ...this.renderPlot(context),
        ...(this.tooltipEnabled ? [this.renderTooltip()] : []),
      ],
      {
        mousemove: this.handleTooltipMove,
        mouseleave: this.handleTooltipLeave,
      }
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
      (sum, entry) => sum + estimateTextWidth(entry.name, LEGEND_FONT_SIZE) + LEGEND_SWATCH_SIZE + LEGEND_SWATCH_GAP + LEGEND_ITEM_GAP,
      0
    );
    const startX = (this.chartWidth - totalWidth) / 2;
    const centerY = this.chartTitle ? ONE_CHART_TITLE_HEIGHT + ONE_CHART_LEGEND_HEIGHT / 2 : ONE_CHART_LEGEND_HEIGHT / 2 + this.chartMargin.top;

    let cursor = Math.max(0, startX);
    const items = entries.map((entry) => {
      const itemWidth = estimateTextWidth(entry.name, LEGEND_FONT_SIZE) + LEGEND_SWATCH_SIZE + LEGEND_SWATCH_GAP;
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

  /**
   * 为可命中的图形元素附加 tooltip 数据集属性。
   * 子类在渲染柱子/扇区/数据点时调用，事件由根节点统一委托。
   */
  protected tooltipHitProps(
    hit: OneChartTooltipHit,
    color: string,
    formatValue: (value: number) => string = oneDefaultValueFormat
  ): Record<string, string> {
    if (!this.tooltipEnabled) {
      return {};
    }
    const lines = this.resolveTooltipLines(hit, formatValue);
    return {
      'data-one-chart-tip-title': hit.name,
      'data-one-chart-tip-color': color,
      'data-one-chart-tip-text': lines.join('\n'),
    };
  }

  private resolveTooltipLines(
    hit: OneChartTooltipHit,
    formatValue: (value: number) => string
  ): string[] {
    const options =
      typeof this.props.tooltip === 'object' ? this.props.tooltip : null;
    const custom = options?.formatter?.(hit);
    if (custom && custom.length > 0) {
      return custom;
    }
    const valueText = formatValue(hit.value);
    if (hit.xValue !== undefined && hit.yValue !== undefined) {
      return [`x ${formatValue(hit.xValue)}, y ${formatValue(hit.yValue)}`];
    }
    if (hit.series !== undefined) {
      return [`${hit.series} ${valueText}`];
    }
    if (hit.percent !== undefined) {
      return [`${valueText}（${onePercentLabel(hit.percent)}）`];
    }
    return [valueText];
  }

  private renderTooltip(): VNode {
    const { tooltipVisible, tooltipTitle, tooltipEntries } = this
      .state as OneChartTooltipState;
    const maxEntryWidth = tooltipEntries.reduce(
      (max, entry) => Math.max(max, estimateTextWidth(entry.text, TOOLTIP_FONT_SIZE)),
      0
    );
    const titleWidth = tooltipTitle
      ? estimateTextWidth(tooltipTitle, TOOLTIP_FONT_SIZE)
      : 0;
    const boxWidth = Math.ceil(
      Math.max(titleWidth, maxEntryWidth) +
        TOOLTIP_PADDING * 2 +
        TOOLTIP_SWATCH_SIZE +
        TOOLTIP_SWATCH_GAP
    );
    const boxHeight = Math.ceil(
      TOOLTIP_PADDING * 2 +
        (tooltipTitle ? TOOLTIP_TITLE_HEIGHT : 0) +
        tooltipEntries.length * TOOLTIP_LINE_HEIGHT
    );
    this.tooltipBoxSize = { width: boxWidth, height: boxHeight };

    const children: VNode[] = [
      svgRect({
        width: boxWidth,
        height: boxHeight,
        rx: 4,
        fill: ONE_CHART_TOOLTIP_BACKGROUND,
        stroke: ONE_CHART_TOOLTIP_BORDER,
        'stroke-width': 1,
      }),
    ];

    let cursorY = TOOLTIP_PADDING + TOOLTIP_FONT_SIZE;
    if (tooltipTitle) {
      children.push(
        svgText(tooltipTitle, {
          x: TOOLTIP_PADDING,
          y: cursorY,
          'font-size': TOOLTIP_FONT_SIZE,
          'font-weight': 600,
          fill: ONE_CHART_TOOLTIP_TEXT,
        })
      );
      cursorY += TOOLTIP_TITLE_HEIGHT;
    }

    tooltipEntries.forEach((entry) => {
      children.push(
        svgG([
          svgRect({
            x: TOOLTIP_PADDING,
            y: cursorY - TOOLTIP_SWATCH_SIZE + 1,
            width: TOOLTIP_SWATCH_SIZE,
            height: TOOLTIP_SWATCH_SIZE,
            rx: 1.5,
            fill: entry.color,
          }),
          svgText(entry.text, {
            x: TOOLTIP_PADDING + TOOLTIP_SWATCH_SIZE + TOOLTIP_SWATCH_GAP,
            y: cursorY,
            'font-size': TOOLTIP_FONT_SIZE,
            fill: ONE_CHART_TOOLTIP_TEXT,
          }),
        ])
      );
      cursorY += TOOLTIP_LINE_HEIGHT;
    });

    return svgG(children, {
      'data-one-chart-tooltip': '',
      transform: 'translate(0 0)',
      opacity: tooltipVisible ? '1' : '0',
      'pointer-events': 'none',
    });
  }

  private readonly handleTooltipMove = (event: Event): void => {
    if (!this.tooltipEnabled) {
      return;
    }
    const root = event.currentTarget as Element | null;
    const hit = findOneChartTipTarget(event.target);
    if (!root) {
      return;
    }
    // 指针移到无命中区域时隐藏 tooltip。
    if (!hit) {
      this.hideTooltip();
      return;
    }

    const mouseEvent = event as MouseEvent;
    const rect = root.getBoundingClientRect();
    this.moveTooltip(mouseEvent.clientX - rect.left, mouseEvent.clientY - rect.top);

    const title = hit.getAttribute('data-one-chart-tip-title') ?? '';
    const color = hit.getAttribute('data-one-chart-tip-color') ?? '';
    const text = hit.getAttribute('data-one-chart-tip-text') ?? '';
    const signature = `${title}\u0000${color}\u0000${text}`;
    if (signature === this.currentTooltipSignature) {
      return;
    }
    this.currentTooltipSignature = signature;
    this.setState({
      tooltipVisible: true,
      tooltipTitle: title,
      tooltipEntries: [{ color, text }],
    });
  };

  private readonly handleTooltipLeave = (): void => {
    if (this.tooltipEnabled) {
      this.hideTooltip();
    }
  };

  private hideTooltip(): void {
    if (!(this.state as OneChartTooltipState).tooltipVisible) {
      return;
    }
    this.currentTooltipSignature = null;
    this.setState({ tooltipVisible: false });
  }

  private moveTooltip(x: number, y: number): void {
    const group = this.tooltipGroupElement();
    if (!group) {
      return;
    }
    const { width: boxWidth, height: boxHeight } = this.tooltipBoxSize;
    const left = Math.max(
      0,
      Math.min(x + ONE_CHART_TOOLTIP_OFFSET_X, this.chartWidth - boxWidth)
    );
    const top = Math.max(
      0,
      Math.min(y + ONE_CHART_TOOLTIP_OFFSET_Y, this.chartHeight - boxHeight)
    );
    group.setAttribute('transform', `translate(${left} ${top})`);
  }

  private tooltipGroupElement(): Element | null {
    if (this.tooltipGroupNode && this.tooltipGroupNode.isConnected) {
      return this.tooltipGroupNode;
    }
    const root = this.getElement();
    this.tooltipGroupNode =
      root instanceof Element
        ? root.querySelector('[data-one-chart-tooltip]')
        : null;
    return this.tooltipGroupNode;
  }
}
