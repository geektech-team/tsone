# TSone Monorepo Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convert the current TSone single-package repository into a Bun workspace with the existing package under `packages/tsone/`.

**Architecture:** The root becomes a private workspace and command proxy. `packages/tsone` remains the publishable `@geektech/tsone` package, keeping its existing source, scripts, tests, docs app, examples, README, LICENSE, exports, and publishing metadata.

**Tech Stack:** Bun 1.3.x workspaces, TypeScript 5.x, bun:test, Happy DOM, existing TSone runtime.

## Global Constraints

- Keep the project Bun-first; do not reintroduce npm, pnpm, Vite, or Vitest as the main workflow.
- Runtime code keeps zero external runtime dependencies.
- Public display name remains `TSone`, package name remains `@geektech/tsone`, version remains `0.0.1`.
- `bun run docs` continues to start the documentation preview server.
- Generated outputs such as `dist`, `docs/dist`, caches, and `node_modules` remain untracked.
- Root commands `bun test`, `bun run build`, `bun run dev`, `bun run docs`, and `bun run docs:build` remain usable from the repository root.

---

### Task 1: Monorepo Contract Tests

**Files:**

- Modify: `tests/package-smoke.test.ts`
- Modify: `tests/public-api-docs.test.ts`
- Modify: `tests/brand-consistency.test.ts`
- Modify: `tests/repository-hygiene.test.ts`
- Modify: `tests/docs-build.test.ts`
- Modify: `tests/docs-server.test.ts`
- Modify: `tests/example-entry.test.ts`
- Modify: `tests/component-types.test.ts`

**Interfaces:**

- Produces: test helpers that derive `repoRoot` and `packageRoot` from `import.meta.dir`, not from `process.cwd()`.
- Produces: tests that expect `packages/tsone/package.json` to be the publishable package manifest.

- [ ] **Step 1: Update tests to describe the new package root**

Replace direct `process.cwd()` package assumptions with explicit roots:

```typescript
const repoRoot = join(import.meta.dir, '..', '..', '..');
const packageRoot = join(repoRoot, 'packages', 'tsone');
```

For tests still located inside `packages/tsone/tests` after migration, use:

```typescript
const packageRoot = join(import.meta.dir, '..');
const repoRoot = join(packageRoot, '..', '..');
```

Update test imports from `../lib`, `../scripts`, `../docs`, and `../examples` to continue working after tests move with the package.

- [ ] **Step 2: Add root workspace assertions**

In `tests/package-smoke.test.ts`, assert the root manifest is private and declares the workspace:

```typescript
const rootPackageJson = JSON.parse(
  readFileSync(join(repoRoot, 'package.json'), 'utf8')
) as { private?: boolean; workspaces?: string[] };

expect(rootPackageJson.private).toBe(true);
expect(rootPackageJson.workspaces).toEqual(['packages/*']);
```

Also read package metadata from `join(packageRoot, 'package.json')`.

- [ ] **Step 3: Run focused contract tests and confirm RED**

Run:

```bash
bun test tests/package-smoke.test.ts tests/brand-consistency.test.ts tests/repository-hygiene.test.ts
```

Expected: FAIL because `packages/tsone/package.json` and root workspace metadata do not exist yet.

### Task 2: Workspace And Package Relocation

**Files:**

- Create: `packages/tsone/`
- Modify: `package.json`
- Modify: `tsconfig.json`
- Modify: `bunfig.toml`
- Modify: `.gitignore`
- Move into `packages/tsone/`: `lib/`, `scripts/`, `tests/`, `examples/`, `docs/`, `skills/`, `README.md`, `LICENSE`, `tsconfig.build.json`
- Keep package manifest at: `packages/tsone/package.json`

**Interfaces:**

- Consumes: Task 1 tests expecting `packages/tsone`.
- Produces: a root private workspace package and a publishable TSone workspace package.

- [ ] **Step 1: Move the current package files**

Run:

```bash
mkdir -p packages/tsone
git mv lib scripts tests examples docs skills README.md LICENSE tsconfig.build.json packages/tsone/
git mv bunfig.toml packages/tsone/bunfig.toml
git mv package.json packages/tsone/package.json
```

- [ ] **Step 2: Create root workspace manifest**

Create root `package.json`:

