import type { VNode } from '@geektech/tsone';
import { OneChart } from '../Chart';
import type { OneChartProps, OneChartSeries } from '../types';
import { OneLinearScale, oneNiceDomain } from '../scale';
import {
  ONE_CHART_AXIS_LINE_COLOR,
  ONE_CHART_AXIS_TEXT_COLOR,
  ONE_CHART_GRID_COLOR,
} from '../theme';
import { svgLine, svgText } from '../svg';
import { oneDefaultValueFormat, truncateOneChartText } from '../format';

/** 笛卡尔图表（柱状/折线）通用属性。 */
export interface OneCartesianChartProps extends OneChartProps {
  /** 分类名，同时决定 X 轴刻度数量。 */
  categories: string[];
  /** 系列数据，每个系列数据长度须与分类一致。 */
  series: OneChartSeries[];
  /** 是否显示网格线，默认 true。 */
  grid?: boolean;
  /** 数值刻度格式化。 */
  valueFormat?: (value: number) => string;
}

export interface OneCartesianFrameOptions {
  /** 数值轴比例尺。 */
  valueScale: OneLinearScale;
  /** 分类标签中心位置（垂直布局为 x、水平布局为 y）。 */
  categoryCenters: number[];
  /** 数值轴方向：vertical 为 Y 轴（柱/折线），horizontal 为 X 轴（横向柱）。 */
  axis: 'vertical' | 'horizontal';
}

/**
 * 笛卡尔图表抽象基类：提供数值域计算、网格与坐标轴渲染，
 * 供柱状图与折线图共享。
 */
export abstract class OneCartesianChart<
  TProps extends OneCartesianChartProps = OneCartesianChartProps,
> extends OneChart<TProps> {
  protected get categories(): string[] {
    return this.props.categories ?? [];
  }

  protected get series(): OneChartSeries[] {
    return this.props.series ?? [];
  }

  protected get showGrid(): boolean {
    return this.props.grid !== false;
  }

  /** 全部系列的最小值（含 0）。 */
  protected minSeriesValue(): number {
    let min = 0;
    for (const item of this.series) {
      for (const value of item.data) {
        if (Number.isFinite(value) && value < min) {
          min = value;
        }
      }
    }
    return min;
  }

  /** 全部系列的最大值（含 0）。 */
  protected maxSeriesValue(): number {
    let max = 0;
    for (const item of this.series) {
      for (const value of item.data) {
        if (Number.isFinite(value) && value > max) {
          max = value;
        }
      }
    }
    return max;
  }

  /** 数值比例尺：域扩展到整齐边界并包含 0，映射到给定像素范围。 */
  protected valueScale(range: readonly [number, number]): OneLinearScale {
    const [d0, d1] = oneNiceDomain(this.minSeriesValue(), this.maxSeriesValue());
    return new OneLinearScale([d0, d1], range);
  }

  /** 默认垂直布局的 Y 比例尺。 */
  protected yScale(): OneLinearScale {
    return this.valueScale([this.plotY + this.plotHeight, this.plotY]);
  }

  protected formatValue(value: number): string {
    if (this.props.valueFormat) {
      return this.props.valueFormat(value);
    }
    return oneDefaultValueFormat(value);
  }

  /** 分类中心点 x（折线数据点与无带布局的标签用）。 */
  protected xCategoryCenter(index: number): number {
    const count = this.categories.length;
    if (count <= 1) {
      return this.plotX + this.plotWidth / 2;
    }
    return this.plotX + ((index + 0.5) * this.plotWidth) / count;
  }

  /** 渲染坐标轴、网格与分类/刻度标签。 */
  protected renderCartesianFrame(options: OneCartesianFrameOptions): VNode[] {
    const { valueScale, categoryCenters, axis } = options;
    const left = this.plotX;
    const top = this.plotY;
    const width = this.plotWidth;
    const height = this.plotHeight;
    const bottom = top + height;
    const right = left + width;
    const nodes: VNode[] = [];
    const ticks = valueScale.ticks(5);

    if (axis === 'vertical') {
      ticks.forEach((tick) => {
        const y = valueScale.scale(tick);
        if (this.showGrid) {
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
      categoryCenters.forEach((x, index) => {
        nodes.push(
          svgText(truncateOneChartText(this.categories[index], 12), {
            x,
            y: bottom + 18,
            'text-anchor': 'middle',
            'font-size': 11,
            fill: ONE_CHART_AXIS_TEXT_COLOR,
          })
        );
      });
    } else {
      ticks.forEach((tick) => {
        const x = valueScale.scale(tick);
        if (this.showGrid) {
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
          svgText(this.formatValue(tick), {
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
      categoryCenters.forEach((y, index) => {
        nodes.push(
          svgText(truncateOneChartText(this.categories[index], 12), {
            x: left - 8,
            y: y + 3,
            'text-anchor': 'end',
            'font-size': 11,
            fill: ONE_CHART_AXIS_TEXT_COLOR,
          })
        );
      });
    }

    return nodes;
  }
}
