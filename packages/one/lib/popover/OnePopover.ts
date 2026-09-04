import { Component, type VNode } from '@geektech/tsone';
import {
  getDefaultOneOverlayHost,
  OneFloatingPositioner,
  OneOverlayMountController,
  OneTooltipTriggerError,
  resolveOneOverlayContainer,
  type OneOverlayFactoryContext,
  type OneOverlayPlacement,
} from '../overlay';
import { PopoverBubble, type PopoverBubbleProps } from './PopoverBubble';
import type { OnePopoverProps, OnePopoverTrigger } from './types';

interface OnePopoverState {
  internalOpen: boolean;
}

const PLACEMENTS: readonly OneOverlayPlacement[] = [
  'top-start',
  'top',
  'top-end',
  'right-start',
  'right',
  'right-end',
  'bottom-start',
  'bottom',
  'bottom-end',
  'left-start',
  'left',
  'left-end',
];

const TRIGGERS: readonly OnePopoverTrigger[] = ['hover-focus', 'click', 'manual'];

export class OnePopover extends Component<OnePopoverProps, OnePopoverState> {
  private readonly positioner = new OneFloatingPositioner();
  private controller: OneOverlayMountController<PopoverBubbleProps> | undefined;
  private triggerElement: HTMLElement | undefined;
  private targetDocument: Document | undefined;
  private popoverId: string | undefined;
  private hovered = false;
  private focused = false;
  private openTimer: number | undefined;
  private closeTimer: number | undefined;

  protected initState(): OnePopoverState {
    return { internalOpen: this.props.defaultOpen === true };
  }

  protected initStyles(): void {}

  protected onMounted(): void {
    const wrapper = this.getElement();
    const trigger =
      wrapper instanceof HTMLElement ? wrapper.firstElementChild : null;
    if (!(trigger instanceof HTMLElement)) {
      throw new OneTooltipTriggerError();
    }
    this.triggerElement = trigger;
    this.targetDocument = trigger.ownerDocument;
    this.targetDocument.addEventListener('click', this.handleDocumentClick);
    this.targetDocument.addEventListener('keydown', this.handleDocumentKeydown);
    this.controller = new OneOverlayMountController<PopoverBubbleProps>(
      getDefaultOneOverlayHost(this.targetDocument),
      'popover',
      (context) => this.createBubble(context)
    );
    this.synchronizeOverlay();
  }

  protected beforeUpdate(): void {
    this.synchronizeOverlay();
  }

  protected beforeUnmount(): void {
    this.clearTimers();
    this.targetDocument?.removeEventListener('click', this.handleDocumentClick);
    this.targetDocument?.removeEventListener(
      'keydown',
      this.handleDocumentKeydown
    );
    this.controller?.close();
    this.controller = undefined;
    this.triggerElement = undefined;
    this.targetDocument = undefined;
  }

  protected render(): VNode {
    return {
      tag: 'span',
      props: {
        className: 'one-popover__trigger',
        ...(this.requestedOpen()
          ? { 'data-one-popover-open': '' }
          : {}),
      },
      children: defaultChildren(this.props.children ?? []),
      listeners: {
        mouseenter: () => this.handleMouseEnter(),
        mouseleave: () => this.handleMouseLeave(),
        focusin: () => this.handleFocusIn(),
        focusout: (event) => this.handleFocusOut(event),
        click: () => this.handleTriggerClick(),
      },
    };
  }

  private createBubble(context: OneOverlayFactoryContext) {
    this.popoverId = context.id;
    const bubble = new PopoverBubble(this.bubbleOptions(context.id));
    bubble.mount(context.slot);
    this.applyExpanded(true);
    return {
      update: (next: Partial<PopoverBubbleProps>) => bubble.setProps(next),
      destroy: () => {
        bubble.unmount();
        this.applyExpanded(false);
        this.popoverId = undefined;
      },
    };
  }

  private synchronizeOverlay(): void {
    if (!this.controller || !this.triggerElement || !this.targetDocument) {
      return;
    }
    const shouldOpen = !this.props.disabled && this.requestedOpen();
    if (!shouldOpen) {
      this.controller.close();
      return;
    }
    const container = resolveOneOverlayContainer(
      this.props.container,
      this.targetDocument
    );
    this.controller.open(container);
    this.controller.update(this.bubbleOptions());
  }

  private bubbleOptions(id = this.popoverId ?? ''): PopoverBubbleProps {
    const targetDocument = this.targetDocument;
    if (!this.triggerElement || !targetDocument) {
      throw new OneTooltipTriggerError();
    }
    return {
      id,
      content: this.props.content,
      reference: this.triggerElement,
      placement: normalizePlacement(this.props.placement),
      offset: normalizeDelay(this.props.offset, 8),
      boundaryPadding: 8,
      arrow: this.props.arrow !== false,
      container: resolveOneOverlayContainer(
        this.props.container,
        targetDocument
      ),
      positioner: this.positioner,
    };
  }

  private requestedOpen(): boolean {
    return this.props.open === undefined
      ? this.state.internalOpen
      : this.props.open === true;
  }

