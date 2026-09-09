import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { flushSync } from '@geektech/tsone';
import { OneTabs, type OneTabsChangeEvent } from '../lib/tabs';

describe('OneTabs', () => {
  let container: HTMLElement;
  let component: OneTabs;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    component?.unmount();
    container.remove();
  });

  it('renders stable tab and panel relationships with dynamic slots', () => {
    component = new OneTabs({
      id: 'account',
      defaultValue: 'profile',
      ariaLabel: '账户设置',
      items: [
        { value: 'profile', label: '资料' },
        { value: 'security', label: '安全' },
      ],
      children: [
        { tag: 'p', slot: 'profile', children: ['资料内容'] },
        { tag: 'p', slot: 'security', children: ['安全内容'] },
      ],
    });
    component.mount(container);

    const list = container.querySelector('[role="tablist"]');
    const tabs = container.querySelectorAll('[role="tab"]');
    const panels = container.querySelectorAll('[role="tabpanel"]');
    expect(list?.getAttribute('aria-label')).toBe('账户设置');
    expect(tabs).toHaveLength(2);
    expect(panels).toHaveLength(2);
    expect(tabs[0].getAttribute('aria-controls')).toBe('account-panel-0');
    expect(panels[0].getAttribute('aria-labelledby')).toBe('account-tab-0');
    expect(panels[0].hasAttribute('hidden')).toBe(false);
    expect(panels[1].hasAttribute('hidden')).toBe(true);
    expect(panels[0].textContent).toContain('资料内容');
    expect(panels[1].textContent).toContain('安全内容');
  });

  it('updates uncontrolled state and only requests controlled changes', () => {
    component = new OneTabs({
      defaultValue: 'a',
      items: [
        { value: 'a', label: 'A' },
        { value: 'b', label: 'B' },
      ],
    });
    const values: string[] = [];
    component.on('change', (payload) => {
      values.push((payload as OneTabsChangeEvent).value);
    });
    component.mount(container);

    (
      container.querySelectorAll('[role="tab"]')[1] as HTMLButtonElement
    ).click();
    expect(values).toEqual(['b']);
    expect(
      container.querySelector('[role="tab"][aria-selected="true"]')?.textContent
    ).toBe('B');

    component.setProps({ value: 'a' });
    flushSync();
    (
      container.querySelectorAll('[role="tab"]')[1] as HTMLButtonElement
    ).click();
    expect(values).toEqual(['b', 'b']);
    expect(
      container.querySelector('[role="tab"][aria-selected="true"]')?.textContent
    ).toBe('A');
  });

  it('deduplicates values and skips disabled tabs with keyboard activation', () => {
    component = new OneTabs({
      defaultValue: 'missing',
      items: [
        { value: 'a', label: 'A' },
        { value: 'disabled', label: 'Disabled', disabled: true },
        { value: 'b', label: 'B' },
        { value: 'a', label: 'Duplicate A' },
      ],
    });
    component.mount(container);

    expect(container.querySelectorAll('[role="tab"]')).toHaveLength(3);
    const first = container.querySelector('[role="tab"]') as HTMLButtonElement;
    first.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true })
    );
    expect(
      container.querySelector('[role="tab"][aria-selected="true"]')?.textContent
    ).toBe('B');
    expect(document.activeElement?.textContent).toBe('B');
  });

  it('supports Home, End and wrapping while suppressing disabled activation', () => {
    component = new OneTabs({
      items: [
        { value: 'a', label: 'A' },
        { value: 'b', label: 'B', disabled: true },
        { value: 'c', label: 'C' },
      ],
    });
    let changes = 0;
    component.on('change', () => {
      changes += 1;
    });
    component.mount(container);

    let tabs = container.querySelectorAll('[role="tab"]');
    tabs[0].dispatchEvent(
      new KeyboardEvent('keydown', { key: 'End', bubbles: true })
    );
    expect(document.activeElement?.textContent).toBe('C');
    tabs = container.querySelectorAll('[role="tab"]');
    tabs[2].dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true })
    );
    expect(document.activeElement?.textContent).toBe('A');
    tabs = container.querySelectorAll('[role="tab"]');
    tabs[0].dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Home', bubbles: true })
    );
    (tabs[1] as HTMLButtonElement).click();
    expect(changes).toBe(2);

    component.setProps({
      items: [{ value: 'disabled', label: 'Disabled', disabled: true }],
    });
    flushSync();
    expect(container.querySelector('[aria-selected="true"]')).toBeNull();
  });

  it('publishes scoped hover, focus and selected styles', () => {
    component = new OneTabs({
      items: [{ value: 'a', label: 'A' }],
    });
    component.mount(container);

    const css = [...document.querySelectorAll('style')]
      .map((style) => style.textContent)
      .join('\n');
    expect(css).toContain('.one-tabs__tab:hover');
    expect(css).toContain('.one-tabs__tab:focus-visible');
    expect(css).toContain('.one-tabs__tab[aria-selected="true"]');
  });
});
