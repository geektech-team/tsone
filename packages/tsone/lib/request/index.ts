import { RequestClient } from './RequestClient';
import type { RequestDefaults } from './types';

export { RequestClient } from './RequestClient';
export { RequestError } from './RequestError';
export type {
  RequestConfig,
  RequestDefaults,
  RequestInterceptor,
  ResponseErrorInterceptor,
  ResponseInterceptor,
  ResponseType,
  ResponseTypeResult,
} from './types';

export function createRequest(defaults: RequestDefaults = {}): RequestClient {
  return new RequestClient(defaults);
}

export const request = createRequest();
