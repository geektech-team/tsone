# TransitionGroup List Animation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a public `TransitionGroup` class component that animates keyed list items as they enter and exit, with six built-in animation types and configurable duration.

**Architecture:** `TransitionGroup` converts public props into an internal specialized HTML VNode. `TransitionGroupRenderStrategy` extends the existing element strategy and owns keyed child reconciliation, while a composed `ListAnimationController` owns Web Animations presets, cancellation, and reduced-motion degradation.

**Tech Stack:** TypeScript strict mode, Bun, `bun:test`, Happy DOM, browser Web Animations API.

**Spec:** `packages/tsone/docs/superpowers/specs/2026-08-29-transition-group-animation-design.md`

## Global Constraints

- Keep `@geektech/tsone` browser runtime free of external production dependencies.
- Preserve the class-component model and strategy-based renderer; do not introduce JSX, SSR, an animation library, or a build-system change.
- Public animation types are exactly `fade`, `slide-up`, `slide-down`, `slide-left`, `slide-right`, and `scale`.
- `tag` defaults to `div`, `type` defaults to `fade`, `duration` defaults to `300`, and easing is fixed to `ease`.
- Direct children must be keyed VNodes; text children, missing keys, and duplicate keys throw.
- Initial children and later additions animate; removals remain mounted until exit finishes.
- Respect `prefers-reduced-motion: reduce`; degrade immediately when Web Animations is unavailable or the child root is not an `HTMLElement`.
- Reordering reuses and moves DOM without an enter, exit, FLIP, or stagger animation.
- Preserve all existing dirty work. Before animation work, checkpoint the already verified tag-helper change separately because its tests and docs overlap this plan.
- Follow strict red-green-refactor for new behavior, using Bun commands from the repository root.

## File Structure

- Create `packages/tsone/lib/core/renderer/element-strategy.ts`: existing generic HTML element rendering and protected child lifecycle hooks.
- Create `packages/tsone/lib/core/animation/types.ts`: public animation props/types plus the internal animation-group VNode and validation helpers.
- Create `packages/tsone/lib/core/animation/TransitionGroup.ts`: public class component only.
- Create `packages/tsone/lib/core/animation/list-animation-controller.ts`: presets, Web Animations execution, cancellation, and reduced-motion checks.
- Create `packages/tsone/lib/core/animation/transition-group-strategy.ts`: keyed animated child reconciliation and delayed unmount.
- Create `packages/tsone/lib/core/animation/index.ts`: public animation exports.
- Modify `packages/tsone/lib/core/renderer.ts`: import/register/re-export the extracted element strategy and register the specialized strategy before it.
- Modify `packages/tsone/lib/core/index.ts`: export the public animation module.
- Create `packages/tsone/tests/transition-group.test.ts`: public component, DOM ordering, lifecycle, race, validation, and fallback behavior.
- Create `packages/tsone/tests/list-animation-controller.test.ts`: literal preset keyframe contracts and reverse exit behavior.
- Modify `packages/tsone/tests/component-types.test.ts`: compile public `TransitionGroup` props and animation type usage.
- Modify `packages/tsone/tests/public-api-docs.test.ts`: enforce root export and bilingual documentation contracts.
- Modify `packages/tsone/README.md`, `packages/tsone/README-zh.md`, `packages/tsone/docs/app/content/en/api.ts`, and `packages/tsone/docs/app/content/zh/api.ts`: document the feature.

---

### Task 0: Checkpoint the Completed Tag-Helper Work

**Files:**

- Existing changes only: `packages/tsone/lib/core/vnode.ts`
- Existing changes only: `packages/tsone/tests/vnode-tags.test.ts`
- Existing changes only: `packages/tsone/tests/component-types.test.ts`
- Existing changes only: `packages/tsone/tests/public-api-docs.test.ts`
- Existing changes only: `packages/tsone/README.md`
- Existing changes only: `packages/tsone/README-zh.md`
- Existing changes only: `packages/tsone/docs/app/content/en/api.ts`
- Existing changes only: `packages/tsone/docs/app/content/zh/api.ts`

**Interfaces:**

- Consumes: the previously completed `Tag(tag, options)` and common HTML helper implementation.
- Produces: a clean baseline commit so later animation hunks can be reviewed and committed independently.

- [ ] **Step 1: Verify the existing tag-helper change without editing it**

Run:

```bash
bun test packages/tsone/tests/vnode-tags.test.ts packages/tsone/tests/component-types.test.ts packages/tsone/tests/public-api-docs.test.ts
git diff --check
```

Expected: all tests pass, `git diff --check` exits `0`, and no animation files exist yet.

- [ ] **Step 2: Commit only the verified predecessor change**

```bash
git add packages/tsone/lib/core/vnode.ts \
  packages/tsone/tests/vnode-tags.test.ts \
  packages/tsone/tests/component-types.test.ts \
  packages/tsone/tests/public-api-docs.test.ts \
  packages/tsone/README.md \
  packages/tsone/README-zh.md \
  packages/tsone/docs/app/content/en/api.ts \
  packages/tsone/docs/app/content/zh/api.ts
git commit -m "feat: add common HTML tag helpers"
```

