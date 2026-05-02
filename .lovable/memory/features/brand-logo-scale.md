---
name: brand-logo-scale-setting
description: Global tunable for BrandHeader logo + presenter chip avatar size via `--brand-logo-scale` token (default 0.85 = the v0.88 −15% treatment). Slider in /settings, range 0.6–1.2.
type: feature
---

# Brand logo scale setting (v0.89+)

`PresetSettings.logoScale` (range **0.6–1.2**, step 0.05, default
**0.85**) drives the CSS var `--brand-logo-scale` on `<html>`.

Default 0.85 is intentional: it's the −15% treatment that shipped in
v0.88. So upgrading to v0.89 changes nothing visually unless the user
drags the slider.

**Consumed by** `src/slides/components/BrandHeader.tsx`:
- Logo height: `calc(64px * var(--brand-logo-scale, 0.85))` (base 64px = original `h-16`)
- Avatar height/width: `calc(28px * var(--brand-logo-scale, 0.85))` (base 28px = original `h-7 w-7`)

Width on the wordmark stays `auto` so the trimmed PNG keeps its
~830:207 aspect ratio.

**Slider lives at** `/settings` → "Brand logo size", immediately under
"Title size". Has live percentage readout + helper copy.

**Why scale-not-replace:** keeps existing decks pixel-identical at the
default; allows fine-tuning without touching code; works in tandem with
`--brand-inset-x` (spec 47) which controls position, not size.

**Spec:** `spec/slides/48-logo-scale-setting.md`. Constraints: default
MUST stay 0.85; token name MUST stay `--brand-logo-scale`; avatar
scales with logo, not independently.
