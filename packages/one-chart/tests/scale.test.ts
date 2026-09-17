import { describe, expect, it } from 'bun:test';
import {
  OneBandScale,
  OneLinearScale,
  oneNiceDomain,
  oneNiceStep,
  oneNiceTicks,
} from '../lib/scale';
import { OneChartScaleError } from '../lib';

describe('oneNiceStep / oneNiceTicks / oneNiceDomain', () => {
  it('produces 1/2/5 × 10^k steps', () => {
    expect(oneNiceStep(20)).toBe(20);
    expect(oneNiceStep(7.4)).toBe(10);
    expect(oneNiceStep(0.12)).toBe(0.1);
    expect(oneNiceStep(2.9)).toBe(2);
    expect(oneNiceStep(-3)).toBe(1);
  });

  it('returns covering ticks in ascending order', () => {
    expect(oneNiceTicks(0, 100, 5)).toEqual([0, 20, 40, 60, 80, 100]);
    expect(oneNiceTicks(-10, 10, 4)).toEqual([-10, -5, 0, 5, 10]);
    expect(oneNiceTicks(3, 3)).toEqual([3]);
    expect(oneNiceTicks(1, 0)).toEqual([]);
  });

  it('extends the last tick to cover the max', () => {
    expect(oneNiceTicks(0, 37, 5)).toEqual([0, 10, 20, 30, 40]);
    expect(oneNiceTicks(0, 440, 5)).toEqual([0, 100, 200, 300, 400, 500]);
  });

  it('prepends a tick to cover the min when it falls below the first tick', () => {
    // -0.3 应落在 -0.2 之下，首刻度须向前补一档，避免负值数据点越出绘图区
    expect(oneNiceTicks(-0.3, 0.5, 5)).toEqual([-0.4, -0.2, 0, 0.2, 0.4, 0.6]);
    expect(oneNiceTicks(-7, 12, 5)).toEqual([-10, -5, 0, 5, 10, 15]);
    // min 恰为步长整数倍时不补
    expect(oneNiceTicks(-10, 10, 4)).toEqual([-10, -5, 0, 5, 10]);
    expect(oneNiceTicks(0, 100, 5)).toEqual([0, 20, 40, 60, 80, 100]);
  });

  it('expands domains to nice bounds covering both extremes', () => {
    expect(oneNiceDomain(0, 37)).toEqual([0, 40]);
    expect(oneNiceDomain(0, 0)).toEqual([0, 1]);
    expect(oneNiceDomain(5, 5)).toEqual([0, 5.5]);
    expect(oneNiceDomain(-7, 12)).toEqual([-10, 15]);
    expect(oneNiceDomain(-0.3, 0.5)).toEqual([-0.4, 0.6]);
  });
});

describe('OneLinearScale', () => {
  it('maps values linearly across the range', () => {
    const scale = new OneLinearScale([0, 100], [0, 500]);
    expect(scale.scale(0)).toBe(0);
    expect(scale.scale(50)).toBe(250);
    expect(scale.scale(100)).toBe(500);
    expect(scale.scale(-50)).toBe(-250);
  });

  it('supports inverted ranges (pixel y axis)', () => {
    const scale = new OneLinearScale([0, 100], [400, 0]);
    expect(scale.scale(0)).toBe(400);
    expect(scale.scale(100)).toBe(0);
    expect(scale.scale(50)).toBe(200);
  });

  it('rejects degenerate domains', () => {
    expect(() => new OneLinearScale([5, 5], [0, 100])).toThrow(
      OneChartScaleError
    );
    expect(() => new OneLinearScale([Number.NaN, 10], [0, 100])).toThrow(
      OneChartScaleError
    );
  });

  it('returns domain ticks', () => {
    const scale = new OneLinearScale([0, 100], [0, 500]);
    expect(scale.ticks(5)).toEqual([0, 20, 40, 60, 80, 100]);
  });
});

describe('OneBandScale', () => {
  it('divides the range into evenly padded bands', () => {
    const scale = new OneBandScale(['A', 'B', 'C'], [0, 300], {
      padding: 0.2,
    });
    // step = 300 / 3.2 = 93.75，bandwidth = 75，居中时外缘空隙各 18.75
    expect(scale.scale('A')).toBeCloseTo(18.75, 5);
    expect(scale.scale('B')).toBeCloseTo(112.5, 5);
    expect(scale.scale('C')).toBeCloseTo(206.25, 5);
    expect(scale.bandwidth).toBeCloseTo(75, 5);
    expect(scale.step).toBeCloseTo(93.75, 5);
  });

  it('supports align left and right', () => {
    const left = new OneBandScale(['A', 'B'], [0, 100], {
      padding: 0.2,
      align: 0,
    });
    expect(left.scale('A')).toBe(0);
    const right = new OneBandScale(['A', 'B'], [0, 100], {
      padding: 0.2,
      align: 1,
    });
    // step = 100 / 2.2 ≈ 45.45，右对齐时左缘空隙 2*0.2*step
    expect(right.scale('B')).toBeCloseTo(63.64, 1);
  });

  it('centers a single category', () => {
    const scale = new OneBandScale(['A'], [0, 100], { padding: 0.2 });
    // step = 100 / 1.2 ≈ 83.33，bandwidth ≈ 66.67，居中时两侧各 16.67
    expect(scale.scale('A')).toBeCloseTo(16.67, 1);
    expect(scale.bandwidth).toBeCloseTo(66.67, 1);
  });

  it('throws on unknown or duplicate categories', () => {
    const scale = new OneBandScale(['A', 'B'], [0, 100]);
    expect(() => scale.scale('C')).toThrow(OneChartScaleError);
    expect(() => new OneBandScale(['A', 'A'], [0, 100])).toThrow(
      OneChartScaleError
    );
    expect(() => new OneBandScale([], [0, 100])).toThrow(OneChartScaleError);
    expect(() => new OneBandScale(['A'], [0, 100], { padding: 1 })).toThrow(
      OneChartScaleError
    );
  });
});
