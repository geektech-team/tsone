import {
  normalizeNonNegativeInteger,
  normalizePositiveInteger,
} from '../navigation';

export type OnePaginationToken = number | 'ellipsis-start' | 'ellipsis-end';

export function createOnePaginationTokens(
  pageCount: number,
  page: number,
  siblingCount: number
): OnePaginationToken[] {
  const normalizedCount = normalizePositiveInteger(pageCount, 1);
  const normalizedPage = Math.min(
    normalizedCount,
    normalizePositiveInteger(page, 1)
  );
  const normalizedSiblings = normalizeNonNegativeInteger(siblingCount, 1);
  const pages = new Set<number>([1, normalizedCount]);

  for (
    let candidate = Math.max(1, normalizedPage - normalizedSiblings);
    candidate <= Math.min(normalizedCount, normalizedPage + normalizedSiblings);
    candidate += 1
  ) {
    pages.add(candidate);
  }

  const sorted = [...pages].sort((left, right) => left - right);
  return sorted.flatMap((value, index): OnePaginationToken[] => {
    if (index === 0) return [value];
    const previous = sorted[index - 1];
    const gap = value - previous;
    if (gap === 2) return [previous + 1, value];
    if (gap > 2) {
      return [previous === 1 ? 'ellipsis-start' : 'ellipsis-end', value];
    }
    return [value];
  });
}
