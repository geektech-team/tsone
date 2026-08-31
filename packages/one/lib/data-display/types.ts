export type OneDataDisplayVariant =
  | 'neutral'
  | 'primary'
  | 'success'
  | 'warning'
  | 'error';

const VARIANTS: readonly OneDataDisplayVariant[] = [
  'neutral',
  'primary',
  'success',
  'warning',
  'error',
];

export function normalizeOneDataDisplayVariant(
  value: unknown,
  fallback: OneDataDisplayVariant = 'neutral'
): OneDataDisplayVariant {
  return VARIANTS.includes(value as OneDataDisplayVariant)
    ? (value as OneDataDisplayVariant)
    : fallback;
}
