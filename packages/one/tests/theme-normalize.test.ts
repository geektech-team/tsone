import { describe, expect, test } from 'bun:test';
import { ONE_DEFAULT_THEME } from '../lib/theme/default-theme';
import { OneThemeConfigError } from '../lib/theme/errors';
import { normalizeOneThemeOptions } from '../lib/theme/normalize';
import type { OneThemeInitOptions } from '../lib/theme/types';

describe('ONE_DEFAULT_THEME', () => {
  test('contains the complete resolved default theme', () => {
    expect(ONE_DEFAULT_THEME).toEqual({
      colors: {
        primary: '#5fd956',
        primaryHover: '#4bc944',
        primaryContrast: '#162018',
        secondary: '#ffffff',
        secondaryHover: '#d9e8d6',
        secondaryContrast: '#162018',
        danger: '#b83232',
        dangerHover: '#9f2d2d',
        dangerContrast: '#ffffff',
        info: '#2563eb',
        success: '#2f7c39',
        warning: '#9a6700',
        overlay: 'rgba(22, 32, 24, 0.48)',
        surface: '#ffffff',
        text: '#162018',
        muted: '#647268',
        focus: '#2f7c39',
      },
      typography: {
        fontFamily:
          "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        fontSizeSm: '12px',
        fontSizeMd: '14px',
        fontSizeLg: '16px',
        lineHeight: '1.5',
      },
      border: {
        color: '#d9e8d6',
        width: '1px',
        style: 'solid',
      },
      radius: {
        sm: '4px',
        md: '8px',
        lg: '8px',
      },
    });
  });

  test('is deeply frozen', () => {
    expect(Object.isFrozen(ONE_DEFAULT_THEME)).toBe(true);
    expect(Object.isFrozen(ONE_DEFAULT_THEME.colors)).toBe(true);
    expect(Object.isFrozen(ONE_DEFAULT_THEME.typography)).toBe(true);
    expect(Object.isFrozen(ONE_DEFAULT_THEME.border)).toBe(true);
    expect(Object.isFrozen(ONE_DEFAULT_THEME.radius)).toBe(true);
  });
});

describe('normalizeOneThemeOptions', () => {
  test('registers only the built-in default without options', () => {
    const result = normalizeOneThemeOptions();

    expect(result.defaultTheme).toBe('default');
    expect(Object.keys(result.themes)).toEqual(['default']);
    expect(result.themes.default).toBe(ONE_DEFAULT_THEME);
  });

  test('resolves multiple themes independently from the built-in default', () => {
    const result = normalizeOneThemeOptions({
      defaultTheme: 'night',
      themes: {
        brand: {
          colors: { primary: '#112233' },
          radius: { lg: '12px' },
        },
        night: {
          colors: { surface: '#101510', text: '#f4f8f4' },
          typography: { lineHeight: '1.7' },
          border: { width: '2px', style: 'dashed' },
        },
      },
    });

    expect(result.defaultTheme).toBe('night');
    expect(Object.keys(result.themes)).toEqual(['default', 'brand', 'night']);
    expect(result.themes.brand.colors.primary).toBe('#112233');
    expect(result.themes.brand.colors.surface).toBe('#ffffff');
    expect(result.themes.brand.radius).toEqual({
      sm: '4px',
      md: '8px',
      lg: '12px',
    });
    expect(result.themes.night.colors.primary).toBe('#5fd956');
    expect(result.themes.night.typography.lineHeight).toBe('1.7');
    expect(result.themes.night.border).toEqual({
      color: '#d9e8d6',
      width: '2px',
      style: 'dashed',
    });
  });

  test('returns a deeply frozen registry without mutating input', () => {
    const options: OneThemeInitOptions = {
      themes: { brand: { colors: { primary: '#112233' } } },
    };

    const result = normalizeOneThemeOptions(options);

    expect(Object.isFrozen(result)).toBe(true);
    expect(Object.isFrozen(result.themes)).toBe(true);
    expect(Object.isFrozen(result.themes.brand)).toBe(true);
    expect(Object.isFrozen(result.themes.brand.colors)).toBe(true);
    expect(options).toEqual({
      themes: { brand: { colors: { primary: '#112233' } } },
    });
  });

  test('registers valid names that affect ordinary object prototypes', () => {
    const result = normalizeOneThemeOptions({
      defaultTheme: '__proto__',
      themes: {
        ['__proto__']: { colors: { primary: '#334455' } },
      },
    });

    expect(Object.keys(result.themes)).toEqual(['default', '__proto__']);
    expect(result.themes.__proto__.colors.primary).toBe('#334455');
  });

  test.each([
    ['reserved name', { themes: { default: {} } }],
    ['blank name', { themes: { '': {} } }],
    ['padded name', { themes: { ' brand': {} } }],
    ['whitespace name', { themes: { 'brand name': {} } }],
    ['missing default', { defaultTheme: 'missing' }],
    ['array themes', { themes: [] }],
    ['non-record definition', { themes: { brand: 'green' } }],
    ['non-record group', { themes: { brand: { colors: [] } } }],
    ['unknown option', { persist: true }],
    ['unknown group', { themes: { brand: { spacing: {} } } }],
    ['unknown token', { themes: { brand: { colors: { accent: '#fff' } } } }],
    ['non-string token', { themes: { brand: { radius: { sm: 4 } } } }],
    ['blank token', { themes: { brand: { border: { style: '  ' } } } }],
  ] as const)('rejects invalid configuration: %s', (_label, options) => {
    expect(() =>
      normalizeOneThemeOptions(options as unknown as OneThemeInitOptions)
    ).toThrow(OneThemeConfigError);
  });
});
