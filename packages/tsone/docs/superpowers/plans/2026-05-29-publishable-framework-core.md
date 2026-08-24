# Publishable Framework Core Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make TSone publish/install reliably and add typed components, keyed diffing, real slots, and dynamic route params.

**Architecture:** Use separate build configs for package output and example dev. Keep class-based components and strategy-based rendering, adding typed state generics and richer runtime context for slots. Extend router matching with a local path matcher that preserves the current router API.

**Tech Stack:** TypeScript, Vite library mode, Vitest with jsdom, Node/npm smoke scripts.

---

### Task 1: Publishable Package Output

**Files:**
- Modify: `package.json`
- Create: `tsconfig.build.json`
- Create: `vite.lib.config.ts`
- Modify: `vite.config.ts`
- Create: `tests/package-smoke.test.ts`

- [ ] Write a failing package smoke test that runs `npm run build`, `npm pack --dry-run --json`, checks that exported files exist, and verifies a temporary consumer can import `tsone` and `tsone/router`.
- [ ] Run `npm test -- tests/package-smoke.test.ts` and confirm it fails on the current package layout.
- [ ] Add a library build config that emits `dist/index.js`, `dist/router/index.js`, `dist/style/index.js`, and matching declarations.
- [ ] Update package scripts and `exports` to match the real output.
- [ ] Run the package smoke test and confirm it passes.

### Task 2: Typed Component

**Files:**
- Modify: `lib/core/component/base.ts`
- Modify: `lib/core/renderer.ts`
- Modify: `lib/core/app.ts`
- Modify: `lib/core/vnode.ts`
- Create: `tests/component-types.test.ts`

- [ ] Write a failing compile-time/runtime test showing `Component<Props, State>` exposes typed `props`, `state`, and `setState`.
- [ ] Run the focused test and confirm it fails because `Component` currently only types props.
- [ ] Add the state generic with defaults that preserve existing subclasses.
- [ ] Replace the most visible component-facing `any` types with `unknown` or typed records where practical.
- [ ] Run focused and full tests.

### Task 3: Keyed Diff

**Files:**
- Modify: `lib/core/renderer.ts`
- Modify: `tests/framework-plan.test.ts`

- [ ] Write a failing test that reorders keyed children and asserts the existing DOM node is moved instead of recreated.
- [ ] Run the focused test and confirm it fails.
- [ ] Implement keyed reconciliation inside `ElementRenderStrategy.updateChildren`.
- [ ] Run focused and full tests.

### Task 4: Real Slots

**Files:**
- Modify: `lib/core/renderer.ts`
- Modify: `lib/core/vnode.ts`
- Modify: `tests/framework-plan.test.ts`

- [ ] Write a failing test where a parent passes default and named slot children to a child component.
- [ ] Run the focused test and confirm it fails because slot outlets render empty placeholders.
- [ ] Add slot collection to component props and slot projection in `SlotRenderStrategy`.
- [ ] Run focused and full tests.

### Task 5: Dynamic Route Params

**Files:**
- Modify: `lib/router/index.ts`
- Modify: `lib/router/__tests__/router.test.ts`

- [ ] Write a failing test for `/users/:id` that asserts route record matching and `params.id`.
- [ ] Run the focused test and confirm it fails.
- [ ] Implement dynamic path matching and params decoding.
- [ ] Run focused and full tests.

### Task 6: Final Verification

**Files:**
- No production changes expected.

- [ ] Run `npm exec -- tsc --noEmit`.
- [ ] Run `npm test`.
- [ ] Run `npm run build`.
- [ ] Run `npm_config_cache=/private/tmp/tsone-npm-cache npm pack --dry-run --json`.
- [ ] Run `npm run lint` and report remaining lint status honestly if strict rules still need a follow-up.
