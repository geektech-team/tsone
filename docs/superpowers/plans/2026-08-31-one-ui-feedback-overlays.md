# One UI Feedback and Overlay Components Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add accessible `OneAlert`, `OneMessage`, `OneDialog`, and `OneTooltip` components with reusable overlay infrastructure, imperative Message/Dialog services, full documentation, and zero new runtime dependencies.

**Architecture:** Public overlay components keep a stable anchor or trigger inside the TSone parent tree. They compose private overlay views mounted by `OneOverlayHost` into `document.body` or a validated custom container; imperative services reuse the same private views. A dependency-inverted `OneOverlayPositioner` supplies the zero-dependency 12-placement Tooltip algorithm.

**Tech Stack:** Bun workspace, strict TypeScript, TSone class components and VNodes, `bun:test`, Happy DOM, existing One CSS-variable style system, typed One documentation renderer.

**Spec:** `docs/superpowers/specs/2026-08-31-one-ui-feedback-overlays-design.md`

## Global Constraints

- Add no browser runtime dependency and do not modify the TSone public API.
- Public names are exactly `OneAlert`, `OneMessage`, `OneDialog`, `OneTooltip`, `oneMessage`, and `oneDialog`.
- Message and Dialog provide both component and imperative APIs.
- Overlay components keep their public root anchor or trigger in the parent tree; only private overlay views mount into the Host.
- Default overlay container is `document.body`; a supplied container must be connected, belong to the current `Document`, and have measurable layout.
- Tooltip implements 12 placements, flip, shift, resize/scroll updates, and arrow positioning without `@floating-ui/dom`.
- Preserve the existing user-owned modification in `packages/one/package.json`; do not stage, rewrite, format, or commit that file.
- `packages/one/package.json` currently declares the user-edited peer range `>=0.1.0 <0.2.0`, while `packages/one/tests/package-contract.test.ts` still expects `>=0.0.2 <0.1.0`. Record that as a pre-existing baseline mismatch and do not fold a version-contract migration into this feature.
- Use TDD for every behavior: observe the named test fail for the expected missing behavior before implementation, then rerun it green.
- Each task commits only its listed files; inspect `git status --short` before every commit.

## File Map

New shared infrastructure:

- `packages/one/lib/overlay/types.ts` — public overlay types and internal Host contracts.
- `packages/one/lib/overlay/errors.ts` — stable environment, container, and trigger errors.
- `packages/one/lib/overlay/container.ts` — lazy document/container resolution.
- `packages/one/lib/overlay/host.ts` — per-Document Host, records, stacking, handles, and cleanup.
- `packages/one/lib/overlay/mount-controller.ts` — declarative component ownership of a private overlay view.
- `packages/one/lib/overlay/positioner.ts` — 12-placement calculation and auto-update lifecycle.
- `packages/one/lib/overlay/index.ts` — shared exports.

New components:

- `packages/one/lib/alert/OneAlert.ts`, `packages/one/lib/alert/index.ts`.
- `packages/one/lib/message/OneMessage.ts` — public anchor component.
- `packages/one/lib/message/MessageOverlay.ts` — actual Message view.
- `packages/one/lib/message/timer.ts` — pausable countdown with injectable scheduler.
- `packages/one/lib/message/service.ts`, `packages/one/lib/message/index.ts`.
- `packages/one/lib/dialog/OneDialog.ts` — public anchor component.
- `packages/one/lib/dialog/DialogOverlay.ts` — actual Dialog view.
- `packages/one/lib/dialog/focus-manager.ts` — focus trap and restoration.
- `packages/one/lib/dialog/scroll-lock.ts` — reference-counted body scroll lock.
- `packages/one/lib/dialog/service.ts`, `packages/one/lib/dialog/index.ts`.
- `packages/one/lib/tooltip/OneTooltip.ts` — stable trigger component.
- `packages/one/lib/tooltip/TooltipBubble.ts` — positioned tooltip view.
- `packages/one/lib/tooltip/index.ts`.

New tests and docs:

- `packages/one/tests/overlay.test.ts`, `positioner.test.ts`, `alert.test.ts`, `message.test.ts`, `dialog.test.ts`, `tooltip.test.ts`.
- `packages/one/docs/app/content/feedback.ts`.
- `packages/one/docs/app/demos/AlertDemo.ts`, `MessageDemo.ts`, `DialogDemo.ts`, `TooltipDemo.ts`.

Existing cross-cutting files change only in the tasks that list them.

---

### Task 1: Overlay contracts, container resolution, Host, and mount controller

**Files:**

- Create: `packages/one/lib/overlay/types.ts`
- Create: `packages/one/lib/overlay/errors.ts`
- Create: `packages/one/lib/overlay/container.ts`
- Create: `packages/one/lib/overlay/host.ts`
- Create: `packages/one/lib/overlay/mount-controller.ts`
- Create: `packages/one/lib/overlay/index.ts`
- Test: `packages/one/tests/overlay.test.ts`

**Interfaces:**

- Produces `OneFeedbackVariant`, `OneOverlayContainer`, `OneOverlayPlacement`, `OneOverlayHandle<TOptions>`, `OneOverlayKind`, `OneOverlayFactory<TOptions>`, `OneOverlayHost`, `DomOneOverlayHost`, `getDefaultOneOverlayHost()`, `OneOverlayMountController<TOptions>`, `OneOverlayEnvironmentError`, `OneOverlayContainerError`, and `OneTooltipTriggerError`.
- Later tasks pass a factory that mounts one private overlay view into the supplied Host slot and returns `update()` plus `destroy()`.

- [ ] **Step 1: Write the failing container and Host tests**