Expected: the animation design and implementation-plan commits remain separate; no unrelated path is staged.

---

### Task 1: Extract the Element Strategy and Add Child Lifecycle Hooks

**Files:**

- Create: `packages/tsone/lib/core/renderer/element-strategy.ts`
- Modify: `packages/tsone/lib/core/renderer.ts:1-650`
- Test: `packages/tsone/tests/framework-plan.test.ts`

**Interfaces:**

- Consumes: `RenderStrategy<HTMLNode>`, `RenderRuntimeContext`, `ModelBindingController`, renderer prop helpers, and current keyed diff behavior.
- Produces: `ElementRenderStrategy` with protected `mountChildren`, `updateChildren`, and `unmountChildren` methods for the animation specialization.

- [ ] **Step 1: Record the green characterization baseline**

Run:

```bash
bun test packages/tsone/tests/framework-plan.test.ts packages/tsone/lib/core/__tests__/form.test.ts
```

Expected: existing element rendering, keyed diff, listeners, directions, and form bindings pass before the refactor.

- [ ] **Step 2: Extract the class without changing behavior**

Move `ElementRenderStrategy` and its element-only imports from `core/renderer.ts` to `core/renderer/element-strategy.ts`. Preserve the existing props, listener, model, duplicate-key, and keyed-diff code. Make the class generic so the specialization can use a narrower VNode type:

```ts
export class ElementRenderStrategy<TNode extends HTMLNode = HTMLNode>
  implements RenderStrategy<TNode>
{
  public matches(vnode: Renderable): vnode is TNode {
    return typeof vnode === 'object' && vnode !== null && isHTMLNode(vnode);
  }
}
```

Keep the existing `mount`, `patch`, `unmount`, props, listeners, directions, and diff helpers inside this generic class.

Replace the three inline child lifecycle blocks with these protected hooks, using `TNode` in the parent-VNode positions:

```ts
protected mountChildren(
  element: HTMLElement,
  vnode: TNode,
  context: RenderRuntimeContext
): void {
  (vnode.children ?? []).forEach((child) => {
    element.appendChild(context.renderer.mount(child, context));
  });
}

protected updateChildren(
  element: HTMLElement,
  oldVNode: TNode,
  newVNode: TNode,
  context: RenderRuntimeContext
): void {
  const oldChildren = oldVNode.children ?? [];
  const newChildren = newVNode.children ?? [];
  this.updateOrdinaryChildren(element, oldChildren, newChildren, context);
}

protected unmountChildren(
  element: HTMLElement,
  vnode: TNode,
  context: RenderRuntimeContext
): void {
  (vnode.children ?? []).forEach((child, index) => {
    const childNode = element.childNodes[index];
    if (childNode) {
      context.renderer.unmount(child, childNode, context);
    }
  });
}
```

Rename the current private `updateChildren(element, oldChildren, newChildren, context)` implementation to `private updateOrdinaryChildren(...)` without changing its body. Call `this.mountChildren(element, vnode, context)` from `mount`, `this.updateChildren(element, oldVNode, newVNode, context)` from `patch`, and `this.unmountChildren(element, vnode, context)` from `unmount`. Passing parent VNodes through the hooks lets the specialized strategy read animation configuration without mutable global or re-entrant temporary state.

In `core/renderer.ts`, import the class and preserve its public export:

```ts
import { ElementRenderStrategy } from './renderer/element-strategy';
export { ElementRenderStrategy } from './renderer/element-strategy';
```

- [ ] **Step 3: Run the characterization tests**

Run:

```bash
bun test packages/tsone/tests/framework-plan.test.ts packages/tsone/lib/core/__tests__/form.test.ts
bunx tsc --noEmit
```

Expected: all tests and type checking pass with identical ordinary-element behavior.

- [ ] **Step 4: Commit the renderer refactor**

```bash
git add packages/tsone/lib/core/renderer.ts packages/tsone/lib/core/renderer/element-strategy.ts
git commit -m "refactor: extract element render strategy"
```

---

### Task 2: Add the Public TransitionGroup Component and Validation

**Files:**

- Create: `packages/tsone/lib/core/animation/types.ts`
- Create: `packages/tsone/lib/core/animation/TransitionGroup.ts`
- Create: `packages/tsone/lib/core/animation/index.ts`
- Create: `packages/tsone/tests/transition-group.test.ts`
- Modify: `packages/tsone/lib/core/index.ts`
- Modify: `packages/tsone/tests/component-types.test.ts`

**Interfaces:**

- Consumes: `Component`, `HTMLNode`, `HTMLProps`, `EventListeners`, and keyed `VNode` children.
- Produces: `TransitionGroup`, `TransitionGroupProps`, `TransitionAnimationType`, `TransitionGroupNode`, `TransitionGroupOptions`, `isTransitionGroupNode`, and `validateTransitionGroupChildren`.

- [ ] **Step 1: Write failing public API and validation tests**

