import { describe, expect, it } from 'bun:test';
import { OneFloatingPositioner } from '../lib/overlay';

function rect(x: number, y: number, width: number, height: number) {
  return {
    x,
    y,
    width,
    height,
    top: y,
    left: x,
    right: x + width,
    bottom: y + height,
  };
}

describe('OneFloatingPositioner', () => {
  const positioner = new OneFloatingPositioner();

  it('calculates aligned top and right placements', () => {
    expect(
      positioner.compute({
        reference: rect(100, 100, 40, 20),
        floating: rect(0, 0, 80, 30),
        boundary: rect(0, 0, 400, 300),
        placement: 'top-start',
        offset: 8,
        padding: 8,
      })
    ).toMatchObject({ x: 100, y: 62, placement: 'top-start' });
    expect(
      positioner.compute({
        reference: rect(100, 100, 40, 20),
        floating: rect(0, 0, 80, 30),
        boundary: rect(0, 0, 400, 300),
        placement: 'right-end',
        offset: 8,
        padding: 8,
      })
    ).toMatchObject({ x: 148, y: 90, placement: 'right-end' });
  });

  it('flips when the preferred side cannot fit', () => {
    const result = positioner.compute({
      reference: rect(100, 4, 40, 20),
      floating: rect(0, 0, 80, 40),
      boundary: rect(0, 0, 300, 200),
      placement: 'top',
      offset: 8,
      padding: 8,
    });

    expect(result.placement).toBe('bottom');
    expect(result.y).toBe(32);
  });

  it('chooses maximum visible area then shifts within padding', () => {
    const result = positioner.compute({
      reference: rect(2, 80, 10, 20),
      floating: rect(0, 0, 180, 140),
      boundary: rect(0, 0, 200, 160),
      placement: 'left',
      offset: 8,
      padding: 8,
    });

    expect(result.x).toBeGreaterThanOrEqual(8);
    expect(result.y).toBeGreaterThanOrEqual(8);
    expect(result.arrow.y).toBeGreaterThanOrEqual(8);
  });

  it('stops resize and scroll updates after cleanup', async () => {
    const reference = document.createElement('button');
    const floating = document.createElement('div');
    document.body.append(reference, floating);
    let updates = 0;
    const cleanup = positioner.autoUpdate(reference, floating, () => {
      updates += 1;
    });

    window.dispatchEvent(new Event('resize'));
    await new Promise<void>((resolve) =>
      window.requestAnimationFrame(() => resolve())
    );
    expect(updates).toBe(1);

    cleanup();
    cleanup();
    window.dispatchEvent(new Event('resize'));
    window.dispatchEvent(new Event('scroll'));
    await new Promise<void>((resolve) =>
      window.requestAnimationFrame(() => resolve())
    );
    expect(updates).toBe(1);
    reference.remove();
    floating.remove();
  });
});
