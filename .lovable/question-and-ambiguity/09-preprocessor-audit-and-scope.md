# Q09 — Preprocessor: silent body strip + audit verbosity

**Date:** 2026-04-28
**Task:** Implement a deck load preprocessor that converts legacy `description.body` into `description.bullets[]` before schema validation so older decks are fully normalized end-to-end.

## The ambiguities

1. **Empty / whitespace `body` fields** — should they be stripped silently or audited?
2. **Bundled vs imported scope** — should the preprocessor run on both, or only on imported manifests (since bundled JSON is "ours" and a hit there is a content bug)?
3. **Where to surface the audit** — toast at boot? console only? overlay panel?

## Inferences applied

### #1 Empty body → silent strip, no audit entry
- Removing an empty `body: ""` is contract cleanup, not a content migration. Auditing it would clutter the report on every reload of a deck that happens to ship empty placeholder fields.
- The validator still gets a clean shape so it can produce its proper "add bullets[]" error if the description is otherwise empty.

### #2 Run on BOTH bundled and imported decks
- Imported (localStorage) needs it for legacy author data — the obvious case.
- Bundled also gets it because `spec/26-slide-definitions/` has historical files that may still carry `body` in pockets the audit sweep missed. The audit `source: 'bundled'` entry then doubles as a "fix this in source JSON" signal for us, while still allowing the deck to boot cleanly.

### #3 Audit surfacing
- Console `console.info` summary at boot ("Normalized N steps across M slides …") — low-noise, discoverable in dev.
- Exported `bulletNormalizationAudit` array so the contract-issues overlay (or any future audit panel) can list per-slide entries without re-running the migration.
- No toast — would be intrusive on every page load and the migration is invisible to viewers.

## Implementation
- New `src/slides/proseToBullets.ts` (shared splitter) — also imported by `ContentFieldEditor.tsx` to remove drift.
- New `src/slides/normalize3DBullets.ts` (preprocessor + audit type).
- Wired into `src/slides/loader.ts` immediately after `loadActive()` and before the validation loop.
- 6 unit tests in `src/test/normalize3DBullets.test.ts` cover migration, append+cap, string coercion, idempotency, empty-body strip, and non-3D slide skip — all pass.

## Reviewable later
If the user wants the audit visible in the on-screen overlay rather than just the console, expose `bulletNormalizationAudit` to `ContractIssuesOverlay` and add a "Migrated at boot" section.