Add tests that mount the public component through the real renderer:

```ts
it('renders the default transition group wrapper', () => {
  const container = document.createElement('div');
  const group = new TransitionGroup({
    children: [{ tag: 'span', key: 'first', children: ['First'] }],
  });

  group.mount(container);

  expect(container.firstElementChild?.tagName).toBe('DIV');
  expect(container.textContent).toBe('First');
});

it('rejects direct children without keys', () => {
  const group = new TransitionGroup({
    children: [{ tag: 'span', children: ['Missing key'] }],
  });

  expect(() => group.mount(document.createElement('div'))).toThrow(
    'TransitionGroup children must have unique keys'
  );
});
```

Extend the temporary TypeScript consumer in `component-types.test.ts`:

```ts
import { TransitionAnimationType, TransitionGroup } from 'tsone-source';

const animationType: TransitionAnimationType = 'slide-up';
const animatedList: VNode = {
  component: TransitionGroup,
  props: { tag: 'ul', type: animationType, duration: 240 },
  children: [{ tag: 'li', key: 'one', children: ['One'] }],
};
void animatedList;
```

- [ ] **Step 2: Run tests to verify RED**

Run:

```bash
bun test packages/tsone/tests/transition-group.test.ts packages/tsone/tests/component-types.test.ts
```

Expected: FAIL because `TransitionGroup` and its public types are not exported.

- [ ] **Step 3: Implement types, normalization, and the class component**

Define the public and internal contracts in `animation/types.ts`:

```ts
export const TRANSITION_ANIMATION_TYPES = [
  'fade',
  'slide-up',
  'slide-down',
  'slide-left',
  'slide-right',
  'scale',
] as const;

export type TransitionAnimationType =
  (typeof TRANSITION_ANIMATION_TYPES)[number];

export interface TransitionGroupOptions {
  type: TransitionAnimationType;
  duration: number;
}

export interface TransitionGroupProps {
  tag?: string;
  type?: TransitionAnimationType;
  duration?: number;
  elementProps?: HTMLProps;
  listeners?: EventListeners;
  children?: VNode[];
}

export interface TransitionGroupNode extends HTMLNode {
  transitionGroup: TransitionGroupOptions;
  children?: VNode[];
}
```

Add runtime validation with exact rules:

```ts
export function normalizeTransitionGroupProps(
  props: TransitionGroupProps
): Required<Pick<TransitionGroupProps, 'tag' | 'type' | 'duration'>> {
  const tag = (props.tag ?? 'div').trim();
  const type = props.type ?? 'fade';
  const duration = props.duration ?? 300;

  if (!tag.trim()) throw new Error('TransitionGroup tag must not be empty');
  if (!TRANSITION_ANIMATION_TYPES.includes(type)) {
    throw new Error(`Unknown TransitionGroup animation type "${type}"`);
  }
  if (!Number.isFinite(duration) || duration < 0) {
    throw new Error(
      'TransitionGroup duration must be a non-negative finite number'
    );
  }

  return { tag, type, duration };
}
```

`validateTransitionGroupChildren` must reject strings, missing keys, and duplicate keys before any child mounts, while `isTransitionGroupNode` supplies the renderer predicate:

```ts
export function validateTransitionGroupChildren(
  children: Array<VNode | string>
): VNode[] {
  const keys = new Set<string | number>();

  return children.map((child) => {
    if (
      typeof child === 'string' ||
      child.key === undefined ||
      keys.has(child.key)
    ) {
      throw new Error('TransitionGroup children must have unique keys');
    }

    keys.add(child.key);
    return child;
  });
}

export function isTransitionGroupNode(
  vnode: unknown
): vnode is TransitionGroupNode {
  return (
    typeof vnode === 'object' &&
    vnode !== null &&
    'transitionGroup' in vnode &&
    isHTMLNode(vnode as VNode)
  );
}
```

Implement `TransitionGroup` as a thin class:

```ts
export class TransitionGroup extends Component<TransitionGroupProps> {
  protected initState(): object {
    return {};
  }

  protected initStyles(): void {}

  protected render(): TransitionGroupNode {
    const { tag, type, duration } = normalizeTransitionGroupProps(this.props);
    const children = this.props.children ?? [];
    validateTransitionGroupChildren(children);

    return {
      tag,
      props: this.props.elementProps,
      listeners: this.props.listeners,
      children,
      transitionGroup: { type, duration },
    };
  }
}
```

Export the component and public types from `animation/index.ts`, then add `export * from './animation';` to `core/index.ts`.

- [ ] **Step 4: Run tests to verify GREEN**

Run:

```bash
bun test packages/tsone/tests/transition-group.test.ts packages/tsone/tests/component-types.test.ts
bunx tsc --noEmit
```

Expected: wrapper, validation, and public type tests pass. At this stage the ordinary element strategy ignores the internal marker, so animation behavior is not yet asserted.

- [ ] **Step 5: Commit the public component contract**

