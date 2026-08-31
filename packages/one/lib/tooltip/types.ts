import type { VNode } from '@geektech/tsone';
import type { OneOverlayContainer, OneOverlayPlacement } from '../overlay';

export type OneTooltipTrigger = 'hover-focus' | 'click' | 'manual';

export interface OneTooltipProps {
  content: VNode | string;
  placement?: OneOverlayPlacement;
  trigger?: OneTooltipTrigger;
  open?: boolean;
  defaultOpen?: boolean;
  openDelay?: number;
  closeDelay?: number;
  offset?: number;
  container?: OneOverlayContainer;
  arrow?: boolean;
  disabled?: boolean;
  children?: Array<VNode | string>;
}
