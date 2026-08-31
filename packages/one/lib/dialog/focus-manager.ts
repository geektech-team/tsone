const FOCUSABLE_SELECTOR = [
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  'a[href]',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

export class OneDialogFocusManager {
  private dialog: HTMLElement | undefined;
  private previousFocus: HTMLElement | undefined;
  private isTop: () => boolean = () => true;
  private targetDocument: Document | undefined;

  public activate(
    dialog: HTMLElement,
    isTop: () => boolean = () => true
  ): void {
    this.deactivate(false);
    this.dialog = dialog;
    this.targetDocument = dialog.ownerDocument;
    this.isTop = isTop;
    const active = this.targetDocument.activeElement;
    this.previousFocus = active instanceof HTMLElement ? active : undefined;
    this.targetDocument.addEventListener('keydown', this.handleKeydown);
    (this.focusableElements()[0] ?? dialog).focus();
  }

  public deactivate(restoreFocus = true): void {
    this.targetDocument?.removeEventListener('keydown', this.handleKeydown);
    if (restoreFocus && this.previousFocus?.isConnected) {
      this.previousFocus.focus();
    }
    this.dialog = undefined;
    this.previousFocus = undefined;
    this.targetDocument = undefined;
    this.isTop = () => true;
  }

  private readonly handleKeydown = (event: KeyboardEvent): void => {
    if (event.key !== 'Tab' || !this.dialog || !this.isTop()) {
      return;
    }
    const focusable = this.focusableElements();
    if (focusable.length === 0) {
      event.preventDefault();
      this.dialog.focus();
      return;
    }
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const active = this.targetDocument?.activeElement ?? null;
    if (event.shiftKey && (active === first || !this.dialog.contains(active))) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && active === last) {
      event.preventDefault();
      first.focus();
    }
  };

  private focusableElements(): HTMLElement[] {
    if (!this.dialog) {
      return [];
    }
    return [
      ...this.dialog.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
    ].filter(
      (element) =>
        element.getAttribute('aria-hidden') !== 'true' &&
        !element.hasAttribute('hidden')
    );
  }
}
