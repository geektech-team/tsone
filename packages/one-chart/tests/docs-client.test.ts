import { describe, expect, it } from 'bun:test';
import { flushSync } from '@geektech/tsone';
import { BarChartDemo } from '../docs/app/demos/BarChartDemo';

/**
 * 交互式 demo 的回归测试：TSone 原生元素的 DOM 事件必须通过 `listeners` 字段
 * 绑定（`emitters` 只对组件节点生效），否则点击按钮不会切换图表数据。
 */
describe('One Chart docs demo interaction', () => {
  it('cycles the bar demo through grouped, stacked and horizontal on button click', () => {
    const host = document.createElement('div');
    document.body.appendChild(host);
    const demo = new BarChartDemo();
    demo.mount(host);
    flushSync();

    const button = host.querySelector<HTMLButtonElement>('button');
    const title = host.querySelector<SVGTextElement>('text');
    expect(button).not.toBeNull();
    expect(button?.textContent).toContain('堆叠');
    expect(title?.textContent).toBe('季度销量（分组）');

    // 分组 → 堆叠
    button?.dispatchEvent(new Event('click'));
    flushSync();
    expect(
      host.querySelector<HTMLButtonElement>('button')?.textContent
    ).toContain('横向');
    expect(host.querySelector<SVGTextElement>('text')?.textContent).toBe(
      '季度销量（堆叠）'
    );

    // 堆叠 → 横向
    host.querySelector<HTMLButtonElement>('button')?.dispatchEvent(
      new Event('click')
    );
    flushSync();
    expect(
      host.querySelector<HTMLButtonElement>('button')?.textContent
    ).toContain('分组');
    expect(host.querySelector<SVGTextElement>('text')?.textContent).toBe(
      '季度销量（横向）'
    );

    // 横向 → 回到分组
    host.querySelector<HTMLButtonElement>('button')?.dispatchEvent(
      new Event('click')
    );
    flushSync();
    expect(
      host.querySelector<SVGTextElement>('text')?.textContent
    ).toBe('季度销量（分组）');
  });

  it('keeps a stable svg node while repainting on toggle', () => {
    const host = document.createElement('div');
    document.body.appendChild(host);
    const demo = new BarChartDemo();
    demo.mount(host);
    flushSync();

    const svg = host.querySelector('svg');
    expect(svg).not.toBeNull();

    host.querySelector<HTMLButtonElement>('button')?.dispatchEvent(
      new Event('click')
    );
    flushSync();

    expect(host.querySelector('svg')).toBe(svg);
  });
});
