import { beforeEach, describe, expect, test } from 'bun:test';
import { DomOneThemeService } from '../lib/theme/OneThemeService';
import {
  OneThemeConfigError,
  OneThemeEnvironmentError,
  OneThemeNotFoundError,
} from '../lib/theme/errors';
import {
  ONE_THEME_VARIABLES,
  oneThemeToVariables,
} from '../lib/theme/variables';

describe('One theme CSS variables', () => {
  test('maps the complete fixed variable set', () => {
    const service = new DomOneThemeService(() => document.documentElement);
    service.init({
      defaultTheme: 'night',
      themes: {
        night: {
          colors: { primary: '#112233' },
          typography: { lineHeight: '1.7' },
          border: { width: '2px', style: 'dashed' },
          radius: { lg: '12px' },
        },
      },
    });

    const root = document.documentElement;
    expect(ONE_THEME_VARIABLES).toHaveLength(28);
    expect(oneThemeToVariables).toBeFunction();
    expect(root.style.getPropertyValue('--one-color-primary')).toBe('#112233');
    expect(root.style.getPropertyValue('--one-color-surface')).toBe('#ffffff');
    expect(root.style.getPropertyValue('--one-line-height')).toBe('1.7');
    expect(root.style.getPropertyValue('--one-border-width')).toBe('2px');
    expect(root.style.getPropertyValue('--one-border-style')).toBe('dashed');
    expect(root.style.getPropertyValue('--one-radius-lg')).toBe('12px');
    expect(root.dataset.oneTheme).toBe('night');
  });
});

describe('DomOneThemeService', () => {
  beforeEach(() => {
    document.documentElement.removeAttribute('style');
    document.documentElement.removeAttribute('data-one-theme');
  });

  test('starts with the built-in default without touching the DOM', () => {
    document.documentElement.style.setProperty('--one-color-primary', 'local');
    const service = new DomOneThemeService(() => document.documentElement);

    expect(service.currentTheme).toBe('default');
    expect(
      document.documentElement.style.getPropertyValue('--one-color-primary')
    ).toBe('local');
    expect(document.documentElement.dataset.oneTheme).toBeUndefined();
  });

  test('can apply the built-in default before initialization', () => {
    const service = new DomOneThemeService(() => document.documentElement);

    service.switch('default');

    expect(service.currentTheme).toBe('default');
    expect(
      document.documentElement.style.getPropertyValue('--one-color-primary')
    ).toBe('#5fd956');
    expect(document.documentElement.dataset.oneTheme).toBe('default');
  });

  test('switches between registered custom and default themes', () => {
    const service = new DomOneThemeService(() => document.documentElement);
    service.init({
      defaultTheme: 'brand',
      themes: { brand: { colors: { primary: '#112233' } } },
    });

    expect(service.currentTheme).toBe('brand');
    expect(
      document.documentElement.style.getPropertyValue('--one-color-primary')
    ).toBe('#112233');

    service.switch('default');

    expect(service.currentTheme).toBe('default');
    expect(
      document.documentElement.style.getPropertyValue('--one-color-primary')
    ).toBe('#5fd956');
    expect(document.documentElement.dataset.oneTheme).toBe('default');
  });

  test('reinitialization replaces the previous custom registry', () => {
    const service = new DomOneThemeService(() => document.documentElement);
    service.init({ themes: { first: { colors: { primary: '#111111' } } } });
    service.switch('first');

    service.init({ themes: { second: { colors: { primary: '#222222' } } } });

    expect(service.currentTheme).toBe('default');
    expect(() => service.switch('first')).toThrow(OneThemeNotFoundError);
    service.switch('second');
    expect(service.currentTheme).toBe('second');
  });

  test('rejects invalid and unknown switch names without changing state', () => {
    const service = new DomOneThemeService(() => document.documentElement);
    service.init({ themes: { brand: { colors: { primary: '#112233' } } } });
    service.switch('brand');
    const before = document.documentElement.getAttribute('style');

    expect(() => service.switch(' missing ')).toThrow(OneThemeConfigError);
    expect(() => service.switch('missing')).toThrow(OneThemeNotFoundError);
    expect(service.currentTheme).toBe('brand');
    expect(document.documentElement.getAttribute('style')).toBe(before);
  });

  test('invalid reinitialization preserves the previous state and DOM', () => {
    const service = new DomOneThemeService(() => document.documentElement);
    service.init({
      defaultTheme: 'brand',
      themes: { brand: { colors: { primary: '#112233' } } },
    });
    const before = document.documentElement.getAttribute('style');

    expect(() =>
      service.init({ defaultTheme: 'missing', themes: { next: {} } })
    ).toThrow(OneThemeConfigError);

    expect(service.currentTheme).toBe('brand');
    expect(document.documentElement.getAttribute('style')).toBe(before);
    service.switch('brand');
  });

  test('reports a missing browser root without changing service state', () => {
    const service = new DomOneThemeService(() => undefined);

    expect(() => service.init()).toThrow(OneThemeEnvironmentError);
    expect(() => service.switch('default')).toThrow(OneThemeEnvironmentError);
    expect(service.currentTheme).toBe('default');
  });

  test('rolls back every managed value when a DOM write fails', () => {
    const root = document.documentElement;
    root.style.setProperty('--one-color-primary', 'before', 'important');
    root.style.setProperty('--one-radius-lg', '20px');
    root.dataset.oneTheme = 'before';
    const originalSetProperty = root.style.setProperty.bind(root.style);
    let writes = 0;
    root.style.setProperty = (
      property: string,
      value: string | null,
      priority?: string
    ) => {
      writes += 1;
      if (writes === 5) {
        throw new Error('write failed');
      }
      originalSetProperty(property, value, priority);
    };
    const service = new DomOneThemeService(() => root);

    expect(() => service.init()).toThrow('write failed');

    root.style.setProperty = originalSetProperty;
    expect(service.currentTheme).toBe('default');
    expect(root.style.getPropertyValue('--one-color-primary')).toBe('before');
    expect(root.style.getPropertyPriority('--one-color-primary')).toBe(
      'important'
    );
    expect(root.style.getPropertyValue('--one-radius-lg')).toBe('20px');
    expect(root.dataset.oneTheme).toBe('before');
    expect(
      root.style.getPropertyValue('--one-color-primary-hover')
    ).toBeEmpty();
  });
});
