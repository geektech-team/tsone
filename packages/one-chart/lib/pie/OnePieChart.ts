import type { VNode } from '@geektech/tsone';
import { OneChart } from '../Chart';
import type { OneChartProps, OneChartRenderContext, OnePieDatum } from '../types';
import { normalizeOneNumberOption, validateOnePieData } from '../theme';
import { oneArcPath, oneCollapsedArcPath, onePolarPoint } from '../geometry';
import { ONE_CHART_AXIS_TEXT_COLOR } from '../theme';
import { onePercentLabel } from '../format';
import { svgPath, svgText } from '../svg';
import { oneAnimAttrs, oneAnimFrom, oneAnimKey } from '../animation';
import { OneChartDataError } from '../errors';

export interface OnePieChartProps extends OneChartProps {
  /** 饼图数据项。 */
  data: OnePieDatum[];
  /** 内半径：数字或 'auto'（默认 0.55 倍外半径），大于 0 时为环形图。 */
  innerRadius?: number | 'auto';
  /** 是否在扇区外侧显示百分比标签，默认 false。 */
  showLabels?: boolean;
  /** 起始角度（度），默认 -90（12 点钟方向）。 */
  startAngle?: number;
  /** 结束角度（度），默认 270（绕满一周）。 */
  endAngle?: number;
  /** 扇区间隙（度），默认 1。 */
  padAngle?: number;
  /** 标签格式化，参数为（数值, 总和, 百分比）。 */
  labelFormat?: (value: number, total: number, percent: number) => string;
}

const DEG_TO_RAD = Math.PI / 180;

/** 饼图：支持环形（甜甜圈）、百分比标签与扇区间隙。 */
export class OnePieChart extends OneChart<OnePieChartProps> {
  protected get chartName(): string {
    return 'OnePieChart';
  }

  protected get data(): OnePieDatum[] {
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

    const total = data.reduce((sum, item) => sum + item.value, 0);
    const cx = context.x + context.width / 2;
    const cy = context.y + context.height / 2;
    const showLabels = this.props.showLabels === true;

    const maxRadius = Math.min(context.width, context.height) / 2;
    const radius = showLabels ? maxRadius * 0.72 : maxRadius * 0.9;
    const innerRadius = this.resolveInnerRadius(radius);

    const startAngle = this.toRadians(this.props.startAngle, -90);
    const endAngle = this.toRadians(this.props.endAngle, 270);
    const padAngle = this.toRadians(this.props.padAngle, 1);
    const sweep = endAngle - startAngle;
    if (sweep <= 0) {
      throw new OneChartDataError(
        `${this.chartName} 的结束角度必须大于起始角度`
      );
    }

    const nodes: VNode[] = [];
    let angle = startAngle;

    data.forEach((item, index) => {
      const span = (item.value / total) * sweep;
      const color = this.colorFor(index);
      const percent = (item.value / total) * 100;
      nodes.push(
        svgPath(
          oneArcPath(cx, cy, radius, innerRadius, angle, angle + span, padAngle),
          {
            fill: color,
            stroke: '#ffffff',
            'stroke-width': 1,
            ...oneAnimAttrs(['d']),
            ...oneAnimKey(`slice-${index}`),
            ...oneAnimFrom([
              [
                'd',
                oneCollapsedArcPath(cx, cy, radius, innerRadius, angle, padAngle),
              ],
            ]),
            ...this.tooltipHitProps(
              { name: item.name, value: item.value, percent },
              color
            ),
          }
        )
      );

      if (showLabels) {
        const midAngle = angle + span / 2;
        const label = this.props.labelFormat
          ? this.props.labelFormat(item.value, total, percent)
          : onePercentLabel(percent);
        const [labelX, labelY] = onePolarPoint(cx, cy, radius + 16, midAngle);
        // 初始化动画起点：标签从扇区起始角滑出。
        const [fromX, fromY] = onePolarPoint(cx, cy, radius + 16, angle);
        nodes.push(
          svgText(label, {
            x: labelX,
            y: labelY + 3,
            'text-anchor': Math.cos(midAngle) >= 0 ? 'start' : 'end',
            'font-size': 11,
            fill: ONE_CHART_AXIS_TEXT_COLOR,
            ...oneAnimAttrs(['x', 'y']),
            ...oneAnimKey(`slice-label-${index}`),
            ...oneAnimFrom([
              ['x', fromX],
              ['y', fromY + 3],
            ]),
          })
        );
      }

      angle += span;
    });

    return nodes;
  }

  private resolveInnerRadius(radius: number): number {
    if (this.props.innerRadius === 'auto') {
      return radius * 0.55;
    }
    const value = normalizeOneNumberOption(this.props.innerRadius, 0);
    return Math.min(Math.max(value, 0), radius * 0.9);
  }

  private toRadians(value: number | undefined, fallback: number): number {
    const normalized = normalizeOneNumberOption(value, fallback);
    return normalized * DEG_TO_RAD;
  }
}
