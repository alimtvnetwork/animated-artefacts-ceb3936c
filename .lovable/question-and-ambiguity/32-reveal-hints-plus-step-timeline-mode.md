# 32 — Combined "reveal hints + step/timeline mode" dropdown item

**Logged:** 2026-05-02 · **Window 2 task:** 32 / 40

## Task context

User asked: *"Add a dropdown option to toggle reveal hints and
step/timeline mode together, so my click-reveal capsules behave
consistently per slide."*

## Ambiguities

**Q1 — What is "step/timeline mode"?** No existing toggle by that
name. Three plausible readings:

- (a) A presenter-mode flag that forces every slide with click-reveal
  capsules to advance them **one-at-a-time** (stepwise) instead of
  rendering them all at once. Consistent with "behave consistently per
  slide".
- (b) A flag that flips the per-step `revealMode` default to
  `timelineLand` deck-wide (currently auto-picked).
- (c) A toggle that pairs reveal-hints with the existing StepTimeline
  autoplay (`P`) global state.

Inferred: **(a)** — a `clickRevealStepwise` deck-level flag that, when
on, pairs with reveal-hints in a single dropdown item. Slide consumers
read it via `useClickRevealStepwise()` to optionally serialize their
reveal sequence.

**Q2 — Single combined toggle, or two synchronized items?** "Toggle
reveal hints and step/timeline mode together" reads as a **single
combined item** that flips both at once. Picked single-item
interpretation; both flags persist and follow the combined toggle.

**Q3 — Consumer wiring scope.** This task only adds the **menu item +
persisted flag + subscription hook**. Per-slide-type consumption of
`clickRevealStepwise` (CapsuleListSlide, KeywordSlide, ClickRevealSlide
parents) is a separate, larger task — flagged here as follow-up.
Without consumers, the flag is inert beyond pulsing reveal hints.

## Inferred decisions

- New dropdown item in the controller hamburger labeled
  **"Click-reveal mode"** that flips both `revealHints` and a new
  `clickRevealStepwise` flag in lockstep.
- Persistence keys: `riseup.revealHints` (existing) +
  `riseup.clickRevealStepwise` (new).
- Subscription hook `useClickRevealStepwise()` exported from a small
  module so future slide components can read it without prop drilling.
- The existing standalone "Reveal hints" item stays in the dropdown
  (toggles only the pulse, no stepwise change) — combined mode is
  additive, not a replacement.

## What's NOT done this turn (follow-up)

- Per-slide-type consumption of `clickRevealStepwise`. Today the flag
  is read by no slide. Treating click-reveal capsules as a stepwise
  sequence requires changes to each capsule grid + a per-slide
  active-step index. Non-trivial; warrants its own spec turn.

## Timestamp
2026-05-02
