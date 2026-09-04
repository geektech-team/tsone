import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import {
  OneFloatingPositioner,
  OneTooltipTriggerError,
  type OneOverlayPlacement,
  type OneOverlayPositionRequest,
  type OneOverlayPositionResult,
} from '../lib/overlay';
import { OnePopover } from '../lib/popover';

const placements: OneOverlayPlacement[] = [
  'top-start',
  'top',
  'top-end',
  'right-start',
  'right',
  'right-end',
  'bottom-start',
  'bottom',
  'bottom-end',
  'left-start',
  'left',
  'left-end',
];

describe('OnePopover', () => {
  let container: HTMLElement;
  let component: OnePopover | undefined;

  beforeEach(() => {
    document.head.innerHTML = '';
    document.body.innerHTML = '';
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    component?.unmount();
    component = undefined;
    document.body.innerHTML = '';
  });

  it('keeps its trigger in place and renders an open dialog bubble', () => {
    component = new OnePopover({
      content: '弹层内容',
      defaultOpen: true,
      children: [{ tag: 'button', children: ['打开'] }],
    });
    component.mount(container);

    const trigger = container.querySelector('button') as HTMLButtonElement;
    const popover = document.body.querySelector(
      '[role="dialog"]'
    ) as HTMLElement;

    expect(trigger.parentElement?.className).toContain('one-popover__trigger');
    expect(trigger.getAttribute('aria-haspopup')).toBe('dialog');
    expect(trigger.getAttribute('aria-expanded')).toBe('true');
    expect(popover).toBeTruthy();
    expect(popover.textContent).toContain('弹层内容');
  });

  it('toggles on click and closes on an outside document click', () => {
    component = new OnePopover({
      content: '内容',
      children: [{ tag: 'button', children: ['打开'] }],
    });
    component.mount(container);

    const trigger = container.querySelector('button') as HTMLButtonElement;
    expect(document.body.querySelector('[role="dialog"]')).toBeNull();

    trigger.click();
    expect(document.body.querySelector('[role="dialog"]')).toBeTruthy();
    expect(trigger.getAttribute('aria-expanded')).toBe('true');

    document.body.click();
    expect(document.body.querySelector('[role="dialog"]')).toBeNull();
    expect(trigger.getAttribute('aria-expanded')).toBeNull();
  });

  it('closes on Escape', () => {
    component = new OnePopover({
      content: '内容',
      children: [{ tag: 'button', children: ['打开'] }],
    });
    component.mount(container);

    const trigger = container.querySelector('button') as HTMLButtonElement;
    trigger.click();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(document.body.querySelector('[role="dialog"]')).toBeNull();
  });

  it('stays closed when disabled', () => {
    component = new OnePopover({
      content: '内容',
      disabled: true,
      defaultOpen: true,
      children: [{ tag: 'button', children: ['打开'] }],
    });
    component.mount(container);

    expect(document.body.querySelector('[role="dialog"]')).toBeNull();
  });

  it('throws a clear error without an interactive trigger child', () => {
    expect(() => {
      component = new OnePopover({ content: '内容', children: ['plain text'] });
      component.mount(container);
    }).toThrow(OneTooltipTriggerError);
  });
});

describe('PopoverBubble placement normalization', () => {
  it('accepts every documented placement in the positioner request', () => {
    const positioner = new OneFloatingPositioner();
    placements.forEach((placement) => {
      const request: OneOverlayPositionRequest = {
        reference: {
          x: 10,
          y: 10,
          width: 20,
          height: 20,
          top: 10,
          right: 30,
          bottom: 30,
          left: 10,
        },
        floating: {
          x: 0,
          y: 0,
          width: 100,
          height: 40,
          top: 0,
          right: 100,
          bottom: 40,
          left: 0,
        },
        boundary: {
          x: 0,
          y: 0,
          width: 800,
          height: 600,
          top: 0,
          right: 800,
          bottom: 600,
          left: 0,
        },
        placement,
        offset: 8,
        padding: 8,
      };
      const result: OneOverlayPositionResult =
        positioner.compute(request);
      expect(result.x).toBeGreaterThanOrEqual(0);
      expect(result.y).toBeGreaterThanOrEqual(0);
    });
  });
});
