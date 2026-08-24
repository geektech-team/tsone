# TSone Framework Capabilities Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement task-by-task. Steps use checkbox syntax for tracking.

**Goal:** Deliver conditional/list rendering, component communication, native-form binding, and lightweight validation.

**Architecture:** Extend VNode and existing render strategies; keep component events/providers inside `Component`; extract form path and validation logic into pure core modules.

**Tech Stack:** Bun, TypeScript, bun:test, Happy DOM.

## Global Constraints

- Zero browser runtime dependencies.
- Preserve class components, strategy renderer, and old `directions.if`/`directions.model` contracts.
- Do not touch unrelated monorepo migration changes.
- Use test-first red/green cycles.

---

### Task 1: Generalize conditions and add `each`

**Files:** Modify `packages/tsone/lib/core/vnode.ts`, `packages/tsone/lib/core/renderer.ts`, `packages/tsone/lib/core/renderer/types.ts`; test `packages/tsone/tests/framework-plan.test.ts`.

**Produces:** `each<T>(items, render, key)`, shared VNode directions, comment-anchor handling for element/component/slot conditions.

- [ ] Write failing tests for a `directions.if` component unmount/remount and `each([{ id: 'a' }], () => ({ tag: 'li' }), item => item.id)` returning a VNode keyed `a`.
- [ ] Run `bun test packages/tsone/tests/framework-plan.test.ts`; verify failures are missing `each` and unhandled component condition.
- [ ] Add `each` to `vnode.ts`; it clones rendered VNodes with the supplied key and rejects string render output. Move `directions` to common VNode shape. Make component and slot strategies use the same comment-anchor conditional transition as elements.
- [ ] Run `bun test packages/tsone/tests/framework-plan.test.ts && bunx tsc --noEmit`; expect exit 0.
- [ ] Commit only changed task files with message `feat: add each helper and component conditions`.

### Task 2: Harden keyed reconciliation

**Files:** Modify `packages/tsone/lib/core/renderer.ts`; test `packages/tsone/tests/framework-plan.test.ts`.

**Produces:** duplicate-key error and safe mixed-list fallback.

- [ ] Write failing tests asserting duplicate sibling key `same` throws `Duplicate key "same"`, and a mixed keyed/unkeyed list patches positionally.
- [ ] Run `bun test packages/tsone/tests/framework-plan.test.ts`; verify the new tests fail for current behavior.
- [ ] Add a pre-diff duplicate-key check. Call keyed reconciliation only if all old and new children have keys; otherwise reuse index reconciliation.
- [ ] Run `bun test packages/tsone/tests/framework-plan.test.ts`; expect exit 0.
- [ ] Commit only changed task files with message `fix: make keyed child reconciliation safe`.

### Task 3: Synchronize props and component events

**Files:** Modify `packages/tsone/lib/core/component/base.ts`, `packages/tsone/lib/core/renderer.ts`, `packages/tsone/lib/core/renderer/types.ts`; test `packages/tsone/tests/framework-plan.test.ts`.

**Produces:** `on()` unsubscribe function, emitter replacement/removal, and single-render props patch.

- [ ] Write failing tests that switch a child `saved` emitter and observe only the new handler, and call the function returned by `child.on('saved', listener)` before emitting.
- [ ] Run `bun test packages/tsone/tests/framework-plan.test.ts`; verify old listeners are retained and `on()` returns no function.
- [ ] Make `on` return `() => off(...)`; track VNode-installed listeners per child instance and synchronize on patch. Remove the renderer's second update after `setProps`.
- [ ] Run `bun test packages/tsone/tests/framework-plan.test.ts && bunx tsc --noEmit`; expect exit 0.
- [ ] Commit only changed task files with message `feat: synchronize component events and props`.

### Task 4: Add hierarchical providers

**Files:** Modify `packages/tsone/lib/core/component/base.ts`, `packages/tsone/lib/core/app.ts`, `packages/tsone/lib/core/renderer.ts`, `packages/tsone/lib/core/renderer/types.ts`; test `packages/tsone/tests/framework-plan.test.ts`.

**Produces:** `InjectionKey<T>`, `provide`, and `inject` on components/app.

- [ ] Write failing tests proving a descendant reads a nearest component provider ahead of an app provider, symbol keys work, and a missing key returns fallback.
- [ ] Run `bun test packages/tsone/tests/framework-plan.test.ts`; verify provider APIs are missing.
- [ ] Add maps per component/app. Capture parent component on child registration; `inject` checks self, parent chain, then app map. Clear component maps on unmount.
- [ ] Run `bun test packages/tsone/tests/framework-plan.test.ts`; expect exit 0.
- [ ] Commit only changed task files with message `feat: add hierarchical component injection`.

### Task 5: Implement form model paths and native controls

**Files:** Create `packages/tsone/lib/core/model.ts`; modify `packages/tsone/lib/core/vnode.ts`, `packages/tsone/lib/core/renderer.ts`, `packages/tsone/lib/core/index.ts`; test `packages/tsone/lib/core/__tests__/form.test.ts` and `packages/tsone/tests/framework-plan.test.ts`.

**Produces:** `ModelBinding`, own-property dot-path helpers, native control synchronization.

- [ ] Write failing unit tests for `profile.name` reads/writes and invalid path errors; DOM tests for input/textarea, boolean and array checkbox, radio, single select, and multiple select.
- [ ] Run `bun test packages/tsone/lib/core/__tests__/form.test.ts`; verify the module is absent.
- [ ] Implement `ModelBinding = string | { path; parse?; format? }`, safe read/write helpers, and control conversion in `model.ts`. Make renderer delegate model setup/cleanup to it so path changes remove old effects/listeners.
- [ ] Run `bun test packages/tsone/lib/core/__tests__/form.test.ts packages/tsone/tests/framework-plan.test.ts`; expect exit 0.
- [ ] Commit only changed task files with message `feat: support native form model bindings`.

### Task 6: Add lightweight validation and document public APIs

**Files:** Create `packages/tsone/lib/core/form.ts`; modify `packages/tsone/lib/core/index.ts`, `packages/tsone/tests/component-types.test.ts`, `packages/tsone/tests/public-api-docs.test.ts`, `packages/tsone/README.md`, `packages/tsone/docs/app/content/api.ts`, `packages/tsone/docs/app/content/guide.ts`; test `packages/tsone/lib/core/__tests__/form.test.ts`.

**Produces:** `createForm`, `required`, `minLength`, `validate`, controller methods and documented exports.

- [ ] Write failing tests for `createForm({ name: '' }, { name: [required('Name is required')] })`, invalid errors, valid `validateField`, reset, and rule exceptions. Add a consumer type program importing every public API.
- [ ] Run `bun test packages/tsone/lib/core/__tests__/form.test.ts packages/tsone/tests/component-types.test.ts`; verify missing exports.
- [ ] Implement pure rules and a controller with `model`, `errors`, `validate`, `validateField`, `resetErrors`; convert thrown rule errors to messages. Document `directions.if`, `each`, events, injection, model binding, and validation with exported-only examples.
- [ ] Run `bun test && bunx tsc --noEmit && bun run build && bun run lint && git diff --check`; expect all exit 0.
- [ ] Commit only changed task files with message `feat: complete framework capability APIs`.
