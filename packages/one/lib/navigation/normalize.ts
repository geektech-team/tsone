export function normalizeNonNegativeInteger(
  value: unknown,
  fallback: number
): number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0
    ? Math.floor(value)
    : Math.max(0, Math.floor(fallback));
}

export function normalizePositiveInteger(
  value: unknown,
  fallback: number
): number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0
    ? Math.floor(value)
    : Math.max(1, Math.floor(fallback));
}

export function normalizePositiveIntegerList(
  values: unknown,
  fallback: readonly number[]
): number[] {
  const source = Array.isArray(values) ? values : fallback;
  return [
    ...new Set(
      source
        .filter(
          (value): value is number =>
            typeof value === 'number' && Number.isFinite(value) && value > 0
        )
        .map(Math.floor)
    ),
  ];
}
