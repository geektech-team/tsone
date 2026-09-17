import type { VNode } from '@geektech/tsone';
import {
  OneCartesianChart,
  type OneCartesianChartProps,
} from '../cartesian';
import type { OneChartRenderContext } from '../types';
import { OneBandScale, OneLinearScale, oneNiceDomain } from '../scale';
import { validateOneChartSeriesData, ONE_CHART_VALUE_TEXT_COLOR } from '../theme';
import { svgRect, svgText } from '../svg';
import { oneAnimAttrs, oneAnimFrom, oneAnimKey } from '../animation';
import { OneChartDataError } from '../errors';

export interface OneBarChartProps extends OneCartesianChartProps {
  /** 横向柱状图，默认 false。 */
  horizontal?: boolean;
  /** 堆叠模式，默认 false。堆叠不支持负值。 */
  stacked?: boolean;
  /** 在柱顶显示数值标签，默认 false。 */
  showValues?: boolean;
}

/** 柱状图：支持多系列分组、横向与堆叠。 */
export class OneBarChart extends OneCartesianChart<OneBarChartProps> {
  protected get chartName(): string {
    return 'OneBarChart';
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

    const horizontal = this.props.horizontal === true;
    const stacked = this.props.stacked === true;
    const nodes: VNode[] = [];

    if (horizontal) {
      const xScale = stacked
        ? this.stackedScale([this.plotX, this.plotX + this.plotWidth])
        : this.valueScale([this.plotX, this.plotX + this.plotWidth]);
      const band = new OneBandScale(
        categories,
        [this.plotY, this.plotY + this.plotHeight],
        { padding: 0.25 }
      );
      const categoryCenters = categories.map(
        (_, index) => band.scaleIndex(index) + band.bandwidth / 2
      );
      nodes.push(
        ...this.renderCartesianFrame({
          valueScale: xScale,
          categoryCenters,
          axis: 'horizontal',
        })
      );
      nodes.push(...this.renderHorizontalBars(xScale, band));
    } else {
      const yScale = stacked
        ? this.stackedScale([this.plotY + this.plotHeight, this.plotY])
        : this.yScale();
      const band = new OneBandScale(
        categories,
        [this.plotX, this.plotX + this.plotWidth],
        { padding: 0.25 }
      );
      const categoryCenters = categories.map(
        (_, index) => band.scaleIndex(index) + band.bandwidth / 2
      );
      nodes.push(
        ...this.renderCartesianFrame({
          valueScale: yScale,
          categoryCenters,
          axis: 'vertical',
        })
      );
      nodes.push(...this.renderVerticalBars(yScale, band));
    }

    return nodes;
  }

  /** 堆叠模式数值域：覆盖各分类累计总和。 */
  private stackedDomain(): [number, number] {
    const { categories, series } = this;
    const sums = new Array<number>(categories.length).fill(0);
    for (const item of series) {
      item.data.forEach((value, index) => {
        sums[index] += value;
      });
    }
    let max = 0;
    for (const sum of sums) {
      if (Number.isFinite(sum) && sum > max) {
        max = sum;
      }
    }
    return oneNiceDomain(0, max);
  }

  private stackedScale(range: readonly [number, number]): OneLinearScale {
    return new OneLinearScale(this.stackedDomain(), range);
  }

