import { Component, type VNode } from '@geektech/tsone';
import type {
  OneOverlayPlacement,
  OneOverlayPositioner,
  OneOverlayRect,
} from '../overlay';
import {
  ONE_THEME_DEFAULTS,
  ONE_THEME_TYPOGRAPHY_PROPERTIES,
  oneThemeBorder,
  type OneNamedStyle,
} from '../styles/shared';

export interface PopoverBubbleProps {
  id: string;
  content: VNode | string;
  reference: HTMLElement;
  placement: OneOverlayPlacement;
  offset: number;
  boundaryPadding: number;
  arrow: boolean;
  container: HTMLElement;
  positioner: OneOverlayPositioner;
}

export const ONE_POPOVER_STYLES: OneNamedStyle[] = [
  {
    name: 'one-popover-bubble',
    selector: '.one-popover__bubble',
    properties: {
      ...ONE_THEME_TYPOGRAPHY_PROPERTIES,
      position: 'fixed',
      zIndex: `var(--one-z-index-tooltip, ${ONE_THEME_DEFAULTS.zIndexTooltip})`,
      boxSizing: 'border-box',
      minWidth: '160px',
      maxWidth: '320px',
      padding: `var(--one-space-sm, ${ONE_THEME_DEFAULTS.spaceSm}) var(--one-space-md, ${ONE_THEME_DEFAULTS.spaceMd})`,
      color: `var(--one-color-text, ${ONE_THEME_DEFAULTS.colorText})`,
      fontSize: `var(--one-font-size-md, ${ONE_THEME_DEFAULTS.fontSizeMd})`,
      backgroundColor: `var(--one-color-surface, ${ONE_THEME_DEFAULTS.colorSurface})`,
      border: oneThemeBorder(),
      borderRadius: `var(--one-radius-md, ${ONE_THEME_DEFAULTS.radiusMd})`,
      boxShadow: `var(--one-shadow-overlay, ${ONE_THEME_DEFAULTS.shadowOverlay})`,
      pointerEvents: 'auto',
    },
  },
  {
    name: 'one-popover-bubble-contained',
    selector: '.one-popover__bubble--contained',
    properties: { position: 'absolute' },
  },
  {
    name: 'one-popover-arrow',
    selector: '.one-popover__arrow',
    properties: {
      position: 'absolute',
      width: '8px',
      height: '8px',
      backgroundColor: 'inherit',
      border: oneThemeBorder(),
      transform: 'rotate(45deg)',
    },
  },
  {
    name: 'one-popover-arrow-vertical',
    selector:
      '.one-popover__bubble[data-placement^="top"] .one-popover__arrow, .one-popover__bubble[data-placement^="bottom"] .one-popover__arrow',
    properties: {
      left: 'var(--one-popover-arrow-x, 50%)',
      marginLeft: '-4px',
    },
  },
  {
    name: 'one-popover-arrow-horizontal',
    selector:
      '.one-popover__bubble[data-placement^="left"] .one-popover__arrow, .one-popover__bubble[data-placement^="right"] .one-popover__arrow',
    properties: {
      top: 'var(--one-popover-arrow-y, 50%)',
      marginTop: '-4px',
    },
  },
  {
    name: 'one-popover-arrow-top',
    selector: '.one-popover__bubble[data-placement^="top"] .one-popover__arrow',
    properties: { bottom: '-4px' },
  },
  {
    name: 'one-popover-arrow-bottom',
    selector:
      '.one-popover__bubble[data-placement^="bottom"] .one-popover__arrow',
    properties: { top: '-4px' },
  },
  {
    name: 'one-popover-arrow-left',
    selector:
      '.one-popover__bubble[data-placement^="left"] .one-popover__arrow',
    properties: { right: '-4px' },
  },
  {
    name: 'one-popover-arrow-right',
    selector:
      '.one-popover__bubble[data-placement^="right"] .one-popover__arrow',
    properties: { left: '-4px' },
  },
];

interface PopoverBubbleState {}

export class PopoverBubble extends Component<
  PopoverBubbleProps,
  PopoverBubbleState
> {
  private stopAutoUpdate: (() => void) | undefined;

  public mount(container: HTMLElement): void {
    super.mount(container);
    this.updatePosition();
    const element = this.getElement();
    if (element instanceof HTMLElement) {
      this.stopAutoUpdate = this.props.positioner.autoUpdate(
        this.props.reference,
        element,
        () => this.updatePosition()
      );
    }
  }

  public setProps(props: Partial<PopoverBubbleProps>): void {
    super.setProps(props);
    this.updatePosition();
  }

  protected initState(): PopoverBubbleState {
    return {};
  }

  protected initStyles(): void {
    ONE_POPOVER_STYLES.forEach(({ name, ...style }) => {
      this.styleManager.addStyle(name, style);
    });
  }

  protected onUnmounted(): void {
    this.stopAutoUpdate?.();
    this.stopAutoUpdate = undefined;
  }

  protected render(): VNode {
    const contained =
      this.props.container !== this.props.container.ownerDocument.body;
    return {
      tag: 'div',
      props: {
        id: this.props.id,
        className: [
          'one-popover__bubble',
          ...(contained ? ['one-popover__bubble--contained'] : []),
        ].join(' '),
        role: 'dialog',
        'data-placement': this.props.placement,
      },
      children: [
        this.props.content,
        ...(this.props.arrow
          ? [
              {
                tag: 'span',
                props: {
                  className: 'one-popover__arrow',
                  'aria-hidden': 'true',
                },
              } as VNode,
            ]
          : []),
      ],
    };
  }

  private updatePosition(): void {
    const element = this.getElement();
    if (!(element instanceof HTMLElement) || !element.isConnected) {
      return;
    }
    const boundary = this.boundaryRect();
    const result = this.props.positioner.compute({
      reference: toOverlayRect(this.props.reference.getBoundingClientRect()),
      floating: toOverlayRect(element.getBoundingClientRect()),
      boundary,
      placement: this.props.placement,
      offset: this.props.offset,
      padding: this.props.boundaryPadding,
    });
    const contained =
      this.props.container !== this.props.container.ownerDocument.body;
    element.style.left = `${result.x - (contained ? boundary.left : 0)}px`;
    element.style.top = `${result.y - (contained ? boundary.top : 0)}px`;
    element.dataset.placement = result.placement;
    element.style.removeProperty('--one-popover-arrow-x');
    element.style.removeProperty('--one-popover-arrow-y');
    if (result.arrow.x !== undefined) {
      element.style.setProperty('--one-popover-arrow-x', `${result.arrow.x}px`);
    }
    if (result.arrow.y !== undefined) {
      element.style.setProperty('--one-popover-arrow-y', `${result.arrow.y}px`);
    }
  }

  private boundaryRect(): OneOverlayRect {
    const targetDocument = this.props.container.ownerDocument;
    if (this.props.container !== targetDocument.body) {
      return toOverlayRect(this.props.container.getBoundingClientRect());
    }
    const view = targetDocument.defaultView;
    const width =
      view?.innerWidth ?? targetDocument.documentElement.clientWidth;
    const height =
      view?.innerHeight ?? targetDocument.documentElement.clientHeight;
    return {
      x: 0,
      y: 0,
      top: 0,
      left: 0,
      width,
      height,
      right: width,
      bottom: height,
    };
  }
}

function toOverlayRect(rect: DOMRect | OneOverlayRect): OneOverlayRect {
  return {
    x: rect.x,
    y: rect.y,
    width: rect.width,
    height: rect.height,
    top: rect.top,
    right: rect.right,
    bottom: rect.bottom,
    left: rect.left,
  };
}
