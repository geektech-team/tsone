import type { VNode } from '@geektech/tsone';
import { OneChart } from '../Chart';
import type {
  OneChartProps,
  OneChartRenderContext,
  OneFunnelDatum,
} from '../types';
import { ONE_CHART_AXIS_TEXT_COLOR, validateOnePieData } from '../theme';
import { onePolygonPath } from '../geometry';
import { onePercentLabel, truncateOneChartText } from '../format';
import { svgPath, svgText } from '../svg';
import { oneDefaultValueFormat } from '../format';
import { oneAnimAttrs, oneAnimFrom, oneAnimKey } from '../animation';

export interface OneFunnelChartProps extends OneChartProps {
  /** 漏斗数据项，按展示顺序逐级排列（通常由大到小）。 */
  data: OneFunnelDatum[];
  /** 是否显示每级数值，默认 false。 */
  showValues?: boolean;
  /** 是否显示相对首级的百分比，默认 false。 */
  showPercent?: boolean;
  /** 相邻两级间距（px），默认 2。 */
  gap?: number;
  /** 数值格式化。 */
  valueFormat?: (value: number) => string;
}

/**
 * 漏斗图：每级为梯形（上底宽按值比例），下一级上底即本级下底，
 * 最后一级收拢为三角形。数值与百分比标签显示在梯形右侧。
 */
export class OneFunnelChart extends OneChart<OneFunnelChartProps> {
  protected get chartName(): string {
    return 'OneFunnelChart';
  }

  protected get data(): OneFunnelDatum[] {
    return this.props.data ?? [];
  }

  protected legendEntries() {
    return this.data.map((item, index) => ({
      name: item.name,
      color: this.colorFor(index),
    }));
  }

  protected renderPlot(context: OneChartRenderContext): VNode[] {
    const data = this.data;
    validateOnePieData(data, this.chartName);

    const maxValue = Math.max(...data.map((item) => item.value));
    const gap = this.resolveGap();
    const levelHeight =
      (context.height - gap * Math.max(0, data.length - 1)) / data.length;
    const cx = context.x + context.width / 2;
    const nodes: VNode[] = [];

    data.forEach((item, index) => {
      const color = this.colorFor(index);
      const yTop = context.y + index * (levelHeight + gap);
      const yBottom = yTop + levelHeight;
      const widthTop = (item.value / maxValue) * context.width;
      const widthBottom =
        index + 1 < data.length
          ? (data[index + 1]!.value / maxValue) * context.width
          : 0;

      nodes.push(
        svgPath(
          onePolygonPath([
            [context.x + (context.width - widthTop) / 2, yTop],
            [context.x + (context.width + widthTop) / 2, yTop],
            [context.x + (context.width + widthBottom) / 2, yBottom],
            [context.x + (context.width - widthBottom) / 2, yBottom],
          ]),
          {
            fill: color,
            stroke: '#ffffff',
            'stroke-width': 1,
            ...oneAnimAttrs(['d']),
            ...oneAnimKey(`funnel-${index}`),
            // 初始化动画起点：梯形收拢为中心竖线。
            ...oneAnimFrom([
              [
                'd',
                onePolygonPath([
                  [cx, yTop],
                  [cx, yTop],
                  [cx, yBottom],
                  [cx, yBottom],
                ]),
              ],
            ]),
            ...this.tooltipHitProps(
              {
                name: item.name,
                value: item.value,
                percent: (item.value / maxValue) * 100,
              },
              color
            ),
          }
        )
      );

      if (widthTop >= 44) {
        nodes.push(
          svgText(truncateOneChartText(item.name, 8), {
            x: cx,
            y: yTop + levelHeight / 2 + 3.5,
            'text-anchor': 'middle',
            'font-size': 11,
            'font-weight': 600,
            fill: '#ffffff',
          })
        );
      }

      const labels: string[] = [];
      if (this.props.showValues) {
        labels.push(this.formatValue(item.value));
      }
      if (this.props.showPercent) {
        labels.push(onePercentLabel((item.value / maxValue) * 100));
      }
      if (labels.length > 0) {
        nodes.push(
          svgText(labels.join(' '), {
            x: context.x + (context.width + widthTop) / 2 + 8,
            y: yTop + levelHeight / 2 + 3.5,
            'text-anchor': 'start',
            'font-size': 11,
            fill: ONE_CHART_AXIS_TEXT_COLOR,
            ...oneAnimAttrs(['x', 'y']),
            ...oneAnimKey(`funnel-label-${index}`),
            // 初始化动画起点：标签从中心随梯形一起展开。
            ...oneAnimFrom([
              ['x', cx + 8],
              ['y', yTop + levelHeight / 2 + 3.5],
            ]),
          })
        );
      }
    });

    return nodes;
  }

  protected formatValue(value: number): string {
    if (this.props.valueFormat) {
      return this.props.valueFormat(value);
    }
    return oneDefaultValueFormat(value);
  }

  private resolveGap(): number {
    const value = this.props.gap;
    return typeof value === 'number' && Number.isFinite(value) && value >= 0
      ? value
      : 2;
  }
}
