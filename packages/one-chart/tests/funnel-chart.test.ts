import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { flushSync } from '@geektech/tsone';
import { OneFunnelChart, OneChartDataError } from '../lib';

const DATA = [
  { name: '曝光', value: 100 },
  { name: '点击', value: 60 },
  { name: '转化', value: 30 },
];

describe('OneFunnelChart', () => {
  let container: HTMLElement;
  let chart: OneFunnelChart;

  beforeEach(() => {
    document.body.innerHTML = '';
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('renders one trapezoid per level, width proportional to value', () => {
    chart = new OneFunnelChart({ data: DATA });
    chart.mount(container);

    const paths = container.querySelectorAll('path');
    expect(paths.length).toBe(3);
    expect(paths[0]?.getAttribute('d')).toContain('M52 44');
    expect(paths[0]?.getAttribute('d')).toContain('L616 44');
    // 第 0 级下底宽 = 60% × 564 = 338.4，下底右缘 503.2
    expect(paths[0]?.getAttribute('d')).toContain('503.2');
    // 第 1 级上底即第 0 级下底（164.8 ~ 503.2）
    expect(paths[1]?.getAttribute('d')).toContain('M164.8 148.67');
  });

  it('converges the last level to a triangle', () => {
    chart = new OneFunnelChart({ data: DATA });
    chart.mount(container);

    const d = container.querySelectorAll('path')[2]?.getAttribute('d') ?? '';
    // 最后一级下底为 0：下边两点收拢到同一 x（中心 334）
    expect(d).toContain('334 356');
    expect(container.querySelectorAll('path').length).toBe(3);
  });

  it('shows value and percent labels to the right', () => {
    chart = new OneFunnelChart({
      data: DATA,
      showValues: true,
      showPercent: true,
    });
    chart.mount(container);

    const texts = [...container.querySelectorAll('text')].map(
      (node) => node.textContent
    );
    expect(texts).toContain('100 100%');
    expect(texts).toContain('60 60%');
    expect(texts).toContain('30 30%');
    // 名称标签渲染在宽级内部
    expect(texts).toContain('曝光');
  });

  it('throws OneChartDataError for empty data or non-positive values', () => {
    expect(() => new OneFunnelChart({ data: [] }).mount(container)).toThrow(
      OneChartDataError
    );
    expect(
      () =>
        new OneFunnelChart({
          data: [{ name: 'A', value: -1 }],
        }).mount(container)
    ).toThrow(OneChartDataError);
  });

  it('respects a custom gap', () => {
    chart = new OneFunnelChart({ data: DATA, gap: 8 });
    chart.mount(container);

    const d = container.querySelectorAll('path')[1]?.getAttribute('d') ?? '';
    // gap=8 时第 1 级 y 顶 = 44 + 98.67 + 8 = 150.67
    expect(d).toContain('164.8 150.67');
  });

  it('shows value and conversion on hover', () => {
    chart = new OneFunnelChart({ data: DATA });
    chart.mount(container);

    const hit = container.querySelector<Element>('path[data-one-chart-tip-title]');
    hit?.dispatchEvent(
      new MouseEvent('mousemove', { bubbles: true, clientX: 100, clientY: 100 })
    );
    flushSync();

    const tip = container.querySelector('[data-one-chart-tooltip]');
    expect(tip?.getAttribute('opacity')).toBe('1');
    expect(tip?.textContent).toContain('曝光');
    expect(tip?.textContent).toContain('100');
    expect(tip?.textContent).toContain('100%');
  });
});
