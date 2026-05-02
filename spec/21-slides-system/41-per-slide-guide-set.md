# spec/slides/41 — Per-slide guide-set dropdown

**Status**: shipped in v0.77.0
**Companion to**: spec 35 (live alignment guide), spec 38 (preview guide)

## Summary

Adds a small dropdown to the live `AlignmentGuideOverlay` HUD that lets
the author pick which guide set is shown FOR THE CURRENT SLIDE ONLY.
Useful when one slide needs to show all three guides (Logo + Body + Rail)
while a neighbor only needs the Body guide for typography alignment
checking.

The selection is keyed by `location.pathname` so each `/N` route remembers
its own choice. The `SlidePreviewAlignmentOverlay` honors the same
selection for the active route, so what you see live and what you see in
the preview tile are always in sync.

## Options

| Value  | Behavior                                              |
|--------|-------------------------------------------------------|
| `all`  | Show all three guides (default)                       |
| `logo` | Show only the gold logo-edge guide                    |
| `body` | Show only the cream body-grid guide                   |
| `rail` | Show only the ember timeline-rail guide (preview only)|
| `none` | Hide guides on THIS slide, keep the global toggle ON  |

## Storage

In-memory `Map<slideKey, GuideSet>` in `slideGuideOverrides.ts`. NOT
persisted to localStorage and NOT serialized into deck JSON — these are
authoring-time choices that should never reach a final exported deck.
The map clears when the user reloads the page; that's intentional.

## Resolution order

```
per-slide override → 'all' (default)
```

The global `showAlignmentGuide` toggle in `/settings` still gates
everything: when OFF, no overlay renders and the dropdown is unreachable
(but its stored value is preserved for the next time guides are turned
back on).

## UI placement

Inside the existing top-right HUD, between the title row and the px
readout block:

```
┌──────────────────────────────────┐
│ ● ALIGNMENT GUIDE        /3      │
│ Show: [ All three ▾ ]            │
│ logo.x: 16                       │
│ body.x: 18                       │
│ Δ: +2px                          │
└──────────────────────────────────┘
```

The `<select>` gets `pointer-events-auto` while the rest of the overlay
stays `pointer-events-none` — clicks on the slide pass through, clicks
on the dropdown work normally.

## Verification

1. `/settings` → enable "Alignment guide".
2. Navigate to `/3`. All three guides visible.
3. Open the HUD dropdown → "Body only". Logo + Rail guides disappear,
   Body guide remains. The slide-key chip shows `/3`.
4. Navigate to `/2`. Dropdown resets to `All three` (per-slide
   independent).
5. Navigate back to `/3`. Selection is remembered: still "Body only".
6. Open `/builder` and view a SlidePreview tile — the same per-slide
   selection applies (preview reads `window.location.pathname`).
7. Reload the page. All overrides clear (intentional in-memory storage).
