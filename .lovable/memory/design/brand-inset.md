---
name: brand-inset-token
description: Single CSS var `--brand-inset-x` controls logo+chip+body-grid horizontal inset across the entire deck. Change in one place, everything follows.
type: design
---

# Brand inset token (`--brand-inset-x`)

**Value (v0.88+):** `clamp(48px, 15vw, 288px)` — defined in
`src/index.css` `:root`. Resolves to **288px** at the locked 1920px
canvas (= 15% inset).

**Single source of truth.** All four of these read from this token:

1. `BrandHeader` logo's left inset (`paddingLeft`).
2. `BrandHeader` presenter chip's right inset (`paddingRight`) —
   mirrors the logo for symmetric whitespace.
3. `--body-grid-margin-left` default (in `:root`).
4. `header-anchored` body grid mode in `presetSettings.ts` (so the
   StepTimeline title, rail, and capsules track the logo edge).

**Logo size pairs with the inset.** When the inset increased to 15%,
the logo shrank `h-16` → `h-[54px]` (–15.6%) so the header doesn't feel
top-heavy. Width derives from height + the trimmed PNG aspect ratio
(~830 × 207, see spec 37): 54 × (830/207) ≈ **217px** wide.

**To shift the entire deck inward/outward,** change ONLY the
`--brand-inset-x` value in `index.css`. Do NOT hard-code `px-N` or
`pl-[Npx]` in BrandHeader, do NOT add a separate clamp in
`presetSettings.ts`. The single token is what spec 35's live alignment
guide and spec 38's preview alignment guide both verify against.

**See:** `spec/slides/47-brand-inset-token.md` for full math, viewport
table, verification steps, and the alignment chain
(`header padding → logo edge → body grid → step rail`).
