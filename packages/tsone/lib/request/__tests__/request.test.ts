import { expect, test } from 'bun:test';
import { InterceptorManager } from '../InterceptorManager';
import { RequestError, createRequest } from '..';

test('runs registered handlers in order and unregisters a handler', async () => {
  const manager = new InterceptorManager<number>();
  const events: string[] = [];
  const removeFirst = manager.use(async (value) => {
    events.push('first');
    return value + 1;
  });
  manager.use((value) => {
    events.push('second');
    return value * 2;
  });

  expect(await manager.run(1)).toBe(4);
  removeFirst();
  expect(await manager.run(1)).toBe(2);
  expect(events).toEqual(['first', 'second', 'second']);
});

test('applies async request and response interceptors around parsed JSON', async () => {
  const fetcher: typeof fetch = (input, init) => {
    expect(String(input)).toBe('https://api.example.test/users');
    expect(new Headers(init?.headers).get('Authorization')).toBe('Bearer token');
    return Promise.resolve(Response.json({ id: 1 }));
  };
  const client = createRequest({
    baseURL: 'https://api.example.test',
    fetch: fetcher,
  });
  client.interceptors.request.use(async (config) => ({
    ...config,
    headers: { ...config.headers, Authorization: 'Bearer token' },
  }));
  client.interceptors.response.use(async (value) => ({
    ...(value as { id: number }),
    name: 'Ada',
  }));

  await expect(
    client.get<{ id: number; name: string }>('/users')
  ).resolves.toEqual({ id: 1, name: 'Ada' });
});

test('merges default and per-request headers', async () => {
  const client = createRequest({
    headers: { Authorization: 'Bearer token' },
    fetch: (_input, init) => {
      const headers = new Headers(init?.headers);
      expect(headers.get('Authorization')).toBe('Bearer token');
      expect(headers.get('X-Request-ID')).toBe('request-1');
      return Promise.resolve(Response.json({ ok: true }));
    },
  });

  await expect(
    client.get('/status', { headers: { 'X-Request-ID': 'request-1' } })
  ).resolves.toEqual({ ok: true });
});

test('lets a failure interceptor recover a non-2xx response', async () => {
  const client = createRequest({
    fetch: () => Promise.resolve(new Response('missing', { status: 404 })),
  });
  client.interceptors.error.use((error) => {
    expect(error).toBeInstanceOf(RequestError);
    return { id: 0 };
  });

  await expect(client.get<{ id: number }>('/users/1')).resolves.toEqual({
    id: 0,
  });
});

test('parses each configured response type', async () => {
  const client = createRequest({
    fetch: () => Promise.resolve(new Response('hello')),
  });

  await expect(client.get('/value', { responseType: 'text' })).resolves.toBe(
    'hello'
  );
  await expect(client.get('/value', { responseType: 'blob' })).resolves.toEqual(
    expect.any(Blob)
  );
  await expect(
    client.get('/value', { responseType: 'arrayBuffer' })
  ).resolves.toEqual(expect.any(ArrayBuffer));
  await expect(
    client.get('/value', { responseType: 'response' })
  ).resolves.toEqual(expect.any(Response));
});

test('routes request, transport, and response interceptor failures to error interceptors', async () => {
  const requestFailure = createRequest({
    fetch: () => Promise.reject(new Error('must not fetch')),
  });
  requestFailure.interceptors.request.use(() => {
    throw new Error('request failure');
  });
  requestFailure.interceptors.error.use((error) =>
    `recovered: ${(error as Error).message}`
  );

  await expect(requestFailure.get('/value')).resolves.toBe(
    'recovered: request failure'
  );

  const transportFailure = createRequest({
    fetch: () => Promise.reject(new Error('transport failure')),
  });
  transportFailure.interceptors.error.use((error) =>
    `recovered: ${(error as Error).message}`
  );

  await expect(transportFailure.get('/value')).resolves.toBe(
    'recovered: transport failure'
  );

  const responseFailure = createRequest({
    fetch: () => Promise.resolve(Response.json({ id: 1 })),
  });
  responseFailure.interceptors.response.use(() => {
    throw new Error('response failure');
  });
  responseFailure.interceptors.error.use((error) =>
    `recovered: ${(error as Error).message}`
  );

  await expect(responseFailure.get('/value')).resolves.toBe(
    'recovered: response failure'
  );
});
