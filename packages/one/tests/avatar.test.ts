import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { OneAvatar } from '../lib';

describe('OneAvatar', () => {
  let container: HTMLElement;
  let component: OneAvatar;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    component?.unmount();
    container.remove();
  });

  it('renders an image when src is provided', () => {
    component = new OneAvatar({ src: '/avatar.png', alt: '头像' });
    component.mount(container);

    const img = container.querySelector(
      'img.one-avatar__img'
    ) as HTMLImageElement;
    expect(img).toBeTruthy();
    expect(img.alt).toBe('头像');
  });

  it('falls back to text initials when no src is provided', () => {
    component = new OneAvatar({ text: 'JD' });
    component.mount(container);

    expect(
      container.querySelector('.one-avatar__fallback')?.textContent
    ).toBe('JD');
    expect(container.querySelector('img')).toBeNull();
  });

  it('applies shape, size and variant classes', () => {
    component = new OneAvatar({
      text: 'JD',
      shape: 'square',
      size: 'lg',
      variant: 'primary',
    });
    component.mount(container);

    const root = container.querySelector('.one-avatar');
    expect(root?.className).toContain('one-avatar--square');
    expect(root?.className).toContain('one-avatar--lg');
    expect(root?.className).toContain('one-avatar--primary');
  });

  it('falls back to circle and md for invalid shape and size', () => {
    component = new OneAvatar({
      text: 'JD',
      shape: 'triangle' as 'circle',
      size: 'xl' as 'md',
    });
    component.mount(container);

    const root = container.querySelector('.one-avatar');
    expect(root?.className).toContain('one-avatar--circle');
    expect(root?.className).toContain('one-avatar--md');
  });
});
