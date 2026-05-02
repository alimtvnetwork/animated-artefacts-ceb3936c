# Slide System Specs

Documentation and JSON Schemas for the Riseup Asia slide presentation system.
JSON files in this directory and its subfolders are the **runtime source of truth** —
the React app loads them via `import.meta.glob` and renders accordingly.

## Files

| File                          | Purpose |
|-------------------------------|---------|
| `00-fundamentals.md`          | Per-slide JSON fields + layout contract + authoring checklist. Start here. |
| `02-controller.md`            | Where the controller sits, how it appears/disappears, keyboard shortcuts. |
| `03-animation-rules.md`       | Color rules (no always-on gradients), motion patterns, variety guidance. |
| `04-grid-overview.md`         | Grid/thumbnail overview behavior and shortcuts. |
| `05-presenter-view.md`        | Presenter view layout, sync channel, speaker notes. |
| `06-deck-manifest.md`         | Single-file import/export format for moving decks between projects. |
| `07-theme-system.md`          | Live theme switcher (Noir & Gold ↔ Bright Gold); persisted with deck on export. |
| `08-brand-strip.md`           | Optional deck-wide branded strip above the standard header (logo + tagline). |
| `09-qr-and-hover.md`          | Reusable BrandedQR component (PNG-as-truth, white tile + ink) and lift-hover interaction tokens. |
| `10-deck-preset.md`           | `preset: "premium"` deck opt-in — Ubuntu Bold + clamp sizing + auto-picked white/cream/gold rules. |
| `11-focus-timeline.md`        | Focus-timeline pattern — one step in limelight, neighbors dim. Advances on Next/Prev (presenter-paced). |
| `slide.schema.json`           | JSON Schema (draft-07) for a single slide spec. |
| `deck.schema.json`            | JSON Schema for a deck manifest (`deck.json`). |
| `deck-manifest.schema.json`   | JSON Schema for a portable deck manifest export. |
| `{deck-slug}/`                | One folder per deck (e.g. `showcase/`) — contains `deck.json` + `NN-name.{json,md}`. |

## Quick reference

**Disable a slide** (without deleting it):
```json
{ "enabled": false }
```

**Mark a slide as click-reveal** (hidden from linear flow):
```json
{ "isClickReveal": true, "parentSlide": 2 }
```

**Trigger a click-reveal from a capsule**:
```json
{ "text": "Strategy", "color": "gold", "clickRevealSlide": 4 }
```

**Use solid title color with one-shot shimmer** (preferred over static gradient):
```json
{ "titleStyle": "cream", "titleShimmer": true }
```

## Validating slides locally

The schemas can be plugged into any draft-07-compatible validator
(`ajv`, VS Code's JSON validation, etc.). To enable in-editor hints, add to
`.vscode/settings.json`:

```json
{
  "json.schemas": [
    { "fileMatch": ["spec/slides/*/[0-9][0-9]-*.json"], "url": "./spec/slides/slide.schema.json" },
    { "fileMatch": ["spec/slides/*/deck.json"],         "url": "./spec/slides/deck.schema.json" }
  ]
}
```