```bash
git add packages/tsone/lib/core/animation/types.ts \
  packages/tsone/lib/core/animation/TransitionGroup.ts \
  packages/tsone/lib/core/animation/index.ts \
  packages/tsone/lib/core/index.ts \
  packages/tsone/tests/transition-group.test.ts \
  packages/tsone/tests/component-types.test.ts
git commit -m "feat: add transition group component contract"
```

---

### Task 3: Implement Animation Presets and Reduced-Motion Degradation

**Files:**

- Create: `packages/tsone/lib/core/animation/list-animation-controller.ts`
- Create: `packages/tsone/tests/list-animation-controller.test.ts`

**Interfaces:**

- Consumes: `TransitionAnimationType` and `TransitionGroupOptions`.
- Produces: `ListAnimationController.playEnter`, `playExit`, `cancel`, and a normalized `ListAnimationRun` result.

- [ ] **Step 1: Write failing literal-keyframe tests**

Install a controllable `HTMLElement.prototype.animate` test double that records the literal keyframes and options and exposes a `finished` promise. Assert behavior, not call counts:

```ts
it('uses fade keyframes for enter and reverses them for exit', () => {
  const element = document.createElement('li');
  const controller = new ListAnimationController();

  const enter = controller.playEnter(element, { type: 'fade', duration: 180 });
  expect(enter?.keyframes).toEqual([{ opacity: 0 }, { opacity: 1 }]);
  expect(enter?.options).toEqual({
    duration: 180,
    easing: 'ease',
    fill: 'both',
  });

  const exit = controller.playExit(element, { type: 'fade', duration: 180 });
  expect(exit?.keyframes).toEqual([{ opacity: 1 }, { opacity: 0 }]);
});
```

Use a literal table for the five other start frames:

```ts
it.each([
  ['slide-up', { opacity: 0, transform: 'translateY(12px)' }],
  ['slide-down', { opacity: 0, transform: 'translateY(-12px)' }],
  ['slide-left', { opacity: 0, transform: 'translateX(12px)' }],
  ['slide-right', { opacity: 0, transform: 'translateX(-12px)' }],
  ['scale', { opacity: 0, transform: 'scale(0.95)' }],
] as const)('uses the %s enter preset', (type, startFrame) => {
  const element = document.createElement('li');
  const run = new ListAnimationController().playEnter(element, {
    type,
    duration: 300,
  });

  expect(run?.keyframes[0]).toEqual(startFrame);
  expect(run?.keyframes[1]).toMatchObject({ opacity: 1 });
});
```

Add reduced-motion and no-API tests that assert `playEnter` and `playExit` return `null`.

- [ ] **Step 2: Run tests to verify RED**

Run:

```bash
bun test packages/tsone/tests/list-animation-controller.test.ts
```

Expected: FAIL because `ListAnimationController` does not exist.

- [ ] **Step 3: Implement the controller**

Define literal presets and normalized runs:

```ts
export interface ListAnimationRun {
  animation: Animation;
  token: symbol;
  keyframes: Keyframe[];
  options: KeyframeAnimationOptions;
  finished: Promise<'finished' | 'cancelled'>;
}

const ENTER_KEYFRAMES: Record<TransitionAnimationType, [Keyframe, Keyframe]> = {
  fade: [{ opacity: 0 }, { opacity: 1 }],
  'slide-up': [
    { opacity: 0, transform: 'translateY(12px)' },
    { opacity: 1, transform: 'translateY(0)' },
  ],
  'slide-down': [
    { opacity: 0, transform: 'translateY(-12px)' },
    { opacity: 1, transform: 'translateY(0)' },
  ],
  'slide-left': [
    { opacity: 0, transform: 'translateX(12px)' },
    { opacity: 1, transform: 'translateX(0)' },
  ],
  'slide-right': [
    { opacity: 0, transform: 'translateX(-12px)' },
    { opacity: 1, transform: 'translateX(0)' },
  ],
  scale: [
    { opacity: 0, transform: 'scale(0.95)' },
    { opacity: 1, transform: 'scale(1)' },
  ],
};
```

The controller keeps a `WeakMap<HTMLElement, ListAnimationRun>`. Starting a new run cancels the current run for that element. Normalize `animation.finished` to `'finished'` or `'cancelled'` so cancellation never leaks an unhandled rejection. `cancel(element)` cancels and deletes only the current run.

Implement the public methods and shared runner with these signatures and state transitions:

