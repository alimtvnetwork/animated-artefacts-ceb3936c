---
name: steps-3d-refinements
description: CR 24 — 3D slide is now slot 4, has right description panel + top numeric markers (50% of slide-3) + CLICK-ONLY interactivity (no hover effects, ever). Logo defaults logoScale 0.765, logoOffsetY +18, chipOffsetY +18.
type: feature
---

# Steps 3D refinements (CR 24)

**Spec:** `spec/22-slides-issues/24-steps-3d-refinements.md`
(builds on `spec/21-slides-system/61-steps-chain-3d.md`).

## What changed

1. **Deck order:** `StepsChain3DSlide` is slot 4 in `showcase`. Previous
   slots 4–7 shifted to 5–8.
2. **Logo defaults** (in `presetSettings.ts`):
   - `logoScale` 0.85 → **0.765** (–10%)
   - `logoOffsetY` 0 → **+18** (≈15% of `--brand-inset-y` 116px)
   - `chipOffsetY` 0 → **+18** (mirror)
   - Step text column auto-aligns because `--brand-inset-y` is coupled
     to `logoScale` in `applyPresetSettings`.
3. **Right description panel** on `StepsChain3DSlide` mirrors the regular
   slide layout. Per-step `content.steps[].description = { title, bullets[]?, body?, meta }`.
   `bullets[]` (preferred per Core "keywords-only" rule) renders as a
   staggered gold-dot list (50ms steps). Falls back to `body` only when
   `bullets` is absent. Title/body/meta animate at 0/60/120ms.
   Dev-only console warning fires when `body` exceeds 12 words.
4. **Top numeric markers** above each 3D step. Token
   `--step-number-size-3d = calc(var(--step-number-size) * 0.5)`. Reuses
   slide-3 entrance animation, triggered on activation.
5. **Click-only** (updated 2026-04-29): each step is a button.
   **No hover effect of any kind** — no glow ring, no marker brightening,
   no lift, no filter change. `cursor: pointer` is the only hover affordance.
   Click/Enter/Space sets `activeIndex` using the existing spec 61 spring
   zoom — that activation animation IS the user feedback.
   `aria-current="step"`, focus ring, `aria-label="Step N: <label>"`.

## Rules

- Never re-add solid background fill on the active 3D card.
- **Never re-introduce hover effects on step cards.** See
  [no-hover-on-steps-chain-3d](mem://constraints/no-hover-on-steps-chain-3d).
- Logo / chip / panel offsets are derived from `--brand-inset-x/y` —
  never hard-code pixels in slide components.
- Description animation MUST start with the step's spring, not on its own
  timer.
- `prefers-reduced-motion`: opacity crossfade only, no glow pulse, no
  rotateY, no translateZ.
