import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { flushSync } from '@geektech/tsone';
import { OneBarChart } from '../lib';
import { OneChartDataError } from '../lib';

const CATEGORIES = ['Q1', 'Q2', 'Q3', 'Q4'];
const SERIES = [
  { name: '华东', data: [120, 200, 150, 280] },
  { name: '华南', data: [80, 110, 130, 160] },
];

/** 过滤掉图例色块（10×10）与 tooltip 浮层，只保留绘制区矩形。 */
function plotRects(container: HTMLElement): Element[] {
  return [...container.querySelectorAll('rect')].filter(
    (rect) =>
      !rect.closest('[data-one-chart-tooltip]') &&
      !(
        rect.getAttribute('width') === '10' &&
        rect.getAttribute('height') === '10'
      )
  );
}

/** 过滤 tooltip 浮层后统计矩形数量。 */
function plotRectCount(container: HTMLElement): number {
  return [...container.querySelectorAll('rect')].filter(
    (rect) => !rect.closest('[data-one-chart-tooltip]')
  ).length;
}

describe('OneBarChart', () => {
  let container: HTMLElement;
  let chart: OneBarChart;

  beforeEach(() => {
    document.body.innerHTML = '';
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    chart?.unmount();
    container.remove();
  });

  it('renders grouped bars, axis labels and a legend', () => {
    chart = new OneBarChart({ categories: CATEGORIES, series: SERIES });
    chart.mount(container);

    const svg = container.querySelector('svg');
    expect(svg?.getAttribute('aria-label')).toBe('OneBarChart');

    const rects = [...container.querySelectorAll('rect')];
    expect(rects.length).toBe(11); // 8 根柱 + 2 个图例色块 + tooltip 背景
    const bars = plotRects(container);
    expect(bars.length).toBe(8);
    expect(bars.every((bar) => Number(bar.getAttribute('width')) > 0)).toBe(
      true
    );
    // 同一分类的两根柱并排（Q1 两根柱起点不同）
    const x0 = Number(bars[0]?.getAttribute('x'));
    const x1 = Number(bars[1]?.getAttribute('x'));
    expect(x1).toBeGreaterThan(x0);

    const texts = [...container.querySelectorAll('text')].map(
      (node) => node.textContent
    );
    expect(texts).toContain('Q1');
    expect(texts).toContain('Q4');
    expect(texts).toContain('华东');
    expect(texts).toContain('华南');

    // 网格线数量 = 刻度数量
    const gridLines = [...container.querySelectorAll('line')].filter(
      (line) => line.getAttribute('stroke') === '#e5e7eb'
    );
    expect(gridLines.length).toBeGreaterThanOrEqual(4);
  });

  it('renders value labels above bars when showValues is set', () => {
    chart = new OneBarChart({
      categories: CATEGORIES,
      series: SERIES,
      showValues: true,
    });
    chart.mount(container);

    const texts = [...container.querySelectorAll('text')].map(
      (node) => node.textContent
    );
    expect(texts).toContain('120');
    expect(texts).toContain('280');
    expect(texts).toContain('160');
  });

  it('supports horizontal bars with category labels on the left', () => {
    chart = new OneBarChart({
      categories: CATEGORIES,
      series: SERIES,
      horizontal: true,
    });
    chart.mount(container);

    const bars = plotRects(container);
    expect(bars.length).toBe(8);
    // 横向柱高度均为同一带宽，且大于 0
    const heights = bars.map((bar) => Number(bar.getAttribute('height')));
    expect(heights.every((height) => height > 0)).toBe(true);
    expect(new Set(heights.map((height) => height.toFixed(2))).size).toBe(1);
  });

  it('stacks series when stacked is true', () => {
    chart = new OneBarChart({
      categories: CATEGORIES,
      series: SERIES,
      stacked: true,
    });
    chart.mount(container);

    // 2 系列 × 4 分类 = 8 段堆叠柱
    const bars = plotRects(container);
    expect(bars.length).toBe(8);
    // 第一系列（底部）各段都落在绘图区底边（基线）
    const plotBottom = 44 + 312; // 图例 28 + 上边距 16，绘图区高 312
    for (let index = 0; index < 4; index += 1) {
      const bar = bars[index];
      expect(
        Number(bar?.getAttribute('y')) + Number(bar?.getAttribute('height'))
      ).toBeCloseTo(plotBottom, 0);
    }
    // 第二系列各段底部与第一系列同分类顶部无缝相接
    for (let index = 0; index < 4; index += 1) {
      const above = bars[index];
      const below = bars[index + 4];
      expect(Number(below?.getAttribute('y')) + Number(below?.getAttribute('height'))).toBeCloseTo(
        Number(above?.getAttribute('y')),
        0
      );
    }
    // Q4 累计值 440 映射到域 [0, 500]，两段总高 = 312 * 0.88
    const q4Total =
      Number(bars[3]?.getAttribute('height')) +
      Number(bars[7]?.getAttribute('height'));
    expect(q4Total).toBeCloseTo(312 * 0.88, 0);
  });

  it('rejects negative values in stacked mode', () => {
    chart = new OneBarChart({
      categories: CATEGORIES,
      series: [{ name: 'A', data: [1, -2, 3, 4] }],
      stacked: true,
    });
    expect(() => chart.mount(container)).toThrow(OneChartDataError);
  });

  it('rejects length-mismatched series data', () => {
    chart = new OneBarChart({
      categories: CATEGORIES,
      series: [{ name: 'A', data: [1, 2] }],
    });
    expect(() => chart.mount(container)).toThrow(OneChartDataError);
  });

  it('repaints bars after props change', () => {
    chart = new OneBarChart({ categories: CATEGORIES, series: SERIES });
    chart.mount(container);
    expect(plotRectCount(container)).toBe(10);

    chart.setProps({
      categories: ['Q1', 'Q2'],
      series: [{ name: '华东', data: [5, 9] }],
    });
    flushSync();

    // 2 根柱 + 1 个图例色块
    expect(plotRectCount(container)).toBe(3);
    const texts = [...container.querySelectorAll('text')].map(
      (node) => node.textContent
    );
    expect(texts).not.toContain('华南');
  });
});
