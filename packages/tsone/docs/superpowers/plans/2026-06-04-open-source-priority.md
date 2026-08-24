# Open Source Priority Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bring TSone closer to a mature open-source frontend framework by cleaning repository hygiene, stabilizing public API documentation, tightening core types, and splitting the riskiest oversized modules.

**Architecture:** Keep the existing pure TypeScript and Bun-native direction. Preserve the object-oriented framework core, but move public contracts into explicit type modules and split renderer/router internals by responsibility so future behavior changes can be tested in isolation.

**Tech Stack:** Bun, TypeScript, Bun test, Happy DOM, ESLint, Prettier.

---

### Task 1: Repository Hygiene

**Files:**
- Modify: `.gitignore`
- Modify: `.npmignore`
- Modify: `tests/package-smoke.test.ts`
- Create: `tests/repository-hygiene.test.ts`
- Remove tracked generated artifacts: `.DS_Store`, `coverage/`

- [ ] **Step 1: Write the failing hygiene test**

Create `tests/repository-hygiene.test.ts` with assertions that tracked files do not include `.DS_Store`, coverage output, nested `node_modules`, VitePress cache, or package-manager caches.

- [ ] **Step 2: Run the hygiene test to verify it fails**

Run: `bun test tests/repository-hygiene.test.ts`
Expected: FAIL while `.DS_Store` and `coverage/` are still tracked.

- [ ] **Step 3: Clean repository artifacts and ignore rules**

Remove tracked generated files with `git rm -r --cached .DS_Store coverage`, delete stale `docs/node_modules`, and update ignore files to prevent recurrence.

- [ ] **Step 4: Run the hygiene test to verify it passes**

Run: `bun test tests/repository-hygiene.test.ts`
Expected: PASS.

### Task 2: Public API Documentation Contract

**Files:**
- Modify: `README.md`
- Modify: `docs/src/api/*.md`
- Create: `tests/public-api-docs.test.ts`

- [ ] **Step 1: Write the failing docs contract test**

Create a test that reads `package.json`, `README.md`, and docs pages and asserts documented commands, imports, version examples, and route component APIs match the current public exports.

- [ ] **Step 2: Run the docs contract test to verify it fails**

Run: `bun test tests/public-api-docs.test.ts`
Expected: FAIL on stale README/API documentation.

- [ ] **Step 3: Align docs to current public API**

Update README and API docs to cover `createApp`, `Component<Props, State>`, `VNode`, `reactive`, `effect`, `computed`, `createRouter`, `RouterView`, `RouterLink`, and Bun commands.

- [ ] **Step 4: Run the docs contract test to verify it passes**

Run: `bun test tests/public-api-docs.test.ts`
Expected: PASS.

### Task 3: Core Public Type Tightening

**Files:**
- Modify: `lib/core/vnode.ts`
- Modify: `lib/core/app.ts`
- Modify: `lib/core/component/base.ts`
- Modify: `lib/router/index.ts`
- Modify: `tests/component-types.test.ts`

- [ ] **Step 1: Add type-level coverage for public framework contracts**

Extend tests to compile consumer usage with typed props/state, route params/meta, events, and vnode props/listeners.

- [ ] **Step 2: Run targeted type tests to verify failures**

Run: `bun test tests/component-types.test.ts`
Expected: FAIL before missing public types are exported or narrowed.

- [ ] **Step 3: Replace high-impact public `any` with bounded unknown/generic types**

Introduce explicit `ComponentProps`, `ComponentState`, `VNodeProps`, `EventListener`, `RouteMeta`, and generic route/component constraints.

- [ ] **Step 4: Run type and runtime tests**

Run: `bun test tests/component-types.test.ts && bunx tsc --noEmit`
Expected: PASS.

### Task 4: Focused Module Splits

**Files:**
- Create: `lib/core/renderer/types.ts`
- Create: `lib/core/renderer/props.ts`
- Create: `lib/router/matcher.ts`
- Create: `lib/router/history.ts`
- Modify: `lib/core/renderer.ts`
- Modify: `lib/router/index.ts`

- [ ] **Step 1: Add tests that preserve renderer/router behavior**

Use existing tests plus public API smoke tests as behavioral guards for keyed diff, slots, directives, dynamic routes, and listener cleanup.

- [ ] **Step 2: Extract stable helpers without behavior changes**

Move renderer type contracts and prop/event helpers into focused files. Move route path matching and history adapters into focused router files.

- [ ] **Step 3: Run full verification**

Run: `bun test && bunx tsc --noEmit && bun run build && bun run lint`
Expected: tests, typecheck, and build pass; lint has no errors.