  private renderVerticalBars(
    yScale: OneLinearScale,
    band: OneBandScale
  ): VNode[] {
    const { categories, series } = this;
    const baseline = yScale.scale(0);
    const nodes: VNode[] = [];

    if (this.props.stacked) {
      this.assertStackable();
      const offsets = new Array<number>(categories.length).fill(0);
      series.forEach((item, seriesIndex) => {
        const color = this.colorFor(seriesIndex);
        item.data.forEach((value, index) => {
          const start = yScale.scale(offsets[index]);
          const end = yScale.scale(offsets[index] + value);
          offsets[index] += value;
          const barY = Math.min(start, end);
          const barHeight = Math.max(0.5, Math.abs(end - start));
          nodes.push(
            svgRect({
              x: band.scaleIndex(index),
              y: barY,
              width: band.bandwidth,
              height: barHeight,
              fill: color,
              ...oneAnimAttrs(['y', 'height']),
              ...oneAnimKey(`stack-${seriesIndex}-${index}`),
              ...oneAnimFrom([
                ['y', barY + barHeight],
                ['height', 0],
              ]),
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

    const innerStep = band.bandwidth / series.length;
    const barWidth = innerStep * 0.75;
    series.forEach((item, seriesIndex) => {
      const color = this.colorFor(seriesIndex);
      item.data.forEach((value, index) => {
        const valueY = yScale.scale(value);
        const barX =
          band.scaleIndex(index) +
          seriesIndex * innerStep +
          (innerStep - barWidth) / 2;
        const barY = Math.min(valueY, baseline);
        const barHeight = Math.max(0.5, Math.abs(baseline - valueY));
        nodes.push(
          svgRect({
            x: barX,
            y: barY,
            width: barWidth,
            height: barHeight,
            fill: color,
            ...oneAnimAttrs(['y', 'height']),
            ...oneAnimKey(`bar-${seriesIndex}-${index}`),
            ...oneAnimFrom([
              ['y', barY + barHeight],
              ['height', 0],
            ]),
            ...this.tooltipHitProps(
              { name: categories[index], series: item.name, value },
              color,
              (v) => this.formatValue(v)
            ),
          })
        );
        if (this.props.showValues && Math.abs(baseline - valueY) >= 10) {
          nodes.push(
            svgText(this.formatValue(value), {
              x: barX + barWidth / 2,
              y: valueY > baseline ? valueY - 4 : valueY + 12,
              'text-anchor': 'middle',
              'font-size': 10,
              fill: ONE_CHART_VALUE_TEXT_COLOR,
              ...oneAnimAttrs(['x', 'y']),
              ...oneAnimKey(`bar-value-${seriesIndex}-${index}`),
              ...oneAnimFrom([
                ['x', barX + barWidth / 2],
                ['y', valueY > baseline ? baseline - 4 : baseline + 12],
              ]),
            })
          );
        }
      });
    });

    return nodes;
  }

  private renderHorizontalBars(
    xScale: OneLinearScale,
    band: OneBandScale
  ): VNode[] {
    const { categories, series } = this;
    const baseline = xScale.scale(0);
    const nodes: VNode[] = [];

    if (this.props.stacked) {
      this.assertStackable();
      const offsets = new Array<number>(categories.length).fill(0);
      series.forEach((item, seriesIndex) => {
        const color = this.colorFor(seriesIndex);
        item.data.forEach((value, index) => {
          const start = xScale.scale(offsets[index]);
          const end = xScale.scale(offsets[index] + value);
          offsets[index] += value;
          const barX = Math.min(start, end);
          const barWidth = Math.max(0.5, Math.abs(end - start));
          nodes.push(
            svgRect({
              x: barX,
              y: band.scaleIndex(index),
              width: barWidth,
              height: band.bandwidth,
              fill: color,
              ...oneAnimAttrs(['x', 'width']),
              ...oneAnimKey(`hstack-${seriesIndex}-${index}`),
              ...oneAnimFrom([
                ['x', barX + barWidth],
                ['width', 0],
              ]),
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

    const innerStep = band.bandwidth / series.length;
    const barHeight = innerStep * 0.75;
    series.forEach((item, seriesIndex) => {
      const color = this.colorFor(seriesIndex);
      item.data.forEach((value, index) => {
        const valueX = xScale.scale(value);
        const barY =
          band.scaleIndex(index) +
          seriesIndex * innerStep +
          (innerStep - barHeight) / 2;
        const barX = Math.min(valueX, baseline);
        const barWidth = Math.max(0.5, Math.abs(baseline - valueX));
        nodes.push(
          svgRect({
            x: barX,
            y: barY,
            width: barWidth,
            height: barHeight,
            fill: color,
            ...oneAnimAttrs(['x', 'width']),
            ...oneAnimKey(`hbar-${seriesIndex}-${index}`),
            ...oneAnimFrom([
              ['x', barX + barWidth],
              ['width', 0],
            ]),
            ...this.tooltipHitProps(
              { name: categories[index], series: item.name, value },
              color,
              (v) => this.formatValue(v)
            ),
          })
        );
        if (this.props.showValues && Math.abs(baseline - valueX) >= 10) {
          nodes.push(
            svgText(this.formatValue(value), {
              x: Math.max(valueX, baseline) + 4,
              y: barY + barHeight / 2 + 3,
              'text-anchor': 'start',
              'font-size': 10,
              fill: ONE_CHART_VALUE_TEXT_COLOR,
              ...oneAnimAttrs(['x', 'y']),
              ...oneAnimKey(`hbar-value-${seriesIndex}-${index}`),
              ...oneAnimFrom([
                ['x', baseline + 4],
                ['y', barY + barHeight / 2 + 3],
              ]),
            })
          );
        }
      });
    });

    return nodes;
  }

  private assertStackable(): void {
    if (this.minSeriesValue() < 0) {
      throw new OneChartDataError(`${this.chartName} 堆叠模式不支持负值`);
    }
  }
}
