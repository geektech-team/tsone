import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { flushSync } from '@geektech/tsone';
import {
  ONE_GRID_BREAKPOINT_DEFAULTS,
  ONE_GRID_COLUMNS,
  OneCol,
  OneRow,
  normalizeOneColOffset,
  normalizeOneColSpan,
  normalizeOneRowGutter,
  resolveOneColLayout,
  resolveOneGridBreakpoint,
  type OneColProps,
} from '../lib';

describe('OneRow / OneCol grid', () => {
  let container: HTMLElement;
  let row: OneRow | undefined;

  beforeEach(() => {
    document.body.innerHTML = '';
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    row?.unmount();
    row = undefined;
    container.remove();
  });

  it('divides the row width into 24 equal columns via span', () => {
    row = new OneRow({
      children: [
        { component: OneCol, props: { span: 6 }, children: ['a'] },
        { component: OneCol, props: { span: 18 }, children: ['b'] },
      ],
    });
    row.mount(container);

    const cols = container.querySelectorAll('.one-col');
    expect(cols.length).toBe(2);
    expect((cols[0] as HTMLElement).style.width).toBe(
      `calc(100% * 6 / ${ONE_GRID_COLUMNS})`
    );
    expect((cols[1] as HTMLElement).style.width).toBe(
      `calc(100% * 18 / ${ONE_GRID_COLUMNS})`
    );
  });

  it('supports offset to shift a column to the right', () => {
    row = new OneRow({
      children: [
        { component: OneCol, props: { span: 8, offset: 8 }, children: ['x'] },
      ],
    });
    row.mount(container);

    const col = container.querySelector('.one-col') as HTMLElement;
    expect(col.style.marginLeft).toBe(`calc(100% * 8 / ${ONE_GRID_COLUMNS})`);
  });

  it('applies gutter to the row and injects padding into columns', () => {
    row = new OneRow({
      gutter: [16, 8],
      children: [{ component: OneCol, props: { span: 12 }, children: ['x'] }],
    });
    row.mount(container);

    const rowElement = container.querySelector('.one-row') as HTMLElement;
    expect(rowElement.style.marginLeft).toBe('-8px');
    expect(rowElement.style.marginRight).toBe('-8px');
    expect(rowElement.style.rowGap).toBe('8px');

    const col = container.querySelector('.one-col') as HTMLElement;
    expect(col.style.paddingLeft).toBe('8px');
    expect(col.style.paddingRight).toBe('8px');
  });

  it('accepts a single number gutter for both axes and defaults to zero', () => {
    expect(normalizeOneRowGutter(12)).toEqual({ horizontal: 12, vertical: 12 });
    expect(normalizeOneRowGutter([16, 8])).toEqual({
      horizontal: 16,
      vertical: 8,
    });
    expect(normalizeOneRowGutter(undefined)).toEqual({
      horizontal: 0,
      vertical: 0,
    });
    expect(normalizeOneRowGutter([-4, 'wide'])).toEqual({
      horizontal: 0,
      vertical: 0,
    });
  });

  it('applies align, justify and wrap modifiers', () => {
    row = new OneRow({
      align: 'center',
      justify: 'space-between',
      wrap: false,
      children: [{ component: OneCol, props: { span: 12 }, children: ['x'] }],
    });
    row.mount(container);

    const rowElement = container.querySelector('.one-row') as HTMLElement;
    expect(rowElement.style.alignItems).toBe('center');
    expect(rowElement.style.justifyContent).toBe('space-between');
    expect(rowElement.style.flexWrap).toBe('nowrap');
  });

  it('normalizes span into the 1-24 range and offsets into 0-23', () => {
    expect(normalizeOneColSpan(12)).toBe(12);
    expect(normalizeOneColSpan(25)).toBe(24);
    expect(normalizeOneColSpan(0)).toBeUndefined();
    expect(normalizeOneColSpan('wide')).toBeUndefined();
    expect(normalizeOneColOffset(4)).toBe(4);
    expect(normalizeOneColOffset(30)).toBe(23);
    expect(normalizeOneColOffset(-2)).toBe(0);
    expect(normalizeOneColOffset('none')).toBe(0);
  });

  it('keeps a column auto-sized when span is absent', () => {
    row = new OneRow({
      children: [{ component: OneCol, props: {}, children: ['auto'] }],
    });
    row.mount(container);

    const col = container.querySelector('.one-col') as HTMLElement;
    expect(col.style.width).toBe('');
    expect(col.style.marginLeft).toBe('');
  });

  it('renders columns without padding outside a OneRow', () => {
    const col = new OneCol({ span: 12, children: ['standalone'] });
    col.mount(container);

    const standalone = container.querySelector('.one-col') as HTMLElement;
    expect(standalone.style.paddingLeft).toBe('0px');
    expect(standalone.style.paddingRight).toBe('0px');
    col.unmount();
  });
});

