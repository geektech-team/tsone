import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { flushSync } from '@geektech/tsone';
import { OneBarChart, OneLineChart, OnePieChart, OneRadarChart } from '../lib';

const CATEGORIES = ['Q1', 'Q2', 'Q3', 'Q4'];
const SERIES = [
  { name: '华东', data: [120, 200, 150, 280] },
  { name: '华南', data: [80, 110, 130, 160] },
];

/** 元素的直接子级 SMIL 动画节点。 */
function directAnimateChildren(element: Element): Element[] {
  return [...element.childNodes].filter(
    (node): node is Element =>
      node instanceof Element && node.hasAttribute('data-one-chart-animate')
  );
}

/** 元素上针对指定属性的动画节点。 */
function animateFor(element: Element, attributeName: string): Element | null {
  return (
    directAnimateChildren(element).find(
      (node) => node.getAttribute('attributeName') === attributeName
    ) ?? null
  );
}

/** 绘制区柱子：排除图例色块与 tooltip 浮层。 */
function plotBars(container: HTMLElement): Element[] {
  return [...container.querySelectorAll('rect')].filter(
    (rect) =>
      rect.hasAttribute('data-one-chart-anim') &&
      !rect.closest('[data-one-chart-tooltip]')
  );
}

describe('OneChart 初始化动画', () => {
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

  it('柱状图挂载后柱子保留最终几何，并携带从底部生长的 SMIL 动画', () => {
    chart = new OneBarChart({ categories: CATEGORIES, series: SERIES });
    chart.mount(container);

    const bars = plotBars(container);
    expect(bars.length).toBe(8);

    for (const bar of bars) {
      const y = Number(bar.getAttribute('y'));
      const height = Number(bar.getAttribute('height'));
      expect(height).toBeGreaterThan(0);

      const heightAnim = animateFor(bar, 'height');
      const yAnim = animateFor(bar, 'y');
      expect(heightAnim).not.toBeNull();
      expect(yAnim).not.toBeNull();
      // 初始化起点：高度 0、y 位于柱底。
      expect(heightAnim?.getAttribute('from')).toBe('0');
      expect(heightAnim?.getAttribute('to')).toBe(bar.getAttribute('height'));
      expect(yAnim?.getAttribute('from')).toBe(String(y + height));
      expect(yAnim?.getAttribute('to')).toBe(bar.getAttribute('y'));
      expect(heightAnim?.getAttribute('dur')).toBe('0.6s');
      expect(heightAnim?.getAttribute('fill')).toBe('freeze');
    }
  });

  it('animation: false 时不注入任何动画节点', () => {
    chart = new OneBarChart({
      categories: CATEGORIES,
      series: SERIES,
      animation: false,
    });
    chart.mount(container);

    expect(
      container.querySelector('[data-one-chart-animate]')
    ).toBeNull();
    // 几何仍是最终值
    expect(plotBars(container).every((bar) => Number(bar.getAttribute('height')) > 0)).toBe(true);
  });

  it('animation: { init: false } 时跳过初始化动画，但数据变更动画仍生效', () => {
    chart = new OneBarChart({
      categories: CATEGORIES,
      series: SERIES,
      animation: { init: false },
    });
    chart.mount(container);
    expect(container.querySelector('[data-one-chart-animate]')).toBeNull();

    chart.setProps({ series: [{ name: '华东', data: [10, 20, 30, 40] }] });
    flushSync();
    const bars = plotBars(container);
    expect(bars.length).toBe(4);
    expect(animateFor(bars[0]!, 'height')).not.toBeNull();
  });

  it('折线图初始化：路径从基线水平线形变到实际折线', () => {
    const line = new OneLineChart({
      categories: CATEGORIES,
      series: [{ name: '华东', data: [120, 200, 150, 280] }],
    });
    line.mount(container);

    const path = [...container.querySelectorAll('path')].find((node) =>
      node.hasAttribute('data-one-chart-anim')
    );
    expect(path).not.toBeNull();
    const anim = animateFor(path!, 'd');
    expect(anim).not.toBeNull();
    expect(anim?.getAttribute('to')).toBe(path?.getAttribute('d'));

    // 起点为水平线：所有点纵坐标相同
    const from = anim?.getAttribute('from') ?? '';
    const numbers = (from.match(/-?\d+(?:\.\d+)?/g) ?? []).map(Number);
    expect(numbers.length).toBeGreaterThanOrEqual(4);
    const yValues = numbers.filter((_, index) => index % 2 === 1);
    expect(new Set(yValues).size).toBe(1);
  });

  it('饼图初始化：扇区从零跨度路径展开', () => {
    const pie = new OnePieChart({
      data: [
        { name: 'A', value: 50 },
        { name: 'B', value: 30 },
        { name: 'C', value: 20 },
      ],
      animation: { duration: 800 },
    });
    pie.mount(container);

    const slices = [...container.querySelectorAll('path')].filter((node) =>
      node.hasAttribute('data-one-chart-anim')
    );
    expect(slices.length).toBe(3);
    for (const slice of slices) {
      const anim = animateFor(slice, 'd');
      expect(anim).not.toBeNull();
      expect(anim?.getAttribute('dur')).toBe('0.8s');
      expect(anim?.getAttribute('to')).toBe(slice.getAttribute('d'));
      // 起点扇区首尾重合（零面积）
      const from = anim?.getAttribute('from') ?? '';
      const match = from.match(
        /^M(-?\d+(?:\.\d+)?) (-?\d+(?:\.\d+)?) A-?\d+(?:\.\d+)? -?\d+(?:\.\d+)? 0 0 1 (-?\d+(?:\.\d+)?) (-?\d+(?:\.\d+)?)/
      );
      expect(match).not.toBeNull();
      expect(match?.[1]).toBe(match?.[3]);
      expect(match?.[2]).toBe(match?.[4]);
    }
  });

  it('雷达图初始化：多边形从中心点展开', () => {
    const radar = new OneRadarChart({
      indicators: ['速度', '力量', '耐力'],
      series: [{ name: 'A', data: [80, 60, 90] }],
    });
    radar.mount(container);

    const polygon = [...container.querySelectorAll('polygon')].find((node) =>
      node.hasAttribute('data-one-chart-anim')
    );
    expect(polygon).not.toBeNull();
    const anim = animateFor(polygon!, 'points');
    expect(anim).not.toBeNull();
    expect(anim?.getAttribute('to')).toBe(polygon?.getAttribute('points'));
    const from = anim?.getAttribute('from') ?? '';
    const coords = (from.match(/-?\d+(?:\.\d+)?/g) ?? []).map(Number);
    expect(coords.length).toBe(6);
    // 起点所有点收拢于圆心
    expect(coords[0]).toBe(coords[2]);
    expect(coords[0]).toBe(coords[4]);
    expect(coords[1]).toBe(coords[3]);
    expect(coords[1]).toBe(coords[5]);
  });
});

