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

## Fix Round 1/5: Complete Examples and Contributing Coverage

### Important Finding

The original English Examples/Contributing test sampled a few searchable
tokens. Removing the complete Hello World or Counter example, or deleting
unrelated Contributing sections and commands, could leave those assertions
passing.

### Fix

Modified `packages/tsone/tests/docs-locales.test.ts` only:

- Generalized the existing API structure helper into `docPageStructure`, which
  compares page `path`, `sectionOrder`, and `order`, plus every block in order.
- The block signature covers heading levels, paragraph inline structure, list
  item counts and inline structure, code language/line count/imports/commands,
  callout kind and inline structure, and API table row structure.
- Added corresponding Chinese/English page comparisons for Examples and
  Contributing, including logical links.
- Fixed all six English Examples headings and all four TypeScript code block
  specifications as independent literals: language, line counts
  (`34`, `77`, `176`, `153`), and imports. The complete code blocks must also
  equal their Chinese-page counterparts.
- Fixed all 35 English Contributing headings and all 12 code blocks as
  independent literals, including every Bun, Git, docs, commit-format, and
  commit-example command block.
- Retained English CJK rejection assertions for both pages.

No production implementation remains changed in this fix round.

### Mutation RED

After adding the tests, temporarily removed the complete English Hello World
heading and its 34-line code block from `en/examples.ts`, then ran:

```bash
bun test packages/tsone/tests/docs-locales.test.ts
```

Result: exit 1, `15 pass`, `1 fail`, `67 expect()` calls. The new
`preserves the complete English examples page structure and code` test failed
at the structural comparison and showed the missing level-2 heading and
34-line TypeScript block. The temporary deletion was then restored exactly;
`git diff -- packages/tsone/docs/app/content/en/examples.ts` is empty.

### GREEN

Required verification after restoring the correct content:

```bash
bun test packages/tsone/tests/docs-locales.test.ts packages/tsone/tests/docs-content.test.ts
bunx tsc --noEmit
```

Results:

- Locale/content tests: exit 0, `28 pass`, `0 fail`, `121 expect()` calls.
- TypeScript check: exit 0.

Additional focused checks:

```bash
bunx eslint packages/tsone/tests/docs-locales.test.ts
git diff --check -- packages/tsone/tests/docs-locales.test.ts .superpowers/sdd/2026-08-28-docs-i18n/task-5-report.md
```

Both commands exited 0.
