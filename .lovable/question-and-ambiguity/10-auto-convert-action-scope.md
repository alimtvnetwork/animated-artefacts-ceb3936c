# Q10 — Auto-convert action: slide-scoped or deck-scoped?

**Date:** 2026-04-28
**Task:** Add an editor action button to auto-convert legacy `description.body` into `description.bullets[]` and remove `body` from the JSON with a single click.

## The ambiguity

Three reasonable scopes for the button:
1. **Per-step** (already exists from task 06) — manual, granular.
2. **Per-slide** — one click migrates every step on the currently-selected 3D slide.
3. **Whole deck** — one click sweeps every 3D slide in the deck.

User said "an editor action button" (singular, contextual to the editor) — strongly implies slide-scoped, since the editor's primary unit is the selected slide.

## Inference applied

Chose **option 2: slide-scoped** action, rendered as a banner above the Content section. Reasons:
- Matches the editor's mental model (editing one slide at a time).
- Hard-validation already blocks save until ALL 3D slides are clean (task 05), so a missed slide just blocks the next save → user navigates and clicks again. Low friction.
- Deck-scoped action would belong in the top toolbar next to Export — out of place when the user is mid-edit.
- Loader preprocessor (task 09) already covers the "whole deck" case automatically at boot for legacy decks; this button is for *new* prose pasted into the editor.

## Implementation
- New `src/builder/NormalizeBulletsAction.tsx` — dormant unless the selected slide is `StepsChain3DSlide` AND has at least one non-empty `description.body`.
- Reuses the shared `normalize3DBullets()` preprocessor (no logic duplication).
- Deep-clones the slide before mutation to keep the existing reducer pattern as the sole owner of state transitions.
- Toast variants: success ("Migrated N steps, M bullets") vs info ("Cleared empty legacy bodies") for the edge case where every body was whitespace.

## Reviewable later
If the user later wants a deck-wide sweep, expose the same component in the top toolbar with `slides={draft.slides}` and iterate over the audit. The preprocessor already accepts an array of slides — no logic change needed.
