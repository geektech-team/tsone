import { OneChartScaleError } from '../errors';

export interface OneBandScaleOptions {
  /** 内外 padding（0-1），默认 0.2。 */
  padding?: number;
  /** 分组在范围内的对齐（0 左对齐，0.5 居中，1 右对齐），默认 0.5。 */
  align?: number;
}

/**
 * 分类带比例尺：把离散分类映射为范围上等宽、等间距的"带"。
 * padding 同时控制带间空隙与边缘空隙的比例；align 决定边缘空隙
 * 的分配（0 左对齐、0.5 居中、1 右对齐）。
 */
export class OneBandScale<T = string> {
  public readonly domain: readonly T[];
  public readonly range: readonly [number, number];
  /** 每个分类的步长（含 padding）。 */
  public readonly step: number;
  /** 每个分类的实际带宽（不含 padding）。 */
  public readonly bandwidth: number;
  /** 第一个分类的起点。 */
  public readonly start: number;

  private readonly indexOf: Map<T, number>;

  constructor(
    domain: readonly T[],
    range: readonly [number, number],
    options: OneBandScaleOptions = {}
  ) {
    const { padding = 0.2, align = 0.5 } = options;
    const [r0, r1] = range;
    if (!Array.isArray(domain) || domain.length === 0) {
      throw new OneChartScaleError('分类带比例尺需要至少一个分类');
    }
    if (!Number.isFinite(r0) || !Number.isFinite(r1)) {
      throw new OneChartScaleError('分类带比例尺的范围必须为有限数');
    }
    if (!Number.isFinite(padding) || padding < 0 || padding >= 1) {
      throw new OneChartScaleError(`分类带比例尺的 padding 必须在 [0, 1) 内：${padding}`);
    }
    if (!Number.isFinite(align) || align < 0 || align > 1) {
      throw new OneChartScaleError(`分类带比例尺的 align 必须在 [0, 1] 内：${align}`);
    }

    this.domain = [...domain];
    this.range = [r0, r1];
    this.indexOf = new Map<T, number>();
    domain.forEach((item, index) => {
      if (this.indexOf.has(item)) {
        throw new OneChartScaleError(`分类重复：${String(item)}`);
      }
      this.indexOf.set(item, index);
    });

    const span = r1 - r0;
    const count = domain.length;
    // 带宽 step*(1-padding)，带间与边缘空隙各为 step*padding；
    // 总宽 = count*带宽 + (count+1)*空隙 = step*(count+padding) = span
    this.step = span / Math.max(1, count + padding);
    this.bandwidth = this.step * (1 - padding);
    // 边缘空隙总量为 2*padding*step，按 align 在两侧分配
    this.start = r0 + padding * this.step * 2 * align;
  }

  /** 分类起始 x 坐标。 */
  public scale(value: T): number {
    const index = this.indexOf.get(value);
    if (index === undefined) {
      throw new OneChartScaleError(`分类不在域中：${String(value)}`);
    }
    return this.scaleIndex(index);
  }

  /** 按分类序号取起始 x 坐标。 */
  public scaleIndex(index: number): number {
    return this.start + index * this.step;
  }
}
