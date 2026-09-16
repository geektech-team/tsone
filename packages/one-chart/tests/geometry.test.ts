import { describe, expect, it } from 'bun:test';
import {
  oneArcPath,
  oneAreaPath,
  oneLinePath,
  onePolarPoint,
  onePolygonPath,
  oneSmoothLinePath,
} from '../lib';

describe('oneLinePath', () => {
  it('builds M/L segments', () => {
    expect(
      oneLinePath([
        [0, 0],
        [10, 5],
        [20, 10],
      ])
    ).toBe('M0 0 L10 5 L20 10');
    expect(oneLinePath([])).toBe('');
  });
});

describe('oneSmoothLinePath', () => {
  it('falls back to straight lines for fewer than 3 points', () => {
    expect(oneSmoothLinePath([[0, 0], [10, 5]])).toBe('M0 0 L10 5');
  });

  it('emits cubic beziers for 3+ points', () => {
    const path = oneSmoothLinePath([
      [0, 0],
      [10, 10],
      [20, 0],
    ]);
    expect(path.startsWith('M0 0')).toBe(true);
    expect(path).toContain(' C');
    expect(path.split(' C').length).toBe(3); // 两段曲线
  });
});

describe('oneAreaPath', () => {
  it('closes the line to the baseline', () => {
    const path = oneAreaPath(
      [
        [0, 10],
        [10, 30],
        [20, 20],
      ],
      40
    );
    expect(path).toContain('L20 40');
    expect(path).toContain('L0 40');
    expect(path.endsWith('Z')).toBe(true);
  });

  it('supports smooth curves and empty input', () => {
    expect(oneAreaPath([], 40)).toBe('');
    expect(
      oneAreaPath(
        [
          [0, 10],
          [10, 20],
          [20, 15],
        ],
        40,
        'smooth'
      )
    ).toContain(' C');
  });
});

describe('onePolarPoint / onePolygonPath', () => {
  it('converts polar to cartesian coordinates', () => {
    const [x0, y0] = onePolarPoint(0, 0, 10, 0);
    expect(x0).toBeCloseTo(10, 5);
    expect(y0).toBeCloseTo(0, 5);
    const [x1, y1] = onePolarPoint(0, 0, 10, Math.PI / 2);
    expect(x1).toBeCloseTo(0, 5);
    expect(y1).toBeCloseTo(10, 5);
    const [x2, y2] = onePolarPoint(100, 50, 5, Math.PI);
    expect(x2).toBeCloseTo(95, 5);
    expect(y2).toBeCloseTo(50, 5);
  });

  it('builds closed polygons', () => {
    expect(
      onePolygonPath([
        [0, 0],
        [10, 0],
        [10, 10],
      ])
    ).toBe('M0 0 L10 0 L10 10 Z');
    expect(onePolygonPath([])).toBe('');
  });
});

describe('oneArcPath', () => {
  it('builds a solid sector', () => {
    const path = oneArcPath(100, 100, 50, 0, 0, Math.PI / 2);
    expect(path.startsWith('M')).toBe(true);
    expect(path).toContain('A50 50 0 0 1');
    expect(path.endsWith('Z')).toBe(true);
  });

  it('builds a ring sector when innerRadius is positive', () => {
    const ring = oneArcPath(100, 100, 50, 20, 0, Math.PI / 2);
    const solid = oneArcPath(100, 100, 50, 0, 0, Math.PI / 2);
    expect(ring.length).toBeGreaterThan(solid.length);
    expect(ring.match(/A/g)?.length).toBe(2);
    expect(ring).toContain('A20 20');
  });

  it('shrinks both ends by the pad angle', () => {
    // 用弧端点的圆心角跨度比较，而不是字符串长度
    const spanOf = (path: string): number => {
      const start = path.match(/^M([\d.-]+) ([\d.-]+)/);
      const end = path.match(/A[\d.-]+ [\d.-]+ 0 (\d) 1 ([\d.-]+) ([\d.-]+)/);
      if (!start || !end) {
        return 0;
      }
      const a0 = Math.atan2(Number(start[2]) - 100, Number(start[1]) - 100);
      const a1 = Math.atan2(Number(end[3]) - 100, Number(end[2]) - 100);
      let span = a1 - a0;
      while (span <= 0) {
        span += Math.PI * 2;
      }
      return span;
    };
    const plain = oneArcPath(100, 100, 50, 0, 0, 1, 0);
    const padded = oneArcPath(100, 100, 50, 0, 0, 1, 0.2);
    expect(spanOf(padded)).toBeLessThan(spanOf(plain));
    expect(spanOf(padded)).toBeCloseTo(0.6, 1); // 1 - 2 * 0.2（端点坐标取整引入小误差）
  });

  it('builds a full circle for a single full-sweep item', () => {
    const path = oneArcPath(100, 100, 50, 0, 0, Math.PI * 2);
    expect(path.match(/A/g)?.length).toBe(2);
    expect(path.startsWith('M')).toBe(true);
  });

  it('returns empty for invalid sweeps', () => {
    expect(oneArcPath(0, 0, 0, 0, 0, 1)).toBe('');
    expect(oneArcPath(0, 0, 50, 0, 1, 0)).toBe('');
  });
});