describe('OneChart 数据变更动画', () => {
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

  it('更新数据后柱子从旧几何过渡到新几何', () => {
    chart = new OneBarChart({ categories: CATEGORIES, series: SERIES });
    chart.mount(container);

    const firstBar = plotBars(container)[0]!;
    const oldHeight = firstBar.getAttribute('height');
    const oldY = firstBar.getAttribute('y');

    // 首柱 120 → 60，数值域保持 [0, 300] 不变，仅柱子高度/位置变化
    chart.setProps({
      series: [
        { name: '华东', data: [60, 200, 150, 280] },
        { name: '华南', data: [80, 110, 130, 160] },
      ],
    });
    flushSync();

    const bars = plotBars(container);
    const updated = bars[0]!;
    expect(updated.getAttribute('height')).not.toBe(oldHeight);

    const heightAnim = animateFor(updated, 'height');
    expect(heightAnim?.getAttribute('from')).toBe(oldHeight);
    expect(heightAnim?.getAttribute('to')).toBe(updated.getAttribute('height'));
    const yAnim = animateFor(updated, 'y');
    expect(yAnim?.getAttribute('from')).toBe(oldY);
    expect(yAnim?.getAttribute('to')).toBe(updated.getAttribute('y'));
  });

  it('新增分类的柱子补播初始化动画', () => {
    chart = new OneBarChart({ categories: CATEGORIES, series: SERIES });
    chart.mount(container);

    chart.setProps({
      categories: [...CATEGORIES, 'Q5'],
      series: SERIES.map((item) => ({ ...item, data: [...item.data, 50] })),
    });
    flushSync();

    const bars = plotBars(container);
    expect(bars.length).toBe(10);
    const added = bars.find(
      (bar) => bar.getAttribute('data-one-chart-anim-key') === 'bar-0-4'
    );
    expect(added).not.toBeNull();
    const heightAnim = animateFor(added!, 'height');
    expect(heightAnim?.getAttribute('from')).toBe('0');
  });

  it('animation: { update: false } 时数据变更不注入新动画，并清理旧动画', () => {
    chart = new OneBarChart({
      categories: CATEGORIES,
      series: SERIES,
      animation: { update: false },
    });
    chart.mount(container);
    expect(plotBars(container).every((bar) => animateFor(bar, 'height') !== null)).toBe(true);

    chart.setProps({ series: [{ name: '华东', data: [12, 20, 15, 28] }] });
    flushSync();

    const bars = plotBars(container);
    expect(bars.every((bar) => directAnimateChildren(bar).length === 0)).toBe(true);
    // 几何直接生效
    expect(Number(bars[0]!.getAttribute('height'))).toBeGreaterThan(0);
  });

  it('动画中途关闭时清理残留动画，几何保持最新值', () => {
    chart = new OneBarChart({ categories: CATEGORIES, series: SERIES });
    chart.mount(container);

    chart.setProps({ animation: false });
    flushSync();

    expect(container.querySelector('[data-one-chart-animate]')).toBeNull();
    expect(plotBars(container)[0]?.getAttribute('height')).not.toBe('0');
  });
});

