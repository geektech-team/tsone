import type { RequestConfig } from './types';

export class RequestError extends Error {
  readonly config: RequestConfig;
  readonly response?: Response;

  constructor(config: RequestConfig, response?: Response) {
    super(
      response
        ? `Request failed with status ${response.status}`
        : 'Request failed'
    );
    this.name = 'RequestError';
    this.config = config;
    this.response = response;
  }
}
