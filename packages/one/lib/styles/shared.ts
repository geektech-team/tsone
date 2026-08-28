import type { StyleSheet } from '@geektech/tsone';
import type { StyleOptions } from '@geektech/tsone/style';
import type { OneComponentSize } from '../types';

export type OneNamedStyle = StyleOptions & { name: string };

export const ONE_THEME_DEFAULTS = {
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

const ONE_SIZES: readonly OneComponentSize[] = ['sm', 'md', 'lg'];

export function normalizeOneSize(value: unknown): OneComponentSize {
  return ONE_SIZES.includes(value as OneComponentSize)
    ? (value as OneComponentSize)
    : 'md';
}

export function oneStylesToSheet(styles: readonly OneNamedStyle[]): StyleSheet {
  const sheet: StyleSheet = [];

  styles.forEach((style) => {
    sheet.push({ selector: style.selector, properties: style.properties });
    if (style.hover) {
      sheet.push({
        selector: `${style.selector}:hover`,
        properties: style.hover,
      });
    }
    Object.entries(style.media ?? {}).forEach(([query, properties]) => {
      sheet.push({
        atRule: `@media ${query}`,
        rules: [{ selector: style.selector, properties }],
      });
    });
  });

  return sheet;
}
