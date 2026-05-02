# Q11 — Conversion preview shape

**Date:** 2026-04-28
**Task:** Display a preview panel in the editor showing how legacy `description.body` will be split into bullets before applying the conversion.

## The ambiguity

Two reasonable preview shapes:
1. **Aggregate** — one combined list of "all N bullets that will be created", sorted by step.
2. **Per-step grouped** — one card per step showing source body + existing bullets + new bullets + drop warnings.

## Inference applied

Chose **option 2: per-step grouped** card layout. Reasons:
- Authors think in steps, not in flat bullet lists. They need to see *which step gets which fragment* to trust the migration.
- Per-step view naturally surfaces the append-vs-replace behaviour (existing bullets are listed in muted gold, new ones in cream) and makes the 6-cap visible per-row.
- Aggregate would hide the 6-cap dropped warnings — a critical signal for content fidelity.

## Implementation
- New `buildStepPreviews(slide)` helper that mirrors `normalize3DBullets`'s append-and-cap rules exactly (single source of truth — both compute on the same data).
- Preview renders inside the existing ember banner, scrollable (`max-h-72`) so many-step decks don't push the editor off-screen.
- Shows for each step: label, `existing+new/6` count, source `<pre>` block, ordered list (existing in `gold/55`, new in `cream`), and ember warnings for dropped fragments or saturated caps.
- Header summary: total new bullets + total dropped (in ember when > 0).
- Removed unused `countLegacyBodies` helper now that `buildStepPreviews` covers both paths.

## Reviewable later
If the per-step view feels too dense for slides with many steps, add a collapse-by-default `<details>` wrapper around each card.