```ts
export class ListAnimationController {
  private readonly runs = new WeakMap<HTMLElement, ListAnimationRun>();

  public playEnter(
    element: HTMLElement,
    options: TransitionGroupOptions
  ): ListAnimationRun | null {
    return this.play(element, options, 'enter');
  }

  public playExit(
    element: HTMLElement,
    options: TransitionGroupOptions
  ): ListAnimationRun | null {
    return this.play(element, options, 'exit');
  }

  public cancel(element: HTMLElement): void {
    const current = this.runs.get(element);
    if (!current) return;
    this.runs.delete(element);
    current.animation.cancel();
  }

  private play(
    element: HTMLElement,
    transition: TransitionGroupOptions,
    phase: 'enter' | 'exit'
  ): ListAnimationRun | null {
    this.cancel(element);
    if (!this.canAnimate(element)) return null;

    const enterFrames = ENTER_KEYFRAMES[transition.type];
    const keyframes =
      phase === 'enter' ? [...enterFrames] : [...enterFrames].reverse();
    const options: KeyframeAnimationOptions = {
      duration: transition.duration,
      easing: 'ease',
      fill: 'both',
    };
    const animation = element.animate(keyframes, options);
    const token = Symbol('list-animation');
    const finished = animation.finished.then(
      () => 'finished' as const,
      () => 'cancelled' as const
    );
    const run = { animation, token, keyframes, options, finished };
    this.runs.set(element, run);

    void finished.then((result) => {
      if (this.runs.get(element)?.token !== token) return;
      this.runs.delete(element);
      if (phase === 'enter' && result === 'finished') {
        animation.cancel();
      }
    });

    return run;
  }
}
```

Cancelling a completed enter animation removes the `fill: both` effect so it cannot permanently override user opacity or transform styles. The already normalized `finished` promise has settled before this cleanup.

Use this exact degradation condition:

```ts
private canAnimate(element: HTMLElement): boolean {
  const reduced =
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  return !reduced && typeof element.animate === 'function';
}
```

When `finished` settles, delete the WeakMap entry only if it still points to the same run token. This keeps `cancel(element)` and later animations from deleting each other's state.

- [ ] **Step 4: Run tests to verify GREEN**

Run:

```bash
bun test packages/tsone/tests/list-animation-controller.test.ts
bunx tsc --noEmit
```

Expected: all six presets, exit reversal, cancellation normalization, reduced-motion, and missing-API tests pass.

- [ ] **Step 5: Commit the controller**

```bash
git add packages/tsone/lib/core/animation/list-animation-controller.ts packages/tsone/tests/list-animation-controller.test.ts
git commit -m "feat: add list animation presets"
```

---

### Task 4: Animate Initial and Added Children While Preserving Reorder Identity

**Files:**

- Create: `packages/tsone/lib/core/animation/transition-group-strategy.ts`
- Modify: `packages/tsone/lib/core/renderer.ts:15-35`
- Modify: `packages/tsone/tests/transition-group.test.ts`

**Interfaces:**

- Consumes: `ElementRenderStrategy`, `TransitionGroupNode`, `ListAnimationController`, and `RenderRuntimeContext`.
- Produces: `TransitionGroupRenderStrategy` plus per-wrapper active keyed entry tracking.

- [ ] **Step 1: Write failing initial/add/reorder tests**

Use this stateful host component to render `TransitionGroup` with `each()`:

```ts
interface AnimatedItemState {
  items: Array<{ id: string; label: string }>;
}

class AnimatedListHost extends Component<
  Record<string, never>,
  AnimatedItemState
> {
  protected initState(): AnimatedItemState {
    return { items: [{ id: 'a', label: 'A' }] };
  }

  protected initStyles(): void {}

  protected render(): VNode {
    return {
      component: TransitionGroup,
      props: { tag: 'ul', type: 'slide-up', duration: 200 },
      children: each(
        this.state.items,
        (item) => ({
          tag: 'li',
          props: { 'data-id': item.id },
          children: [item.label],
        }),
        (item) => item.id
      ),
    };
  }
}
```

Assert observable DOM and animation frames:

```ts
it('animates initial and newly added keyed children', () => {
  const container = document.createElement('div');
  const host = new AnimatedListHost();
  host.mount(container);

  expect(animationFor(container.querySelector('[data-id="a"]')!)).toMatchObject(
    {
      keyframes: [
        { opacity: 0, transform: 'translateY(12px)' },
        { opacity: 1, transform: 'translateY(0)' },
      ],
    }
  );

  host.state.items.push({ id: 'b', label: 'B' });
  expect(container.querySelectorAll('li')).toHaveLength(2);
  expect(animationFor(container.querySelector('[data-id="b"]')!)).toBeDefined();
});

it('moves retained keyed nodes without starting another animation', () => {
  const firstNode = container.querySelector('[data-id="a"]');
  finishAllAnimations();
  host.state.items.reverse();

  expect(container.querySelectorAll('li')[1]).toBe(firstNode);
  expect(activeAnimationFor(firstNode!)).toBeUndefined();
});
```

- [ ] **Step 2: Run tests to verify RED**

Run:

```bash
bun test packages/tsone/tests/transition-group.test.ts
```

Expected: FAIL because the internal animation-group VNode still uses the ordinary element strategy and no child animation starts.

- [ ] **Step 3: Implement the specialized strategy**

Define active entries:

```ts
interface TransitionEntry {
  key: string | number;
  vnode: VNode;
  node: Node;
  status: 'active' | 'exiting';
  animationToken?: symbol;
}
```

`TransitionGroupRenderStrategy` must:

