import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { ONE_THEME_DEFAULTS, OneButton, OneCard, OneInput } from '../lib';

const EXPECTED_THEME_DEFAULTS = {
  colorPrimary: '#5fd956',
  colorPrimaryHover: '#4bc944',
  colorDanger: '#d64545',
  colorSurface: '#ffffff',
  colorText: '#162018',
  colorMuted: '#647268',
  colorBorder: '#d9e8d6',
  colorFocus: '#2f7c39',
  radiusSm: '4px',
  radiusMd: '8px',
  spaceXs: '4px',
  spaceSm: '8px',
  spaceMd: '12px',
  spaceLg: '16px',
  fontSizeSm: '12px',
  fontSizeMd: '14px',
  fontSizeLg: '16px',
  shadowCard: '0 12px 30px rgba(32, 74, 38, 0.1)',
  fontFamily:
    "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
} as const;

describe('One UI style contract', () => {
  let container: HTMLElement;
  let components: Array<OneButton | OneInput | OneCard>;

  beforeEach(() => {
    document.head.innerHTML = '';
    container = document.createElement('div');
    document.body.appendChild(container);
    components = [];
  });

  afterEach(() => {
    components.forEach((component) => component.unmount());
    container.remove();
  });

  it('publishes the exact immutable theme defaults', () => {
    expect(ONE_THEME_DEFAULTS).toEqual(EXPECTED_THEME_DEFAULTS);
    expect(Object.keys(ONE_THEME_DEFAULTS)).toEqual(
      Object.keys(EXPECTED_THEME_DEFAULTS)
    );
  });

  it('scopes generated component CSS and uses public token fallbacks', () => {
    components = [
      new OneButton({ children: ['Save'] }),
      new OneInput({ value: 'One' }),
      new OneCard({ title: 'One', children: ['Body'] }),
    ];
    components.forEach((component) => component.mount(container));

    const css = Array.from(document.head.querySelectorAll('style'))
      .map((style) => style.textContent ?? '')
      .join('\n');
    const selectors = css
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.endsWith('{'))
      .map((line) => line.slice(0, -1).trim());

    expect(selectors.length).toBeGreaterThan(0);
    selectors.forEach((selector) => {
      expect(selector.startsWith('.one-')).toBe(true);
    });
    expect(css).toContain('var(--one-color-primary, #5fd956)');
    expect(css).toContain('var(--one-radius-md, 8px)');
    expect(css).not.toMatch(/(^|[}\s,])(body|html)(?=[\s,{])/m);
  });
});
