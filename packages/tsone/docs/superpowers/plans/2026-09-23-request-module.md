# TSone Request Module Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a zero-dependency `@geektech/tsone/request` client with configurable JSON parsing and request, response, and failure interceptors.

**Architecture:** `RequestClient` owns the request pipeline and composes three generic `InterceptorManager` collections. The public factory creates isolated clients; each client delegates transport to browser `fetch`, parses a successful response according to `responseType`, and routes any pipeline failure through failure interceptors.

**Tech Stack:** TypeScript strict mode, browser Fetch API, Bun, `bun:test`.

**Spec:** `packages/tsone/docs/superpowers/specs/2026-09-23-request-module-design.md`

## Global Constraints

- Keep browser runtime code dependency-free; do not add a dependency, `./dev` export, or DOM test runtime dependency.
- Export the module only from `@geektech/tsone/request`; do not duplicate it in `@geektech/tsone`.
- Default `responseType` is `'json'`; supported types are `'json'`, `'text'`, `'blob'`, `'arrayBuffer'`, and `'response'`.
- Request, response-success, and response-failure interceptors run in registration order and may be asynchronous.
- Non-2xx responses and thrown transport/request/response failures enter response-failure interceptors.
- Do not add retry, timeout, cache, cancellation wrappers, or global shared configuration.
- Preserve unrelated changes in the current checkout. Do not commit unless the user approves a concrete commit plan.

---

## File Structure

- Create `packages/tsone/lib/request/types.ts`: public request configuration, response-type mapping, interceptor and client interfaces.
- Create `packages/tsone/lib/request/InterceptorManager.ts`: generic ordered registration and removal.
- Create `packages/tsone/lib/request/RequestError.ts`: structured non-2xx failure.
- Create `packages/tsone/lib/request/RequestClient.ts`: config normalization, fetch invocation, parse path, and interceptor pipeline.
- Create `packages/tsone/lib/request/index.ts`: public factory, default singleton, and type exports.
- Create `packages/tsone/lib/request/__tests__/request.test.ts`: isolated Fetch API behavior tests.
- Modify `packages/tsone/package.json`: publish the `./request` subpath.
- Modify `packages/tsone/scripts/build.ts`: emit the request subpath JavaScript entrypoint.
- Modify `packages/tsone/tests/package-smoke.test.ts`: assert packaged request files and type-consume the public subpath.
- Modify `packages/tsone/README.md` and `packages/tsone/README-zh.md`: add compact request/interceptor usage.
- Modify `packages/tsone/docs/app/content/en/api.ts` and `packages/tsone/docs/app/content/zh/api.ts`: add typed Request API pages.

### Task 1: Define the public type contract and interceptor registry

**Files:**
- Create: `packages/tsone/lib/request/types.ts`
- Create: `packages/tsone/lib/request/InterceptorManager.ts`
- Create: `packages/tsone/lib/request/__tests__/request.test.ts`

**Interfaces:**
- Produces `ResponseType`, `RequestConfig`, `ResponseTypeResult`, `RequestInterceptor`, `ResponseInterceptor`, `ResponseErrorInterceptor`, and `InterceptorManager<T>`.
- Produces `InterceptorManager<T>.use(handler: T): () => void` and `.run(value: T): Promise<T>`.

- [ ] **Step 1: Write the failing registry-order test**

```ts
import { expect, test } from 'bun:test';
import { InterceptorManager } from '../InterceptorManager';

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
```

- [ ] **Step 2: Run the focused test to verify it fails because the module is absent**

Run: `bun test packages/tsone/lib/request/__tests__/request.test.ts`

Expected: FAIL with a module-resolution error for `../InterceptorManager`.

- [ ] **Step 3: Add the minimal generic registry and public type declarations**

```ts
export class InterceptorManager<T> {
  private readonly handlers = new Set<(value: T) => T | Promise<T>>();

  use(handler: (value: T) => T | Promise<T>): () => void {
    this.handlers.add(handler);
    return () => this.handlers.delete(handler);
  }

  async run(value: T): Promise<T> {
    let result = value;
    for (const handler of this.handlers) result = await handler(result);
    return result;
  }
}
```

Define the request interfaces in `types.ts` using `RequestInit` composition, and avoid `any`; use `unknown` for parsed payloads and generic response-result mapping.

- [ ] **Step 4: Run the focused test to verify it passes**

Run: `bun test packages/tsone/lib/request/__tests__/request.test.ts`

Expected: PASS for the registration-order and unregister behavior.

### Task 2: Implement request execution, success parsing, and error recovery

**Files:**
- Create: `packages/tsone/lib/request/RequestError.ts`
- Create: `packages/tsone/lib/request/RequestClient.ts`
- Modify: `packages/tsone/lib/request/__tests__/request.test.ts`

**Interfaces:**
- Consumes `RequestConfig`, `ResponseTypeResult`, and generic manager behavior from Task 1.
- Produces `RequestClient.request<T, TType extends ResponseType = 'json'>(config): Promise<ResponseTypeResult<T, TType>>` and method shortcuts.
- Produces `RequestError` with readonly `config` and optional `response` fields.

