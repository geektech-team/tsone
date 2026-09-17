import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { OnePieChart } from '../lib';
import { OneChartDataError } from '../lib';

const DATA = [
  { name: '华东', value: 30 },
  { name: '华南', value: 50 },
  { name: '华北', value: 20 },
];

describe('OnePieChart', () => {
  let container: HTMLElement;
  let chart: OnePieChart;

  beforeEach(() => {
    document.body.innerHTML = '';
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    chart?.unmount();
    container.remove();
  });

  it('renders one sector per datum plus legend swatches', () => {
    chart = new OnePieChart({ data: DATA });
    chart.mount(container);

    expect(container.querySelectorAll('path').length).toBe(3);
    const rects = [...container.querySelectorAll('rect')].filter(
      (rect) => !rect.closest('[data-one-chart-tooltip]')
    );
    expect(rects.length).toBe(3);
    const texts = [...container.querySelectorAll('text')].map(
      (node) => node.textContent
    );
    expect(texts).toContain('华东');
    expect(texts).toContain('华北');
  });

  it('slices the circle proportionally to values', () => {
    // 显式布局以便精确计算圆心：plot = (10,10,380,280)
    chart = new OnePieChart({
      data: DATA,
      padAngle: 0,
      showLegend: false,
      width: 400,
      height: 300,
      margin: { top: 10, right: 10, bottom: 10, left: 10 },
    });
    chart.mount(container);

    const cx = 200;
    const cy = 150;
    const spans = [...container.querySelectorAll('path')].map((path) => {
      const d = path.getAttribute('d') ?? '';
      const start = d.match(/^M([\d.-]+) ([\d.-]+)/);
      const arc = d.match(/A[\d.-]+ [\d.-]+ 0 (\d) 1 ([\d.-]+) ([\d.-]+)/);
      if (!start || !arc) {
        return 0;
      }
      const a0 = Math.atan2(
        Number(start[2]) - cy,
        Number(start[1]) - cx
      );
      const a1 = Math.atan2(Number(arc[3]) - cy, Number(arc[2]) - cx);
      let span = a1 - a0;
      while (span <= 0) {
        span += Math.PI * 2;
      }
      return span;
    });

    const total = spans.reduce((sum, span) => sum + span, 0);
    const ratios = spans.map((span) => span / total);
    expect(ratios[0]).toBeCloseTo(0.3, 1);
    expect(ratios[1]).toBeCloseTo(0.5, 1);
    expect(ratios[2]).toBeCloseTo(0.2, 1);

    // 第一片从 12 点钟方向开始
    const first = container.querySelector('path')?.getAttribute('d') ?? '';
    expect(first.startsWith(`M${cx} ${cy - 126}`)).toBe(true);
  });

  it('renders percentage labels when showLabels is enabled', () => {
    chart = new OnePieChart({ data: DATA, showLabels: true });
    chart.mount(container);

    const texts = [...container.querySelectorAll('text')].map(
      (node) => node.textContent
    );
    expect(texts).toContain('30%');
    expect(texts).toContain('50%');
    expect(texts).toContain('20%');
  });

  it('supports custom label formatting', () => {
    chart = new OnePieChart({
      data: DATA,
      showLabels: true,
      labelFormat: (value, total, percent) => `${value}/${total}(${percent.toFixed(0)}%)`,
    });
    chart.mount(container);

    const texts = [...container.querySelectorAll('text')].map(
      (node) => node.textContent
    );
    expect(texts).toContain('30/100(30%)');
  });

  it('renders a donut ring with innerRadius auto', () => {
    chart = new OnePieChart({ data: DATA, innerRadius: 'auto' });
    chart.mount(container);

    const ringPath = container.querySelector('path')?.getAttribute('d') ?? '';
    // 环形扇区包含内外两段弧
    expect(ringPath.match(/A/g)?.length).toBe(2);
    expect(ringPath).toContain('Z');
  });

  it('builds a full circle for a single datum', () => {
    chart = new OnePieChart({ data: [{ name: '唯一', value: 100 }] });
    chart.mount(container);

    const path = container.querySelector('path')?.getAttribute('d') ?? '';
    expect(path.match(/A/g)?.length).toBe(2);
  });

  it('rejects empty, zero and negative values', () => {
    expect(() => {
      const invalid = new OnePieChart({ data: [] });
      invalid.mount(container);
    }).toThrow(OneChartDataError);

    expect(() => {
      const invalid = new OnePieChart({ data: [{ name: 'A', value: 0 }] });
      invalid.mount(container);
    }).toThrow(OneChartDataError);

    expect(() => {
      const invalid = new OnePieChart({ data: [{ name: 'A', value: -3 }] });
      invalid.mount(container);
    }).toThrow(OneChartDataError);
  });

  it('rejects an inverted angle range', () => {
    chart = new OnePieChart({ data: DATA, startAngle: 90, endAngle: -90 });
    expect(() => chart.mount(container)).toThrow(OneChartDataError);
  });
});
