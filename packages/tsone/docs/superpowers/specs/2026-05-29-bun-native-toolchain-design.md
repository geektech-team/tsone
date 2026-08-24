# Bun Native Toolchain Design

## Goal

TSone should use Bun as its only project runtime/toolchain layer. Development, tests, library build, package smoke checks, and docs serving should run through Bun commands. The published library remains standard ESM plus declarations so JavaScript consumers can still import it normally.

## Scope

In scope:

- Replace root `npm`/Vite/Vitest workflows with Bun scripts.
- Run tests with `bun:test`.
- Provide DOM globals for tests through a Bun preload using `happy-dom`.
- Build JavaScript bundles with `Bun.build`.
- Keep declaration generation through `tsc` because Bun does not emit `.d.ts`.
- Replace VitePress docs with a small Bun-native Markdown documentation server.
- Update smoke tests and docs to verify Bun install/import flows.

Out of scope:

- Changing TSone runtime APIs.
- Keeping Vite/Vitest as alternate root workflows.
- Adding SSR, JSX compilation, or a docs search index.

## Architecture

Root scripts become Bun-first: `bun test`, `bun run build`, `bun run dev`, `bun run docs`. `scripts/build.ts` cleans generated package output, runs `tsc` for declarations, then calls `Bun.build` for `lib/index.ts`, `lib/router/index.ts`, and `lib/style/index.ts`.

Tests import from `bun:test`. A `bunfig.toml` preload registers DOM globals through `tests/setup-dom.ts`. Package smoke tests build, pack, install, and type-check using Bun commands.

The docs system moves from `docs/package.json` plus VitePress to `scripts/docs.ts`. It reads Markdown files from `docs/src`, renders a simple HTML shell, and serves routes such as `/`, `/guide/getting-started`, and `/api/router` with `Bun.serve`.

## Validation

- `bun test`
- `bun run build`
- `bun run lint`
- `bun pm pack --dry-run` when available; otherwise `bun pm pack` into a temporary directory in smoke tests.
- Temporary Bun consumer project imports `tsone` and `tsone/router` and passes `tsc --noEmit`.
