import type { VNode } from '@geektech/tsone';
import { OneChart } from '../Chart';
import type {
  OneChartProps,
  OneChartRenderContext,
  OneScatterSeries,
} from '../types';
import { OneLinearScale, oneNiceDomain } from '../scale';
import {
  ONE_CHART_AXIS_LINE_COLOR,
  ONE_CHART_AXIS_TEXT_COLOR,
  ONE_CHART_GRID_COLOR,
} from '../theme';
import { oneDefaultValueFormat, truncateOneChartText } from '../format';
import { svgCircle, svgLine, svgText } from '../svg';
import { oneAnimAttrs, oneAnimFrom, oneAnimKey } from '../animation';
import { OneChartDataError } from '../errors';

export interface OneScatterChartProps extends OneChartProps {
  /** 系列数据，每个点为 [x, y] 数值对。 */
  series: OneScatterSeries[];
  /** 是否显示网格线，默认 true。 */
  grid?: boolean;
  /** 数值刻度与 tooltip 的格式化。 */
  valueFormat?: (value: number) => string;
  /** 数据点半径（px），默认 4。 */
  pointRadius?: number;
}

/**
 * 散点图：双数值轴（线性比例尺），支持多系列叠加。
 * 数值域按数据范围取整齐边界，不强制包含 0。
 */
export class OneScatterChart extends OneChart<OneScatterChartProps> {
  protected get chartName(): string {
    return 'OneScatterChart';
  }

  protected get series(): OneScatterSeries[] {
    return this.props.series ?? [];
  }

  protected legendEntries() {
    return this.series.map((item, index) => ({
      name: item.name,
      color: this.colorFor(index),
    }));
  }

  protected renderPlot(context: OneChartRenderContext): VNode[] {
    const series = this.series;
    this.assertSeries(series);

    const [xDomain, yDomain] = this.domains(series);
    const xScale = new OneLinearScale(
      xDomain,
      [context.x, context.x + context.width]
    );
    const yScale = new OneLinearScale(
      yDomain,
      [context.y + context.height, context.y]
    );

    const nodes: VNode[] = [
      ...this.renderAxes(context, xScale, yScale),
    ];

    const pointRadius = this.resolvePointRadius();
    series.forEach((item, seriesIndex) => {
      const color = this.colorFor(seriesIndex);
      item.data.forEach(([x, y], pointIndex) => {
        nodes.push(
          svgCircle({
            cx: xScale.scale(x),
            cy: yScale.scale(y),
            r: pointRadius,
            fill: color,
            stroke: '#ffffff',
            'stroke-width': 1,
            ...oneAnimAttrs(['cx', 'cy', 'r']),
            ...oneAnimKey(`dot-${seriesIndex}-${pointIndex}`),
            ...oneAnimFrom([['r', 0]]),
            ...this.tooltipHitProps(
              { name: item.name, xValue: x, yValue: y, value: y },
              color,
              (value) => this.formatValue(value)
            ),
          })
        );
      });
    });

    return nodes;
  }

  protected formatValue(value: number): string {
    if (this.props.valueFormat) {
      return this.props.valueFormat(value);
    }
    return oneDefaultValueFormat(value);
  }

  private resolvePointRadius(): number {
    const value = this.props.pointRadius;
    return typeof value === 'number' && Number.isFinite(value) && value > 0
      ? value
      : 4;
  }

  private assertSeries(series: OneScatterSeries[]): void {
    if (!Array.isArray(series) || series.length === 0) {
      throw new OneChartDataError(`${this.chartName} 需要至少一个系列（series）`);
    }
    series.forEach((item, index) => {
      if (!item || typeof item.name !== 'string' || !item.name.trim()) {
        throw new OneChartDataError(
          `${this.chartName} 第 ${index + 1} 个系列缺少名称`
        );
      }
      if (!Array.isArray(item.data) || item.data.length === 0) {
        throw new OneChartDataError(
          `${this.chartName} 系列「${item.name}」没有数据点`
        );
      }
    });
    this.assertPointValues(series);
  }

  private assertPointValues(series: OneScatterSeries[]): void {
    series.forEach((item) => {
      item.data.forEach((point, pointIndex) => {
        const [x, y] = point;
        if (
          !Array.isArray(point) ||
          typeof x !== 'number' ||
          !Number.isFinite(x) ||
          typeof y !== 'number' ||
          !Number.isFinite(y)
        ) {
          throw new OneChartDataError(
            `${this.chartName} 系列「${item.name}」第 ${pointIndex + 1} 个点的坐标非法`
          );
        }
      });
    });
  }

  /** 计算 x/y 数值域：数据范围取整齐边界，单点时向两侧各扩 10%。 */
  private domains(
    series: OneScatterSeries[]
  ): [readonly [number, number], readonly [number, number]] {
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;
    for (const item of series) {
      for (const [x, y] of item.data) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
    const xDomain = oneNiceDomain(minX, maxX);
    const yDomain = oneNiceDomain(minY, maxY);
    return [xDomain, yDomain];
  }

  private renderAxes(
    context: OneChartRenderContext,
    xScale: OneLinearScale,
    yScale: OneLinearScale
  ): VNode[] {
    const left = context.x;
    const top = context.y;
    const bottom = top + context.height;
    const right = left + context.width;
    const nodes: VNode[] = [];
    const xTicks = xScale.ticks(5);
    const yTicks = yScale.ticks(5);

    yTicks.forEach((tick) => {
      const y = yScale.scale(tick);
      if (this.props.grid !== false) {
        nodes.push(
          svgLine({
            x1: left,
            y1: y,
            x2: right,
            y2: y,
            stroke: ONE_CHART_GRID_COLOR,
            'stroke-width': 1,
          })
        );
      }
      nodes.push(
        svgText(this.formatValue(tick), {
          x: left - 8,
          y: y + 3,
          'text-anchor': 'end',
          'font-size': 11,
          fill: ONE_CHART_AXIS_TEXT_COLOR,
        })
      );
    });

    xTicks.forEach((tick) => {
      const x = xScale.scale(tick);
      if (this.props.grid !== false) {
        nodes.push(
          svgLine({
            x1: x,
            y1: top,
            x2: x,
            y2: bottom,
            stroke: ONE_CHART_GRID_COLOR,
            'stroke-width': 1,
          })
        );
      }
      nodes.push(
        svgText(truncateOneChartText(this.formatValue(tick), 12), {
          x,
          y: bottom + 18,
          'text-anchor': 'middle',
          'font-size': 11,
          fill: ONE_CHART_AXIS_TEXT_COLOR,
        })
      );
    });

    nodes.push(
      svgLine({
        x1: left,
        y1: top,
        x2: left,
        y2: bottom,
        stroke: ONE_CHART_AXIS_LINE_COLOR,
        'stroke-width': 1,
      }),
      svgLine({
        x1: left,
        y1: bottom,
        x2: right,
        y2: bottom,
        stroke: ONE_CHART_AXIS_LINE_COLOR,
        'stroke-width': 1,
      })
    );

    return nodes;
  }
}
