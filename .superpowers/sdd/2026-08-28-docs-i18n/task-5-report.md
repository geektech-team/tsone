# Task 5 Report: Complete the English Catalog and Enforce Strict Parity

## Status

GREEN. The English documentation now has 14 independent static typed-content
pages, and the documentation registry builds and validates both locale catalogs
at module initialization.

## Scope

- Added static English `Examples` and `Contributing` pages.
- Added the 14-page English source-page aggregator in Chinese catalog order.
- Added `DocCatalog`, catalog construction, English CJK rejection, localized
  search paths, and bidirectional missing/extra route parity validation.
- Added locale-aware catalog lookup while preserving Chinese-default
  `docPages`, `searchEntries`, and `findDocPage` aliases.
- Added coverage for complete English pages, 14-page parity, missing and extra
  routes, CJK rejection, base page validation errors, localized search
  isolation, and localized page lookup.

## RED

Command:

```bash
bun test packages/tsone/tests/docs-locales.test.ts packages/tsone/tests/docs-content.test.ts
```

Result: exit 1, `0 pass`, `2 fail`. The failures were the intended missing
feature boundaries:

- `Cannot find module '../docs/app/content/en/contributing'`
- `Export named 'docCatalogs' not found in module .../content/index.ts`

No production implementation had been added before this run.

## GREEN

Focused catalog tests after implementation:

```bash
bun test packages/tsone/tests/docs-locales.test.ts packages/tsone/tests/docs-content.test.ts
```

Result: exit 0, `27 pass`, `0 fail`, `123 expect()` calls.

Brief-required regression set:

```bash
bun test packages/tsone/tests/docs-locales.test.ts packages/tsone/tests/docs-content.test.ts packages/tsone/tests/public-api-docs.test.ts
```

Result: exit 0, `31 pass`, `0 fail`, `203 expect()` calls.

Additional verification:

```bash
bunx tsc --noEmit
bunx eslint packages/tsone/docs/app/content/en/examples.ts packages/tsone/docs/app/content/en/contributing.ts packages/tsone/docs/app/content/en/index.ts packages/tsone/docs/app/content/catalog.ts packages/tsone/docs/app/content/index.ts packages/tsone/tests/docs-locales.test.ts packages/tsone/tests/docs-content.test.ts
git diff --check -- packages/tsone/docs/app/content packages/tsone/tests/docs-locales.test.ts packages/tsone/tests/docs-content.test.ts
bun test
bun run docs:build
```

Results:

- TypeScript check: exit 0.
- Task-file ESLint: exit 0.
- Diff whitespace check: exit 0.
- Full suite: `142 pass`, `0 fail`, `564 expect()` calls.
- Static documentation build: exit 0.

## Self-Review

- English content imports no Chinese content and performs no runtime mapping.
- `enSourcePages` aggregates home, guide, API, examples, and contributing in
  the same order as `zhSourcePages`.
- Both catalogs contain the same 14 normalized logical routes and ordering.
- The four English example code blocks exactly match the complete Chinese
  source examples at 34, 77, 176, and 153 lines; the full form and list code is
  present.
- English contributing content preserves the Chinese page's block structure,
  Bun/Git/docs commands, typed-content rules, and technical identifiers.
- English content contains no characters matched by
  `/[\u3400-\u9fff]/u`; `createDocCatalog('en', ...)` rejects the first page
  that does.
- `validateDocPages` remains the sole duplicate, empty route, and empty content
  validator; catalog tests confirm its exact errors propagate.
- Parity checks reference-to-candidate missing routes first, then
  candidate-to-reference extra routes, with the candidate locale and first
  offending logical route in each error.
- `DocPage.path` remains logical for both locales. Only English search entry
  paths receive `/en` localization.
- Chinese compatibility exports are aliases of `docCatalogs.zh` and retain
  normalized lookup behavior.
- Only task files and this report are included in the task commit; unrelated
  dirty work remains untouched.

## Attention

The repository-wide `bun run lint` command still exits 1 because the existing,
unmodified `packages/tsone/docs/app/content/en/guide.ts` has 1,137
`prettier/prettier` errors. Task-file lint, all tests, type checking, and the
documentation build pass. This baseline formatting debt was intentionally left
outside task 5's file boundary.