  private requestOpen(open: boolean): void {
    if (this.props.disabled || open === this.requestedOpen()) {
      return;
    }
    this.emit('openChange', open);
    if (this.props.open !== undefined) {
      return;
    }
    this.state.internalOpen = open;
    this.synchronizeOverlay();
  }

  private handleMouseEnter(): void {
    if (this.normalizedTrigger() !== 'hover-focus') {
      return;
    }
    this.hovered = true;
    this.cancelCloseTimer();
    this.scheduleOpen();
  }

  private handleMouseLeave(): void {
    if (this.normalizedTrigger() !== 'hover-focus') {
      return;
    }
    this.hovered = false;
    if (!this.focused) {
      this.scheduleClose();
    }
  }

  private handleFocusIn(): void {
    if (this.normalizedTrigger() !== 'hover-focus') {
      return;
    }
    this.focused = true;
    this.cancelCloseTimer();
    this.scheduleOpen();
  }

  private handleFocusOut(event: Event): void {
    if (this.normalizedTrigger() !== 'hover-focus') {
      return;
    }
    const wrapper = this.getElement();
    const next = (event as FocusEvent).relatedTarget;
    if (wrapper instanceof HTMLElement && next instanceof Node) {
      if (wrapper.contains(next)) {
        return;
      }
    }
    this.focused = false;
    if (!this.hovered) {
      this.scheduleClose();
    }
  }

  private handleTriggerClick(): void {
    if (this.normalizedTrigger() === 'click') {
      this.requestOpen(!this.requestedOpen());
    }
  }

  private readonly handleDocumentClick = (event: Event): void => {
    if (
      this.normalizedTrigger() !== 'click' ||
      !this.requestedOpen() ||
      (event.target instanceof Node &&
        this.getElement()?.contains(event.target))
    ) {
      return;
    }
    this.requestOpen(false);
  };

  private readonly handleDocumentKeydown = (event: KeyboardEvent): void => {
    if (event.key === 'Escape' && this.requestedOpen()) {
      this.requestOpen(false);
    }
  };

  private scheduleOpen(): void {
    this.cancelCloseTimer();
    if (this.openTimer !== undefined || this.requestedOpen()) {
      return;
    }
    const delay = normalizeDelay(this.props.openDelay, 100);
    if (delay === 0) {
      this.requestOpen(true);
      return;
    }
    this.openTimer = this.targetDocument?.defaultView?.setTimeout(() => {
      this.openTimer = undefined;
      if (this.hovered || this.focused) {
        this.requestOpen(true);
      }
    }, delay);
  }

  private scheduleClose(): void {
    this.cancelOpenTimer();
    if (this.closeTimer !== undefined || !this.requestedOpen()) {
      return;
    }
    const delay = normalizeDelay(this.props.closeDelay, 100);
    if (delay === 0) {
      this.requestOpen(false);
      return;
    }
    this.closeTimer = this.targetDocument?.defaultView?.setTimeout(() => {
      this.closeTimer = undefined;
      if (!this.hovered && !this.focused) {
        this.requestOpen(false);
      }
    }, delay);
  }

  private clearTimers(): void {
    this.cancelOpenTimer();
    this.cancelCloseTimer();
  }

  private cancelOpenTimer(): void {
    if (this.openTimer !== undefined) {
      this.targetDocument?.defaultView?.clearTimeout(this.openTimer);
      this.openTimer = undefined;
    }
  }

  private cancelCloseTimer(): void {
    if (this.closeTimer !== undefined) {
      this.targetDocument?.defaultView?.clearTimeout(this.closeTimer);
      this.closeTimer = undefined;
    }
  }

  private applyExpanded(expanded: boolean): void {
    if (!this.triggerElement) {
      return;
    }
    this.triggerElement.setAttribute(
      'aria-haspopup',
      this.props.haspopup ?? 'dialog'
    );
    if (expanded) {
      this.triggerElement.setAttribute('aria-expanded', 'true');
    } else {
      this.triggerElement.removeAttribute('aria-expanded');
    }
  }

  private normalizedTrigger(): OnePopoverTrigger {
    return TRIGGERS.includes(this.props.trigger as OnePopoverTrigger)
      ? (this.props.trigger as OnePopoverTrigger)
      : 'click';
  }
}

function normalizePlacement(value: unknown): OneOverlayPlacement {
  return PLACEMENTS.includes(value as OneOverlayPlacement)
    ? (value as OneOverlayPlacement)
    : 'bottom';
}

function defaultChildren(
  children: Array<VNode | string>
): Array<VNode | string> {
  const result: Array<VNode | string> = [];
  children.forEach((child) => {
    if (typeof child === 'string') {
      result.push(child);
      return;
    }
    if (child && typeof child === 'object' && 'tag' in child) {
      result.push(child);
      return;
    }
    if (child && typeof child === 'object' && 'component' in child) {
      result.push(child);
      return;
    }
    result.push(child);
  });
  return result;
}

function normalizeDelay(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}
