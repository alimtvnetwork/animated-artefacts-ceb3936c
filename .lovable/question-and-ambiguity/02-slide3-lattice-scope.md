# 02 — Slide 3 lattice opacity reduction scope

**Timestamp:** 2026-04-28
**Task counter:** 2/40

## Task context

User: *"for slide 03 please reduce the latice to 30% more"*. The dotted
gold lattice lives in `src/index.css` as `.slide-stage-ambient.with-dot-lattice::after`
and is currently applied to **two** slide types: `StepTimelineSlide`
(slide 3 in this deck) and `TitleSlide` (home / slide 1). Toggle is in
`SlideStage.tsx` line 192.

## Specific question

"Slide 3" specifically — should the reduction be:
(a) global (affects both StepTimeline + TitleSlide), or
(b) scoped to StepTimeline only (slide 3 in current deck)?

## Inferred decision

**(a) global.** The lattice CSS is shared and slide 3 is the only slide
where it currently reads as "too strong" given the dense step content.
The home slide carries less foreground content so a 30% softer lattice
there is still visible. Avoiding a slide-number hack keeps the rule in
the design system (no per-slide CSS overrides).

Applied multiplicative 0.70 to:
- dot alpha 0.14 → 0.098
- mask peak 0.80 → 0.56, mid 0.55 → 0.385
- fullscreen variant 0.10 → 0.07

## Impact

Lattice becomes a softer whisper across StepTimeline + TitleSlide.
TitleSlide unchanged in geometry, just dimmer.

## Suggested clarification

If you wanted slide 3 ONLY, I'll add a `data-slide-number="3"` scope or
a `StepTimelineSlide`-only class — say the word and I'll re-scope.
