import type {
  OneOverlayContainer,
  OneOverlayFactory,
  OneOverlayHandle,
  OneOverlayHost,
  OneOverlayKind,
} from './types';

export class OneOverlayMountController<TOptions extends object> {
  private handle: OneOverlayHandle<TOptions> | undefined;

  public constructor(
    private readonly host: OneOverlayHost,
    private readonly kind: OneOverlayKind,
    private readonly factory: OneOverlayFactory<TOptions>,
    private readonly group?: string
  ) {}

  public open(container?: OneOverlayContainer): void {
    if (this.handle) {
      return;
    }
    this.handle = this.host.open({
      kind: this.kind,
      group: this.group,
      container,
      factory: this.factory,
    });
  }

  public update(options: Partial<TOptions>): void {
    this.handle?.update(options);
  }

  public close(): void {
    this.handle?.close();
    this.handle = undefined;
  }

  public isOpen(): boolean {
    return this.handle !== undefined;
  }
}