```json
{
  "name": "tsone-monorepo",
  "private": true,
  "type": "module",
  "workspaces": ["packages/*"],
  "scripts": {
    "dev": "bun run --cwd packages/tsone dev",
    "docs": "bun run --cwd packages/tsone docs",
    "build": "bun run --cwd packages/tsone build",
    "build:types": "bun run --cwd packages/tsone build:types",
    "lint": "bun run --cwd packages/tsone lint",
    "format": "prettier --write . --ignore-path .gitignore",
    "test": "bun test",
    "docs:build": "bun run --cwd packages/tsone docs:build",
    "preview": "bun run --cwd packages/tsone preview"
  },
  "devDependencies": {
    "@types/bun": "^1.3.14",
    "@typescript-eslint/eslint-plugin": "^6.14.0",
    "@typescript-eslint/parser": "^6.14.0",
    "eslint": "^8.55.0",
    "eslint-config-prettier": "^10.1.8",
    "eslint-plugin-prettier": "^5.5.5",
    "happy-dom": "^20.9.0",
    "prettier": "^3.1.1",
    "typescript": "^5.3.3"
  },
  "engines": {
    "bun": ">=1.3.0"
  }
}
```

- [ ] **Step 3: Keep package manifest publish-only**

Remove dev-only dependencies from `packages/tsone/package.json` only after root dev dependencies exist. Keep package fields for `name`, `version`, `description`, `type`, `main`, `module`, `types`, `exports`, `scripts`, `keywords`, `author`, `license`, `files`, and `publishConfig`.

- [ ] **Step 4: Add root TypeScript and Bun test config**

Root `tsconfig.json` should type-check package runtime, docs app, examples, and scripts:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "module": "ESNext",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "skipLibCheck": true,
    "moduleResolution": "Bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": [
    "packages/tsone/lib",
    "packages/tsone/examples",
    "packages/tsone/docs/app",
    "packages/tsone/scripts"
  ],
  "exclude": [
    "node_modules",
    "packages/*/node_modules",
    "packages/*/dist",
    "packages/*/docs/dist",
    "coverage"
  ]
}
```

Root `bunfig.toml` should preload package tests for root `bun test`:

```toml
[test]
preload = ["./packages/tsone/tests/setup-dom.ts"]
```

- [ ] **Step 5: Update ignores**

Keep root generated artifacts ignored:

```gitignore
node_modules/
dist/
packages/*/dist/
packages/*/node_modules/
packages/*/docs/node_modules/
packages/*/docs/dist/
.pnpm-store/
.DS_Store
coverage/
*.log
.env*
.worktrees
worktrees
```

- [ ] **Step 6: Run focused tests and confirm GREEN**

Run:

```bash
bun test packages/tsone/tests/package-smoke.test.ts packages/tsone/tests/brand-consistency.test.ts packages/tsone/tests/repository-hygiene.test.ts
```

Expected: PASS.

### Task 3: Path Fixes, Docs, And Verification

**Files:**

- Modify: `AGENTS.md`
- Modify: `packages/tsone/README.md`
- Modify: `packages/tsone/docs/app/content/contributing.ts`
- Modify: any package test or script with stale root-relative paths.
- Modify: `bun.lock` through `bun install` if Bun updates workspace metadata.

**Interfaces:**

- Consumes: packageRoot/repoRoot helpers from Task 1 and workspace structure from Task 2.
- Produces: root and package commands that both work with the new layout.

- [ ] **Step 1: Update user-facing paths**

Replace root package paths in docs and AGENTS with `packages/tsone/...` where the path points to package internals. Keep root commands documented as root commands.

- [ ] **Step 2: Update stale test commands**

Commands embedded in tests that spawn scripts from package cwd should use package-relative paths:

```typescript
cmd: ['bun', 'scripts/docs.ts', '--build', '--port', 'invalid'],
cwd: packageRoot,
```

Root-level tests that verify root behavior should use `cwd: repoRoot`.

- [ ] **Step 3: Refresh workspace install metadata**

Run:

```bash
bun install
```

Expected: workspace install succeeds and `bun.lock` reflects the monorepo shape.

- [ ] **Step 4: Run verification**

Run:

```bash
bun test
bunx tsc --noEmit
bun run build
bun run docs:build
bun pm pack --cwd packages/tsone --destination /tmp/tsone-pack-check --ignore-scripts --quiet
```

Expected: all commands exit 0; generated `packages/tsone/dist` and `packages/tsone/docs/dist` are ignored.

- [ ] **Step 5: Check worktree hygiene**

Run:

```bash
git status --short
git check-ignore packages/tsone/dist/index.js packages/tsone/docs/dist/index.html
```

Expected: only intentional source/config/doc/test/lock changes are listed; generated files are ignored.
