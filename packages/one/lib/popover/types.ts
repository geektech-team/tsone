import type { VNode } from '@geektech/tsone';
import type { OneOverlayContainer, OneOverlayPlacement } from '../overlay';

export type OnePopoverTrigger = 'hover-focus' | 'click' | 'manual';

export interface OnePopoverProps {
  content: VNode | string;
  placement?: OneOverlayPlacement;
  trigger?: OnePopoverTrigger;
  haspopup?: string;
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
