import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { OneCard } from '../lib';

describe('OneCard', () => {
  let container: HTMLElement;
  let component: OneCard;

  beforeEach(() => {
    document.head.innerHTML = '';
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    component?.unmount();
    container.remove();
  });

  it('renders title and default content without an empty footer', () => {
    component = new OneCard({ title: 'Profile', children: ['Body'] });
    component.mount(container);

    expect(container.querySelector('.one-card__header')?.textContent).toBe(
      'Profile'
    );
    expect(container.querySelector('.one-card__body')?.textContent).toBe(
      'Body'
    );
    expect(container.querySelector('.one-card__footer')).toBeNull();
  });

  it('prefers an explicit header slot and renders a footer slot', () => {
    component = new OneCard({
      title: 'Fallback',
      children: [
        { tag: 'strong', slot: 'header', children: ['Custom'] },
        { tag: 'p', children: ['Body'] },
        { tag: 'button', slot: 'footer', children: ['Done'] },
      ],
    });
    component.mount(container);

    expect(container.querySelector('.one-card__header')?.textContent).toBe(
      'Custom'
    );
    expect(
      container.querySelector('.one-card__header')?.textContent
    ).not.toContain('Fallback');
    expect(container.querySelector('.one-card__footer')?.textContent).toBe(
      'Done'
    );
  });

  it('omits the header when neither title nor header slot exists', () => {
    component = new OneCard({ children: ['Only body'] });
    component.mount(container);

    expect(container.querySelector('.one-card__header')).toBeNull();
  });
});