- [ ] **Step 1: Write failing pipeline tests**

```ts
test('applies async request and response interceptors around parsed JSON', async () => {
  const fetcher = (input: RequestInfo | URL, init?: RequestInit) => {
    expect(String(input)).toBe('https://api.example.test/users');
    expect(new Headers(init?.headers).get('Authorization')).toBe('Bearer token');
    return Promise.resolve(Response.json({ id: 1 }));
  };
  const client = createRequest({ baseURL: 'https://api.example.test', fetch: fetcher });
  client.interceptors.request.use(async (config) => ({
    ...config,
    headers: { ...config.headers, Authorization: 'Bearer token' },
  }));
  client.interceptors.response.use(async (value) => ({ ...value, name: 'Ada' }));

  await expect(client.get<{ id: number; name: string }>('/users')).resolves.toEqual({
    id: 1,
    name: 'Ada',
  });
});

test('lets a failure interceptor recover a non-2xx response', async () => {
  const client = createRequest({ fetch: () => Promise.resolve(new Response('missing', { status: 404 })) });
  client.interceptors.error.use((error) => {
    expect(error).toBeInstanceOf(RequestError);
    return { id: 0 };
  });

  await expect(client.get<{ id: number }>('/users/1')).resolves.toEqual({ id: 0 });
});
```

- [ ] **Step 2: Run the focused test to verify it fails because `createRequest` is not exported**

Run: `bun test packages/tsone/lib/request/__tests__/request.test.ts`

Expected: FAIL with `createRequest` or `RequestClient` missing.

- [ ] **Step 3: Implement the minimal pipeline**

```ts
const config = await this.interceptors.request.run(mergeConfig(this.defaults, input));
try {
  const response = await this.fetch(config.url, toRequestInit(config));
  if (!response.ok) throw new RequestError(config, response);
  const value = await parseResponse<T, TType>(response, config.responseType ?? 'json');
  return await this.interceptors.response.run(value);
} catch (error) {
  return await this.interceptors.error.run(error);
}
```

Use `new URL(url, baseURL)` only when `baseURL` exists; preserve an absolute URL otherwise. Make `get`, `post`, `put`, `patch`, and `delete` delegate to `request` with the matching method. Keep parsing in a dedicated private helper and make `'response'` return the unconsumed response.

- [ ] **Step 4: Run the focused tests to verify they pass**

Run: `bun test packages/tsone/lib/request/__tests__/request.test.ts`

Expected: PASS for request mutation, success transformation, non-2xx conversion, and recovery.

### Task 3: Cover response types and thrown failures

**Files:**
- Modify: `packages/tsone/lib/request/__tests__/request.test.ts`
- Modify: `packages/tsone/lib/request/RequestClient.ts`

**Interfaces:**
- Consumes `RequestClient` and `RequestError` from Task 2.
- Verifies all declared `responseType` values and that request, transport, and success-interceptor throws enter `interceptors.error`.

- [ ] **Step 1: Write failing response-type and failure-source tests**

```ts
test.each([
  ['text', 'hello'],
  ['response', Response],
] as const)('returns the requested %s response type', async (responseType, expected) => {
  const client = createRequest({ fetch: () => Promise.resolve(new Response('hello')) });
  const result = await client.get('/value', { responseType });
  expect(responseType === 'response' ? result : String(result)).toEqual(
    responseType === 'response' ? expect.any(expected) : expected
  );
});

test('passes a request-interceptor failure to error interceptors', async () => {
  const client = createRequest({ fetch: () => Promise.reject(new Error('must not fetch')) });
  client.interceptors.request.use(() => { throw new Error('blocked'); });
  client.interceptors.error.use((error) => `recovered: ${(error as Error).message}`);
  await expect(client.get('/value')).resolves.toBe('recovered: blocked');
});
```

Add separate fixtures for JSON, `Blob`, and `ArrayBuffer` so every response type in the public union is asserted.

- [ ] **Step 2: Run the focused test to verify it fails on unsupported response types or failure routing**

Run: `bun test packages/tsone/lib/request/__tests__/request.test.ts`

Expected: FAIL on the first unsupported type or on an unhandled request-interceptor throw.

- [ ] **Step 3: Complete parsing and error routing without expanding scope**

```ts
switch (responseType) {
  case 'text': return await response.text();
  case 'blob': return await response.blob();
  case 'arrayBuffer': return await response.arrayBuffer();
  case 'response': return response;
  default: return await response.json() as T;
}
```

Ensure the outer failure path covers configuration merge, request interceptors, fetch, status validation, parsing, and response-success interceptors. Do not catch errors produced by a failure interceptor itself.

- [ ] **Step 4: Run the focused suite to verify it passes**

Run: `bun test packages/tsone/lib/request/__tests__/request.test.ts`

Expected: PASS for all five response types and each failure source.

