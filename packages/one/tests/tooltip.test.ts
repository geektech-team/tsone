import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { flushSync } from '@geektech/tsone';
import {
  OneFloatingPositioner,
  OneTooltipTriggerError,
  type OneOverlayPlacement,
  type OneOverlayPositionRequest,
  type OneOverlayPositionResult,
  type OneOverlayPositioner,
} from '../lib/overlay';
import { OneTooltip, TooltipBubble } from '../lib/tooltip';

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

describe('OneTooltip', () => {
  let container: HTMLElement;
  let component: OneTooltip | undefined;

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

  function triggerButton(ariaDescribedby?: string) {
    return {
      tag: 'button',
      props: { 'aria-describedby': ariaDescribedby },
      children: ['Help'],
    };
  }

  it('keeps its trigger in place and restores aria-describedby after cleanup', () => {
    component = new OneTooltip({
      content: 'Helpful text',
      defaultOpen: true,
      children: [triggerButton('existing-description')],
    });
    component.mount(container);
    const trigger = container.querySelector('button') as HTMLButtonElement;
    const tooltip = document.body.querySelector(
      '[role="tooltip"]'
    ) as HTMLElement;

    expect(trigger.parentElement).toBe(
      container.querySelector('.one-tooltip__trigger')
    );
    expect(trigger.getAttribute('aria-describedby')).toBe(
      `existing-description ${tooltip.id}`
    );
    expect(tooltip.getAttribute('data-placement')).toBeTruthy();
    component.unmount();
    expect(trigger.getAttribute('aria-describedby')).toBe(
      'existing-description'
    );
    expect(document.querySelector('[role="tooltip"]')).toBeNull();
  });

  it('coordinates hover and focus before closing', () => {
    component = new OneTooltip({
      content: 'Helpful text',
      openDelay: 0,
      closeDelay: 0,
      children: [triggerButton()],
    });
    component.mount(container);
    const wrapper = container.querySelector(
      '.one-tooltip__trigger'
    ) as HTMLElement;
    const trigger = container.querySelector('button') as HTMLButtonElement;

    wrapper.dispatchEvent(new MouseEvent('mouseenter'));
    expect(document.querySelector('[role="tooltip"]')).toBeTruthy();
    trigger.dispatchEvent(new Event('focusin', { bubbles: true }));
    wrapper.dispatchEvent(new MouseEvent('mouseleave'));
    expect(document.querySelector('[role="tooltip"]')).toBeTruthy();
    trigger.dispatchEvent(new Event('focusout', { bubbles: true }));
    expect(document.querySelector('[role="tooltip"]')).toBeNull();
  });

  it('cancels delayed opening when hover ends early', async () => {
    component = new OneTooltip({
      content: 'Delayed',
      openDelay: 10,
      closeDelay: 10,
      children: [triggerButton()],
    });
    component.mount(container);
    const wrapper = container.querySelector(
      '.one-tooltip__trigger'
    ) as HTMLElement;

    wrapper.dispatchEvent(new MouseEvent('mouseenter'));
    wrapper.dispatchEvent(new MouseEvent('mouseleave'));
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(document.querySelector('[role="tooltip"]')).toBeNull();
  });

  it('toggles on click and closes on outside click or Escape', () => {
    component = new OneTooltip({
      content: 'Clickable',
      trigger: 'click',
      children: [triggerButton()],
    });
    component.mount(container);
    const trigger = container.querySelector('button') as HTMLButtonElement;

    trigger.click();
    expect(document.querySelector('[role="tooltip"]')).toBeTruthy();
    document.body.click();
    expect(document.querySelector('[role="tooltip"]')).toBeNull();
    trigger.click();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(document.querySelector('[role="tooltip"]')).toBeNull();
  });

  it('requests a controlled manual close without overriding open=true', () => {
    const changes: boolean[] = [];
    component = new OneTooltip({
      content: 'Manual',
      trigger: 'manual',
      open: true,
      children: [triggerButton()],
    });
    component.on('openChange', (value) => changes.push(value as boolean));
    component.mount(container);

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(changes).toEqual([false]);
    expect(document.querySelector('[role="tooltip"]')).toBeTruthy();
    component.setProps({ open: false });
    flushSync();
    expect(document.querySelector('[role="tooltip"]')).toBeNull();
  });

  it('stays closed while disabled and rejects a missing trigger element', () => {
    component = new OneTooltip({
      content: 'Disabled',
      disabled: true,
      defaultOpen: true,
      children: [triggerButton()],
    });
    component.mount(container);
    expect(document.querySelector('[role="tooltip"]')).toBeNull();
    component.unmount();

    component = new OneTooltip({ content: 'Missing', children: [] });
    expect(() => component?.mount(container)).toThrow(OneTooltipTriggerError);
  });

  it('mounts in a custom container without an arrow', () => {
    const custom = document.createElement('section');
    custom.getBoundingClientRect = () => rect(20, 20, 320, 240);
    document.body.appendChild(custom);
    component = new OneTooltip({
      content: 'Contained',
      defaultOpen: true,
      container: custom,
      arrow: false,
      children: [triggerButton()],
    });
    component.mount(container);

    expect(custom.querySelector('[role="tooltip"]')).toBeTruthy();
    expect(custom.querySelector('.one-tooltip__arrow')).toBeNull();
  });
});

