import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { flushSync } from '@geektech/tsone';
import { OneLineChart } from '../lib';

const CATEGORIES = ['周一', '周二', '周三', '周四', '周五'];
const SERIES = [
  { name: '访问量', data: [120, 200, 150, 280, 190] },
  { name: '转化率', data: [30, 45, 40, 60, 55] },
];

describe('OneLineChart', () => {
  let container: HTMLElement;
  let chart: OneLineChart;

  beforeEach(() => {
    document.body.innerHTML = '';
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    chart?.unmount();
    container.remove();
  });

  it('renders one path per series plus axes and labels', () => {
    chart = new OneLineChart({ categories: CATEGORIES, series: SERIES });
    chart.mount(container);

    const paths = container.querySelectorAll('path');
    expect(paths.length).toBe(2);

    const texts = [...container.querySelectorAll('text')].map(
      (node) => node.textContent
    );
    expect(texts).toContain('周一');
    expect(texts).toContain('访问量');
    expect(texts).toContain('转化率');
  });

  it('uses straight M/L segments by default', () => {
    chart = new OneLineChart({ categories: CATEGORIES, series: SERIES });
    chart.mount(container);

    const path = container.querySelector('path');
    expect(path?.getAttribute('d')).toContain(' L');
    expect(path?.getAttribute('d')).not.toContain(' C');
  });

  it('emits cubic beziers in smooth mode', () => {
    chart = new OneLineChart({
      categories: CATEGORIES,
      series: SERIES,
      curve: 'smooth',
    });
    chart.mount(container);

    const path = container.querySelector('path');
    expect(path?.getAttribute('d')).toContain(' C');
  });

  it('adds an area path when fill is enabled', () => {
    chart = new OneLineChart({
      categories: CATEGORIES,
      series: SERIES,
      fill: true,
    });
    chart.mount(container);

    const paths = [...container.querySelectorAll('path')];
    expect(paths.length).toBe(4);
    const area = paths.find((path) => path.getAttribute('d')?.endsWith('Z'));
    expect(area).toBeDefined();
    expect(area?.getAttribute('fill-opacity')).toBe('0.12');
  });

  it('renders data points when showPoints is enabled', () => {
    chart = new OneLineChart({
      categories: CATEGORIES,
      series: SERIES,
      showPoints: true,
    });
    chart.mount(container);

    const circles = [...container.querySelectorAll('circle')].filter(
      (circle) => !circle.hasAttribute('data-one-chart-tip-title')
    );
    expect(circles.length).toBe(10); // 2 系列 × 5 分类
    expect(circles[0]?.getAttribute('r')).toBe('3.5');
  });

  it('repaints the line when props change', () => {
    chart = new OneLineChart({ categories: CATEGORIES, series: SERIES });
    chart.mount(container);
    const before = container.querySelector('path')?.getAttribute('d');

    chart.setProps({
      series: [{ name: '访问量', data: [10, 20, 30, 40, 50] }],
    });
    flushSync();

    const after = container.querySelector('path')?.getAttribute('d');
    expect(after).not.toBe(before);
    expect(container.querySelectorAll('path').length).toBe(1);
  });
});
