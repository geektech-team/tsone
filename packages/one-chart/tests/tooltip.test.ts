import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { flushSync } from '@geektech/tsone';
import { OneBarChart, OneLineChart, OnePieChart, OneRadarChart } from '../lib';

/**
 * tooltip 交互测试：事件委托在 svg 根上，测试向命中元素分发
 * 冒泡的 MouseEvent，模拟真实浏览器中的鼠标移动。
 * 注意：TSone 组件更新走微任务调度，而 happy-dom 对 SVG 元素的
 * dispatchEvent 不做自动冲刷，因此事件派发后统一显式 flushSync。
 */

function hover(element: Element, clientX: number, clientY: number): void {
  element.dispatchEvent(
    new MouseEvent('mousemove', { bubbles: true, clientX, clientY })
  );
  flushSync();
}

/** 指针移到绘图区空白处（无命中元素）。 */
function moveToEmpty(svg: Element, clientX = 5, clientY = 5): void {
  svg.dispatchEvent(
    new MouseEvent('mousemove', { bubbles: false, clientX, clientY })
  );
  flushSync();
}

function tooltipGroup(container: HTMLElement): Element | null {
  return container.querySelector('[data-one-chart-tooltip]');
}

describe('OneChart tooltip', () => {
  let container: HTMLElement;

  beforeEach(() => {
    document.body.innerHTML = '';
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('renders an invisible tooltip layer by default', () => {
    const chart = new OneBarChart({
      categories: ['Q1', 'Q2'],
      series: [{ name: '华东', data: [120, 200] }],
    });
    chart.mount(container);

    const group = tooltipGroup(container);
    expect(group).not.toBeNull();
    expect(group?.getAttribute('opacity')).toBe('0');
  });

  it('shows bar value on hover and hides on leave', () => {
    const chart = new OneBarChart({
      categories: ['Q1', 'Q2'],
      series: [
        { name: '华东', data: [120, 200] },
        { name: '华南', data: [80, 110] },
      ],
    });
    chart.mount(container);

    const bar = container.querySelector<Element>('rect[data-one-chart-tip-title]');
    expect(bar).not.toBeNull();
    hover(bar!, 100, 100);

    const group = tooltipGroup(container);
    expect(group?.getAttribute('opacity')).toBe('1');
    expect(group?.textContent).toContain('Q1');
    expect(group?.textContent).toContain('华东');
    expect(group?.textContent).toContain('120');

    // 指针移到空白区域时隐藏
    moveToEmpty(container.querySelector('svg')!);
    expect(tooltipGroup(container)?.getAttribute('opacity')).toBe('0');
  });

  it('follows the pointer within the svg bounds', () => {
    const chart = new OneBarChart({
      categories: ['Q1', 'Q2'],
      series: [{ name: '华东', data: [120, 200] }],
    });
    chart.mount(container);

    const bar = container.querySelector<Element>('rect[data-one-chart-tip-title]');
    hover(bar!, 100, 80);

    const transform = tooltipGroup(container)?.getAttribute('transform') ?? '';
    expect(transform).toContain('translate(114'); // 100 + 水平偏移 14
  });

  it('updates content when moving to another bar', () => {
    const chart = new OneBarChart({
      categories: ['Q1', 'Q2'],
      series: [{ name: '华东', data: [120, 200] }],
    });
    chart.mount(container);

    const bars = container.querySelectorAll<Element>(
      'rect[data-one-chart-tip-title]'
    );
    hover(bars[0]!, 100, 100);
    expect(tooltipGroup(container)?.textContent).toContain('120');

    hover(bars[1]!, 200, 100);
    expect(tooltipGroup(container)?.textContent).toContain('200');
    expect(tooltipGroup(container)?.textContent).toContain('Q2');
  });

  it('shows line point tooltip via invisible hit circle', () => {
    const chart = new OneLineChart({
      categories: ['Q1', 'Q2', 'Q3'],
      series: [{ name: '访问量', data: [10, 20, 30] }],
    });
    chart.mount(container);

    const hit = container.querySelector<Element>(
      'circle[data-one-chart-tip-title]'
    );
    hover(hit!, 150, 120);

    const group = tooltipGroup(container);
    expect(group?.getAttribute('opacity')).toBe('1');
    expect(group?.textContent).toContain('访问量');
    expect(group?.textContent).toContain('10');
    expect(group?.textContent).toContain('Q1');
  });

  it('shows pie sector value and percentage', () => {
    const chart = new OnePieChart({
      data: [
        { name: '华东', value: 30 },
        { name: '华南', value: 50 },
        { name: '华北', value: 20 },
      ],
    });
    chart.mount(container);

    const sector = container.querySelector<Element>(
      'path[data-one-chart-tip-title]'
    );
    hover(sector!, 100, 100);

    const group = tooltipGroup(container);
    expect(group?.getAttribute('opacity')).toBe('1');
    expect(group?.textContent).toContain('华东');
    expect(group?.textContent).toContain('30');
    expect(group?.textContent).toContain('30%');
  });

  it('shows radar vertex value', () => {
    const chart = new OneRadarChart({
      indicators: ['速度', '力量', '技巧'],
      series: [{ name: '战士', data: [80, 60, 90] }],
    });
    chart.mount(container);

    const hit = container.querySelector<Element>(
      'circle[data-one-chart-tip-title]'
    );
    hover(hit!, 100, 100);

    const group = tooltipGroup(container);
    expect(group?.getAttribute('opacity')).toBe('1');
    expect(group?.textContent).toContain('速度');
    expect(group?.textContent).toContain('战士');
    expect(group?.textContent).toContain('80');
  });

  it('uses a custom formatter when provided', () => {
    const chart = new OneBarChart({
      categories: ['Q1'],
      series: [{ name: '华东', data: [120] }],
      tooltip: {
        formatter: (hit) => [`自定义 ${hit.name} 值 ${hit.value}`],
      },
    });
    chart.mount(container);

    const bar = container.querySelector<Element>('rect[data-one-chart-tip-title]');
    hover(bar!, 100, 100);

    const group = tooltipGroup(container);
    expect(group?.textContent).toContain('自定义 Q1 值 120');
  });

  it('omits the tooltip layer when tooltip is false', () => {
    const chart = new OneBarChart({
      categories: ['Q1'],
      series: [{ name: '华东', data: [120] }],
      tooltip: false,
    });
    chart.mount(container);

    expect(tooltipGroup(container)).toBeNull();
    expect(
      container.querySelector('rect[data-one-chart-tip-title]')
    ).toBeNull();
  });
});