### Task 4: Publish the request entry point and guard the package contract

**Files:**
- Create: `packages/tsone/lib/request/index.ts`
- Modify: `packages/tsone/package.json`
- Modify: `packages/tsone/scripts/build.ts`
- Modify: `packages/tsone/tests/package-smoke.test.ts`

**Interfaces:**
- Produces `@geektech/tsone/request` with `createRequest`, `request`, `RequestClient`, `RequestError`, and public types.
- Consumes request implementation from Tasks 1-3.

- [ ] **Step 1: Add a failing package smoke assertion**

```ts
expect(packageFileList).toEqual(expect.arrayContaining([
  'dist/request/index.js',
  'dist/request/index.d.ts',
]));

// In bun-consumer.ts
import { createRequest, request } from '@geektech/tsone/request';
request.interceptors.request.use((config) => config);
const typedClient = createRequest({ baseURL: 'https://api.example.test' });
void typedClient;
```

- [ ] **Step 2: Run the package smoke test to verify it fails due to the absent export/build entrypoint**

Run: `bun test packages/tsone/tests/package-smoke.test.ts`

Expected: FAIL because `dist/request/index.js` is missing or the consumer cannot resolve the subpath.

- [ ] **Step 3: Wire package exports and build entrypoints**

```json
"./request": {
  "import": "./dist/request/index.js",
  "types": "./dist/request/index.d.ts"
}
```

Add `./lib/request/index.ts` to Bun build entrypoints. Export values and `export type` declarations from the request entrypoint; construct the default `request` with `createRequest()`.

- [ ] **Step 4: Run build and package smoke verification**

Run: `bun run build --cwd packages/tsone && bun test packages/tsone/tests/package-smoke.test.ts`

Expected: build succeeds and the packed temporary consumer compiles and imports the request subpath.

### Task 5: Document the published API in both languages

**Files:**
- Modify: `packages/tsone/README.md`
- Modify: `packages/tsone/README-zh.md`
- Modify: `packages/tsone/docs/app/content/en/api.ts`
- Modify: `packages/tsone/docs/app/content/zh/api.ts`
- Test: `packages/tsone/tests/public-api-docs.test.ts`
- Test: `packages/tsone/tests/docs-content.test.ts`

**Interfaces:**
- Consumes the exact public export names and response-type union from Task 4.
- Produces bilingual, executable-looking API documentation for client construction, request interceptor registration, success transformation, error recovery, and `responseType`.

- [ ] **Step 1: Add failing documentation-contract assertions**

```ts
expect(readme).toContain("from '@geektech/tsone/request'");
expect(readmeZh).toContain("from '@geektech/tsone/request'");
expect(enSourcePages.some((page) => page.path === '/api/request/')).toBe(true);
expect(zhSourcePages.some((page) => page.path === '/api/request/')).toBe(true);
```

- [ ] **Step 2: Run documentation tests to verify they fail**

Run: `bun test packages/tsone/tests/public-api-docs.test.ts packages/tsone/tests/docs-content.test.ts`

Expected: FAIL because neither README nor docs pages mention the request subpath.

- [ ] **Step 3: Add focused bilingual API content**

Include this accurate shape in both READMEs and typed docs, translating prose rather than symbols:

```ts
const api = createRequest({ baseURL: '/api' });
api.interceptors.request.use((config) => ({
  ...config,
  headers: { ...config.headers, Authorization: 'Bearer token' },
}));
api.interceptors.error.use(() => ({ offline: true }));
const text = await api.get('/health', { responseType: 'text' });
```

State that normal calls parse JSON, status failures reject unless recovered, and `responseType: 'response'` keeps the raw response.

- [ ] **Step 4: Run documentation tests to verify they pass**

Run: `bun test packages/tsone/tests/public-api-docs.test.ts packages/tsone/tests/docs-content.test.ts`

Expected: PASS with the new subpath and typed pages accepted.

### Task 6: Run release-oriented regression checks

**Files:**
- Verify only: request module, package metadata, documentation, and tests from Tasks 1-5.

**Interfaces:**
- Verifies the final public package, source type declarations, and documentation remain internally consistent.

- [ ] **Step 1: Run the targeted behavioral and documentation suites**

Run: `bun test packages/tsone/lib/request/__tests__/request.test.ts packages/tsone/tests/public-api-docs.test.ts packages/tsone/tests/docs-content.test.ts packages/tsone/tests/package-smoke.test.ts`

Expected: PASS.

- [ ] **Step 2: Type-check and build the package**

Run: `bunx tsc --noEmit && bun run build --cwd packages/tsone`

Expected: both commands exit 0.

- [ ] **Step 3: Check the packed package contents and diff hygiene**

Run: `bun pm pack --cwd packages/tsone --dry-run && git diff --check && git status --short`

Expected: the dry run includes `dist/request/index.js` and `dist/request/index.d.ts`; diff check exits 0; status lists only intended tracked changes plus generated ignored output.
