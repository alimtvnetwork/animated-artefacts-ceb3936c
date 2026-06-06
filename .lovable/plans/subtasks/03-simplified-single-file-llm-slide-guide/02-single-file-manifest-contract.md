---
Slug: single-file-manifest-contract
Status: pending
Created: 2026-06-06
Parent: 03-simplified-single-file-llm-slide-guide
---

# Single-file manifest contract (the one-shot output)

The simplified guide's headline rule: the AI returns ONE JSON file — the deck
manifest — with every slide inlined and every image embedded as Base64 data
URI or inline SVG. No multi-file split as the deliverable.

Document, with a complete copy-pasteable skeleton:
- Manifest envelope: `manifestVersion`, `exportedAt`, `source`, `deck`,
  `slides[]` (mirror `spec/21-slides-system/06-deck-manifest.md`).
- Where images go: `content.image` accepts `data:image/png;base64,…` and inline
  `<svg>…`; reference `src/slides/inlineImages.ts` as the export-time inliner.
- Round-trip: how this file is imported (Import/Export menu → "Import
  manifest"), stored at `localStorage["riseup.deck.imported.v1"]`.
- A minimal 2-slide end-to-end example (title + one content slide, one image
  embedded) so the AI sees the whole shape at once.

## Verification
A reader can produce a valid single manifest from the skeleton alone; example
imports cleanly via the existing import path.