class RecordingPositioner implements OneOverlayPositioner {
  public requests: OneOverlayPositionRequest[] = [];
  public cleaned = false;

  public compute(request: OneOverlayPositionRequest): OneOverlayPositionResult {
    this.requests.push(request);
    return {
      x: 120,
      y: 80,
      placement: request.placement,
      arrow: { x: 14 },
    };
  }

  public autoUpdate(): () => void {
    return () => {
      this.cleaned = true;
    };
  }
}

describe('TooltipBubble', () => {
  beforeEach(() => {
    document.head.innerHTML = '';
    document.body.innerHTML = '';
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('forwards all placements and applies coordinates and arrow variables', () => {
    const reference = document.createElement('button');
    const slot = document.createElement('div');
    document.body.append(reference, slot);
    reference.getBoundingClientRect = () => rect(100, 100, 40, 20);
    const positioner = new RecordingPositioner();
    const bubble = new TooltipBubble({
      id: 'tooltip-recording',
      content: 'Positioned',
      reference,
      placement: 'top',
      offset: 8,
      boundaryPadding: 8,
      arrow: true,
      container: document.body,
      positioner,
    });
    bubble.mount(slot);

    placements.forEach((placement) => bubble.setProps({ placement }));
    expect(
      positioner.requests.map((request) => request.placement).slice(-12)
    ).toEqual(placements);
    const element = document.querySelector('#tooltip-recording') as HTMLElement;
    expect(element.style.left).toBe('120px');
    expect(element.style.top).toBe('80px');
    expect(element.style.getPropertyValue('--one-tooltip-arrow-x')).toBe(
      '14px'
    );
    bubble.unmount();
    expect(positioner.cleaned).toBe(true);
  });

  it('exposes an actual flip and shift result', () => {
    const reference = document.createElement('button');
    const slot = document.createElement('div');
    document.body.append(reference, slot);
    reference.getBoundingClientRect = () => rect(190, 2, 20, 20);
    const bubble = new TooltipBubble({
      id: 'tooltip-real',
      content: 'Positioned',
      reference,
      placement: 'top',
      offset: 8,
      boundaryPadding: 8,
      arrow: true,
      container: document.body,
      positioner: new OneFloatingPositioner(),
    });
    bubble.mount(slot);
    const element = document.querySelector('#tooltip-real') as HTMLElement;
    element.getBoundingClientRect = () => rect(0, 0, 180, 40);
    bubble.setProps({ placement: 'top' });

    expect(element.dataset.placement).toBe('bottom');
    expect(Number.parseFloat(element.style.left)).toBeGreaterThanOrEqual(8);
    expect(Number.parseFloat(element.style.top)).toBeGreaterThanOrEqual(8);
    bubble.unmount();
  });
});

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
    toJSON: () => ({}),
  };
}
