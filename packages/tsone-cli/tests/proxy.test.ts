import { afterEach, describe, expect, it } from 'bun:test';
import { createProxyHandler } from '../src/proxy';

const upstreams: Array<ReturnType<typeof Bun.serve>> = [];

afterEach(() => {
  upstreams.splice(0).forEach((server) => server.stop(true));
});

function startUpstream(
  fetch: (request: Request) => Response | Promise<Response>
): ReturnType<typeof Bun.serve> {
  const server = Bun.serve({
    hostname: '127.0.0.1',
    port: 0,
    fetch,
  });
  upstreams.push(server);
  return server;
}

describe('HTTP development proxy', () => {
  it('uses the longest matching prefix and forwards rewritten requests', async () => {
    const upstream = startUpstream(async (request) =>
      Response.json({
        method: request.method,
        url: new URL(request.url).pathname + new URL(request.url).search,
        body: await request.text(),
        host: request.headers.get('host'),
      })
    );
    const handler = createProxyHandler({
      '/api': `http://127.0.0.1:${upstream.port}`,
      '/api/admin': {
        target: `http://127.0.0.1:${upstream.port}`,
        changeOrigin: true,
        rewrite: (path) => path.replace('/api/admin', '/v1'),
      },
    });

    const response = await handler(
      new Request('http://client.test/api/admin/users?active=1', {
        method: 'POST',
        headers: { host: 'client.test', 'content-type': 'text/plain' },
        body: 'payload',
      })
    );

    expect(await response?.json()).toEqual({
      method: 'POST',
      url: '/v1/users?active=1',
      body: 'payload',
      host: `127.0.0.1:${upstream.port}`,
    });
  });

  it('returns undefined for unmatched paths without contacting an upstream', async () => {
    let requests = 0;
    const upstream = startUpstream(() => {
      requests += 1;
      return new Response('unexpected');
    });
    const handler = createProxyHandler({
      '/api': `http://127.0.0.1:${upstream.port}`,
    });

    expect(
      await handler(new Request('http://client.test/not-an-api-route'))
    ).toBeUndefined();
    expect(requests).toBe(0);
  });

  it('preserves the incoming Host header when changeOrigin is false', async () => {
    const upstream = startUpstream(
      (request) => new Response(request.headers.get('host') ?? '')
    );
    const handler = createProxyHandler({
      '/api': {
        target: `http://127.0.0.1:${upstream.port}`,
        changeOrigin: false,
      },
    });

    const response = await handler(
      new Request('http://client.test/api/users', {
        headers: { host: 'original.example.test' },
      })
    );

    expect(await response?.text()).toBe('original.example.test');
  });

  it('passes through upstream status, headers, and body', async () => {
    const upstream = startUpstream(
      () =>
        new Response('created upstream resource', {
          status: 201,
          headers: { 'x-upstream-status': 'created' },
        })
    );
    const handler = createProxyHandler({
      '/api': `http://127.0.0.1:${upstream.port}`,
    });

    const response = await handler(
      new Request('http://client.test/api/resources')
    );

    expect(response?.status).toBe(201);
    expect(response?.headers.get('x-upstream-status')).toBe('created');
    expect(await response?.text()).toBe('created upstream resource');
  });

  it('removes request headers named by Connection before forwarding', async () => {
    const upstream = startUpstream((request) =>
      Response.json({
        first: request.headers.get('x-request-only'),
        second: request.headers.get('x-request-second'),
        kept: request.headers.get('x-kept'),
      })
    );
    const handler = createProxyHandler({
      '/api': `http://127.0.0.1:${upstream.port}`,
    });

    const response = await handler(
      new Request('http://client.test/api/headers', {
        headers: {
          connection: 'x-request-only, X-Request-Second',
          'x-request-only': 'do-not-forward',
          'x-request-second': 'also-do-not-forward',
          'x-kept': 'forward-me',
        },
      })
    );

    expect(await response?.json()).toEqual({
      first: null,
      second: null,
      kept: 'forward-me',
    });
  });

  it('removes response headers named by Connection while preserving the response', async () => {
    const upstream = startUpstream(
      () =>
        new Response('accepted upstream response', {
          status: 202,
          headers: {
            connection: 'x-response-only, X-Response-Second',
            'x-response-only': 'do-not-forward',
            'x-response-second': 'also-do-not-forward',
            'x-kept': 'forward-me',
          },
        })
    );
    const handler = createProxyHandler({
      '/api': `http://127.0.0.1:${upstream.port}`,
    });

    const response = await handler(
      new Request('http://client.test/api/headers')
    );

    expect(response?.status).toBe(202);
    expect(response?.headers.get('connection')).toBeNull();
    expect(response?.headers.get('x-response-only')).toBeNull();
    expect(response?.headers.get('x-response-second')).toBeNull();
    expect(response?.headers.get('x-kept')).toBe('forward-me');
    expect(await response?.text()).toBe('accepted upstream response');
  });

  it('joins a target base path with the proxied path', async () => {
    const upstream = startUpstream(
      (request) => new Response(new URL(request.url).pathname)
    );
    const handler = createProxyHandler({
      '/api': `http://127.0.0.1:${upstream.port}/base`,
    });

    const response = await handler(
      new Request('http://client.test/api/resources')
    );

    expect(await response?.text()).toBe('/base/api/resources');
  });

  it('returns a fixed 502 response when the upstream cannot be reached', async () => {
    const handler = createProxyHandler({
      '/api': 'http://127.0.0.1:1',
    });

    const response = await handler(new Request('http://client.test/api/users'));

    expect(response?.status).toBe(502);
    expect(await response?.text()).toBe('Bad Gateway');
  });
});