```ts
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import {
  DomOneOverlayHost,
  OneOverlayContainerError,
  OneOverlayEnvironmentError,
  OneOverlayMountController,
  resolveOneOverlayContainer,
} from '../lib/overlay';

describe('One overlay infrastructure', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('resolves body and a connected custom container', () => {
    const custom = document.createElement('section');
    custom.getBoundingClientRect = () => ({
      x: 0,
      y: 0,
      top: 0,
      left: 0,
      right: 320,
      bottom: 240,
      width: 320,
      height: 240,
      toJSON: () => ({}),
    });
    document.body.appendChild(custom);
    expect(resolveOneOverlayContainer(undefined, document)).toBe(document.body);
    expect(resolveOneOverlayContainer(() => custom, document)).toBe(custom);
  });

  it('rejects missing, detached and foreign containers with stable errors', () => {
    const detached = document.createElement('div');
    const foreign = document.implementation.createHTMLDocument('foreign');
    expect(() => resolveOneOverlayContainer(() => null, document)).toThrow(
      OneOverlayContainerError
    );
    expect(() => resolveOneOverlayContainer(detached, document)).toThrow(
      'One overlay container must be connected'
    );
    expect(() => resolveOneOverlayContainer(foreign.body, document)).toThrow(
      'One overlay container must belong to the current document'
    );
    expect(() => resolveOneOverlayContainer(undefined, null)).toThrow(
      OneOverlayEnvironmentError
    );
  });

  it('creates one host per container and removes it after the last record closes', () => {
    const host = new DomOneOverlayHost(document);
    const handle = host.open({
      kind: 'message',
      factory: ({ slot }) => {
        slot.textContent = 'Saved';
        return { update: () => {}, destroy: () => {} };
      },
    });
    expect(document.querySelectorAll('[data-one-overlay-host]')).toHaveLength(
      1
    );
    expect(document.body.textContent).toContain('Saved');
    handle.close();
    handle.close();
    expect(document.querySelector('[data-one-overlay-host]')).toBeNull();
  });

  it('lets a mount controller own one private view without moving its anchor', () => {
    const anchor = document.createElement('span');
    document.body.appendChild(anchor);
    const host = new DomOneOverlayHost(document);
    const controller = new OneOverlayMountController(
      host,
      'dialog',
      ({ slot }) => {
        slot.textContent = 'Dialog body';
        return { update: () => {}, destroy: () => {} };
      }
    );
    controller.open();
    expect(anchor.parentElement).toBe(document.body);
    expect(
      document.querySelector('[data-one-overlay-kind="dialog"]')
    ).toBeTruthy();
    controller.close();
  });
});
```

- [ ] **Step 2: Run the test and verify the missing-module failure**

Run: `bun test packages/one/tests/overlay.test.ts`

Expected: FAIL because `../lib/overlay` does not exist.

- [ ] **Step 3: Add exact public and Host contracts**

```ts
// packages/one/lib/overlay/types.ts
export type OneFeedbackVariant = 'info' | 'success' | 'warning' | 'error';
export type OneOverlayContainer = HTMLElement | (() => HTMLElement | null);
export type OneOverlayPlacement =
  | 'top-start'
  | 'top'
  | 'top-end'
  | 'right-start'
  | 'right'
  | 'right-end'
  | 'bottom-start'
  | 'bottom'
  | 'bottom-end'
  | 'left-start'
  | 'left'
  | 'left-end';
export type OneOverlayKind = 'message' | 'dialog' | 'tooltip';

export interface OneOverlayHandle<TOptions extends object> {
  readonly id: string;
  update(options: Partial<TOptions>): void;
  close(): void;
}

export interface OneManagedOverlay<TOptions extends object> {
  update(options: Partial<TOptions>): void;
  destroy(): void;
}

export interface OneOverlayFactoryContext {
  id: string;
  slot: HTMLElement;
  requestClose(): void;
  isTop(): boolean;
}

export type OneOverlayFactory<TOptions extends object> = (
  context: OneOverlayFactoryContext
) => OneManagedOverlay<TOptions>;

export interface OneOverlayOpenRequest<TOptions extends object> {
  kind: OneOverlayKind;
  group?: string;
  container?: OneOverlayContainer;
  factory: OneOverlayFactory<TOptions>;
}

export interface OneOverlayHost {
  open<TOptions extends object>(
    request: OneOverlayOpenRequest<TOptions>
  ): OneOverlayHandle<TOptions>;
  close(id: string): void;
  closeAll(kind?: OneOverlayKind): void;
  isTop(id: string): boolean;
}
```

Implement `OneOverlayEnvironmentError`, `OneOverlayContainerError`, and `OneTooltipTriggerError` as named `Error` subclasses. `resolveOneOverlayContainer(container, targetDocument)` accepts `Document | null` as its second argument, lazily resolves the global document when that argument is omitted, validates `ownerDocument`, `isConnected`, and non-zero layout for custom containers, and exempts `document.body` from Happy DOM's zero geometry.

Implement `DomOneOverlayHost` with a `Map<string, OverlayRecord>`, a `Map<HTMLElement, HostEntry>`, id sequence `one-${kind}-${n}`, idempotent close, kind-filtered `closeAll`, and a per-container element marked with `data-one-overlay-host`. Requests with `group` share a child marked `data-one-overlay-group`; remove that group after its final slot closes. `getDefaultOneOverlayHost(targetDocument?: Document): OneOverlayHost` caches by `Document` in a `WeakMap` without reading global DOM at import time.

Implement `OneOverlayMountController<TOptions>` with constructor `(host: OneOverlayHost, kind: OneOverlayKind, factory: OneOverlayFactory<TOptions>, group?: string)`. It is a small association wrapper around one Host handle. Its `open(container?: OneOverlayContainer)` must be idempotent, `update(options)` must no-op while closed, and `close()` must release the handle. It never receives or moves the public component root.

- [ ] **Step 4: Run focused tests and typecheck**

Run: `bun test packages/one/tests/overlay.test.ts && bunx tsc --noEmit --project packages/one/tsconfig.json`

Expected: PASS with four overlay tests and no TypeScript diagnostics.

- [ ] **Step 5: Commit the infrastructure**

```sh
git status --short
git add packages/one/lib/overlay packages/one/tests/overlay.test.ts
git commit -m "feat(one): add overlay host infrastructure"
```

### Task 2: Zero-dependency 12-placement positioner

**Files:**

- Create: `packages/one/lib/overlay/positioner.ts`
- Modify: `packages/one/lib/overlay/index.ts`
- Test: `packages/one/tests/positioner.test.ts`

**Interfaces:**

- Consumes `OneOverlayPlacement` from Task 1.
- Produces `OneOverlayPositionRequest`, `OneOverlayPositionResult`, `OneOverlayPositioner`, and `OneFloatingPositioner`.

- [ ] **Step 1: Write failing deterministic geometry tests**

