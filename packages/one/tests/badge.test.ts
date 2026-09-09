import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { flushSync } from '@geektech/tsone';
import { OneBadge } from '../lib/badge';

describe('OneBadge', () => {
  let container: HTMLElement;
  let component: OneBadge;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    component?.unmount();
    container.remove();
  });

  it('formats counts and supports a custom maximum', () => {
    component = new OneBadge({ value: 120, children: ['收件箱'] });
    component.mount(container);

    expect(container.querySelector('.one-badge__content')?.textContent).toBe(
      '99+'
    );

    component.setProps({ value: 11, max: 10, children: ['收件箱'] });
    flushSync();
    expect(container.querySelector('.one-badge__content')?.textContent).toBe(
      '10+'
    );
  });

  it('handles zero, dot and hidden values deterministically', () => {
    component = new OneBadge({ value: 0, children: ['通知'] });
    component.mount(container);
    expect(container.querySelector('.one-badge__content')).toBeNull();

    component.setProps({ value: 0, showZero: true, children: ['通知'] });
    flushSync();
    expect(container.querySelector('.one-badge__content')?.textContent).toBe(
      '0'
    );

    component.setProps({
      dot: true,
      ariaLabel: '有新通知',
      children: ['通知'],
    });
    flushSync();
    expect(
      container
        .querySelector('.one-badge__content--dot')
        ?.getAttribute('aria-label')
    ).toBe('有新通知');
  });

  it('renders standalone text and falls back from invalid props', () => {
    component = new OneBadge({
      value: 'NEW',
      max: Number.NaN,
      variant: 'unknown' as 'primary',
    });
    component.mount(container);

    expect(
      container.querySelector('.one-badge--standalone.one-badge--primary')
    ).toBeTruthy();
    expect(container.querySelector('.one-badge__content')?.textContent).toBe(
      'NEW'
    );
  });
});
