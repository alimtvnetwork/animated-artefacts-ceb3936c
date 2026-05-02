---
name: deck-transition-timing-panel
description: /settings panel exposing duration, delay, and easing knobs that override `deck.transitionTiming` for every slide; per-slide content.transitionTiming still wins per-field.
type: feature
---

## What
v0.167 added a "Deck transition timing" section to `/settings` that lets the
presenter pin entrance/exit timing once for every slide in the deck. Each
field is independently nullable — leaving any of the three controls on
"Use deck default" lets the deck JSON (or built-in 550ms expoOut) win for
that field.

## Storage
Three new `PresetSettings` fields (in `src/slides/presetSettings.ts`):
- `transitionDurationMs: number | null` — bounds [0, 2000], step 50.
- `transitionDelayMs: number | null` — bounds [0, 1000], step 25.
- `transitionEasing: TransitionEasingChoice | null` — curated list of 13 named easings (`expoOut` … `linear`).

`null` = "no override; defer to the next level in the chain."

## Resolution
1. `resolveDeckTransitionOverride(settings)` → `TransitionTimingSpec | undefined` (only contains pinned fields).
2. `mergeDeckTiming(deck.transitionTiming, userOverride)` → field-by-field merge.
3. The merged spec is passed to `<SlideStage deckTransitionTiming />`.
4. Inside the stage, `resolveSlideTransitionConfig(slide.content.transitionTiming, deckTransitionTiming)` performs the final per-field merge.

## Precedence (per field, unchanged)
1. `slide.content.transitionTiming` (per-slide JSON)
2. User override from /settings (this panel)
3. `deck.transitionTiming` (deck JSON)
4. Built-in `SLIDE_TRANSITION_CONFIG` (550ms, expoOut, no delay)

## Live update
`SlideDeckPage` subscribes to `subscribePresetSettings` and re-derives the merged
spec whenever any preset changes — the next slide transition uses the new timing
without a reload.

## Files
- `src/slides/presetSettings.ts` — new fields, bounds, `resolveDeckTransitionOverride`, `mergeDeckTiming`.
- `src/pages/SettingsPage.tsx` — new "Deck transition timing" section with three controls + per-field reset.
- `src/pages/SlideDeckPage.tsx` — subscribes to preset changes, merges into `deckTransitionTiming` prop.
