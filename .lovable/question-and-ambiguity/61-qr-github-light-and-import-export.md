# 61 — GitHub-Light QR black-on-black + import/export scope

**Date:** 2026-05-02
**Task #:** 34 (counter incremented from 33)

## User question
> "Confirm import/export works well, mention if we can also import/export
> themes. And the QR becomes black on black on the GitHub Lite theme — find
> the root cause and fix it."

## Import / export scope (clarification recorded, not asked)
The deck currently exposes **render-only** export (Settings → Export deck):
PDF (RGB), PDF (CMYK-safe), SVG per slide, PNG per slide, JPG per slide.
There is **no** deck-JSON import, **no** deck-JSON export, and **no**
theme import/export — themes are static module entries in
`src/slides/themes.ts` keyed by id (e.g. `github-light`, `noir-gold`).

Adding theme JSON import/export would require:
- a serializable theme schema (HSL token map + capsule/title overrides);
- an authoring UI in Settings (or a new Theme Studio route);
- a runtime overlay layer so user-imported themes don't conflict with
  the static catalog when a deck pins `meta.theme`.

Logged for future batch clarification — not in scope for this task.

## QR root cause
**File:** `src/slides/components/BrandedQR.tsx` (wrapper `<div>` line 212)
**Tailwind config:** `tailwind.config.ts:25` maps `white: 'hsl(var(--white))'`.
**Theme override:** `src/index.css:978` — `[data-theme='github-light']`
sets `--white: 210 12% 16%` (#1f2328 GitHub ink) so headline titles using
`text-title-white` stay legible on the light slide surface.

Result: `bg-white` on the QR substrate resolved to the remapped dark ink
in `github-light`, turning the QR card dark. The QR PNG sitting on top has
white modules that LOOK fine, but the surrounding 10px padding ring goes
dark, and depending on the bundled PNG's alpha edge it reads as
"black on black". Other themes leave `--white` at literal white so the
bug only surfaces on `github-light`.

## Fix
Replaced `bg-white` (token-aware) with an inline `background: '#ffffff'`
literal so the QR substrate is theme-independent. Mirrors the existing
`hardcoded-white-ok` exception already used in `QrMeetingSlide`'s
ContactLayout for the same reason.

## Why other QRs were OK
ContactLayout already wraps `BrandedQR` in its own `background: '#ffffff'`
literal hex, masking the inner `bg-white` problem. CompactLayout (and the
builder live preview) had no such wrapper, so the inner `bg-white` leaked
the theme remap.
