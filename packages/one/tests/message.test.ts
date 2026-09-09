import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { flushSync } from '@geektech/tsone';
import { DomOneOverlayHost } from '../lib/overlay';
import { OneMessage, createOneMessageService } from '../lib/message';
import { OneMessageTimer, type OneTimerScheduler } from '../lib/message/timer';

class FakeScheduler implements OneTimerScheduler {
  public time = 0;
  private callback: (() => void) | undefined;
  private due = 0;

  public now(): number {
    return this.time;
  }

  public set(callback: () => void, delay: number): unknown {
    this.callback = callback;
    this.due = this.time + delay;
    return callback;
  }

  public clear(handle: unknown): void {
    if (handle === this.callback) {
      this.callback = undefined;
    }
  }

  public advance(milliseconds: number): void {
    this.time += milliseconds;
    if (this.callback && this.time >= this.due) {
      const callback = this.callback;
      this.callback = undefined;
      callback();
    }
  }
}

describe('OneMessageTimer', () => {
  it('pauses, resumes, resets and disposes a countdown', () => {
    const scheduler = new FakeScheduler();
    let elapsed = 0;
    const timer = new OneMessageTimer(3000, scheduler, () => {
      elapsed += 1;
    });

    scheduler.advance(1000);
    timer.pause();
    scheduler.advance(3000);
    expect(elapsed).toBe(0);
    timer.resume();
    scheduler.advance(1999);
    expect(elapsed).toBe(0);
    scheduler.advance(1);
    expect(elapsed).toBe(1);

    timer.reset(500);
    scheduler.advance(500);
    expect(elapsed).toBe(2);
    timer.reset(0);
    scheduler.advance(5000);
    expect(elapsed).toBe(2);
    timer.dispose();
    timer.dispose();
  });
});

describe('OneMessage', () => {
  let container: HTMLElement;
  let component: OneMessage | undefined;

  beforeEach(() => {
    document.head.innerHTML = '';
    document.body.innerHTML = '';
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    component?.unmount();
    document.body.innerHTML = '';
  });

  it('keeps its public anchor in the parent and mounts a private message view', () => {
    component = new OneMessage({
      content: 'Saved',
      defaultOpen: true,
      duration: 0,
    });
    component.mount(container);

    expect(container.querySelector('[data-one-message-anchor]')).toBeTruthy();
    expect(container.querySelector('.one-message')).toBeNull();
    expect(document.body.querySelector('.one-message')?.textContent).toContain(
      'Saved'
    );
    component.setProps({ content: 'Updated' });
    flushSync();
    expect(document.body.querySelector('.one-message')?.textContent).toContain(
      'Updated'
    );
    component.setProps({ closable: true });
    flushSync();
    expect(document.body.querySelector('.one-message')?.textContent).toContain(
      'Updated'
    );
  });

  it('emits a controlled close request without unmounting the view', () => {
    const changes: boolean[] = [];
    component = new OneMessage({
      content: 'Controlled',
      open: true,
      duration: 0,
      closable: true,
    });
    component.on('openChange', (value) => changes.push(value as boolean));
    component.mount(container);

    (
      document.querySelector('.one-message__close') as HTMLButtonElement
    ).click();

    expect(changes).toEqual([false]);
    expect(document.querySelector('.one-message')).toBeTruthy();
    component.setProps({ open: false });
    flushSync();
    expect(document.querySelector('.one-message')).toBeNull();
  });

  it('creates, updates, stacks and closes imperative messages by kind', () => {
    const host = new DomOneOverlayHost(document);
    const service = createOneMessageService(host);
    const dialog = host.open({
      kind: 'dialog',
      factory: ({ slot }) => {
        slot.textContent = 'Keep dialog';
        return { update: () => {}, destroy: () => {} };
      },
    });
    const first = service.success('Saved', { duration: 0 });
    const second = service.warning('Careful', { duration: 0 });

    expect(document.querySelector('.one-message--success')).toBeTruthy();
    expect(document.querySelector('.one-message--warning')).toBeTruthy();
    expect(
      document.querySelectorAll('[data-one-overlay-group="top"]')
    ).toHaveLength(1);
    const group = document.querySelector(
      '[data-one-overlay-group="top"]'
    ) as HTMLElement;
    expect(group.classList.contains('one-overlay-group--message')).toBe(true);
    expect(group.dataset.oneMessagePlacement).toBe('top');
    first.update({ content: 'Updated' });
    flushSync();
    expect(document.body.textContent).toContain('Updated');
    service.close(first.id);
    service.close(first.id);
    flushSync();
    expect(document.body.textContent).not.toContain('Updated');
    expect(document.body.textContent).toContain('Careful');
    service.closeAll();
    flushSync();
    expect(document.querySelector('.one-message')).toBeNull();
    expect(document.body.textContent).toContain('Keep dialog');
    second.close();
    dialog.close();
  });
});
