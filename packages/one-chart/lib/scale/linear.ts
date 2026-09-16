import type { OneScale } from '../types';
import { OneChartScaleError } from '../errors';

/** 取"整齐"刻度步长：1/2/5 × 10^k。 */
export function oneNiceStep(raw: number): number {
  if (!Number.isFinite(raw) || raw <= 0) {
    return 1;
  }
  const magnitude = 10 ** Math.floor(Math.log10(raw));
  const normalized = raw / magnitude;
  let factor: number;
  if (normalized < 1.5) {
    factor = 1;
  } else if (normalized < 3) {
    factor = 2;
  } else if (normalized < 7) {
    factor = 5;
  } else {
    factor = 10;
  }
  return factor * magnitude;
}

function roundToStep(value: number, step: number): number {
  const rounded = Math.round(value / step) * step;
  // 消除 0.30000000000000004 这类浮点尾差
  return Number(rounded.toPrecision(12));
}

/** 生成约 count 个覆盖 [min, max] 的整齐刻度。 */
export function oneNiceTicks(min: number, max: number, count = 5): number[] {
  if (!Number.isFinite(min) || !Number.isFinite(max) || min > max) {
    return [];
  }
  if (min === max) {
    return [min];
  }
  const step = oneNiceStep((max - min) / Math.max(1, count));
  const ticks: number[] = [];
  for (
    let value = Math.ceil(min / step) * step;
    value <= max + step * 1e-9;
    value += step
  ) {
    ticks.push(roundToStep(value, step));
  }
  // 保证刻度覆盖 max：末刻度仍小于 max 时补一档
  const last = ticks[ticks.length - 1];
  if (ticks.length > 0 && last !== undefined && last < max) {
    ticks.push(roundToStep(last + step, step));
  }
  return ticks;
}

/**
 * 将 [min, max] 扩展到整齐边界。等值区间会向两侧各扩 10%（0 保持为 0）。
 */
export function oneNiceDomain(min: number, max: number, count = 5): [number, number] {
  if (!Number.isFinite(min) || !Number.isFinite(max) || min > max) {
    throw new OneChartScaleError(`无效的比例尺域：[${min}, ${max}]`);
  }
  if (min === max) {
    if (min === 0) {
      return [0, 1];
    }
    const padding = Math.abs(min) * 0.1 || 1;
    const lower = min - padding;
    const upper = max + padding;
    return lower < 0 ? [lower, upper] : [0, upper];
  }
  const ticks = oneNiceTicks(min, max, count);
  return [ticks[0] ?? min, ticks[ticks.length - 1] ?? max];
}

/** 连续线性比例尺：把数值域线性映射到像素范围。 */
export class OneLinearScale implements OneScale {
  public readonly domain: readonly [number, number];
  public readonly range: readonly [number, number];

  constructor(
    domain: readonly [number, number],
    range: readonly [number, number]
  ) {
    const [d0, d1] = domain;
    const [r0, r1] = range;
    if (
      !Number.isFinite(d0) ||
      !Number.isFinite(d1) ||
      d0 === d1 ||
      !Number.isFinite(r0) ||
      !Number.isFinite(r1)
    ) {
      throw new OneChartScaleError(
        `无效的线性比例尺：domain=[${d0}, ${d1}] range=[${r0}, ${r1}]`
      );
    }
    this.domain = [d0, d1];
    this.range = [r0, r1];
  }

  public scale(value: number): number {
    const [d0, d1] = this.domain;
    const [r0, r1] = this.range;
    if (!Number.isFinite(value)) {
      return Number.NaN;
    }
    return r0 + ((value - d0) / (d1 - d0)) * (r1 - r0);
  }

  public ticks(count = 5): number[] {
    return oneNiceTicks(this.domain[0], this.domain[1], count);
  }
}