```ts
import { describe, expect, it } from 'bun:test';
import { OneFloatingPositioner } from '../lib/overlay';

const rect = (x: number, y: number, width: number, height: number) => ({
  x,
  y,
  width,
  height,
  top: y,
  left: x,
  right: x + width,
  bottom: y + height,
});

describe('OneFloatingPositioner', () => {
  const positioner = new OneFloatingPositioner();

  it('calculates all aligned sides from the preferred placement', () => {
    expect(
      positioner.compute({
        reference: rect(100, 100, 40, 20),
        floating: rect(0, 0, 80, 30),
        boundary: rect(0, 0, 400, 300),
        placement: 'top-start',
        offset: 8,
        padding: 8,
      })
    ).toMatchObject({ x: 100, y: 62, placement: 'top-start' });
    expect(
      positioner.compute({
        reference: rect(100, 100, 40, 20),
        floating: rect(0, 0, 80, 30),
        boundary: rect(0, 0, 400, 300),
        placement: 'right-end',
        offset: 8,
        padding: 8,
      })
    ).toMatchObject({ x: 148, y: 90, placement: 'right-end' });
  });

  it('flips when the preferred side cannot fit', () => {
    const result = positioner.compute({
      reference: rect(100, 4, 40, 20),
      floating: rect(0, 0, 80, 40),
      boundary: rect(0, 0, 300, 200),
      placement: 'top',
      offset: 8,
      padding: 8,
    });
    expect(result.placement).toBe('bottom');
    expect(result.y).toBe(32);
  });

  it('chooses maximum visible area then shifts within padding', () => {
    const result = positioner.compute({
      reference: rect(2, 80, 10, 20),
      floating: rect(0, 0, 180, 140),
      boundary: rect(0, 0, 200, 160),
      placement: 'left',
      offset: 8,
      padding: 8,
    });
    expect(result.x).toBeGreaterThanOrEqual(8);
    expect(result.y).toBeGreaterThanOrEqual(8);
    expect(result.arrow.y).toBeGreaterThanOrEqual(8);
  });
});
```

- [ ] **Step 2: Run the test and verify `OneFloatingPositioner` is missing**

Run: `bun test packages/one/tests/positioner.test.ts`

Expected: FAIL because the positioner export is missing.

- [ ] **Step 3: Implement placement parsing, candidate ordering, flip, shift, and auto-update**

Use these exact contracts:

```ts
export interface OneOverlayRect {
  x: number;
  y: number;
  width: number;
  height: number;
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export interface OneOverlayPositionRequest {
  reference: OneOverlayRect;
  floating: OneOverlayRect;
  boundary: OneOverlayRect;
  placement: OneOverlayPlacement;
  offset: number;
  padding: number;
}

export interface OneOverlayPositionResult {
  x: number;
  y: number;
  placement: OneOverlayPlacement;
  arrow: { x?: number; y?: number };
}

export interface OneOverlayPositioner {
  compute(request: OneOverlayPositionRequest): OneOverlayPositionResult;
  autoUpdate(
    reference: HTMLElement,
    floating: HTMLElement,
    update: () => void
  ): () => void;
}
```

Split placement into side and alignment, calculate preferred coordinates, generate candidates in this order: preferred, opposite with same alignment, clockwise orthogonal, counter-clockwise orthogonal. Pick the first fully fitting candidate; otherwise sort by visible intersection area. Shift the chosen point inside boundary padding. Clamp the arrow to 8 pixels from either floating edge.

`autoUpdate()` observes both elements with `ResizeObserver`, subscribes to `scroll` on unique scroll ancestors plus `window`, subscribes to window `resize`, and merges duplicate work with one `requestAnimationFrame`. Its cleanup cancels the frame, disconnects the observer, and removes every listener.

- [ ] **Step 4: Add an auto-update cleanup test and run the suite**

Add a test with a fake `ResizeObserver` and listener counters, call the returned cleanup twice, and assert each listener is removed exactly once.

Run: `bun test packages/one/tests/positioner.test.ts && bunx tsc --noEmit --project packages/one/tsconfig.json`

Expected: PASS.

- [ ] **Step 5: Commit the positioner**

```sh
git add packages/one/lib/overlay packages/one/tests/positioner.test.ts
git commit -m "feat(one): add floating overlay positioner"
```

### Task 3: Theme feedback tokens and OneAlert

**Files:**

- Create: `packages/one/lib/alert/OneAlert.ts`
- Create: `packages/one/lib/alert/index.ts`
- Modify: `packages/one/lib/styles/shared.ts`
- Test: `packages/one/tests/alert.test.ts`
- Test: `packages/one/tests/style-contract.test.ts`

**Interfaces:**

- Consumes `OneFeedbackVariant`.
- Produces `OneAlertProps`, `OneAlert`, and `ONE_ALERT_STYLES`.

- [ ] **Step 1: Extend the exact theme-default test and add failing Alert tests**

Add these exact fields to `EXPECTED_THEME_DEFAULTS`:

```ts
colorInfo: '#2563eb',
colorSuccess: '#2f7c39',
colorWarning: '#9a6700',
colorOverlay: 'rgba(22, 32, 24, 0.48)',
shadowOverlay: '0 18px 48px rgba(22, 32, 24, 0.2)',
zIndexDialog: '1000',
zIndexMessage: '1100',
zIndexTooltip: '1200',
```

Create `alert.test.ts` with four variant assertions, slot precedence, role assertions, and this close test:

```ts
it('emits close and hides an uncontrolled closable alert', () => {
  let closes = 0;
  component = new OneAlert({
    title: 'Network error',
    variant: 'error',
    closable: true,
  });
  component.on('close', () => {
    closes += 1;
  });
  component.mount(container);
  (container.querySelector('.one-alert__close') as HTMLButtonElement).click();
  expect(closes).toBe(1);
  expect(container.querySelector('.one-alert')).toBeNull();
});
```

- [ ] **Step 2: Run tests and verify missing defaults/component failures**

Run: `bun test packages/one/tests/style-contract.test.ts packages/one/tests/alert.test.ts`

Expected: FAIL because the theme fields and Alert module do not exist.

- [ ] **Step 3: Implement Alert with slots, normalized variants, roles, and scoped styles**

Use this contract:

