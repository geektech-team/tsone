import type { OneOverlayPlacement } from './types';

export interface OneOverlayRect {
  x: number;
  y: number;
  width: number;
  height: number;
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export interface OneOverlayPositionRequest {
  reference: OneOverlayRect;
  floating: OneOverlayRect;
  boundary: OneOverlayRect;
  placement: OneOverlayPlacement;
  offset: number;
  padding: number;
}

export interface OneOverlayPositionResult {
  x: number;
  y: number;
  placement: OneOverlayPlacement;
  arrow: { x?: number; y?: number };
}

export interface OneOverlayPositioner {
  compute(request: OneOverlayPositionRequest): OneOverlayPositionResult;
  autoUpdate(
    reference: HTMLElement,
    floating: HTMLElement,
    update: () => void
  ): () => void;
}

type Side = 'top' | 'right' | 'bottom' | 'left';
type Alignment = 'start' | 'center' | 'end';

const OPPOSITE: Record<Side, Side> = {
  top: 'bottom',
  right: 'left',
  bottom: 'top',
  left: 'right',
};

const CLOCKWISE: Record<Side, Side> = {
  top: 'right',
  right: 'bottom',
  bottom: 'left',
  left: 'top',
};

const COUNTER_CLOCKWISE: Record<Side, Side> = {
  top: 'left',
  right: 'top',
  bottom: 'right',
  left: 'bottom',
};

function parsePlacement(placement: OneOverlayPlacement): {
  side: Side;
  alignment: Alignment;
} {
  const [side, alignment = 'center'] = placement.split('-') as [
    Side,
    Alignment?,
  ];
  return { side, alignment };
}

function formatPlacement(
  side: Side,
  alignment: Alignment
): OneOverlayPlacement {
  return (
    alignment === 'center' ? side : `${side}-${alignment}`
  ) as OneOverlayPlacement;
}

function clamp(value: number, minimum: number, maximum: number): number {
  if (maximum < minimum) {
    return minimum;
  }
  return Math.min(Math.max(value, minimum), maximum);
}

function coordinates(
  reference: OneOverlayRect,
  floating: OneOverlayRect,
  side: Side,
  alignment: Alignment,
  offset: number
): { x: number; y: number } {
  let x = reference.left + (reference.width - floating.width) / 2;
  let y = reference.top + (reference.height - floating.height) / 2;

  if (side === 'top') {
    y = reference.top - floating.height - offset;
  } else if (side === 'bottom') {
    y = reference.bottom + offset;
  } else if (side === 'left') {
    x = reference.left - floating.width - offset;
  } else {
    x = reference.right + offset;
  }

  if (side === 'top' || side === 'bottom') {
    if (alignment === 'start') {
      x = reference.left;
    } else if (alignment === 'end') {
      x = reference.right - floating.width;
    }
  } else if (alignment === 'start') {
    y = reference.top;
  } else if (alignment === 'end') {
    y = reference.bottom - floating.height;
  }

  return { x, y };
}

function fits(
  point: { x: number; y: number },
  floating: OneOverlayRect,
  boundary: OneOverlayRect,
  padding: number
): boolean {
  return (
    point.x >= boundary.left + padding &&
    point.y >= boundary.top + padding &&
    point.x + floating.width <= boundary.right - padding &&
    point.y + floating.height <= boundary.bottom - padding
  );
}

function visibleArea(
  point: { x: number; y: number },
  floating: OneOverlayRect,
  boundary: OneOverlayRect,
  padding: number
): number {
  const left = Math.max(point.x, boundary.left + padding);
  const top = Math.max(point.y, boundary.top + padding);
  const right = Math.min(point.x + floating.width, boundary.right - padding);
  const bottom = Math.min(point.y + floating.height, boundary.bottom - padding);
  return Math.max(0, right - left) * Math.max(0, bottom - top);
}

function scrollAncestors(element: HTMLElement): EventTarget[] {
  const targets = new Set<EventTarget>();
  const view = element.ownerDocument.defaultView;
  let current = element.parentElement;
  while (current) {
    const style = view?.getComputedStyle(current);
    if (
      style &&
      /(auto|scroll|overlay)/.test(
        style.overflow + style.overflowX + style.overflowY
      )
    ) {
      targets.add(current);
    }
    current = current.parentElement;
  }
  if (view) {
    targets.add(view);
  }
  return [...targets];
}

export class OneFloatingPositioner implements OneOverlayPositioner {
  public compute(request: OneOverlayPositionRequest): OneOverlayPositionResult {
    const preferred = parsePlacement(request.placement);
    const sides = [
      preferred.side,
      OPPOSITE[preferred.side],
      CLOCKWISE[preferred.side],
      COUNTER_CLOCKWISE[preferred.side],
    ];
    const candidates = sides.map((side) => ({
      placement: formatPlacement(side, preferred.alignment),
      side,
      point: coordinates(
        request.reference,
        request.floating,
        side,
        preferred.alignment,
        request.offset
      ),
    }));
    const selected =
      candidates.find((candidate) =>
        fits(
          candidate.point,
          request.floating,
          request.boundary,
          request.padding
        )
      ) ??
      candidates.reduce((best, candidate) =>
        visibleArea(
          candidate.point,
          request.floating,
          request.boundary,
          request.padding
        ) >
        visibleArea(
          best.point,
          request.floating,
          request.boundary,
          request.padding
        )
          ? candidate
          : best
      );
    const x = clamp(
      selected.point.x,
      request.boundary.left + request.padding,
      request.boundary.right - request.padding - request.floating.width
    );
    const y = clamp(
      selected.point.y,
      request.boundary.top + request.padding,
      request.boundary.bottom - request.padding - request.floating.height
    );
    const centerX = request.reference.left + request.reference.width / 2;
    const centerY = request.reference.top + request.reference.height / 2;
    const arrow =
      selected.side === 'top' || selected.side === 'bottom'
        ? {
            x: clamp(centerX - x, 8, Math.max(8, request.floating.width - 8)),
          }
        : {
            y: clamp(centerY - y, 8, Math.max(8, request.floating.height - 8)),
          };

    return { x, y, placement: selected.placement, arrow };
  }

  public autoUpdate(
    reference: HTMLElement,
    floating: HTMLElement,
    update: () => void
  ): () => void {
    const view = reference.ownerDocument.defaultView;
    if (!view) {
      return () => {};
    }
    let disposed = false;
    let frame: number | undefined;
    const schedule = (): void => {
      if (disposed || frame !== undefined) {
        return;
      }
      frame = view.requestAnimationFrame(() => {
        frame = undefined;
        if (!disposed) {
          update();
        }
      });
    };
    const targets = new Set<EventTarget>([
      ...scrollAncestors(reference),
      ...scrollAncestors(floating),
    ]);
    targets.forEach((target) => target.addEventListener('scroll', schedule));
    view.addEventListener('resize', schedule);

    const observer = view.ResizeObserver
      ? new view.ResizeObserver(schedule)
      : undefined;
    observer?.observe(reference);
    observer?.observe(floating);

    return () => {
      if (disposed) {
        return;
      }
      disposed = true;
      if (frame !== undefined) {
        view.cancelAnimationFrame(frame);
        frame = undefined;
      }
      observer?.disconnect();
      targets.forEach((target) =>
        target.removeEventListener('scroll', schedule)
      );
      view.removeEventListener('resize', schedule);
    };
  }
}
