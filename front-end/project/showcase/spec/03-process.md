# 03 — Process (Step Timeline)

- **Type:** StepTimelineSlide
- **Transition:** SlideIn
- **Text animation:** SlideUp (staggered per row)
- **Visual:** Vertical timeline with gold connector line. Each row reveals sequentially: Step pill → title → subtitle → capsule.

## Active-step animation

After the reveal completes, an **active-step cursor** auto-advances every
**2.2s** and loops back to Step 1 after the last step. The cursor drives:

- **Progress pill** above the timeline — `Step N / M` with a pulsing gold dot
  and a filled gold progress bar (`(active+1) / total`).
- **Numbered chip** per row, three states:
  - *Active*: solid gold + ink number, soft gold halo, slow ring pulse, scale 1.08.
  - *Complete*: gold-tinted bg + border, white checkmark.
  - *Upcoming*: outlined only, gold/30 border, dim number.
- **Vertical connector** — a base dim line plus a bright gold line that fills
  from top to the active chip with a soft glow.
- **Row text** — active row at full contrast, completed at 80%, upcoming dimmed
  to 45%.

## Interaction

- **Click any step** to jump to it. Auto-advance pauses for 6s after a click,
  then resumes from the clicked step.
- **Keyboard**: rows are real `<button>`s — focusable, with a visible gold
  focus ring.
- **Reduced motion** (`prefers-reduced-motion`): every step renders as
  "active" at once; no cycling, no connector grow.

## Reusability

The pattern (auto-advancing active index + click-to-pause + progress pill)
lives entirely inside `StepTimelineSlide.tsx`. To reuse on another slide
type, lift the `useActiveStep` logic into a hook — current scope keeps it
inline since only one slide type uses it.

## Ambient layer (v0.83)

The right-side icon scatter is JSON-authored under `content.stepAmbient`
with explicit `positions[]`. The GitHub mark is pinned at top:78%, left:70%
and the next icon (Code2) sits at top:88%, left:92% — a deliberate gap of
~22% horizontal so the two never cluster. VS Code is the secondary brand
accent at top-right (22/78) and floats. All other icons stay as faded
silhouettes. Drop this JSON into any compliant renderer and the layout
reproduces 1:1.

## Header offset (v0.85)

`content.headerOffsetPx: 8` shifts ONLY the eyebrow ("HOW WE WORK") + the
title ("Engagement Process") 8px to the right so the title's left edge
aligns with the **"R" glyph of the "Riseup Asia" wordmark** rather than
with the lightning-bolt icon's leftmost edge. Aligning to the icon edge
makes the title look pulled too far left; aligning to the wordmark glyph
reads as intentional, matched typography. Step rows below are unaffected
— they stay anchored to the icon's sight line so the chip column reads
as a separate vertical rail. Range clamped to [-160, 160]px. (User
flagged 40px as too far right in the v0.85 reference screenshot.)


