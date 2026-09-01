export class OneThemeConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'OneThemeConfigError';
  }
}

export class OneThemeNotFoundError extends Error {
  constructor(themeName: string) {
    super(`One UI theme "${themeName}" is not registered.`);
    this.name = 'OneThemeNotFoundError';
  }
}

export class OneThemeEnvironmentError extends Error {
  constructor() {
    super('One UI themes require a browser document root.');
    this.name = 'OneThemeEnvironmentError';
  }
}
