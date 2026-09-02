import type { TransitionGroupOptions } from './types';
export interface ListAnimationRun {
    animation: Animation;
    token: symbol;
    keyframes: Keyframe[];
    options: KeyframeAnimationOptions;
    finished: Promise<'finished' | 'cancelled'>;
}
export declare class ListAnimationController {
    private readonly runs;
    playEnter(element: HTMLElement, options: TransitionGroupOptions): ListAnimationRun | null;
    playExit(element: HTMLElement, options: TransitionGroupOptions): ListAnimationRun | null;
    cancel(element: HTMLElement): void;
    private play;
    private canAnimate;
}
