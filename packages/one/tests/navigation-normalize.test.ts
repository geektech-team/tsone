import { describe, expect, it } from 'bun:test';
import {
  normalizeNonNegativeInteger,
  normalizePositiveInteger,
  normalizePositiveIntegerList,
} from '../lib/navigation';

describe('navigation normalization', () => {
  it('normalizes finite integer bounds without leaking NaN', () => {
    expect(normalizeNonNegativeInteger(2.9, 1)).toBe(2);
    expect(normalizeNonNegativeInteger(-1, 1)).toBe(1);
    expect(normalizeNonNegativeInteger(Number.NaN, 3)).toBe(3);
    expect(normalizePositiveInteger(5.8, 10)).toBe(5);
    expect(normalizePositiveInteger(0, 10)).toBe(10);
    expect(normalizePositiveInteger(Number.POSITIVE_INFINITY, 10)).toBe(10);
  });

  it('deduplicates positive integer lists while preserving order', () => {
    expect(normalizePositiveIntegerList([20, 10, 20, -1, 50.9], [10])).toEqual([
      20, 10, 50,
    ]);
    expect(normalizePositiveIntegerList('invalid', [10, 20])).toEqual([10, 20]);
  });
});
