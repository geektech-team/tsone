import type {
  TransitionAnimationType,
  TransitionGroupOptions,
} from './types';

export interface ListAnimationRun {
  animation: Animation;
  token: symbol;
  keyframes: Keyframe[];
  options: KeyframeAnimationOptions;
  finished: Promise<'finished' | 'cancelled'>;
}

const ENTER_KEYFRAMES: Record<
  TransitionAnimationType,
  [Keyframe, Keyframe]
> = {
  fade: [{ opacity: 0 }, { opacity: 1 }],
  'slide-up': [
    { opacity: 0, transform: 'translateY(12px)' },
    { opacity: 1, transform: 'translateY(0)' },
  ],
  'slide-down': [
    { opacity: 0, transform: 'translateY(-12px)' },
    { opacity: 1, transform: 'translateY(0)' },
  ],
  'slide-left': [
    { opacity: 0, transform: 'translateX(12px)' },
    { opacity: 1, transform: 'translateX(0)' },
  ],
  'slide-right': [
    { opacity: 0, transform: 'translateX(-12px)' },
    { opacity: 1, transform: 'translateX(0)' },
  ],
  scale: [
    { opacity: 0, transform: 'scale(0.95)' },
    { opacity: 1, transform: 'scale(1)' },
  ],
};

export class ListAnimationController {
  private readonly runs = new WeakMap<HTMLElement, ListAnimationRun>();

  public playEnter(
    element: HTMLElement,
    options: TransitionGroupOptions
  ): ListAnimationRun | null {
    return this.play(element, options, 'enter');
  }

  public playExit(
    element: HTMLElement,
    options: TransitionGroupOptions
  ): ListAnimationRun | null {
    return this.play(element, options, 'exit');
  }

  public cancel(element: HTMLElement): void {
    const current = this.runs.get(element);
    if (!current) {
      return;
    }

    this.runs.delete(element);
    current.animation.cancel();
  }

  private play(
    element: HTMLElement,
    transition: TransitionGroupOptions,
    phase: 'enter' | 'exit'
  ): ListAnimationRun | null {
    this.cancel(element);
    if (!this.canAnimate(element)) {
      return null;
    }

    const enterKeyframes = ENTER_KEYFRAMES[transition.type];
    const keyframes =
      phase === 'enter'
        ? [...enterKeyframes]
        : [...enterKeyframes].reverse();
    const options: KeyframeAnimationOptions = {
      duration: transition.duration,
      easing: 'ease',
      fill: 'both',
    };
    const animation = element.animate(keyframes, options);
    const token = Symbol('list-animation');
    const finished = animation.finished.then(
      () => 'finished' as const,
      () => 'cancelled' as const
    );
    const run: ListAnimationRun = {
      animation,
      token,
      keyframes,
      options,
      finished,
    };

    this.runs.set(element, run);
    void finished.then((result) => {
      if (this.runs.get(element)?.token !== token) {
        return;
      }

      this.runs.delete(element);
      if (phase === 'enter' && result === 'finished') {
        animation.cancel();
      }
    });

    return run;
  }

  private canAnimate(element: HTMLElement): boolean {
    const reduced =
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    return !reduced && typeof element.animate === 'function';
  }
}
