import type { OneFeedbackVariant, OneOverlayContainer } from '../overlay';

export type OneMessagePlacement =
  | 'top-start'
  | 'top'
  | 'top-end'
  | 'bottom-start'
  | 'bottom'
  | 'bottom-end';

export interface OneMessageOptions {
  content: string;
  variant?: OneFeedbackVariant;
  duration?: number;
  closable?: boolean;
  placement?: OneMessagePlacement;
  container?: OneOverlayContainer;
}

export interface OneMessageProps extends OneMessageOptions {
  open?: boolean;
  defaultOpen?: boolean;
}
