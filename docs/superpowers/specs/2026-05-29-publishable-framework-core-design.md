# Publishable Framework Core Design

## Context

TSone already has a small TypeScript runtime with reactivity, class-based components, a strategy-based DOM renderer, routing, styles, examples, and Vitest coverage. The next goal is to make the library installable from its package output and fill the most visible runtime gaps for a lightweight open-source framework.

## Scope

This pass focuses on five areas, in this order:

1. Package output that can be built, packed, installed, imported, and type-checked by a consumer.
2. Typed component ergonomics with `Component<Props, State>` while keeping existing component subclasses compatible.
3. Keyed child diffing for stable DOM node identity during reorder, insert, and remove operations.
4. Real named/default slot projection from component children into slot outlets.
5. Dynamic route params for paths such as `/users/:id`.

Out of scope for this pass: SSR, JSX/compiler support, async components, nested routes, navigation guards, devtools, and release automation.

## Architecture

Publishing will use a library-focused TypeScript config and Vite build config so declarations and JavaScript land at the paths declared by `package.json`. Runtime behavior stays in the existing OOP shape: `Component` coordinates lifecycle and state, while `RendererContext` dispatches to render strategies for text, elements, components, and slots. Router matching remains dependency-free and adds a small path-pattern matcher to populate `RouteLocation.params`.

## Testing

Each behavior change gets a failing Vitest test first. Package output also gets a consumer-style smoke test that builds, packs to a temporary cache, installs the tarball into a temporary project, imports `tsone` and `tsone/router`, and runs TypeScript against the consumer.
