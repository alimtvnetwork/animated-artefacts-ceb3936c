---
name: no-brand-strip
description: The top BrandStrip banner (logo + "RISEUP ASIA LLC · 2026 DECK" tagline pill) is permanently rejected — never re-enable it on any slide or deck.
type: constraint
---

## Rule

The `BrandStrip` component (`src/slides/components/BrandStrip.tsx`) must NEVER
be active on any slide. The user has rejected this banner multiple times across
sessions ("remove the banner", "I think we have discussed this several times",
"remove this banner from all pages and mark in memory for future avoid").

## Root cause of the repeated failure

The first attempted fix only removed `deck.brandStrip` from the bundled
`spec/slides/showcase/deck.json`. That was incomplete because runtime loading can
prefer an imported deck manifest from localStorage (`IMPORTED_MANIFEST_KEY` in
`src/slides/loader.ts`). Any older imported manifest containing `deck.brandStrip`
still flowed through `resolveBrandStrip()` and rendered the banner. Therefore the
correct fix is a runtime hard-disable, not just config cleanup.

## How to apply

- **Runtime**: `src/slides/SlideStage.tsx::resolveBrandStrip()` must always
  return `null`. Do not restore deck/slide precedence unless the user explicitly
  reverses this constraint.
- **Preview parity**: `src/slides/components/SlidePreview.tsx` must not import or
  render `BrandStrip`, and `BrandHeader.offsetTop` must stay `0`.
- **Loader sanitization**: `src/slides/loader.ts` must delete `deck.brandStrip`
  and force slide `brandStrip` false while loading bundled/imported manifests,
  so stale localStorage imports cannot resurrect the banner.
- **deck.json**: do NOT include a `brandStrip` object at deck level. If one
  appears, remove it.
- **Per-slide JSON**: do NOT add `brandStrip` overrides that re-enable it.
  Explicit `"brandStrip": false` is fine (defensive).

## Why

The user finds it visually crowding — the standard `BrandHeader` (Riseup logo
top-left + slide counter top-center) is the only top chrome they want. The
extra strip duplicates branding and eats vertical space.

## Files involved

- `spec/slides/showcase/deck.json` — must not contain `brandStrip`
- `src/slides/loader.ts` — strips stale imported/bundled BrandStrip config
- `src/slides/SlideStage.tsx` — `resolveBrandStrip()` hard-returns null
- `src/slides/components/SlidePreview.tsx` — no BrandStrip in thumbnails/previews
- `src/slides/components/BrandStrip.tsx` — component may exist, but must stay inert
