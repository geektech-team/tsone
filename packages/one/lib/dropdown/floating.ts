export interface OneFloatingPanelOptions {
  trigger: HTMLElement;
  panel: HTMLElement;
  gap?: number;
  minWidth?: number;
  onOutside?: () => void;
}

function viewportSize(): { width: number; height: number } {
  return {
    width:
      window.innerWidth || document.documentElement.clientWidth || 0,
    height:
      window.innerHeight || document.documentElement.clientHeight || 0,
  };
}

export function positionOneFloatingPanel(
  options: OneFloatingPanelOptions
): void {
  const { trigger, panel } = options;
  const triggerRect = trigger.getBoundingClientRect();
  const gap = options.gap ?? 4;
  const viewport = viewportSize();

  panel.style.position = 'fixed';
  panel.style.margin = '0';
  panel.style.left = `${triggerRect.left}px`;
  panel.style.top = `${triggerRect.bottom + gap}px`;
  if (options.minWidth !== undefined && options.minWidth > 0) {
    panel.style.width = `${Math.max(triggerRect.width, options.minWidth)}px`;
  }

  const panelRect = panel.getBoundingClientRect();
  if (viewport.height > 0 && panelRect.bottom > viewport.height - 8) {
    panel.style.top = `${Math.max(
      8,
      triggerRect.top - panelRect.height - gap
    )}px`;
  }
  if (viewport.width > 0 && panelRect.right > viewport.width - 8) {
    panel.style.left = `${Math.max(8, viewport.width - panelRect.width - 8)}px`;
  }
}

export function bindOneFloatingPanel(
  options: OneFloatingPanelOptions
): () => void {
  positionOneFloatingPanel(options);
  const onViewportChange = (): void => positionOneFloatingPanel(options);
  const onPointerDown = (event: Event): void => {
    const target = event.target;
    if (!(target instanceof Node)) return;
    if (
      options.panel.contains(target) ||
      options.trigger.contains(target)
    ) {
      return;
    }
    options.onOutside?.();
  };
  window.addEventListener('scroll', onViewportChange, true);
  window.addEventListener('resize', onViewportChange);
  document.addEventListener('pointerdown', onPointerDown);
  return () => {
    window.removeEventListener('scroll', onViewportChange, true);
    window.removeEventListener('resize', onViewportChange);
    document.removeEventListener('pointerdown', onPointerDown);
  };
}
