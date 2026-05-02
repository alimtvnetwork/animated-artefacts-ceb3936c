# Subsystem: import-export-json

## Spec Statement
`spec/21-slides-system/llm/CATALOG.json` is the machine-readable source of truth for every enum value. Importing projects validate deck JSON against it before mounting. Cross-project import/export must round-trip without loss.

## Implementation State
- `CATALOG.json` shipped (v1.0.0, 2026-04-30).
- `src/slides/exportSchemas.ts`, `export.ts`, `exportPptx.ts` cover export side.
- `src/slides/checkImportedAssets.ts` covers asset side.
- Tests: `exportSchemas.test.ts`, `schema.test.ts`.

## Gap
- No `validateAgainstCatalog(deck)` runtime helper — Zod schema and CATALOG.json are kept in sync manually.
- CATALOG.json `slideTypes.count` will lag the addendum until Phase 3.

## Severity
Minor.

## Evidence
- spec: `spec/21-slides-system/llm/CATALOG.json`, `28-component-and-animation-catalog.md`
- impl: `src/slides/exportSchemas.ts`
- test: `src/test/exportSchemas.test.ts`, `schema.test.ts`

## Remediation
1. Add `src/slides/validateAgainstCatalog.ts` that diffs Zod enum values against CATALOG.json at boot in dev.
2. Add CI step that fails if `enums.ts` and `CATALOG.json` drift.