describe('OneChart 容器大小变更动画', () => {
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

  it('变更 width/height 时 SVG 根节点平滑过渡尺寸与 viewBox', () => {
    chart = new OneBarChart({ categories: CATEGORIES, series: SERIES });
    chart.mount(container);

    const svg = container.querySelector('svg')!;
    expect(svg.getAttribute('width')).toBe('640');
    expect(svg.getAttribute('height')).toBe('400');

    chart.setProps({ width: 800, height: 500 });
    flushSync();

    expect(svg.getAttribute('width')).toBe('800');
    expect(svg.getAttribute('height')).toBe('500');

    const widthAnim = animateFor(svg, 'width');
    expect(widthAnim?.getAttribute('from')).toBe('640');
    expect(widthAnim?.getAttribute('to')).toBe('800');
    const heightAnim = animateFor(svg, 'height');
    expect(heightAnim?.getAttribute('from')).toBe('400');
    expect(heightAnim?.getAttribute('to')).toBe('500');
    const viewBoxAnim = animateFor(svg, 'viewBox');
    expect(viewBoxAnim?.getAttribute('from')).toBe('0 0 640 400');
    expect(viewBoxAnim?.getAttribute('to')).toBe('0 0 800 500');
  });

  it('animation: { resize: false } 时容器变更直接生效', () => {
    chart = new OneBarChart({
      categories: CATEGORIES,
      series: SERIES,
      animation: { resize: false },
    });
    chart.mount(container);

    const svg = container.querySelector('svg')!;
    chart.setProps({ width: 800 });
    flushSync();

    expect(svg.getAttribute('width')).toBe('800');
    expect(animateFor(svg, 'width')).toBeNull();
  });
});

describe('OneChart 动画配置', () => {
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

  it('duration 与 easing 映射为 dur / calcMode / keySplines', () => {
    chart = new OneBarChart({
      categories: CATEGORIES,
      series: SERIES,
      animation: { duration: 1000, easing: 'easeInOut' },
    });
    chart.mount(container);

    const anim = animateFor(plotBars(container)[0]!, 'height');
    expect(anim?.getAttribute('dur')).toBe('1s');
    expect(anim?.getAttribute('calcMode')).toBe('spline');
    expect(anim?.getAttribute('keyTimes')).toBe('0;1');
    expect(anim?.getAttribute('keySplines')).toBe('0.33 0 0.67 1');
  });

  it('linear 缓动不输出 spline 属性', () => {
    chart = new OneBarChart({
      categories: CATEGORIES,
      series: SERIES,
      animation: { easing: 'linear' },
    });
    chart.mount(container);

    const anim = animateFor(plotBars(container)[0]!, 'height');
    expect(anim?.getAttribute('calcMode')).toBeNull();
    expect(anim?.getAttribute('keySplines')).toBeNull();
  });
});
