---
name: step-uniformity-fix
description: v0.160 — removed visual differentiators between reveal-bearing and plain step rows so all four steps on a StepTimelineSlide animate identically; louder whoosh MP3 (+15% via ffmpeg) wired into deck assets.
type: feature
---
v0.160.0.

# Why
On showcase slide 3, steps 1-2 carry `expand` / `revealSlide` payloads while steps 3-4 don't. Three latent visual differences made the first half look "wrong" relative to the second:

1. **Shared-layout intercept** — `<motion.div layoutId={s.expand ? \`step-${slideNumber}-${i}\` : undefined}>` only on `expand` rows. Framer's shared-layout system overrode the `initial`/`animate` transform for those rows, so the bubble + text-slide entrance landed at a different end position from non-expand siblings.
2. **ArrowUpRight icon** rendered next to the title only when `hasReveal` was true.
3. **`step-row--reveal-hint` pulse** added when `highlightReveal && hasReveal`.

# Fixes (StepTimelineSlide.tsx)
- Dropped `layoutId` entirely. The inline-expand panel mounts via SlideStage with its own `<motion.div>` and never depended on the shared-id morph for correctness.
- Removed the `<ArrowUpRight>` from the step title (still rendered on the focus-step CTA buttons further down).
- Removed the `step-row--reveal-hint` className branch. The CSS rule survives in `index.css` for any future caller that opts in, but the StepTimelineSlide no longer applies it.
- Kept `data-has-reveal` and the aria-label "focus, then open details" so click-reveal is still announced and triggerable.
- `highlightReveal` prop kept for API compat (renamed to `_highlightReveal` with eslint disable).

# Audio (companion request)
- Generated `public/sounds/fade_swoosh_v4.mp3` from `fade_swoosh_v2.mp3` via `ffmpeg -filter:a "volume=1.15"` — a +15% loudness bump (~+1.2 dB), staying under the user's "not more than 20%" cap.
- `spec/slides/showcase/deck.json` `assets.audio.whoosh` repointed to v4.

# Files
- `src/slides/types/StepTimelineSlide.tsx` — three visual-differentiator removals
- `public/sounds/fade_swoosh_v4.mp3` — new louder whoosh
- `spec/slides/showcase/deck.json` — `whoosh` URL updated
- `package.json` — 0.160.0
