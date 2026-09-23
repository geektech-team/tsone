export type ResponseType =
  | 'json'
  | 'text'
  | 'blob'
  | 'arrayBuffer'
  | 'response';

export type ResponseTypeResult<T, TType extends ResponseType> =
  TType extends 'json'
    ? T
    : TType extends 'text'
      ? string
      : TType extends 'blob'
        ? Blob
        : TType extends 'arrayBuffer'
          ? ArrayBuffer
          : Response;

export interface RequestConfig extends RequestInit {
  url: string;
  baseURL?: string;
  responseType?: ResponseType;
}

export interface RequestDefaults extends Omit<RequestConfig, 'url'> {
  fetch?: typeof fetch;
}

export type RequestInterceptor = (
  config: RequestConfig
) => RequestConfig | Promise<RequestConfig>;

export type ResponseInterceptor = <T>(value: T) => T | Promise<T>;

export type ResponseErrorInterceptor = (
  error: unknown
) => unknown | Promise<unknown>;

export interface RequestInterceptors {
  request: {
    use(interceptor: RequestInterceptor): () => void;
  };
  response: {
    use(interceptor: ResponseInterceptor): () => void;
  };
  error: {
    use(interceptor: ResponseErrorInterceptor): () => void;
  };
}
