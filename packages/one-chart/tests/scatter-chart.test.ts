import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { flushSync } from '@geektech/tsone';
import { OneScatterChart, OneChartDataError } from '../lib';

const SERIES = [
  { name: 'A', data: [[1, 2], [2, 4], [3, 6]] as Array<readonly [number, number]> },
];

describe('OneScatterChart', () => {
  let container: HTMLElement;
  let chart: OneScatterChart;

  beforeEach(() => {
    document.body.innerHTML = '';
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('renders one circle per data point on linear axes', () => {
    chart = new OneScatterChart({ series: SERIES });
    chart.mount(container);

    const circles = [...container.querySelectorAll('circle')];
    expect(circles.length).toBe(3);
    // x 域 [1, 3] → [52, 616]，y 域 [2, 6] → [356, 44]
    expect(circles[0]?.getAttribute('cx')).toBe('52');
    expect(circles[0]?.getAttribute('cy')).toBe('356');
    expect(circles[2]?.getAttribute('cx')).toBe('616');
    expect(circles[2]?.getAttribute('cy')).toBe('44');
    expect(circles[0]?.getAttribute('fill')).toBe('#4e79a7');
  });

  it('renders grid lines and axis ticks for both axes', () => {
    chart = new OneScatterChart({ series: SERIES });
    chart.mount(container);

    const lines = container.querySelectorAll('line');
    // y 刻度 5 + x 刻度 5 条网格，外加左/下两条轴线
    expect(lines.length).toBe(12);
    const texts = [...container.querySelectorAll('text')].map(
      (node) => node.textContent
    );
    expect(texts).toContain('1');
    expect(texts).toContain('6');
  });

  it('supports multiple series with distinct colors', () => {
    chart = new OneScatterChart({
      series: [
        ...SERIES,
        { name: 'B', data: [[1.5, 3], [2.5, 5]] as Array<readonly [number, number]> },
      ],
    });
    chart.mount(container);

    const circles = [...container.querySelectorAll('circle')];
    expect(circles.length).toBe(5);
    expect(circles[3]?.getAttribute('fill')).toBe('#f28e2b');
    const legend = [...container.querySelectorAll('text')].map(
      (node) => node.textContent
    );
    expect(legend).toContain('B');
  });

  it('respects pointRadius and grid=false', () => {
    chart = new OneScatterChart({
      series: SERIES,
      pointRadius: 6,
      grid: false,
    });
    chart.mount(container);

    expect(
      container.querySelector('circle')?.getAttribute('r')
    ).toBe('6');
    // 无网格线：仅 2 条轴线
    expect(container.querySelectorAll('line').length).toBe(2);
  });

  it('throws OneChartDataError for non-finite points', () => {
    expect(
      () =>
        new OneScatterChart({
          series: [
            { name: 'A', data: [[1, Number.NaN]] },
          ],
        }).mount(container)
    ).toThrow(OneChartDataError);
  });

  it('shows x/y values on hover', () => {
    chart = new OneScatterChart({ series: SERIES });
    chart.mount(container);

    const hit = container.querySelector<Element>('circle[data-one-chart-tip-title]');
    hit?.dispatchEvent(
      new MouseEvent('mousemove', { bubbles: true, clientX: 100, clientY: 100 })
    );
    flushSync();

    const tip = container.querySelector('[data-one-chart-tooltip]');
    expect(tip?.getAttribute('opacity')).toBe('1');
    expect(tip?.textContent).toContain('A');
    expect(tip?.textContent).toContain('x 1, y 2');
  });
});
