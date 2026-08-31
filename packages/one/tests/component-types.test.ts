import { describe, expect, it } from 'bun:test';
import {
  OneAlert,
  OneButton,
  OneCard,
  OneDialog,
  OneInput,
  OneMessage,
  OneTooltip,
  oneDialog,
  oneMessage,
  type OneAlertProps,
  type OneButtonProps,
  type OneCardProps,
  type OneDialogProps,
  type OneInputProps,
  type OneMessageOptions,
  type OneMessagePlacement,
  type OneOverlayPlacement,
  type OneTooltipProps,
} from '../lib';

const buttonProps: OneButtonProps = { variant: 'danger', size: 'lg' };
const inputProps: OneInputProps = { value: 'one', invalid: true };
const cardProps: OneCardProps = { title: 'One', children: ['Body'] };
const alertProps: OneAlertProps = { title: 'Info', variant: 'info' };
const messageOptions: OneMessageOptions = { content: 'Saved', duration: 0 };
const dialogProps: OneDialogProps = { title: 'Confirm', defaultOpen: false };
const tooltipProps: OneTooltipProps = {
  content: 'Help',
  placement: 'bottom-end',
  children: [{ tag: 'button', children: ['?'] }],
};
const messagePlacement: OneMessagePlacement = 'top-end';
const overlayPlacement: OneOverlayPlacement = 'right-start';

// @ts-expect-error unsupported variant
const invalidButton: OneButtonProps = { variant: 'ghost' };
// @ts-expect-error unsupported size
const invalidInput: OneInputProps = { size: 'xl' };
// @ts-expect-error unsupported feedback variant
const invalidAlert: OneAlertProps = { variant: 'neutral' };
// @ts-expect-error unsupported message placement
const invalidMessagePlacement: OneMessagePlacement = 'left';
const invalidTooltipTrigger: OneTooltipProps = {
  content: 'Help',
  // @ts-expect-error unsupported tooltip trigger
  trigger: 'hover',
};
// @ts-expect-error unsupported overlay placement
const invalidOverlayPlacement: OneOverlayPlacement = 'center';

describe('public component types', () => {
  it('exports constructors and approved prop shapes', () => {
    expect(typeof OneButton).toBe('function');
    expect(typeof OneInput).toBe('function');
    expect(typeof OneCard).toBe('function');
    expect(typeof OneAlert).toBe('function');
    expect(typeof OneMessage).toBe('function');
    expect(typeof OneDialog).toBe('function');
    expect(typeof OneTooltip).toBe('function');
    expect(typeof oneMessage.success).toBe('function');
    expect(typeof oneDialog.confirm).toBe('function');
    expect(buttonProps.variant).toBe('danger');
    expect(inputProps.value).toBe('one');
    expect(cardProps.title).toBe('One');
    expect(new OneAlert(alertProps)).toBeInstanceOf(OneAlert);
    expect(new OneMessage(messageOptions)).toBeInstanceOf(OneMessage);
    expect(new OneDialog(dialogProps)).toBeInstanceOf(OneDialog);
    expect(new OneTooltip(tooltipProps)).toBeInstanceOf(OneTooltip);
    expect(messagePlacement).toBe('top-end');
    expect(overlayPlacement).toBe('right-start');
    void invalidButton;
    void invalidInput;
    void invalidAlert;
    void invalidMessagePlacement;
    void invalidTooltipTrigger;
    void invalidOverlayPlacement;
  });
});
