import { OneOverlayContainerError, OneOverlayEnvironmentError } from './errors';
import type { OneOverlayContainer } from './types';

function globalDocument(): Document | null {
  return typeof document === 'undefined' ? null : document;
}

export function resolveOneOverlayContainer(
  container?: OneOverlayContainer,
  targetDocument: Document | null = globalDocument()
): HTMLElement {
  if (!targetDocument) {
    throw new OneOverlayEnvironmentError();
  }

  const resolved =
    typeof container === 'function'
      ? container()
      : (container ?? targetDocument.body);
  if (!resolved) {
    throw new OneOverlayContainerError('One overlay container was not found');
  }
  if (resolved.ownerDocument !== targetDocument) {
    throw new OneOverlayContainerError(
      'One overlay container must belong to the current document'
    );
  }
  if (!resolved.isConnected) {
    throw new OneOverlayContainerError(
      'One overlay container must be connected'
    );
  }
  if (resolved !== targetDocument.body) {
    const bounds = resolved.getBoundingClientRect();
    if (bounds.width <= 0 || bounds.height <= 0) {
      throw new OneOverlayContainerError(
        'One overlay container must have measurable layout'
      );
    }
  }

  return resolved;
}
