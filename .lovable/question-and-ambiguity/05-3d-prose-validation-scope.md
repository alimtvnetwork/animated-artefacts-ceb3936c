# Q05 — 3D prose hard-validation: builder-only vs runtime-wide

**Date:** 2026-04-28
**Task:** Add hard validation that prevents saving a 3D deck when any step has `description` as prose instead of `description.bullets[]`.

## The ambiguity

"Prevents saving" could mean:
1. **Builder save paths only** (Export, Copy JSON, Load as active) — block at the author's UI.
2. **Runtime loader / contracts** — refuse to boot a deck that contains prose, including legacy JSON files already on disk.

## Inference applied

Chose **option 1: builder save paths**.

### Why
- `src/slides/contracts.ts` (lines 89–131) explicitly documents `body` as "LEGACY — auto-split to bullets at render; migrate". Promoting it to a runtime hard-fail would crash existing decks (the spec/26-slide-definitions/ directory still contains migrated files, but a sweep miss would brick the app).
- Memory rule: "Spec-first … JSON is source of truth at runtime." A boot-time crash on a previously-valid deck would violate the principle that runtime tolerates what the builder produces, not the inverse.
- The user's intent is clearly authoring hygiene — they want **new** content to be keyword-only. The builder is the place that creates new content.

### Implementation
- New module `src/builder/validate3DSteps.ts` with `findStepsChain3DProseErrors`, `formatProseErrors`, `assertNoStepsChain3DProse`.
- Wired into all three save paths in `src/pages/BuilderPage.tsx` via a shared `guard3DProse()` helper (Export, Copy JSON, Load as active).
- Render-time contracts unchanged — legacy decks still boot.

## Reviewable later

If the user wants this promoted to the Zod runtime contract too, replace `body: z.string().optional()` in `Step3DDescription` with a `.refine` that rejects non-empty body strings, and remove the legacy auto-split path in `StepsChain3DSlide.tsx`.