```ts
export interface OneAlertProps {
  title?: string;
  description?: string;
  variant?: OneFeedbackVariant;
  closable?: boolean;
  children?: Array<VNode | string>;
}
```

Normalize unknown variants to `info`. Render `.one-alert--${variant}`, use `role="alert"` for error/warning and `role="status"` for info/success, prefer the default slot over description, and render named `icon` and `actions` slots only when present. Close state belongs to the component and emits exactly once. Register every style through `StyleManager`; selectors must start with `.one-alert` and use theme fallbacks.

- [ ] **Step 4: Run Alert, theme, and type checks**

Run: `bun test packages/one/tests/alert.test.ts packages/one/tests/style-contract.test.ts && bunx tsc --noEmit --project packages/one/tsconfig.json`

Expected: PASS.

- [ ] **Step 5: Commit Alert and theme primitives**

```sh
git add packages/one/lib/alert packages/one/lib/styles/shared.ts packages/one/tests/alert.test.ts packages/one/tests/style-contract.test.ts
git commit -m "feat(one): add alert feedback component"
```

### Task 4: OneMessage component, timer, stacking, and imperative service

**Files:**

- Create: `packages/one/lib/message/timer.ts`
- Create: `packages/one/lib/message/MessageOverlay.ts`
- Create: `packages/one/lib/message/OneMessage.ts`
- Create: `packages/one/lib/message/service.ts`
- Create: `packages/one/lib/message/index.ts`
- Test: `packages/one/tests/message.test.ts`

**Interfaces:**

- Consumes `OneFeedbackVariant`, `OneOverlayContainer`, `OneOverlayHandle`, `OneOverlayHost`, `OneOverlayMountController`.
- Produces `OneMessagePlacement`, `OneMessageOptions`, `OneMessageProps`, `OneMessage`, `OneMessageService`, `createOneMessageService(host?)`, and default `oneMessage`.

- [ ] **Step 1: Write failing timer, component, and service tests**

Define a fake scheduler with mutable `now`, stored callback, and `advance(ms)`. Test start at 3000, pause after 1000, resume for remaining 2000, reset on update, duration 0, and double dispose.

Add component assertions:

```ts
it('keeps its public anchor in the parent and mounts a private message view', () => {
  component = new OneMessage({
    content: 'Saved',
    defaultOpen: true,
    duration: 0,
  });
  component.mount(container);
  expect(container.querySelector('[data-one-message-anchor]')).toBeTruthy();
  expect(container.querySelector('.one-message')).toBeNull();
  expect(document.body.querySelector('.one-message')?.textContent).toContain(
    'Saved'
  );
  component.setProps({ content: 'Updated' });
  expect(document.body.querySelector('.one-message')?.textContent).toContain(
    'Updated'
  );
});
```

Add service assertions that `success()` returns a handle, creates `.one-message--success`, `update()` changes content and timing, same placement shares one stack, `close(id)` is idempotent, and `closeAll()` removes all Message records without closing Dialog-kind Host records.

- [ ] **Step 2: Run the tests and verify missing Message exports**

Run: `bun test packages/one/tests/message.test.ts`

Expected: FAIL because `../lib/message` does not exist.

- [ ] **Step 3: Implement the pausable timer and private MessageOverlay**

Use an internal scheduler contract:

```ts
interface OneTimerScheduler {
  now(): number;
  set(callback: () => void, delay: number): unknown;
  clear(handle: unknown): void;
}
```

`OneMessageTimer` stores remaining time, started-at time, and one handle. `pause()` subtracts elapsed time, `resume()` schedules remaining time, `reset(duration)` cancels then starts the new duration, and `dispose()` prevents future callbacks.

`MessageOverlay` renders the visible `.one-message` element, close button, role, variant class, and placement metadata. It owns the timer and pauses/resumes on mouseenter/mouseleave. It accepts an internal `requestClose` callback and never manipulates Host DOM.

- [ ] **Step 4: Implement public OneMessage and OneMessageService**

Use these exact public types:

```ts
export type OneMessagePlacement =
  | 'top-start'
  | 'top'
  | 'top-end'
  | 'bottom-start'
  | 'bottom'
  | 'bottom-end';

export interface OneMessageOptions {
  content: string;
  variant?: OneFeedbackVariant;
  duration?: number;
  closable?: boolean;
  placement?: OneMessagePlacement;
  container?: OneOverlayContainer;
}

export interface OneMessageProps extends OneMessageOptions {
  open?: boolean;
  defaultOpen?: boolean;
}

export declare class OneMessageService {
  open(options: OneMessageOptions): OneOverlayHandle<OneMessageOptions>;
  info(
    content: string,
    options?: Omit<OneMessageOptions, 'content' | 'variant'>
  ): OneOverlayHandle<OneMessageOptions>;
  success(
    content: string,
    options?: Omit<OneMessageOptions, 'content' | 'variant'>
  ): OneOverlayHandle<OneMessageOptions>;
  warning(
    content: string,
    options?: Omit<OneMessageOptions, 'content' | 'variant'>
  ): OneOverlayHandle<OneMessageOptions>;
  error(
    content: string,
    options?: Omit<OneMessageOptions, 'content' | 'variant'>
  ): OneOverlayHandle<OneMessageOptions>;
  close(id: string): void;
  closeAll(): void;
}
```

`OneMessage.render()` returns only a stable hidden anchor. Its lifecycle synchronizes controlled `open` or internal `defaultOpen` with a `OneOverlayMountController` whose factory mounts `MessageOverlay`. A user close in controlled mode emits `openChange(false)` and `close` but keeps the private view mounted until `open` changes; non-controlled and service-created views close immediately. Emit `afterClose` only after an actual unmount.

`OneMessageService` uses the same `MessageOverlay` factory. Implement `open`, `info`, `success`, `warning`, `error`, `close`, and `closeAll`. Default placement is `top`, duration is 3000, and invalid placement/variant values normalize to defaults. Pass placement as the Host `group`, mark the resulting group with `data-one-message-placement`, and style the group as the ordered stack so entries never overlap.

- [ ] **Step 5: Run Message, overlay, and type tests**

Run: `bun test packages/one/tests/message.test.ts packages/one/tests/overlay.test.ts && bunx tsc --noEmit --project packages/one/tsconfig.json`

Expected: PASS.

