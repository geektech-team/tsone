import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { ListAnimationController } from '../lib/core/animation/list-animation-controller';

interface AnimationRecord {
  element: HTMLElement;
  keyframes: Keyframe[];
  options: KeyframeAnimationOptions;
  resolve(): void;
  cancelCount: number;
}

const records: AnimationRecord[] = [];
const originalAnimate = Object.getOwnPropertyDescriptor(
  HTMLElement.prototype,
  'animate'
);
const originalMatchMedia = window.matchMedia;

function installAnimationApi(): void {
  Object.defineProperty(HTMLElement.prototype, 'animate', {
    configurable: true,
    writable: true,
    value(
      this: HTMLElement,
      frames: Keyframe[] | PropertyIndexedKeyframes | null,
      options?: number | KeyframeAnimationOptions
    ): Animation {
      let resolveFinished!: () => void;
      let rejectFinished!: (reason?: unknown) => void;
      const finished = new Promise<void>((resolve, reject) => {
        resolveFinished = resolve;
        rejectFinished = reject;
      });
      const record: AnimationRecord = {
        element: this,
        keyframes: Array.isArray(frames) ? frames : [],
        options: typeof options === 'object' && options !== null ? options : {},
        resolve: resolveFinished,
        cancelCount: 0,
      };
      const animation = {
        finished,
        cancel(): void {
          record.cancelCount += 1;
          rejectFinished(new DOMException('Animation cancelled', 'AbortError'));
        },
      } as Animation;

      records.push(record);
      return animation;
    },
  });
}

beforeEach(() => {
  records.length = 0;
  installAnimationApi();
  window.matchMedia = originalMatchMedia;
});

afterEach(() => {
  if (originalAnimate) {
    Object.defineProperty(HTMLElement.prototype, 'animate', originalAnimate);
  } else {
    Reflect.deleteProperty(HTMLElement.prototype, 'animate');
  }
  window.matchMedia = originalMatchMedia;
});

describe('ListAnimationController', () => {
  it('uses fade keyframes for enter and reverses them for exit', () => {
    const element = document.createElement('li');
    const controller = new ListAnimationController();

    const enter = controller.playEnter(element, {
      type: 'fade',
      duration: 180,
    });
    expect(enter?.keyframes).toEqual([{ opacity: 0 }, { opacity: 1 }]);
    expect(enter?.options).toEqual({
      duration: 180,
      easing: 'ease',
      fill: 'both',
    });

    const exit = controller.playExit(element, {
      type: 'fade',
      duration: 180,
    });
    expect(exit?.keyframes).toEqual([{ opacity: 1 }, { opacity: 0 }]);
  });

  it.each([
    ['slide-up', { opacity: 0, transform: 'translateY(12px)' }],
    ['slide-down', { opacity: 0, transform: 'translateY(-12px)' }],
    ['slide-left', { opacity: 0, transform: 'translateX(12px)' }],
    ['slide-right', { opacity: 0, transform: 'translateX(-12px)' }],
    ['scale', { opacity: 0, transform: 'scale(0.95)' }],
  ] as const)('uses the %s enter preset', (type, startFrame) => {
    const element = document.createElement('li');
    const run = new ListAnimationController().playEnter(element, {
      type,
      duration: 300,
    });

    expect(run?.keyframes[0]).toEqual(startFrame);
    expect(run?.keyframes[1]).toMatchObject({ opacity: 1 });
  });

  it('normalizes cancellation when a later animation replaces a run', async () => {
    const element = document.createElement('li');
    const controller = new ListAnimationController();
    const enter = controller.playEnter(element, {
      type: 'scale',
      duration: 300,
    });

    controller.playExit(element, { type: 'scale', duration: 300 });

    expect(await enter?.finished).toBe('cancelled');
    expect(records[0].cancelCount).toBe(1);
  });

  it('clears a completed enter fill effect', async () => {
    const element = document.createElement('li');
    const run = new ListAnimationController().playEnter(element, {
      type: 'fade',
      duration: 300,
    });

    records[0].resolve();
    expect(await run?.finished).toBe('finished');
    await Promise.resolve();

    expect(records[0].cancelCount).toBe(1);
  });

  it('skips enter and exit animations when reduced motion is preferred', () => {
    window.matchMedia = ((query: string) => ({
      matches: query === '(prefers-reduced-motion: reduce)',
    })) as typeof window.matchMedia;
    const controller = new ListAnimationController();
    const element = document.createElement('li');
    const options = { type: 'fade' as const, duration: 300 };

    expect(controller.playEnter(element, options)).toBeNull();
    expect(controller.playExit(element, options)).toBeNull();
  });

  it('skips enter and exit animations when Web Animations is unavailable', () => {
    Reflect.deleteProperty(HTMLElement.prototype, 'animate');
    const controller = new ListAnimationController();
    const element = document.createElement('li');
    const options = { type: 'fade' as const, duration: 300 };

    expect(controller.playEnter(element, options)).toBeNull();
    expect(controller.playExit(element, options)).toBeNull();
  });
});
