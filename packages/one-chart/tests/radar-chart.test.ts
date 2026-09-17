import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { OneRadarChart } from '../lib';
import { OneChartDataError } from '../lib';

const INDICATORS = ['速度', '力量', '技巧', '耐力', '智力'];
const SERIES = [
  { name: '战士', data: [80, 60, 90, 70, 85] },
  { name: '法师', data: [50, 80, 60, 95, 60] },
];

describe('OneRadarChart', () => {
  let container: HTMLElement;
  let chart: OneRadarChart;

  beforeEach(() => {
    document.body.innerHTML = '';
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    chart?.unmount();
    container.remove();
  });

  it('renders grid rings, spokes, axis labels and series polygons', () => {
    chart = new OneRadarChart({ indicators: INDICATORS, series: SERIES });
    chart.mount(container);

    // 5 层网格环 + 2 个系列多边形
    expect(container.querySelectorAll('polygon').length).toBe(7);
    // 5 条辐条
    expect(container.querySelectorAll('line').length).toBe(5);
    // 指标标签 + 图例
    const texts = [...container.querySelectorAll('text')].map(
      (node) => node.textContent
    );
    INDICATORS.forEach((indicator) => {
      expect(texts).toContain(indicator);
    });
    expect(texts).toContain('战士');
    expect(texts).toContain('法师');
  });

  it('renders data points when showPoints is enabled', () => {
    chart = new OneRadarChart({
      indicators: INDICATORS,
      series: SERIES,
      showPoints: true,
    });
    chart.mount(container);

    const circles = [...container.querySelectorAll('circle')].filter(
      (circle) => !circle.hasAttribute('data-one-chart-tip-title')
    );
    expect(circles.length).toBe(10); // 2 系列 × 5 指标
  });

  it('respects the custom levels count', () => {
    chart = new OneRadarChart({
      indicators: INDICATORS,
      series: SERIES,
      levels: 3,
    });
    chart.mount(container);

    expect(container.querySelectorAll('polygon').length).toBe(5); // 3 环 + 2 系列
  });

  it('honors an explicit max domain', () => {
    chart = new OneRadarChart({
      indicators: INDICATORS,
      series: SERIES,
      max: 200,
    });
    chart.mount(container);

    // 以最外网格环（正五边形顶点）的质心作为圆心
    const center = ringCenter(container);
    // 最高值 95 映射到半径的 47.5%，所有点都远离外环
    const seriesPolygon = container.querySelectorAll('polygon')[5];
    const radii = polygonRadii(seriesPolygon, center);
    radii.forEach((radius) => {
      expect(radius).toBeLessThan(130); // 外环半径约 0.82 * min(564,312)/2 ≈ 128
    });
  });

  it('clamps values above the domain max', () => {
    chart = new OneRadarChart({
      indicators: INDICATORS,
      series: [{ name: 'A', data: [50, 50, 50, 50, 50] }],
      max: 25,
    });
    chart.mount(container);

    // 数据全被夹到 25 → 半径 100%（与最外环重合）
    const center = ringCenter(container);
    const polygon = container.querySelectorAll('polygon')[5]; // 第 6 个：5 环后的系列
    const radii = polygonRadii(polygon, center);
    const outer = polygonRadii(container.querySelectorAll('polygon')[4], center);
    radii.forEach((radius, index) => {
      expect(radius).toBeCloseTo(outer[index] ?? 0, 0);
    });
  });

  it('rejects empty indicators or length mismatches', () => {
    expect(() => {
      const invalid = new OneRadarChart({ indicators: [], series: SERIES });
      invalid.mount(container);
    }).toThrow(OneChartDataError);

    expect(() => {
      const invalid = new OneRadarChart({
        indicators: INDICATORS,
        series: [{ name: 'A', data: [1, 2] }],
      });
      invalid.mount(container);
    }).toThrow(OneChartDataError);
  });
});

type Point = readonly [number, number];

function parsePoints(polygon: Element | null): Point[] {
  const raw = polygon?.getAttribute('points') ?? '';
  return raw
    .split(' ')
    .filter(Boolean)
    .map((pair) => pair.split(',').map(Number) as [number, number]);
}

/** 正多边形顶点质心即圆心。 */
function ringCenter(container: HTMLElement): Point {
  const points = parsePoints(container.querySelector('polygon'));
  const x = points.reduce((sum, [px]) => sum + px, 0) / points.length;
  const y = points.reduce((sum, [, py]) => sum + py, 0) / points.length;
  return [x, y];
}

function polygonRadii(polygon: Element | null, center: Point): number[] {
  const [cx, cy] = center;
  return parsePoints(polygon).map(([x, y]) => Math.hypot(x - cx, y - cy));
}
