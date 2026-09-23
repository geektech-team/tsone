import { InterceptorManager } from './InterceptorManager';
import { RequestError } from './RequestError';
import type {
  RequestConfig,
  RequestDefaults,
  ResponseType,
  ResponseTypeResult,
} from './types';

type RequestOptions = Omit<RequestConfig, 'url' | 'method'>;
type RequestMethod = 'DELETE' | 'GET' | 'PATCH' | 'POST' | 'PUT';

function mergeHeaders(
  defaults?: HeadersInit,
  overrides?: HeadersInit
): Headers {
  const headers = new Headers(defaults);
  new Headers(overrides).forEach((value, key) => headers.set(key, value));
  return headers;
}

function mergeConfig(
  defaults: Omit<RequestDefaults, 'fetch'>,
  input: RequestConfig
): RequestConfig {
  return {
    ...defaults,
    ...input,
    headers: mergeHeaders(defaults.headers, input.headers),
  };
}

function resolveUrl(baseURL: string | undefined, url: string): string {
  if (!baseURL || /^[a-z][a-z\d+.-]*:/iu.test(url)) return url;
  if (/^[a-z][a-z\d+.-]*:/iu.test(baseURL)) return new URL(url, baseURL).toString();
  return `${baseURL.replace(/\/$/u, '')}/${url.replace(/^\//u, '')}`;
}

function toRequestInit(config: RequestConfig): RequestInit {
  const { baseURL: _baseURL, responseType: _responseType, url: _url, ...init } =
    config;
  return init;
}

async function parseResponse<T, TType extends ResponseType>(
  response: Response,
  responseType: TType
): Promise<ResponseTypeResult<T, TType>> {
  switch (responseType) {
    case 'text':
      return (await response.text()) as ResponseTypeResult<T, TType>;
    case 'blob':
      return (await response.blob()) as ResponseTypeResult<T, TType>;
    case 'arrayBuffer':
      return (await response.arrayBuffer()) as ResponseTypeResult<T, TType>;
    case 'response':
      return response as ResponseTypeResult<T, TType>;
    default:
      return (await response.json()) as ResponseTypeResult<T, TType>;
  }
}

export class RequestClient {
  readonly interceptors = {
    request: new InterceptorManager<RequestConfig>(),
    response: new InterceptorManager<unknown>(),
    error: new InterceptorManager<unknown>(),
  };

  private readonly defaults: Omit<RequestDefaults, 'fetch'>;
  private readonly fetcher: typeof fetch;

  constructor(defaults: RequestDefaults = {}) {
    const { fetch: customFetch, ...config } = defaults;
    this.defaults = config;
    this.fetcher = customFetch ?? fetch;
  }

  request<T, TType extends ResponseType = 'json'>(
    input: RequestConfig & { responseType?: TType }
  ): Promise<ResponseTypeResult<T, TType>> {
    return this.execute<T, TType>(input);
  }

  get<T, TType extends ResponseType = 'json'>(
    url: string,
    options: RequestOptions & { responseType?: TType } = {}
  ): Promise<ResponseTypeResult<T, TType>> {
    return this.withMethod<T, TType>('GET', url, options);
  }

  post<T, TType extends ResponseType = 'json'>(
    url: string,
    options: RequestOptions & { responseType?: TType } = {}
  ): Promise<ResponseTypeResult<T, TType>> {
    return this.withMethod<T, TType>('POST', url, options);
  }

  put<T, TType extends ResponseType = 'json'>(
    url: string,
    options: RequestOptions & { responseType?: TType } = {}
  ): Promise<ResponseTypeResult<T, TType>> {
    return this.withMethod<T, TType>('PUT', url, options);
  }

  patch<T, TType extends ResponseType = 'json'>(
    url: string,
    options: RequestOptions & { responseType?: TType } = {}
  ): Promise<ResponseTypeResult<T, TType>> {
    return this.withMethod<T, TType>('PATCH', url, options);
  }

  delete<T, TType extends ResponseType = 'json'>(
    url: string,
    options: RequestOptions & { responseType?: TType } = {}
  ): Promise<ResponseTypeResult<T, TType>> {
    return this.withMethod<T, TType>('DELETE', url, options);
  }

  private async withMethod<T, TType extends ResponseType>(
    method: RequestMethod,
    url: string,
    options: RequestOptions & { responseType?: TType }
  ): Promise<ResponseTypeResult<T, TType>> {
    return await this.execute<T, TType>({ ...options, method, url });
  }

  private async execute<T, TType extends ResponseType>(
    input: RequestConfig & { responseType?: TType }
  ): Promise<ResponseTypeResult<T, TType>> {
    try {
      const config = await this.interceptors.request.run(
        mergeConfig(this.defaults, input)
      );
      const response = await this.fetcher(
        resolveUrl(config.baseURL, config.url),
        toRequestInit(config)
      );
      if (!response.ok) throw new RequestError(config, response);
      const value = await parseResponse<T, TType>(
        response,
        (config.responseType ?? 'json') as TType
      );
      return (await this.interceptors.response.run(value)) as ResponseTypeResult<
        T,
        TType
      >;
    } catch (error) {
      return (await this.interceptors.error.run(error)) as ResponseTypeResult<
        T,
        TType
      >;
    }
  }
}
