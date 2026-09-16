import type { VNode } from '@geektech/tsone';
import { OneChart } from '../Chart';
import type {
  OneChartProps,
  OneChartRenderContext,
  OneChartSeries,
} from '../types';
import { OneLinearScale, oneNiceDomain } from '../scale';
import { onePolarPoint, onePolygonPoints } from '../geometry';
import {
  ONE_CHART_AXIS_TEXT_COLOR,
  ONE_CHART_GRID_COLOR,
  normalizeOneNumberOption,
  validateOneChartSeriesData,
} from '../theme';
import { truncateOneChartText } from '../format';
import { svgCircle, svgLine, svgPolygon, svgText } from '../svg';

export interface OneRadarChartProps extends OneChartProps {
  /** 指标（坐标轴）名称。 */
  indicators: string[];
  /** 系列数据，每个系列数据长度须与指标一致。 */
  series: OneChartSeries[];
  /** 网格环层数，默认 5。 */
  levels?: number;
  /** 数值域上限，默认按数据自动取整。 */
  max?: number;
  /** 是否显示数据点，默认 false。 */
  showPoints?: boolean;
  /** 是否填充多边形，默认 true。 */
  fill?: boolean;
}

/** 雷达图：多系列多边形叠加在环形网格上。 */
export class OneRadarChart extends OneChart<OneRadarChartProps> {
  protected get chartName(): string {
    return 'OneRadarChart';
  }

  protected get indicators(): string[] {
    return this.props.indicators ?? [];
  }

  protected get series(): OneChartSeries[] {
    return this.props.series ?? [];
  }

  protected legendEntries() {
    return this.series.map((item, index) => ({
      name: item.name,
      color: this.colorFor(index),
    }));
  }

  protected renderPlot(context: OneChartRenderContext): VNode[] {
    const { indicators, series } = this;
    validateOneChartSeriesData(indicators, series, this.chartName);

    const cx = context.x + context.width / 2;
    const cy = context.y + context.height / 2;
    const radius = (Math.min(context.width, context.height) / 2) * 0.82;
    const levels = normalizeOneNumberOption(
      this.props.levels,
      5,
      (value) => Number.isInteger(value) && value >= 2
    );
    const domainMax = this.resolveDomainMax();
    const valueScale = new OneLinearScale([0, domainMax], [0, radius]);

    const count = indicators.length;
    const angles = indicators.map(
      (_, index) => -Math.PI / 2 + (index * 2 * Math.PI) / count
    );
    const ringPoints = (level: number): Array<readonly [number, number]> =>
      angles.map((angle) => onePolarPoint(cx, cy, (radius * level) / levels, angle));

    const nodes: VNode[] = [];

    // 网格环
    for (let level = 1; level <= levels; level += 1) {
      nodes.push(
        svgPolygon(onePolygonPoints(ringPoints(level)), {
          fill: 'none',
          stroke: ONE_CHART_GRID_COLOR,
          'stroke-width': 1,
        })
      );
    }

    // 辐条
    angles.forEach((angle) => {
      const [x, y] = onePolarPoint(cx, cy, radius, angle);
      nodes.push(
        svgLine({
          x1: cx,
          y1: cy,
          x2: x,
          y2: y,
          stroke: ONE_CHART_GRID_COLOR,
          'stroke-width': 1,
        })
      );
    });

    // 指标标签
    indicators.forEach((indicator, index) => {
      const angle = angles[index];
      const [x, y] = onePolarPoint(cx, cy, radius + 16, angle);
      const cos = Math.cos(angle);
      const anchor =
        Math.abs(cos) < 0.3 ? 'middle' : cos > 0 ? 'start' : 'end';
      nodes.push(
        svgText(truncateOneChartText(indicator, 10), {
          x,
          y: y + 3.5,
          'text-anchor': anchor,
          'font-size': 11,
          fill: ONE_CHART_AXIS_TEXT_COLOR,
        })
      );
    });

    // 系列多边形
    const fill = this.props.fill !== false;
    const showPoints = this.props.showPoints === true;
    series.forEach((item, seriesIndex) => {
      const color = this.colorFor(seriesIndex);
      const points = item.data.map((value, index) => {
        const clamped = Math.max(0, Math.min(value, domainMax));
        return onePolarPoint(cx, cy, valueScale.scale(clamped), angles[index]);
      });

      nodes.push(
        svgPolygon(onePolygonPoints(points), {
          fill: color,
          'fill-opacity': fill ? 0.15 : 0,
          stroke: color,
          'stroke-width': 2,
          'stroke-linejoin': 'round',
        })
      );

      if (showPoints) {
        points.forEach(([x, y]) => {
          nodes.push(
            svgCircle({
              cx: x,
              cy: y,
              r: 3,
              fill: color,
              stroke: '#ffffff',
              'stroke-width': 1.5,
            })
          );
        });
      }
    });

    return nodes;
  }

  private resolveDomainMax(): number {
    const explicit = this.props.max;
    if (typeof explicit === 'number' && Number.isFinite(explicit) && explicit > 0) {
      return explicit;
    }
    let max = 0;
    for (const item of this.series) {
      for (const value of item.data) {
        if (Number.isFinite(value) && value > max) {
          max = value;
        }
      }
    }
    return oneNiceDomain(0, max)[1];
  }
}
