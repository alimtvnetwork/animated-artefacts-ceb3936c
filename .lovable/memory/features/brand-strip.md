---
name: brand-strip
description: Optional deck-wide branded header strip (logo + tagline) above the standard BrandHeader
type: feature
---

## What

Thin 36px (`h-9`) full-width band rendered ABOVE the standard `BrandHeader`. Carries deck-wide branding: Riseup Asia logo/wordmark + tagline (e.g. "Riseup Asia LLC · 2026 Deck"). Theme-aware (uses `--gold`, `--cream`, `--ink`).

## Configuration

- **Deck-level default:** `deck.brandStrip` in `spec/slides/{deck}/deck.json` — applied to every slide.
- **Per-slide override:** `slide.brandStrip`:
  - `false` or `null` → hide on this slide
  - object → replace the deck default for this slide only
  - omitted → inherit deck default

Resolution lives in `resolveBrandStrip()` (exported from `SlideStage`). Both the live audience stage AND `SlidePreview` (used by GridOverview + PresenterPage thumbnails) call it, so the per-slide toggle stays in sync everywhere — no extra BroadcastChannel message needed because both windows render the same slide JSON locally.

## Component

- `src/slides/components/BrandStrip.tsx` — `top:0`, `z-30`, `pointer-events-none`.
- When present, `BrandHeader` is shifted down by 36px via the new `offsetTop` prop. Body padding (`pt-32`) doesn't change.
- Three backgrounds: `solid` (default, semi-opaque ink), `gradient` (gold→ink fade), `transparent`. Optional hairline gold divider.

## Fields

`logoAsset` (`riseup-asia`, default and preferred for export/import), `logo` (direct absolute/export-safe src only), `logoAlt` (fallback text), `logoHeight` (12–32, default 22, clamped at runtime), `logoAlign` (`left|center|right`, default `left` — `right` auto-flips tagline to the left edge), `padding` (`tight|cozy|roomy`, default `cozy`), `tagline`, `taglineTone` (`gold|cream|muted`, default `cream`), `divider` (default true), `background` (default `solid`).

## Layout

3-column grid (left / center / right). Logo occupies the `logoAlign` slot; tagline pill always takes the opposite edge so the two never collide. `padding` shifts both edges in lockstep.

## Schema

- `spec/slides/deck.schema.json` → `brandStrip` (object, all fields optional).
- `spec/slides/slide.schema.json` → `brandStrip` is `oneOf`: `false` | `null` | full object.
- `spec/slides/08-brand-strip.md` documents the contract.

## Rules

- Brand/identity only. Never put titles, CTAs, or per-slide content in the strip.
- Keep tagline ≤ 40 chars (must fit 36px height without wrap).
- Prefer logo assets ≤ 36px tall (SVG/PNG). Large rasters get scaled and look soft.