describe('OneGrid responsive breakpoints', () => {
  let container: HTMLElement;
  let row: OneRow | undefined;
  let originalInnerWidth: number;

  beforeEach(() => {
    document.head.innerHTML = '';
    document.documentElement.removeAttribute('style');
    container = document.createElement('div');
    document.body.appendChild(container);
    originalInnerWidth = window.innerWidth;
  });

  afterEach(() => {
    row?.unmount();
    row = undefined;
    window.innerWidth = originalInnerWidth;
    document.documentElement.removeAttribute('style');
    container.remove();
  });

  it('resolves the matching breakpoint from viewport width', () => {
    expect(resolveOneGridBreakpoint(400, ONE_GRID_BREAKPOINT_DEFAULTS)).toBe('xs');
    expect(resolveOneGridBreakpoint(576, ONE_GRID_BREAKPOINT_DEFAULTS)).toBe('sm');
    expect(resolveOneGridBreakpoint(768, ONE_GRID_BREAKPOINT_DEFAULTS)).toBe('md');
    expect(resolveOneGridBreakpoint(992, ONE_GRID_BREAKPOINT_DEFAULTS)).toBe('lg');
    expect(resolveOneGridBreakpoint(1200, ONE_GRID_BREAKPOINT_DEFAULTS)).toBe('xl');
    expect(resolveOneGridBreakpoint(1600, ONE_GRID_BREAKPOINT_DEFAULTS)).toBe('xxl');
  });

  it('cascades smaller breakpoint values to larger breakpoints', () => {
    const props: OneColProps = { xs: 12, md: 6 };
    expect(resolveOneColLayout(props, 'xs').span).toBe(12);
    expect(resolveOneColLayout(props, 'sm').span).toBe(12);
    expect(resolveOneColLayout(props, 'md').span).toBe(6);
    expect(resolveOneColLayout(props, 'lg').span).toBe(6);
    expect(resolveOneColLayout(props, 'xl').span).toBe(6);
    expect(resolveOneColLayout(props, 'xxl').span).toBe(6);
  });

  it('supports object form with span and offset per breakpoint', () => {
    const props: OneColProps = {
      xs: { span: 24, offset: 0 },
      md: { span: 12, offset: 4 },
    };
    const xs = resolveOneColLayout(props, 'xs');
    const md = resolveOneColLayout(props, 'md');
    expect(xs.span).toBe(24);
    expect(xs.offset).toBe(0);
    expect(md.span).toBe(12);
    expect(md.offset).toBe(4);
  });

  it('falls back to default span/offset when no breakpoint matches', () => {
    const props: OneColProps = { span: 8, offset: 2 };
    const layout = resolveOneColLayout(props, 'lg');
    expect(layout.span).toBe(8);
    expect(layout.offset).toBe(2);
  });

  it('applies the current breakpoint span after mount', () => {
    window.innerWidth = 800;
    row = new OneRow({
      children: [
        { component: OneCol, props: { xs: 24, md: 12 }, children: ['x'] },
      ],
    });
    row.mount(container);
    flushSync();

    const col = container.querySelector('.one-col') as HTMLElement;
    expect(col.style.width).toBe(`calc(100% * 12 / ${ONE_GRID_COLUMNS})`);
  });

  it('updates column layout on resize across a breakpoint', () => {
    window.innerWidth = 400;
    row = new OneRow({
      children: [
        { component: OneCol, props: { xs: 24, md: 12 }, children: ['x'] },
      ],
    });
    row.mount(container);

    const col = container.querySelector('.one-col') as HTMLElement;
    expect(col.style.width).toBe(`calc(100% * 24 / ${ONE_GRID_COLUMNS})`);

    window.innerWidth = 800;
    window.dispatchEvent(new Event('resize'));
    flushSync();

    expect(col.style.width).toBe(`calc(100% * 12 / ${ONE_GRID_COLUMNS})`);
  });

  it('reads custom breakpoints from theme CSS variables', () => {
    document.documentElement.style.setProperty('--one-grid-breakpoint-md', '500');
    window.innerWidth = 600;
    row = new OneRow({
      children: [
        { component: OneCol, props: { xs: 24, md: 12 }, children: ['x'] },
      ],
    });
    row.mount(container);
    flushSync();

    const col = container.querySelector('.one-col') as HTMLElement;
    expect(col.style.width).toBe(`calc(100% * 12 / ${ONE_GRID_COLUMNS})`);
  });
});
