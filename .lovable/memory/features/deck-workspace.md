---
name: deck-workspace
description: /builder is a multi-slide deck workspace with localStorage-persisted DraftDeck; every new slide auto-inherits the deck's preset (premium by default).
type: feature
---

## What

`/builder` is a 3-column deck workspace, not just a single-slide author:

```
┌──────────────┬───────────────────────────┬──────────────────────────┐
│ Deck meta    │ Slide editor              │ Live preview + manifest  │
│ Slide list   │ (per selected slide)      │ JSON                     │
└──────────────┴───────────────────────────┴──────────────────────────┘
```

## Files

- `src/builder/draftDeck.ts` — `useDraftDeck()` hook + DraftDeck shape.
  localStorage key `riseup.deck.draft.v1`. Provides:
  - `updateDeck`, `updateSlide`, `addSlide`, `duplicateSlide`, `removeSlide`, `moveSlide`, `reset`.
  - `applyPresetToSlide()` — strips per-slide `titleStyle` so the deck preset's
    auto-pick wins. Future presets that need to set additional defaults extend
    this seam.
- `src/builder/DeckMetaForm.tsx` — deck name, slug, presenter, theme, preset.
- `src/builder/SlideListSidebar.tsx` — numbered list with add/duplicate/
  delete + ▲/▼ reorder; type picker for new slides.
- `src/pages/BuilderPage.tsx` — orchestrator + manifest export.

## Preset inheritance — the headline behavior

- Default preset on a fresh draft = `premium`.
- Every `addSlide(type)` and `duplicateSlide(n)` calls `applyPresetToSlide`
  with the deck's current preset.
- Changing the deck preset via the form re-applies to **all existing slides**
  (so old per-slide `titleStyle` overrides from a previous preset get cleaned).
- Per-slide explicit overrides are still possible via the "Title style override"
  field in the slide editor (Auto = preset's pick).

## Persistence

- DraftDeck → `localStorage["riseup.deck.draft.v1"]`. Synchronous writes on
  every store mutation. Refreshes survive.
- Reset wipes the storage entry via `clearDraft()`.
- "Load as active" writes the manifest to `IMPORTED_MANIFEST_KEY` and
  navigates to `/1` — same import path the deck menu uses.
- "Export" downloads the manifest as JSON via the existing
  `buildManifest`/`downloadManifest` pipeline.

## Discoverability

Linked from the deck menu (`Wand2` → "Open slide builder").
