export class OneOverlayEnvironmentError extends Error {
  public constructor(message = 'One overlay requires a browser document') {
    super(message);
    this.name = 'OneOverlayEnvironmentError';
  }
}

export class OneOverlayContainerError extends Error {
  public constructor(message: string) {
    super(message);
    this.name = 'OneOverlayContainerError';
  }
}

export class OneTooltipTriggerError extends Error {
  public constructor(
    message = 'OneTooltip requires one HTMLElement trigger child'
  ) {
    super(message);
    this.name = 'OneTooltipTriggerError';
  }
}