- [ ] **Step 6: Commit Message**

```sh
git add packages/one/lib/message packages/one/tests/message.test.ts
git commit -m "feat(one): add message component and service"
```

### Task 5: OneDialog component, private view, focus, and scroll lock

**Files:**

- Create: `packages/one/lib/dialog/focus-manager.ts`
- Create: `packages/one/lib/dialog/scroll-lock.ts`
- Create: `packages/one/lib/dialog/DialogOverlay.ts`
- Create: `packages/one/lib/dialog/OneDialog.ts`
- Create: `packages/one/lib/dialog/index.ts`
- Test: `packages/one/tests/dialog.test.ts`

**Interfaces:**

- Consumes the overlay Host and mount controller.
- Produces `OneDialogProps`, `OneDialog`, internal `DialogOverlay`, `OneDialogFocusManager`, and reference-counted body scroll helpers.

- [ ] **Step 1: Write failing controlled, uncontrolled, focus, and cleanup tests**

Cover these cases in `dialog.test.ts`:

```ts
it('keeps an anchor in the parent while its dialog mounts in body', () => {
  component = new OneDialog({ title: 'Delete item', defaultOpen: true });
  component.mount(container);
  expect(container.querySelector('[data-one-dialog-anchor]')).toBeTruthy();
  expect(container.querySelector('[role="dialog"]')).toBeNull();
  expect(document.body.querySelector('[role="dialog"]')).toBeTruthy();
});

it('emits a controlled open change without overriding open=true', () => {
  const changes: boolean[] = [];
  component = new OneDialog({ open: true, title: 'Controlled' });
  component.on('openChange', (value) => changes.push(value as boolean));
  component.mount(container);
  (document.querySelector('.one-dialog__cancel') as HTMLButtonElement).click();
  expect(changes).toEqual([false]);
  expect(document.querySelector('[role="dialog"]')).toBeTruthy();
});
```

Also test default-open cancel, overlay close, `closeOnOverlay: false`, Esc only on the top Dialog, Tab and Shift+Tab wrapping, initial focus, focus restoration, title/description ids, `aria-modal`, and body overflow restored after the final body Dialog closes. Assert custom-container Dialog does not change `document.body.style.overflow`.

- [ ] **Step 2: Run the test and verify missing Dialog failures**

Run: `bun test packages/one/tests/dialog.test.ts`

Expected: FAIL because Dialog files do not exist.

- [ ] **Step 3: Implement focus and scroll helpers**

`OneDialogFocusManager.activate(dialog)` records `document.activeElement`, focuses the first enabled button/input/select/textarea/link/tabindex target or the dialog itself, and installs one keydown listener. Tab from the last target goes to the first; Shift+Tab from the first goes to the last. `deactivate()` removes the listener and restores focus only if the recorded element remains connected.

Implement scroll locking in `scroll-lock.ts` as a per-Document WeakMap containing `{ count, previousOverflow }`. First body Dialog stores and sets `body.style.overflow = 'hidden'`; final release restores the exact prior string. Repeated release cannot make count negative.

- [ ] **Step 4: Implement DialogOverlay and public OneDialog**

Use this public contract:

```ts
export interface OneDialogProps {
  open?: boolean;
  defaultOpen?: boolean;
  title?: string;
  description?: string;
  closeOnOverlay?: boolean;
  closeOnEscape?: boolean;
  confirmLoading?: boolean;
  container?: OneOverlayContainer;
  children?: Array<VNode | string>;
}
```

`DialogOverlay` renders backdrop, panel, header/default/footer slots, default confirm/cancel buttons, stable title/description ids, and loading/disabled state. Backdrop clicks only close when `event.target === event.currentTarget`. Esc and focus management act only when Host context `isTop()` is true.

`OneDialog` renders a hidden stable anchor and owns a controller for `DialogOverlay`. Controlled state emits but stays open until props change; non-controlled state updates itself. Emit `confirm`, `cancel`, `openChange`, and `afterClose`. Every close path passes one reason through the private view so each event fires once.

- [ ] **Step 5: Run Dialog, overlay, and type tests**

Run: `bun test packages/one/tests/dialog.test.ts packages/one/tests/overlay.test.ts && bunx tsc --noEmit --project packages/one/tsconfig.json`

Expected: PASS.

- [ ] **Step 6: Commit the Dialog component**

```sh
git add packages/one/lib/dialog packages/one/tests/dialog.test.ts
git commit -m "feat(one): add accessible dialog component"
```

### Task 6: oneDialog imperative service and asynchronous confirmation

**Files:**

- Create: `packages/one/lib/dialog/service.ts`
- Modify: `packages/one/lib/dialog/index.ts`
- Test: `packages/one/tests/dialog.test.ts`

**Interfaces:**

- Consumes `DialogOverlay`, `OneOverlayHost`, and `OneOverlayHandle`.
- Produces `OneDialogServiceOptions`, `OneDialogService`, `createOneDialogService(host?)`, and default `oneDialog`.

- [ ] **Step 1: Add failing service tests**

```ts
it('keeps confirm open for false and closes for a fulfilled confirmation', async () => {
  const service = createOneDialogService(new DomOneOverlayHost(document));
  const kept = service.confirm({ title: 'Keep', onConfirm: () => false });
  (document.querySelector('.one-dialog__confirm') as HTMLButtonElement).click();
  await Promise.resolve();
  expect(document.querySelector('[role="dialog"]')).toBeTruthy();
  (document.querySelector('.one-dialog__cancel') as HTMLButtonElement).click();
  expect(await kept).toBe(false);

  const closed = service.confirm({
    title: 'Save',
    onConfirm: async () => true,
  });
  (document.querySelector('.one-dialog__confirm') as HTMLButtonElement).click();
  expect(await closed).toBe(true);
  expect(document.querySelector('[role="dialog"]')).toBeNull();
});
```

Add tests for Promise pending loading, repeated confirm suppression, thrown/rejected callback calling `onError` while staying open, cancel/overlay/Esc resolving false, `open()` handle update, close by id, closeAll, and two stacked Dialogs where only the top responds.

- [ ] **Step 2: Run the service tests and verify missing exports**

Run: `bun test packages/one/tests/dialog.test.ts -t "confirm|service|stacked"`

Expected: FAIL because the service API is absent.

