# 30 — Step capsule visual hierarchy + icon badges

**Date:** 2026-04-30
**Mode:** No-questions (30/40)

## Request

> Improve the step capsule labels by adding clearer visual hierarchy,
> stronger contrast, and optional icon badges per step without adding heavy
> text.

## Ambiguities resolved without asking

1. **Where "step capsule labels" live.** Two surfaces qualify: the row
   capsule on `StepTimelineSlide` (slide 3) and the per-step label-capsules
   on `StepsChain3DSlide` (slide 4). Both render via the shared
   `Capsule` component, so any improvement landed there benefits both —
   no per-slide forking. **Decision:** treat this as a *Capsule-level*
   feature, not a slide-level one.

2. **What "icon badges" should look like.** Two reasonable readings:
   (a) a small leading glyph inside the pill, (b) a separate circular
   "chip-within-a-chip" at the leading edge. The user explicitly asked for
   *badges*. **Decision:** support both, gated by an opt-in `iconBadge`
   boolean on `CapsuleSpec`. `iconBadge: true` → contrast-plate badge
   (emblem voice, used for step capsules); `iconBadge: false` → bare
   inline glyph (decorative voice). Authors who don't add `icon` get
   the existing capsule unchanged.

3. **Which icon library.** The deck already pulls from `lucide-react`
   everywhere; a separate icon set would balloon the bundle and break
   the visual language. **Decision:** resolve `spec.icon` (PascalCase
   string) against `lucide-react`'s `icons` map at render time;
   unknown names silently render no icon (no validation crash, no
   loud author-time error — matches the deck's defensive contract for
   optional fields).

4. **"Stronger contrast" on which variant.** The gradient capsules
   (gold/ember/cream/violet/teal/rose/sky) already pass AA against
   noir thanks to dark-ink text. The weak link is `capsule-outline`,
   used for non-active step rows on slide 3. **Decision:** add a faint
   inner gradient + 0.08 inset highlight to `.capsule-outline`, and
   bump active-state outline capsules with a gold tint + 0.55 border
   + soft 0.18 outer accent so the active step reads as the row's
   anchor. Only outline is touched — gradient variants are left alone
   so chromatic identity is preserved.

5. **"Without adding heavy text."** The user's constraint is keyword
   density, not styling. **Decision:** the badge is *visual only*
   (`aria-hidden="true"`); the label string is unchanged. Authors who
   want a status word like "Active" would still write it into `text`
   themselves — this PR doesn't introduce a `caption`/`subtext` slot.

## Implementation

- `src/slides/types.ts` — `CapsuleSpec` gains optional `icon` (lucide
  PascalCase name) and `iconBadge` (boolean) fields. Both default to
  off, every existing capsule renders unchanged.
- `src/slides/components/Capsule.tsx` — adds a `resolveCapsuleIcon`
  helper (resolves against `lucide-react`'s `icons` export, returns
  `null` for unknown names so rendering fails silent), a leading
  `.capsule-icon-badge` span when `iconBadge: true`, or a leading
  `.capsule-icon-inline` span otherwise. The wrapper button drops
  `overflow-hidden` and tightens left padding when a badge is present
  so the contrast plate doesn't get clipped by the pill rounding.
- `src/index.css` — strengthens `.capsule-outline` (subtle inner
  gradient + inset highlight), adds `.capsule-icon-badge` (luminance-
  flipped plate; light plate on dark capsules, dark plate on light
  capsules) and `.capsule-icon-inline`, and adds an active-state
  hierarchy bump on `[data-capsule-state="active"] > .capsule-outline`
  (already emitted by `StepTimelineSlide`'s row wrapper at
  `src/slides/types/StepTimelineSlide.tsx:1008`).

No changes were needed in `StepTimelineSlide` or `StepsChain3DSlide` —
both already feed `s.capsule` straight into `Capsule`, so the new icon
fields propagate automatically the moment authors add them to the deck
JSON. The active-state CSS hook (`data-capsule-state`) was already
present on slide 3's row wrapper.

## Files touched

- `src/slides/types.ts`
- `src/slides/components/Capsule.tsx`
- `src/index.css`
- `.lovable/question-and-ambiguity/30-step-capsule-hierarchy-and-icon-badges.md`
- `.lovable/question-and-ambiguity/task-counter.md`