```ts
export class TransitionGroupRenderStrategy extends ElementRenderStrategy<TransitionGroupNode> {
  private readonly entries = new WeakMap<
    HTMLElement,
    Map<string | number, TransitionEntry>
  >();
  private readonly animations = new ListAnimationController();

  public matches(vnode: Renderable): vnode is TransitionGroupNode {
    return isTransitionGroupNode(vnode);
  }

  protected mountChildren(
    element: HTMLElement,
    groupVNode: TransitionGroupNode,
    context: RenderRuntimeContext
  ): void {
    const keyedChildren = validateTransitionGroupChildren(
      groupVNode.children ?? []
    );
    const entries = new Map<string | number, TransitionEntry>();

    keyedChildren.forEach((childVNode) => {
      const node = context.renderer.mount(childVNode, context);
      element.appendChild(node);
      const entry = {
        key: childVNode.key!,
        vnode: childVNode,
        node,
        status: 'active' as const,
      };
      entries.set(entry.key, entry);
      this.playEnter(entry, node, groupVNode.transitionGroup);
    });

    this.entries.set(element, entries);
  }
}
```

Implement the Task 4 update path explicitly. Removed entries are still synchronous in this task; Task 5 replaces that branch with `startExit`:

```ts
protected updateChildren(
  element: HTMLElement,
  _oldVNode: TransitionGroupNode,
  newVNode: TransitionGroupNode,
  context: RenderRuntimeContext
): void {
  const entries = this.entries.get(element) ?? new Map();
  const nextChildren = validateTransitionGroupChildren(newVNode.children ?? []);
  const nextKeys = new Set(nextChildren.map((child) => child.key!));
  const ordered: TransitionEntry[] = [];

  nextChildren.forEach((childVNode) => {
    const key = childVNode.key!;
    const current = entries.get(key);
    if (current) {
      current.node = context.renderer.patch(
        current.vnode,
        childVNode,
        current.node,
        context
      );
      current.vnode = childVNode;
      current.status = 'active';
      ordered.push(current);
      return;
    }

    const node = context.renderer.mount(childVNode, context);
    const entry: TransitionEntry = {
      key,
      vnode: childVNode,
      node,
      status: 'active',
    };
    entries.set(key, entry);
    ordered.push(entry);
    this.playEnter(entry, node, newVNode.transitionGroup);
  });

  entries.forEach((entry, key) => {
    if (nextKeys.has(key)) return;
    context.renderer.unmount(entry.vnode, entry.node, context);
    entry.node.parentNode?.removeChild(entry.node);
    entries.delete(key);
  });

  this.placeActiveEntries(element, ordered);
  this.entries.set(element, entries);
}

private playEnter(
  entry: TransitionEntry,
  node: Node,
  options: TransitionGroupOptions
): void {
  if (!(node instanceof HTMLElement)) return;
  const run = this.animations.playEnter(node, options);
  entry.animationToken = run?.token;
}

private placeActiveEntries(
  wrapper: HTMLElement,
  ordered: TransitionEntry[]
): void {
  let reference: Node | null = null;
  for (let index = ordered.length - 1; index >= 0; index -= 1) {
    wrapper.insertBefore(ordered[index].node, reference);
    reference = ordered[index].node;
  }
}
```

Override `unmountChildren` in Task 4 to call `super.unmountChildren(...)` and then delete the wrapper entry map. Do not derive active positions from raw `childNodes` because Task 5 will retain exiting nodes there.

Register the strategy before `ElementRenderStrategy`:

```ts
this.strategies = [
  new TextRenderStrategy(),
  new ComponentRenderStrategy(),
  new SlotRenderStrategy(),
  new TransitionGroupRenderStrategy(),
  new ElementRenderStrategy(),
];
```

- [ ] **Step 4: Run tests to verify GREEN**

Run:

```bash
bun test packages/tsone/tests/transition-group.test.ts packages/tsone/tests/framework-plan.test.ts
bunx tsc --noEmit
```

Expected: initial/add/reorder tests pass and ordinary keyed diff remains green.

- [ ] **Step 5: Commit enter animation support**

```bash
git add packages/tsone/lib/core/animation/transition-group-strategy.ts packages/tsone/lib/core/renderer.ts packages/tsone/tests/transition-group.test.ts
git commit -m "feat: animate transition group entries"
```

---

### Task 5: Delay Exit Unmount and Handle Cancellation Races

**Files:**

- Modify: `packages/tsone/lib/core/animation/transition-group-strategy.ts`
- Modify: `packages/tsone/tests/transition-group.test.ts`

**Interfaces:**

- Consumes: per-wrapper `TransitionEntry` state and normalized `ListAnimationRun.finished` results.
- Produces: deferred exit cleanup, same-key reactivation, and synchronous group teardown.

- [ ] **Step 1: Write failing exit lifecycle tests**

Add a child component with an `onUnmounted` counter and assert the real lifecycle boundary:

