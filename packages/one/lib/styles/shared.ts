import type { StyleSheet } from '@geektech/tsone';
import type { StyleOptions } from '@geektech/tsone/style';
import type { OneComponentSize } from '../types';

export type OneNamedStyle = StyleOptions & { name: string };

const ONE_SIZES: readonly OneComponentSize[] = ['sm', 'md', 'lg'];

export function normalizeOneSize(value: unknown): OneComponentSize {
  return ONE_SIZES.includes(value as OneComponentSize)
    ? (value as OneComponentSize)
    : 'md';
}

export function oneStylesToSheet(
  styles: readonly OneNamedStyle[]
): StyleSheet {
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
