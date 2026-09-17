import type { VNode } from '@geektech/tsone';
import {
  OneCartesianChart,
  type OneCartesianChartProps,
} from '../cartesian';
import type { OneChartRenderContext } from '../types';
import type { OnePoint } from '../geometry';
import { oneAreaPath, oneLinePath, oneSmoothLinePath } from '../geometry';
import { validateOneChartSeriesData } from '../theme';
import { svgCircle, svgPath } from '../svg';

export interface OneLineChartProps extends OneCartesianChartProps {
  /** 折线形态：linear 直线（默认）或 smooth 平滑曲线。 */
  curve?: 'linear' | 'smooth';
  /** 是否填充折线下方面积，默认 false。 */
  fill?: boolean;
  /** 是否显示数据点，默认 false。 */
  showPoints?: boolean;
}

/** 折线图：支持平滑曲线、面积填充与数据点。 */
export class OneLineChart extends OneCartesianChart<OneLineChartProps> {
  protected get chartName(): string {
    return 'OneLineChart';
  }

  protected legendEntries() {
    return this.series.map((item, index) => ({
      name: item.name,
      color: this.colorFor(index),
    }));
  }

  protected renderPlot(_context: OneChartRenderContext): VNode[] {
    const { categories, series } = this;
    validateOneChartSeriesData(categories, series, this.chartName);

    const yScale = this.yScale();
    const categoryCenters = categories.map((_, index) =>
      this.xCategoryCenter(index)
    );
    const nodes: VNode[] = [
      ...this.renderCartesianFrame({
        valueScale: yScale,
        categoryCenters,
        axis: 'vertical',
      }),
    ];

    const baseline = yScale.scale(0);
    const curve = this.props.curve === 'smooth' ? 'smooth' : 'linear';
    const fill = this.props.fill === true;
    const showPoints = this.props.showPoints === true;

    series.forEach((item, seriesIndex) => {
      const color = this.colorFor(seriesIndex);
      const points: OnePoint[] = item.data.map((value, index) => [
        this.xCategoryCenter(index),
        yScale.scale(value),
      ]);

      if (fill) {
        nodes.push(
          svgPath(oneAreaPath(points, baseline, curve), {
            fill: color,
            'fill-opacity': 0.12,
            stroke: 'none',
          })
        );
      }

      const linePath =
        curve === 'smooth' ? oneSmoothLinePath(points) : oneLinePath(points);
      nodes.push(
        svgPath(linePath, {
          fill: 'none',
          stroke: color,
          'stroke-width': 2,
          'stroke-linejoin': 'round',
          'stroke-linecap': 'round',
        })
      );

      points.forEach(([x, y], index) => {
        const value = item.data[index];
        if (showPoints) {
          nodes.push(
            svgCircle({
              cx: x,
              cy: y,
              r: 3.5,
              fill: color,
              stroke: '#ffffff',
              'stroke-width': 1.5,
            })
          );
        }
        // 透明热区置于可见点之上，承担 tooltip 命中。
        nodes.push(
          svgCircle({
            cx: x,
            cy: y,
            r: 9,
            fill: 'transparent',
            ...this.tooltipHitProps(
              { name: categories[index], series: item.name, value },
              color,
              (v) => this.formatValue(v)
            ),
          })
        );
      });
    });

    return nodes;
  }
}