```ts
it('keeps a removed component mounted until its exit animation finishes', async () => {
  host.state.items = [];

  expect(container.querySelector('[data-id="a"]')).toBeTruthy();
  expect(AnimatedItem.unmountedCount).toBe(0);

  finishAnimation(container.querySelector('[data-id="a"]')!);
  await Promise.resolve();

  expect(container.querySelector('[data-id="a"]')).toBeNull();
  expect(AnimatedItem.unmountedCount).toBe(1);
});
```

Add the race, teardown, and fallback tests with the same real host component:

```ts
it('reactivates the same node when an exiting key returns', async () => {
  const original = container.querySelector('[data-id="a"]');
  host.state.items = [];
  host.state.items = [{ id: 'a', label: 'Updated' }];
  await Promise.resolve();

  expect(container.querySelector('[data-id="a"]')).toBe(original);
  expect(original?.textContent).toBe('Updated');
});

it('synchronously cleans active and exiting children when the group unmounts', () => {
  host.state.items = [{ id: 'b', label: 'B' }];
  host.unmount();

  expect(container.childNodes).toHaveLength(0);
  expect(AnimatedItem.unmountedCount).toBe(2);
});

it('removes an exiting child immediately when reduced motion is enabled', () => {
  setReducedMotion(true);
  host.state.items = [];

  expect(container.querySelector('[data-id="a"]')).toBeNull();
  expect(AnimatedItem.unmountedCount).toBe(1);
});
```

Cover the missing-API path independently:

```ts
it('removes an exiting child immediately without Web Animations', () => {
  restoreReducedMotion();
  disableElementAnimate();
  host.state.items = [];

  expect(container.querySelector('[data-id="a"]')).toBeNull();
  expect(AnimatedItem.unmountedCount).toBe(1);
});
```

- [ ] **Step 2: Run tests to verify RED**

Run:

```bash
bun test packages/tsone/tests/transition-group.test.ts
```

Expected: FAIL because removed entries are still synchronously unmounted and same-key exit cancellation is not implemented.

- [ ] **Step 3: Implement delayed exit and token checks**

When a key disappears:

```ts
private startExit(
  wrapper: HTMLElement,
  entry: TransitionEntry,
  options: TransitionGroupOptions,
  context: RenderRuntimeContext
): void {
  entry.status = 'exiting';
  const run =
    entry.node instanceof HTMLElement
      ? this.animations.playExit(entry.node, options)
      : null;

  if (!run) {
    this.finishExit(wrapper, entry, context);
    return;
  }

  entry.animationToken = run.token;
  void run.finished.then((result) => {
    if (
      result === 'finished' &&
      entry.status === 'exiting' &&
      entry.animationToken === run.token
    ) {
      this.finishExit(wrapper, entry, context);
    }
  });
}
```

`finishExit` must call `context.renderer.unmount(entry.vnode, entry.node, context)`, remove the node only when its parent is still the wrapper, and delete the map entry only when the map still points to that exact entry.

Replace the Task 4 retained/removed branches with status-aware logic:

```ts
const current = entries.get(key);
if (current) {
  const wasExiting = current.status === 'exiting';
  if (wasExiting && current.node instanceof HTMLElement) {
    this.animations.cancel(current.node);
  }
  current.status = 'active';
  current.animationToken = undefined;
  current.node = context.renderer.patch(
    current.vnode,
    childVNode,
    current.node,
    context
  );
  current.vnode = childVNode;
  ordered.push(current);
  if (wasExiting) {
    this.playEnter(current, current.node, newVNode.transitionGroup);
  }
  return;
}

entries.forEach((entry, key) => {
  if (!nextKeys.has(key) && entry.status === 'active') {
    this.startExit(element, entry, newVNode.transitionGroup, context);
  }
});
```

Retained active entries do not restart their animation. The cancelled exit completion fails both the token and status guards.

Implement exact exit cleanup:

```ts
private finishExit(
  wrapper: HTMLElement,
  entry: TransitionEntry,
  context: RenderRuntimeContext
): void {
  const entries = this.entries.get(wrapper);
  if (entries?.get(entry.key) !== entry) return;

  context.renderer.unmount(entry.vnode, entry.node, context);
  if (entry.node.parentNode === wrapper) {
    wrapper.removeChild(entry.node);
  }
  entries.delete(entry.key);
}
```

Override `unmountChildren` to iterate all tracked active and exiting entries exactly once:

```ts
protected unmountChildren(
  element: HTMLElement,
  vnode: TransitionGroupNode,
  context: RenderRuntimeContext
): void {
  const entries = this.entries.get(element);
  if (!entries) {
    super.unmountChildren(element, vnode, context);
    return;
  }

  entries.forEach((entry) => {
    if (entry.node instanceof HTMLElement) {
      this.animations.cancel(entry.node);
    }
    context.renderer.unmount(entry.vnode, entry.node, context);
    if (entry.node.parentNode === element) {
      element.removeChild(entry.node);
    }
  });
  entries.clear();
  this.entries.delete(element);
}
```

- [ ] **Step 4: Run tests to verify GREEN**

Run:

```bash
bun test packages/tsone/tests/transition-group.test.ts packages/tsone/tests/framework-plan.test.ts packages/tsone/lib/core/__tests__/component.test.ts
bunx tsc --noEmit
```

