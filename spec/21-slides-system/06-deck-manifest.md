# 06 — Deck Manifest (Import / Export)

A **deck manifest** is a single JSON file containing the deck spec + every
slide spec, inlined. It is the portable unit for moving a presentation
between projects, sharing it with a teammate, or backing it up before a
refactor.

## Why one file

The on-disk authoring format splits a deck across many files:

```
spec/slides/{deck-slug}/
├── deck.json
├── 01-title.json
├── 02-capabilities.json
└── …
```

That structure is great for diffs and review, but it makes a deck awkward to
move. The manifest collapses that tree into a single document you can email,
attach to a Linear ticket, or drop into another project.

## Shape

```jsonc
{
  "manifestVersion": 1,                // bumped on breaking changes
  "exportedAt": "2026-04-25T10:00:00Z",
  "source": "showcase",                // originating deck slug (informational)
  "deck":   { /* DeckSpec — see deck.schema.json */ },
  "slides": [
    { /* SlideSpec — see slide.schema.json */ },
    …
  ]
}
```

Schema lives at `spec/slides/deck-manifest.schema.json` and references
`deck.schema.json` + `slide.schema.json` so a single editor config validates
all three.

## Exporting

From the controller pill (bottom-right) → **Deck manifest** icon → **Export
deck as JSON**. The browser downloads
`{deck-slug}-deck-{YYYY-MM-DD}.json`. Disabled slides (`enabled: false`) are
preserved so the round-trip is lossless.

Programmatically:

```ts
import { deck, allSlides } from '@/slides/loader';
import { buildManifest, downloadManifest } from '@/slides/manifest';

downloadManifest(buildManifest(deck, allSlides));
```

## Importing

From the same menu → **Import manifest…** → pick a `.json` file. The app
validates the shape (`manifestVersion`, `deck` object, non-empty `slides`
array, unique `slideNumber`s) and on success:

1. Stores the manifest in `localStorage` under `riseup.deck.imported.v1`.
2. Hard-reloads the page so the loader picks it up cleanly.

The active deck banner inside the menu flips to "Active deck was imported
from a manifest." Use **Reset to bundled deck** to discard the import and
return to the in-repo `spec/slides/showcase/` deck.

## What does NOT travel

- **Images.** Slide JSON references images by relative path (e.g.
  `images/team.jpg`). Those paths must resolve in the destination project,
  or you must rewrite them to absolute URLs before export.
- **Theme files.** The manifest stores `deck.theme = "noir-gold"`; the
  destination project must have that theme available under
  `front-end/themes/noir-gold/`.
- **PHP backend data.** Manifests are pure presentation spec — no notes
  history, no analytics, no auth.

## Versioning

If the slide schema changes in a breaking way (renamed field, removed
preset, etc.), bump `manifestVersion` and add a migration in
`src/slides/manifest.ts` so older exports still load.
