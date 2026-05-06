---
name: top-jumper-visibility-toggle
description: Presenter toggle to hide top-center slide jumper for clean fullscreen stage; reduced-motion CSS refined to preserve opacity fades
type: feature
---
v0.152.0.

# Top jumper visibility toggle
Presenter affordance for the "NN / NN" chip pinned to the top-center of the viewport. State `topJumperHidden` lives in `SlideDeckPage`, persisted to `localStorage['riseup.topJumperHidden']`.

**Default (2026-05-06): HIDDEN.** The chip stays out of the way for a clean fullscreen stage; the presenter opts in only when needed. Storage contract: missing key OR `'1'` → hidden; only an explicit `'0'` (user toggled it on) shows the chip. Existing users who had explicitly hidden it keep their choice; everyone else now defaults to hidden too.

Three control surfaces:
- Controller hamburger dropdown — "Show / Hide top jumper" item with `PanelTop` / `PanelTopClose` icon. Glows gold when hidden.
- Keyboard — `J` (mirrors `T` for thumb strip, `G` for grid).
- The `<TopSlideJumper>` is conditionally rendered: `!gridOpen && !topJumperHidden`.

# Reduced-motion refinement
Previous global CSS killed ALL transitions to 0.01ms under `prefers-reduced-motion: reduce`, including opacity. This made fades imperceptible.

New rule (`src/index.css` lines 762-792) keeps the hard collapse as default but restores a 120ms cross-fade for opacity-bearing surfaces (`[data-state="open|closed"]` for Radix popover/tooltip, `.lift-hover`, `.lift-hover-subtle`, `.controller-pill *`). Mirrors the JS-side `flattenVariants` in `motionPreferences.ts` which preserves opacity while dropping transform keys. Aligns with WCAG guidance — vestibular triggers (parallax/translation/spin) are killed; soft cross-fades survive.
