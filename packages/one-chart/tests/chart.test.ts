import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { Component, flushSync, type VNode } from '@geektech/tsone';
import {
  OneChart,
  OneChartDataError,
  type OneChartProps,
  type OneChartRenderContext,
} from '../lib';
import { validateOneChartSeriesData, validateOnePieData } from '../lib/theme';
import { svgRect } from '../lib/svg';

class TestChart extends OneChart<OneChartProps> {
  protected get chartName(): string {
    return 'TestChart';
  }

  protected legendEntries() {
    return [
      { name: '甲', color: '#111111' },
      { name: '乙', color: '#222222' },
    ];
  }

  protected renderPlot(context: OneChartRenderContext): VNode[] {
    return [
      svgRect({
        x: context.x,
        y: context.y,
        width: context.width,
        height: context.height,
        fill: 'red',
      }),
    ];
  }
}

class ReactiveChart extends Component<OneChartProps, { value: number }> {
  protected initState(): { value: number } {
    return { value: 10 };
  }

  protected initStyles(): void {}

  protected render(): VNode {
    return {
      tag: 'svg',
      props: { viewBox: '0 0 100 100' },
      children: [
        {
          tag: 'rect',
          props: { x: String(this.state.value), width: '10', fill: 'red' },
        },
      ],
    };
  }
}

describe('OneChart base', () => {
  let container: HTMLElement;
  let chart: TestChart;

  beforeEach(() => {
    document.body.innerHTML = '';
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    chart?.unmount();
    container.remove();
  });

  it('mounts an SVG root with size, viewBox and a11y attributes', () => {
    chart = new TestChart({ title: '测试', ariaLabel: '自定义标签' });
    chart.mount(container);

    const svg = container.querySelector('svg');
    expect(svg).not.toBeNull();
    expect(svg?.namespaceURI).toBe('http://www.w3.org/2000/svg');
    expect(svg?.getAttribute('viewBox')).toBe('0 0 640 400');
    expect(svg?.getAttribute('width')).toBe('640');
    expect(svg?.getAttribute('height')).toBe('400');
    expect(svg?.getAttribute('role')).toBe('img');
    expect(svg?.getAttribute('aria-label')).toBe('自定义标签');
  });

  it('falls back to title or chart name for the aria label', () => {
    chart = new TestChart({ title: '销售趋势' });
    chart.mount(container);
    expect(container.querySelector('svg')?.getAttribute('aria-label')).toBe(
      '销售趋势'
    );

    chart.unmount();
    chart = new TestChart({});
    chart.mount(container);
    expect(container.querySelector('svg')?.getAttribute('aria-label')).toBe(
      'TestChart'
    );
  });

  it('renders title and legend entries', () => {
    chart = new TestChart({ title: '双系列对比' });
    chart.mount(container);

    const texts = [...container.querySelectorAll('text')].map(
      (node) => node.textContent
    );
    expect(texts).toContain('双系列对比');
    expect(texts).toContain('甲');
    expect(texts).toContain('乙');

    const swatches = container.querySelectorAll('rect');
    expect(swatches.length).toBe(3); // 两个图例色块 + 一个绘制区矩形
    expect(swatches[0]?.getAttribute('fill')).toBe('#111111');
    expect(swatches[1]?.getAttribute('fill')).toBe('#222222');
  });

  it('hides the legend when showLegend is false', () => {
    chart = new TestChart({ showLegend: false });
    chart.mount(container);
    expect(container.querySelectorAll('rect').length).toBe(1);
  });

  it('respects custom dimensions and margins', () => {
    chart = new TestChart({
      width: 320,
      height: 200,
      margin: { left: 20, right: 20, top: 10, bottom: 20 },
      showLegend: false,
    });
    chart.mount(container);

    const svg = container.querySelector('svg');
    expect(svg?.getAttribute('viewBox')).toBe('0 0 320 200');
    const plot = container.querySelector('rect[fill="red"]');
    expect(plot?.getAttribute('x')).toBe('20');
    expect(plot?.getAttribute('width')).toBe('280');
    expect(plot?.getAttribute('height')).toBe('170'); // 200-10-20
  });

  it('uses the provided palette and cycles past its end', () => {
    class PaletteChart extends TestChart {
      protected renderPlot(_context: OneChartRenderContext): VNode[] {
        return [
          svgRect({ x: 0, y: 0, width: 10, height: 10, fill: this.colorFor(0) }),
          svgRect({ x: 10, y: 0, width: 10, height: 10, fill: this.colorFor(1) }),
          svgRect({ x: 20, y: 0, width: 10, height: 10, fill: this.colorFor(2) }),
        ];
      }
    }
    chart = new PaletteChart({ colors: ['#ff0000', '#00ff00'] });
    chart.mount(container);

    const fills = [...container.querySelectorAll('rect')].map((node) =>
      node.getAttribute('fill')
    );
    expect(fills).toContain('#ff0000');
    expect(fills).toContain('#00ff00');
  });
});

describe('OneChart data validation', () => {
  it('throws OneChartDataError for invalid series data', () => {
    expect(() =>
      validateOneChartSeriesData([], [{ name: 'A', data: [1] }], 'OneBarChart')
    ).toThrow(OneChartDataError);
    expect(() =>
      validateOneChartSeriesData(['Q1'], [], 'OneBarChart')
    ).toThrow(OneChartDataError);
    expect(() =>
      validateOneChartSeriesData(
        ['Q1', 'Q2'],
        [{ name: 'A', data: [1] }],
        'OneBarChart'
      )
    ).toThrow(OneChartDataError);
    expect(() =>
      validateOneChartSeriesData(
        ['Q1'],
        [{ name: 'A', data: [Number.NaN] }],
        'OneBarChart'
      )
    ).toThrow(OneChartDataError);
    expect(() =>
      validateOneChartSeriesData(
        ['Q1'],
        [{ name: '', data: [1] }],
        'OneBarChart'
      )
    ).toThrow(OneChartDataError);
  });

  it('throws OneChartDataError for invalid pie data', () => {
    expect(() => validateOnePieData([], 'OnePieChart')).toThrow(
      OneChartDataError
    );
    expect(() =>
      validateOnePieData([{ name: 'A', value: -1 }], 'OnePieChart')
    ).toThrow(OneChartDataError);
    expect(() =>
      validateOnePieData([{ name: 'A', value: 0 }], 'OnePieChart')
    ).toThrow(OneChartDataError);
    expect(() =>
      validateOnePieData([{ name: '', value: 5 }], 'OnePieChart')
    ).toThrow(OneChartDataError);
  });
});

describe('Reactive SVG updates', () => {
  it('repaints attributes when state changes', () => {
    const container = document.createElement('div');
    const component = new ReactiveChart();
    component.mount(container);

    const rect = container.querySelector('rect');
    expect(rect?.getAttribute('x')).toBe('10');

    component.state.value = 60;
    flushSync();
    expect(rect?.getAttribute('x')).toBe('60');
    expect(rect?.getAttribute('width')).toBe('10');

    component.unmount();
  });
});

