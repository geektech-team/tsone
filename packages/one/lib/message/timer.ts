export interface OneTimerScheduler {
  now(): number;
  set(callback: () => void, delay: number): unknown;
  clear(handle: unknown): void;
}

const DEFAULT_SCHEDULER: OneTimerScheduler = {
  now: () =>
    typeof performance === 'undefined' ? Date.now() : performance.now(),
  set: (callback, delay) => globalThis.setTimeout(callback, delay),
  clear: (handle) => globalThis.clearTimeout(handle as number),
};

export class OneMessageTimer {
  private handle: unknown;
  private remaining = 0;
  private startedAt = 0;
  private paused = false;
  private disposed = false;

  public constructor(
    duration: number,
    private readonly scheduler: OneTimerScheduler = DEFAULT_SCHEDULER,
    private readonly onElapsed: () => void
  ) {
    this.reset(duration);
  }

  public pause(): void {
    if (this.disposed || this.paused || this.handle === undefined) {
      return;
    }
    this.remaining = Math.max(
      0,
      this.remaining - (this.scheduler.now() - this.startedAt)
    );
    this.clear();
    this.paused = true;
  }

  public resume(): void {
    if (this.disposed || !this.paused) {
      return;
    }
    this.paused = false;
    this.schedule();
  }

  public reset(duration: number): void {
    if (this.disposed) {
      return;
    }
    this.clear();
    this.remaining = normalizeDuration(duration);
    this.paused = false;
    this.schedule();
  }

  public dispose(): void {
    if (this.disposed) {
      return;
    }
    this.disposed = true;
    this.clear();
  }

  private schedule(): void {
    if (this.remaining <= 0) {
      return;
    }
    this.startedAt = this.scheduler.now();
    this.handle = this.scheduler.set(() => {
      this.handle = undefined;
      this.remaining = 0;
      if (!this.disposed) {
        this.onElapsed();
      }
    }, this.remaining);
  }

  private clear(): void {
    if (this.handle === undefined) {
      return;
    }
    this.scheduler.clear(this.handle);
    this.handle = undefined;
  }
}

function normalizeDuration(duration: number): number {
  return Number.isFinite(duration) && duration > 0 ? duration : 0;
}
