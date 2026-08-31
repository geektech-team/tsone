import type { VNode } from '@geektech/tsone';
import type { OneOverlayContainer } from '../overlay';

export interface OneDialogProps {
  open?: boolean;
  defaultOpen?: boolean;
  title?: string;
  description?: string;
  closeOnOverlay?: boolean;
  closeOnEscape?: boolean;
  confirmLoading?: boolean;
  container?: OneOverlayContainer;
  children?: Array<VNode | string>;
}

export type OneDialogCloseReason = 'confirm' | 'cancel' | 'overlay' | 'escape';
