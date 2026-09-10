# BackOne

English | [简体中文](./README-zh.md)

A lightweight server-side framework written entirely in TypeScript, built on
Bun. Zero runtime dependencies — routing, middleware, request context, and
static file serving.

## Features

- TypeScript-first with zero runtime dependencies
- Bun-native: built on `Bun.serve`, streaming responses, zero-copy static files
- Segment radix-tree router with `:param` and `*` wildcard support
- Onion-model middleware chain with a typed per-request `Context`
- Lazy query / body parsing with caching
- Return a `Response` directly for zero-overhead passthrough
- Built-in middleware: `logger`, `cors`, `serveStatic`

## Requirements

- Bun >= 1.3

## Quick Start

```ts
import { createServer } from '@geektech/backone';

const app = createServer({ port: 3000 });

app.useLogger();
app.get('/users/:id', (ctx) => ctx.json({ id: ctx.params.id }));
app.post('/echo', async (ctx) => ctx.json(await ctx.bodyJson()));
app.serveStatic('/public', './public');

await app.listen();
```

## API

### createServer(options)

Create a server application. Options: `port` (default 3000, `0` for a random
port), `hostname` (default `0.0.0.0`), `development` (log error details and
expose messages in error responses), `maxRequestBodySize`, `idleTimeout`.

### Routing

`app.get / post / put / patch / delete / options / head / all(path, ...handlers)`
register handlers. Paths support static segments, `:param`, and `*` wildcards.
Multiple handlers on one route run in order.

### Context

Each request gets a `Context`:

- `ctx.params`, `ctx.query` — path / query parameters (query is lazily parsed)
- `ctx.bodyJson<T>()`, `ctx.bodyText()` — lazily parsed and cached body
- `ctx.json / text / html / stream / redirect / noContent` — response builders
- `ctx.status`, `ctx.set(name, value)`, `ctx.headers`
- `ctx.cookie(name)`, `ctx.setCookie(name, value, options)`

Handlers may return a `Response` directly (passthrough) or a primitive / object
which the framework serializes.

### Middleware

`app.use(...handlers)` installs middleware; the chain follows the onion model.
Built-in: `logger`, `cors`, `serveStatic` (also available as `app.useLogger()`,
`app.useCors()`, `app.serveStatic()`).

### Errors

Throw `HttpError` from `@geektech/backone` to control the status code; unknown
errors become `500 Internal Server Error` without leaking internals.

## Development

```sh
bun test          # run tests
bun run build     # build dist (Bun.build + type declarations)
bun run lint      # eslint
```

## Repository Structure

This package lives at `packages/backone` in the TSone monorepo
(`@geektech/tsone` is the frontend framework; `@geektech/backone` is its
server-side sibling). Publish checks follow the same discipline:
`bun test && bunx tsc --noEmit && bun run build && bun pm pack --dry-run`.

## License

MIT
