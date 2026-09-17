import { Component, type VNode } from '@geektech/tsone';
import type {
  OneChartLegendEntry,
  OneChartMargin,
  OneChartProps,
  OneChartRenderContext,
  OneChartTooltipHit,
} from './types';
import {
  oneCreateAnimateElement,
  oneParseAnimFrom,
  oneResolveAnimationOptions,
  type ResolvedOneChartAnimationOptions,
} from './animation';
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

  /** 动画相关：上一次渲染的几何快照（按元素 key）与 SVG 根尺寸快照。 */
  private readonly animationSnapshot = new Map<string, Record<string, string>>();
  private rootSizeSnapshot: Record<string, string> | null = null;

  protected initStyles(): void {}

  /** 图表显示名，用于 aria-label 兜底与校验报错。 */
  protected abstract get chartName(): string;

  /** 归一化后的动画配置；动画被禁用时返回 null。 */
  protected get chartAnimation(): ResolvedOneChartAnimationOptions | null {
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function'
        ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
        : false;
    return oneResolveAnimationOptions(this.props.animation, prefersReducedMotion);
  }

  /** 挂载后播放初始化动画：图形从声明起点生长到最终形态。 */
  protected onMounted(): void {
    const animation = this.chartAnimation;
    if (animation) {
      this.playInitAnimations(animation);
    }
  }

  /** 更新前快照当前几何，供数据变更时从旧值过渡到新值。 */
  protected beforeUpdate(): void {
    if (this.chartAnimation) {
      this.snapshotAnimations();
    }
  }

  /** 更新后播放数据变更 / 新增元素 / 容器大小变更动画。 */
  protected onUpdated(): void {
    const animation = this.chartAnimation;
    if (animation) {
      this.playUpdateAnimations(animation);
    } else {
      // 动画关闭时清掉残留的 freeze 动画，避免元素停留在旧几何值。
      this.clearAllAnimations();
    }
  }

  /** 移除全部残留动画（直接子元素与嵌套元素），并清空快照。 */
  private clearAllAnimations(): void {
    const root = this.animatedRoot();
    if (!root) {
      return;
    }
    for (const element of [...root.querySelectorAll('[data-one-chart-animate]')]) {
      element.remove();
    }
    this.animationSnapshot.clear();
    this.rootSizeSnapshot = null;
  }

  /** 记录全部动画元素当前几何与 SVG 根尺寸。 */
  private snapshotAnimations(): void {
    this.animationSnapshot.clear();
    const root = this.animatedRoot();
    if (!root) {
      this.rootSizeSnapshot = null;
      return;
    }
    const elements = [...root.querySelectorAll('[data-one-chart-anim]')];
    elements.forEach((element, index) => {
      const key =
        element.getAttribute('data-one-chart-anim-key') ??
        `${element.tagName}-${index}`;
      const values: Record<string, string> = {};
      for (const name of this.animationAttributes(element)) {
        const value = element.getAttribute(name);
        if (value !== null) {
          values[name] = value;
        }
      }
      if (Object.keys(values).length > 0) {
        this.animationSnapshot.set(key, values);
      }
    });
    this.rootSizeSnapshot = this.rootSizeValues(root);
  }

  /** 初始化动画：为声明了起点的元素按起点→当前值创建 SMIL 动画。 */
  private playInitAnimations(options: ResolvedOneChartAnimationOptions): void {
    if (!options.init) {
      return;
    }
    const root = this.animatedRoot();
    if (!root) {
      return;
    }
    for (const element of [...root.querySelectorAll('[data-one-chart-anim]')]) {
      this.animateElementInit(element, options);
    }
  }

  /** 更新动画：有快照的元素做几何过渡，新增元素补播初始化动画。 */
  private playUpdateAnimations(options: ResolvedOneChartAnimationOptions): void {
    const root = this.animatedRoot();
    if (!root) {
      return;
    }
    const elements = [...root.querySelectorAll('[data-one-chart-anim]')];
    elements.forEach((element, index) => {
      const key =
        element.getAttribute('data-one-chart-anim-key') ??
        `${element.tagName}-${index}`;
      const old = this.animationSnapshot.get(key);
      if (old) {
        if (options.update) {
          this.animateElementUpdate(element, old, options);
        } else {
          // 关闭数据变更动画时移除残留动画，让新值立即生效。
          this.removeAnimateChildren(element);
        }
      } else if (options.init) {
        this.animateElementInit(element, options);
      }
    });
    if (options.resize && this.rootSizeSnapshot) {
      this.animateRootResize(root, options);
    } else {
      // 关闭容器动画时移除根上的残留动画。
      this.removeAnimateChildren(root);
    }
  }

  private animateElementInit(
    element: Element,
    options: ResolvedOneChartAnimationOptions
  ): void {
    const from = oneParseAnimFrom(
      element.getAttribute('data-one-chart-anim-from')
    );
    if (!from) {
      return;
    }
    const animations: Array<[string, string, string]> = [];
    for (const name of this.animationAttributes(element)) {
      const to = element.getAttribute(name);
      if (to === null || !(name in from) || from[name] === to) {
        continue;
      }
      animations.push([name, from[name]!, to]);
    }
    this.applyAnimations(element, animations, options);
  }

  private animateElementUpdate(
    element: Element,
    old: Record<string, string>,
    options: ResolvedOneChartAnimationOptions
  ): void {
    const animations: Array<[string, string, string]> = [];
    for (const name of this.animationAttributes(element)) {
      const from = old[name];
      const to = element.getAttribute(name);
      if (from === undefined || to === null || from === to) {
        continue;
      }
      animations.push([name, from, to]);
    }
    this.applyAnimations(element, animations, options);
  }

  /** 容器大小变更：SVG 的 width/height/viewBox 从旧值过渡到新值。 */
  private animateRootResize(
    root: Element,
    options: ResolvedOneChartAnimationOptions
  ): void {
    const current = this.rootSizeValues(root);
    const old = this.rootSizeSnapshot;
    if (!old) {
      return;
    }
    const animations: Array<[string, string, string]> = [];
    for (const name of ['width', 'height', 'viewBox'] as const) {
      const from = old[name];
      const to = current[name];
      if (from === undefined || to === undefined || from === to) {
        continue;
      }
      animations.push([name, from, to]);
    }
    this.applyAnimations(root, animations, options);
  }

  /** 为元素创建并挂载一组 SMIL 动画，先清理该元素上的旧动画。 */
  private applyAnimations(
    element: Element,
    animations: Array<[string, string, string]>,
    options: ResolvedOneChartAnimationOptions
  ): void {
    if (animations.length === 0) {
      // 几何无变化（如 tooltip 引起的重渲染）：保留现有动画不打断。
      return;
    }
    if (options.duration <= 0) {
      // 时长为 0 时移除残留动画，让基础属性直接生效。
      this.removeAnimateChildren(element);
      return;
    }
    this.removeAnimateChildren(element);
    for (const [name, from, to] of animations) {
      element.appendChild(
        oneCreateAnimateElement(name, from, to, {
          duration: options.duration,
          easing: options.easing,
        })
      );
    }
  }

  private removeAnimateChildren(element: Element): void {
    for (const child of [...element.childNodes]) {
      if (
        child instanceof Element &&
        child.hasAttribute('data-one-chart-animate')
      ) {
        child.remove();
      }
    }
  }

  private animatedRoot(): Element | null {
    const root = this.getElement();
    return root instanceof Element ? root : null;
  }

  /** 元素声明参与动画的属性列表。 */
  private animationAttributes(element: Element): string[] {
    return (element.getAttribute('data-one-chart-anim') ?? '')
      .split(',')
      .map((name) => name.trim())
      .filter((name) => name.length > 0);
  }

  private rootSizeValues(root: Element): Record<string, string> {
    const values: Record<string, string> = {};
    for (const name of ['width', 'height', 'viewBox'] as const) {
      const value = root.getAttribute(name);
      if (value !== null) {
        values[name] = value;
      }
    }
    return values;
  }

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