- [ ] **Step 3: Implement exact service options and resolution rules**

```ts
export interface OneDialogServiceOptions
  extends Omit<OneDialogProps, 'open' | 'defaultOpen'> {
  content?: VNode | string;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => boolean | void | Promise<boolean | void>;
  onCancel?: () => void;
  onError?: (error: unknown) => void;
}

export declare class OneDialogService {
  open(
    options: OneDialogServiceOptions
  ): OneOverlayHandle<OneDialogServiceOptions>;
  confirm(options: OneDialogServiceOptions): Promise<boolean>;
  close(id: string): void;
  closeAll(): void;
}
```

`open()` returns a normal Host handle. `confirm()` creates one deferred Promise and one DialogOverlay. On confirm, guard with a pending flag, set loading, await `onConfirm`, keep open only for exact `false`, and otherwise close with result true. Catch unknown errors, clear loading, call `onError`, and keep open. Cancel, overlay, Esc, handle close, and closeAll resolve false. Resolve at most once.

- [ ] **Step 4: Run the complete Dialog tests and typecheck**

Run: `bun test packages/one/tests/dialog.test.ts && bunx tsc --noEmit --project packages/one/tsconfig.json`

Expected: PASS.

- [ ] **Step 5: Commit the Dialog service**

```sh
git add packages/one/lib/dialog packages/one/tests/dialog.test.ts
git commit -m "feat(one): add imperative dialog service"
```

### Task 7: OneTooltip triggers, portal bubble, placement, and cleanup

**Files:**

- Create: `packages/one/lib/tooltip/TooltipBubble.ts`
- Create: `packages/one/lib/tooltip/OneTooltip.ts`
- Create: `packages/one/lib/tooltip/index.ts`
- Test: `packages/one/tests/tooltip.test.ts`

**Interfaces:**

- Consumes overlay Host, mount controller, `OneOverlayPositioner`, and `OneOverlayPlacement`.
- Produces `OneTooltipTrigger`, `OneTooltipProps`, `OneTooltip`, `TooltipBubble`, and `ONE_TOOLTIP_STYLES`.

- [ ] **Step 1: Write failing interaction and accessibility tests**

Cover hover plus focus coordination, click outside, Esc, manual controlled mode, disabled state, delay cancellation, custom container, arrow off, and cleanup. Include:

```ts
it('keeps its trigger in place and exposes the portal bubble through aria-describedby', () => {
  component = new OneTooltip({
    content: 'Helpful text',
    defaultOpen: true,
    children: [{ tag: 'button', children: ['Help'] }],
  });
  component.mount(container);
  const trigger = container.querySelector('button') as HTMLButtonElement;
  const tooltip = document.body.querySelector(
    '[role="tooltip"]'
  ) as HTMLElement;
  expect(trigger.parentElement).toBe(
    container.querySelector('.one-tooltip__trigger')
  );
  expect(trigger.getAttribute('aria-describedby')).toBe(tooltip.id);
  expect(tooltip.getAttribute('data-placement')).toBeTruthy();
  component.unmount();
  expect(trigger.hasAttribute('aria-describedby')).toBe(false);
  expect(document.querySelector('[role="tooltip"]')).toBeNull();
});
```

Loop through all 12 placement strings and assert the requested placement reaches the positioner. Mock element rectangles to force top-to-bottom flip and right-edge shift; assert `data-placement`, left/top style, and arrow variables match the positioner result. Test that missing trigger content throws `OneTooltipTriggerError`.

- [ ] **Step 2: Run tests and verify missing Tooltip failure**

Run: `bun test packages/one/tests/tooltip.test.ts`

Expected: FAIL because Tooltip files do not exist.

- [ ] **Step 3: Implement private TooltipBubble and public trigger component**

Use this contract:

```ts
export type OneTooltipTrigger = 'hover-focus' | 'click' | 'manual';

export interface OneTooltipProps {
  content: VNode | string;
  placement?: OneOverlayPlacement;
  trigger?: OneTooltipTrigger;
  open?: boolean;
  defaultOpen?: boolean;
  openDelay?: number;
  closeDelay?: number;
  offset?: number;
  container?: OneOverlayContainer;
  arrow?: boolean;
  disabled?: boolean;
  children?: Array<VNode | string>;
}
```

`OneTooltip` renders `.one-tooltip__trigger` with only the default slot. After mount, resolve its first HTMLElement child or throw `OneTooltipTriggerError`. Preserve the child's prior `aria-describedby`, append the tooltip id while open, and restore the exact prior attribute on close.

For `hover-focus`, track separate `hovered` and `focused` booleans and close only when both are false after closeDelay. Click toggles and installs one document outside-click listener. Manual mode changes only from props/internal default and emits `openChange`. All modes support Esc while open.

`TooltipBubble` mounts in Host, measures after mount, calls `positioner.compute`, writes `left`, `top`, `data-placement`, and arrow CSS variables, and owns the `autoUpdate()` cleanup. Use defaults `top`, 100 ms open/close delay, 8 px offset, 8 px boundary padding, arrow true.

- [ ] **Step 4: Run Tooltip, positioner, overlay, and type tests**

Run: `bun test packages/one/tests/tooltip.test.ts packages/one/tests/positioner.test.ts packages/one/tests/overlay.test.ts && bunx tsc --noEmit --project packages/one/tsconfig.json`

Expected: PASS.

- [ ] **Step 5: Commit Tooltip**

```sh
git add packages/one/lib/tooltip packages/one/tests/tooltip.test.ts
git commit -m "feat(one): add positioned tooltip component"
```

### Task 8: Public exports, category catalog, types, styles, and package consumers

**Files:**

- Modify: `packages/one/lib/index.ts`
- Modify: `packages/one/lib/categories.ts`
- Modify: `packages/one/tests/categories.test.ts`
- Modify: `packages/one/tests/component-types.test.ts`
- Modify: `packages/one/tests/style-contract.test.ts`
- Modify: `packages/one/tests/package-smoke.test.ts`

**Interfaces:**

- Consumes every component and service from Tasks 1–7.
- Produces the final root-package named export surface and feedback category order.

- [ ] **Step 1: Write failing public-contract assertions**

Update the feedback category expectation to:

