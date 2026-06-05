---
name: webcam-squircle-rim-v3
description: Presenter camera squircle rim is v3 PNG plate + transparent mask (NOT CSS-only). Plate behind video, mask crops video; circle/puck fall back to CSS border-radius.
type: feature
---

## The rule (current truth — 2026-06-05, v3)

The presenter webcam squircle rim is a **baked PNG plate + transparent mask**,
NOT a CSS border. This reverses the short-lived 2026-06-02 "CSS-only" (v2)
decision per presenter direction. Do not revert to CSS border-radius + border +
box-shadow for the squircle — that is v2 and is superseded.

## How it's wired (`src/slides/components/PresenterWebcamOverlay.tsx`)

- Imports `@/assets/camera-2026/squircle-plate-gold.png` (rim+shadow) and
  `@/assets/camera-2026/squircle-mask.png` (crop).
- `SquirclePlate` component renders the plate `<img>` ~+14% larger, centered,
  `zIndex:1`, behind the video.
- The live `<video>` gets `SQUIRCLE_MASK_STYLE` (`mask-image: url(mask)`,
  `mask-size: 100% 100%`) so it crops to a transparent squircle, `zIndex:2`.
- In squircle mode the frame is `border:none`, `boxShadow:none`,
  `overflow:visible` (so the plate's rim/shadow extend past the video box).
- Gated by `useSquircle = !circleShape && !minimized` (floating) and
  `!circleShape` (stage/fullscreen/denied). Circle (`O`) + minimized puck keep
  the CSS `border-radius` + gold-border fallback (no circular plate asset).
- Applied on ALL four video surfaces: floating `on`, stage-fill, fullscreen,
  denied fallback preview.

## Assets

- Runtime: `src/assets/camera-2026/squircle-plate-gold.png` + `squircle-mask.png`.
- Spec/reference: `spec/camera-2026/assets/` holds `01` (visual target only),
  `02` (mask), `03` (white-rim plate variant), `04` (gold plate = runtime source).
- Default plate is gold `04` (matches approved reference `01`). White `03` is the
  alternative if a white rim is ever requested.

## Guard

`src/test/presenterWebcamRimContract.test.ts` locks the v3 contract (plate+mask
imports, `mask-image` crop, `<SquirclePlate>` on ≥3 surfaces). Spec source of
truth: `spec/camera-2026/05-backgrounds-and-shapes.md` §8 (v3).

## Why it exists

The rim approach flip-flopped v1 (plate+mask) → v2 (CSS-only) → v3 (plate+mask
again). This memory prevents another accidental revert.
