import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { OneDivider } from '../lib';

describe('OneDivider', () => {
  let container: HTMLElement;
  let component: OneDivider | undefined;

  beforeEach(() => {
    document.body.innerHTML = '';
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    component?.unmount();
    component = undefined;
    container.remove();
  });

  it('renders a plain horizontal divider by default', () => {
    component = new OneDivider({});
    component.mount(container);

    const divider = container.querySelector('.one-divider') as HTMLElement;
    expect(divider).toBeTruthy();
    expect(divider.className).not.toContain('one-divider--vertical');
    expect(container.querySelector('.one-divider__text')).toBeNull();
  });

  it('renders a vertical divider', () => {
    component = new OneDivider({ direction: 'vertical' });
    component.mount(container);

    const divider = container.querySelector('.one-divider') as HTMLElement;
    expect(divider.className).toContain('one-divider--vertical');
  });

  it('renders text between two lines with a text align modifier', () => {
    component = new OneDivider({ text: '分隔', textAlign: 'left' });
    component.mount(container);

    const divider = container.querySelector('.one-divider') as HTMLElement;
    expect(divider.className).toContain('one-divider--with-text');
    expect(divider.className).toContain('one-divider--text-left');
    expect(container.querySelector('.one-divider__text')?.textContent).toBe(
      '分隔'
    );
    expect(container.querySelectorAll('.one-divider__line').length).toBe(2);
  });
});