```ts
{
  id: 'feedback',
  label: '反馈与浮层',
  components: ['OneAlert', 'OneMessage', 'OneDialog', 'OneTooltip'],
}
```

Extend `component-types.test.ts` to import all constructors, both services, all props/options/placement types, and assert invalid variants, triggers, and placements with `@ts-expect-error`. Instantiate each component with its minimum accessible props.

Extend the package smoke consumer to import the four constructors and two service singletons, assert constructor/service runtime types, and use these declarations:

```ts
const alertProps: OneAlertProps = { title: 'Info', variant: 'info' };
const messageOptions: OneMessageOptions = { content: 'Saved', duration: 0 };
const dialogProps: OneDialogProps = { title: 'Confirm', defaultOpen: false };
const tooltipProps: OneTooltipProps = {
  content: 'Help',
  placement: 'bottom-end',
  children: [{ tag: 'button', children: ['?'] }],
};
```

Do not change the manifest peer range assertion in `package-contract.test.ts`; it is the known user-owned baseline mismatch described in Global Constraints.

- [ ] **Step 2: Run contract tests and verify missing exports/category entries**

Run: `bun test packages/one/tests/categories.test.ts packages/one/tests/component-types.test.ts`

Expected: FAIL because root exports and category entries are absent.

- [ ] **Step 3: Export the complete public surface and include component CSS in style tests**

Add root exports grouped by `overlay`, `alert`, `message`, `dialog`, and `tooltip`. Export the three stable error classes and all public types, but do not export internal `MessageOverlay`, `DialogOverlay`, `TooltipBubble`, timer, focus manager, or scroll lock.

Update style-contract component construction and selector scans to include Alert, Message, Dialog, and Tooltip styles. Ensure all generated selectors begin `.one-`, every style uses documented `--one-*` fallbacks, and no style targets bare `body` or `html`.

- [ ] **Step 4: Make package smoke resolve the current TSone tarball dynamically**

Replace the hard-coded TSone tarball filename with the committed TSone manifest version:

```ts
const tsoneManifest = JSON.parse(
  readFileSync(join(tsoneRoot, 'package.json'), 'utf8')
) as { name: string; version: string };
const tsoneTarball = join(
  tempDir,
  `${tsoneManifest.name.replace('@', '').replace('/', '-')}-${tsoneManifest.version}.tgz`
);
```

This is test robustness for the already committed TSone `0.1.0`; it does not stage `packages/one/package.json` or change the One peer contract.

- [ ] **Step 5: Run public contracts, typecheck, and package smoke**

Run: `bun test packages/one/tests/categories.test.ts packages/one/tests/component-types.test.ts packages/one/tests/style-contract.test.ts packages/one/tests/package-smoke.test.ts && bunx tsc --noEmit --project packages/one/tsconfig.json`

Expected: the listed feature and package-smoke tests PASS. Run `bun test packages/one/tests/package-contract.test.ts` separately and record whether the pre-existing peer-range mismatch remains; do not modify the user-owned manifest.

- [ ] **Step 6: Commit public contracts without the manifest**

```sh
git status --short
git add packages/one/lib/index.ts packages/one/lib/categories.ts packages/one/tests/categories.test.ts packages/one/tests/component-types.test.ts packages/one/tests/style-contract.test.ts packages/one/tests/package-smoke.test.ts
git diff --cached --name-only
git commit -m "feat(one): publish feedback component APIs"
```

Confirm `packages/one/package.json` is not in `git diff --cached --name-only`.

### Task 9: Typed feedback documentation, static previews, and theme tokens

**Files:**

- Create: `packages/one/docs/app/content/feedback.ts`
- Modify: `packages/one/docs/app/content/index.ts`
- Modify: `packages/one/docs/app/content/types.ts`
- Modify: `packages/one/docs/app/content/home.ts`
- Modify: `packages/one/docs/app/components/DocArticle.ts`
- Modify: `packages/one/docs/app/styles.ts`
- Modify: `packages/one/docs/app/content/theme-tokens.ts`
- Test: `packages/one/tests/docs-content.test.ts`
- Test: `packages/one/tests/docs-app.test.ts`
- Test: `packages/one/tests/docs-build.test.ts`

**Interfaces:**

- Consumes public components plus internal static overlay views.
- Produces exactly 17 ordered documentation routes and typed demo names `alert`, `message`, `dialog`, `tooltip`.

- [ ] **Step 1: Extend route, content, token, and static-preview tests**

Append these exact paths to `APPROVED_PATHS`:

```ts
'/components/feedback/',
'/components/feedback/alert/',
'/components/feedback/message/',
'/components/feedback/dialog/',
'/components/feedback/tooltip/',
```

Change the route/build count assertions from 12 to 17. Add API-content assertions for all public props, Message service methods, Dialog Promise semantics, Tooltip 12 placements and triggers. Extend the runtime token source list with `ONE_ALERT_STYLES`, `ONE_MESSAGE_STYLES`, `ONE_DIALOG_STYLES`, and `ONE_TOOLTIP_STYLES` so the theming table remains exact.

Add docs-app assertions that each route renders its real `.one-alert`, `.one-message`, `.one-dialog`, or `.one-tooltip__bubble` preview and a matching `data-one-demo` hydration root.

- [ ] **Step 2: Run docs tests and verify route/demo/token failures**

Run: `bun test packages/one/tests/docs-content.test.ts packages/one/tests/docs-app.test.ts packages/one/tests/docs-build.test.ts`

Expected: FAIL because feedback pages and render branches are missing.

- [ ] **Step 3: Add typed feedback pages and exact API tables**

Create `feedback.ts` with one category overview and four component pages. Use orders 8–12 so existing component orders remain stable. Each page must include heading, description, interactive demo, copyable TypeScript example, API table, events/services table, keyboard behavior, and ARIA notes.

Extend the demo union and `demo()` parameter to include the four new names. Import and spread `feedbackPages` after `formPages` in content index. Add links for all four components on the home page.

- [ ] **Step 4: Add static preview branches and component styles**

Import `OneAlert` for its inline preview. Import internal `MessageOverlay`, `DialogOverlay`, and `TooltipBubble` for static-only previews with timers disabled and fixed example state; do not call Host or services during static document rendering. Extend `oneDocsStyles` with all four component style arrays through `oneStylesToSheet`.