Expected: delayed lifecycle, same-key reactivation, reduced-motion fallback, no-API fallback, group teardown, and existing component behavior all pass.

- [ ] **Step 5: Commit exit animation support**

```bash
git add packages/tsone/lib/core/animation/transition-group-strategy.ts packages/tsone/tests/transition-group.test.ts
git commit -m "feat: animate transition group exits"
```

---

### Task 6: Complete Runtime Validation, Documentation, and Release Verification

**Files:**

- Modify: `packages/tsone/tests/transition-group.test.ts`
- Modify: `packages/tsone/tests/public-api-docs.test.ts`
- Modify: `packages/tsone/README.md`
- Modify: `packages/tsone/README-zh.md`
- Modify: `packages/tsone/docs/app/content/en/api.ts`
- Modify: `packages/tsone/docs/app/content/zh/api.ts`

**Interfaces:**

- Consumes: complete public `TransitionGroup` API and all six runtime presets.
- Produces: tested validation edges, searchable bilingual docs, verified build artifacts, and publishable declarations.

- [ ] **Step 1: Add failing edge-contract and documentation tests**

Add literal invalid-input cases:

```ts
it.each([
  [
    { type: 'zoom' as TransitionAnimationType },
    'Unknown TransitionGroup animation type "zoom"',
  ],
  [
    { duration: -1 },
    'TransitionGroup duration must be a non-negative finite number',
  ],
  [
    { duration: Number.NaN },
    'TransitionGroup duration must be a non-negative finite number',
  ],
  [{ tag: ' ' }, 'TransitionGroup tag must not be empty'],
])('rejects invalid transition group props', (props, message) => {
  const group = new TransitionGroup({
    ...props,
    children: [{ tag: 'span', key: 'one' }],
  });
  expect(() => group.mount(document.createElement('div'))).toThrow(message);
});
```

Extend `public-api-docs.test.ts` to require `TransitionGroup`, `TransitionAnimationType`, `slide-up`, `prefers-reduced-motion`, and a keyed `each(...)` example in the English README/component API, plus the root runtime export.

- [ ] **Step 2: Run tests to verify RED**

Run:

```bash
bun test packages/tsone/tests/transition-group.test.ts packages/tsone/tests/public-api-docs.test.ts
```

Expected: validation tests pass if earlier tasks are complete, while documentation assertions fail until the docs are updated.

- [ ] **Step 3: Update bilingual documentation**

Document this public example in both locales, translating prose but preserving executable API names:

```ts
{
  component: TransitionGroup,
  props: { tag: 'ul', type: 'fade', duration: 300 },
  children: each(
    this.state.items,
    (item) => Li({ children: [item.label] }),
    (item) => item.id
  ),
}
```

List all six presets, defaults, required unique keys, initial enter behavior, delayed unmount, automatic `prefers-reduced-motion` degradation, and the explicit absence of reorder/FLIP animation. Add `TransitionGroup` and `TransitionAnimationType` to both README public API lists.

- [ ] **Step 4: Run focused tests and formatting**

Run:

```bash
bunx prettier --check packages/tsone/lib/core/animation packages/tsone/lib/core/renderer.ts packages/tsone/lib/core/renderer/element-strategy.ts packages/tsone/tests/transition-group.test.ts packages/tsone/tests/list-animation-controller.test.ts packages/tsone/tests/component-types.test.ts packages/tsone/tests/public-api-docs.test.ts packages/tsone/README.md packages/tsone/README-zh.md packages/tsone/docs/app/content/en/api.ts packages/tsone/docs/app/content/zh/api.ts
bun test packages/tsone/tests/transition-group.test.ts packages/tsone/tests/list-animation-controller.test.ts packages/tsone/tests/component-types.test.ts packages/tsone/tests/public-api-docs.test.ts packages/tsone/tests/docs-content.test.ts packages/tsone/tests/docs-locales.test.ts
```

Expected: formatting and all focused behavior/type/docs tests pass.

- [ ] **Step 5: Run the full release surface**

Run:

```bash
bun test packages/tsone
bunx tsc --noEmit
bun run --cwd packages/tsone lint
bun run --cwd packages/tsone build
bun test packages/tsone/tests/package-smoke.test.ts
bun pm pack --cwd packages/tsone --dry-run
git diff --check
```

Expected: zero test failures, zero type/lint errors, successful build and package smoke, dry-run archive includes updated runtime and declarations, and no whitespace errors.

- [ ] **Step 6: Commit the documentation and final contracts**

```bash
git add packages/tsone/tests/transition-group.test.ts \
  packages/tsone/tests/public-api-docs.test.ts \
  packages/tsone/README.md \
  packages/tsone/README-zh.md \
  packages/tsone/docs/app/content/en/api.ts \
  packages/tsone/docs/app/content/zh/api.ts
git commit -m "docs: document transition group animations"
```

Run `git status --short` and report any pre-existing changes separately from the completed animation commits.
