import type { OneFeedbackVariant } from '../overlay';
import type { OneMessageOptions, OneMessagePlacement } from './types';

const VARIANTS: readonly OneFeedbackVariant[] = [
  'info',
  'success',
  'warning',
  'error',
];

const PLACEMENTS: readonly OneMessagePlacement[] = [
  'top-start',
  'top',
  'top-end',
  'bottom-start',
  'bottom',
  'bottom-end',
];

export interface NormalizedOneMessageOptions
  extends Omit<OneMessageOptions, 'variant' | 'duration' | 'placement'> {
  variant: OneFeedbackVariant;
  duration: number;
  placement: OneMessagePlacement;
}

export function normalizeOneMessageOptions(
  options: OneMessageOptions
): NormalizedOneMessageOptions {
  return {
    ...options,
    variant: VARIANTS.includes(options.variant as OneFeedbackVariant)
      ? (options.variant as OneFeedbackVariant)
      : 'info',
    duration:
      typeof options.duration === 'number' &&
      Number.isFinite(options.duration) &&
      options.duration >= 0
        ? options.duration
        : 3000,
    placement: PLACEMENTS.includes(options.placement as OneMessagePlacement)
      ? (options.placement as OneMessagePlacement)
      : 'top',
  };
}