Add every new runtime CSS variable to `theme-tokens.ts` with the exact fallback string used by component styles and a description longer than four characters.

- [ ] **Step 5: Run docs content, app, build, and type checks**

Run: `bun test packages/one/tests/docs-content.test.ts packages/one/tests/docs-app.test.ts packages/one/tests/docs-build.test.ts && bunx tsc --noEmit --project packages/one/tsconfig.json`

Expected: PASS with 17 pages.

- [ ] **Step 6: Commit typed docs**

```sh
git add packages/one/docs/app/content packages/one/docs/app/components/DocArticle.ts packages/one/docs/app/styles.ts packages/one/tests/docs-content.test.ts packages/one/tests/docs-app.test.ts packages/one/tests/docs-build.test.ts
git commit -m "docs(one): document feedback and overlay APIs"
```

### Task 10: Interactive demos, README examples, build, and final verification

**Files:**

- Create: `packages/one/docs/app/demos/AlertDemo.ts`
- Create: `packages/one/docs/app/demos/MessageDemo.ts`
- Create: `packages/one/docs/app/demos/DialogDemo.ts`
- Create: `packages/one/docs/app/demos/TooltipDemo.ts`
- Modify: `packages/one/docs/app/client.ts`
- Modify: `packages/one/docs/app/styles.ts`
- Modify: `packages/one/tests/docs-client.test.ts`
- Modify: `packages/one/README.md`
- Modify: `packages/one/README-zh.md`

**Interfaces:**

- Consumes all final public APIs.
- Produces user-visible interactive docs and published README usage.

- [ ] **Step 1: Write failing demo hydration tests**

Extend the mounting test with four roots and four class assertions. Add behavior tests:

```ts
it('opens and closes command-created feedback demos', async () => {
  document.body.innerHTML = [
    '<div data-one-demo="message"></div>',
    '<div data-one-demo="dialog"></div>',
  ].join('');
  mountOneDocsClient();
  (
    document.querySelector('[data-one-open-message]') as HTMLButtonElement
  ).click();
  expect(document.body.querySelector('.one-message')?.textContent).toContain(
    '保存成功'
  );
  (
    document.querySelector('[data-one-open-dialog]') as HTMLButtonElement
  ).click();
  expect(document.body.querySelector('[role="dialog"]')).toBeTruthy();
  (document.querySelector('.one-dialog__cancel') as HTMLButtonElement).click();
  expect(document.body.querySelector('[role="dialog"]')).toBeNull();
});
```

Add Alert close and action assertions. Add Tooltip trigger, placement selector, edge-flip result, click/manual modes, and `aria-describedby` assertions.

- [ ] **Step 2: Run docs-client tests and verify missing demos**

Run: `bun test packages/one/tests/docs-client.test.ts`

Expected: FAIL because the demo constructors and names are absent.

- [ ] **Step 3: Implement four focused demo components and register them**

`AlertDemo` renders all four variants and one closable Alert. `MessageDemo` has buttons for success, warning, update, and closeAll and uses `duration: 0` for stable docs behavior. `DialogDemo` shows controlled Dialog, async confirm, and a bounded custom-container example. `TooltipDemo` provides placement and trigger selectors, a viewport-edge trigger, and visible requested/final placement output.

Import all four in `client.ts`, extend `DemoName`, `DEMOS`, and `isDemoName`. Add docs-only layout rules for stacks, dialog custom-container height, and Tooltip edge sandbox without changing component runtime styles.

- [ ] **Step 4: Update both READMEs with category and minimal service examples**

Add the four feedback components to the category list. Include these exact minimum usage shapes in English and Chinese prose:

```ts
oneMessage.success('Saved');

const confirmed = await oneDialog.confirm({
  title: 'Delete item?',
  description: 'This action cannot be undone.',
});
```

Also include one declarative `OneAlert` and one `OneTooltip` example using exported APIs only. Do not document internal overlay views or classes.

- [ ] **Step 5: Run focused docs and README contracts**

Run: `bun test packages/one/tests/docs-client.test.ts packages/one/tests/docs-content.test.ts packages/one/tests/docs-app.test.ts && bunx tsc --noEmit --project packages/one/tsconfig.json`

Expected: PASS.

- [ ] **Step 6: Run full feature verification**

Run these commands separately and inspect every exit code:

```sh
bun test packages/one/tests/overlay.test.ts packages/one/tests/positioner.test.ts packages/one/tests/alert.test.ts packages/one/tests/message.test.ts packages/one/tests/dialog.test.ts packages/one/tests/tooltip.test.ts
bun test packages/one --timeout 15000
bunx tsc --noEmit --project packages/one/tsconfig.json
bun run --cwd packages/one build
bun run --cwd packages/one docs:build
bun pm pack --cwd packages/one --dry-run
bunx prettier --check packages/one docs/superpowers/specs docs/superpowers/plans
git diff --check
```

Expected feature result: all new component, overlay, docs, type, build, pack, and formatting checks pass. If the full package suite reports only the pre-existing package peer-range mismatch, record its exact failure separately and confirm it is unchanged from preflight; do not alter or stage `packages/one/package.json`.

- [ ] **Step 7: Commit docs demos and README work**

```sh
git status --short
git add packages/one/docs/app/demos packages/one/docs/app/client.ts packages/one/docs/app/styles.ts packages/one/tests/docs-client.test.ts packages/one/README.md packages/one/README-zh.md
git diff --cached --name-only
git commit -m "docs(one): add interactive feedback component demos"
```

Confirm the staged list excludes `packages/one/package.json`, generated `packages/one/dist`, and `packages/one/docs/dist`.

## Completion Checklist

- [ ] Four public feedback components and two imperative services are exported.
- [ ] Public component anchors/triggers remain stable across parent rerenders.
- [ ] Body and custom-container Host lifecycles clean up without leaked records, listeners, timers, observers, focus state, or scroll locks.
- [ ] Tooltip passes all 12 placement, flip, shift, and update tests.
- [ ] The feedback category lists the exact four components.
- [ ] Documentation contains 17 routes and four working new demos.
- [ ] No new runtime dependency or TSone public API change was introduced.
- [ ] `packages/one/package.json` remains user-owned and unstaged.
- [ ] Verification output distinguishes feature results from the known peer-range baseline mismatch.
