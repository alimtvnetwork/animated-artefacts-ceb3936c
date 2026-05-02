---
name: advance-step
description: Cinematic camera-zoom step chain with readable-focus type ramp, optional brand-header suppression, and per-slide whoosh on focus arrival.
type: feature
---

When the user says "**advance step**" or "advance steps" they mean
`AdvanceStepSlide` (slideType `AdvanceStepSlide`). Canonical spec:
`spec/slides/20-advance-step-v2.md` (supersedes
`spec/slides/18-advance-step-cinematic.md` for type ramp, brand header,
and sound). Camera dolly + state mapping rules from spec 18 still apply.

Locked rules:
- **Type ramp** (v2): eyebrow 16–18px, title 7.5–11rem, leading 0.92, subtitle 24–30px, description 18–20px, gold rule 88×2, max-w-5xl. Active frame is the focus, not a peek.
- **Camera**: vertical reel translates Y by `-active*100%`. Spring `{stiffness:90, damping:20}` for the dolly.
- **Per-frame visuals**: far-prev (0.65/0), prev (0.78/0.4), active (1/1), next (0.78/0.4), far-next (0.65/0). Active uses spring `{stiffness:220, damping:22}`.
- **Text stagger** on active: eyebrow 0.55s → title blur(6→0) 0.62s → 88px gold rule width tween 0.78s → subtitle 0.88s → description 0.96s → capsule 0.92s. Re-key on `active` so re-entry replays.
- **Brand header**: hide via `showBrandHeader: false` (the slide already paints its own deck header overlay top-left). Brand strip + presenter chip stay.
- **Sound**: defaults to `{ on:'focus', kind:'whoosh', volume:0.45 }` even when `sound` is omitted. Fires once per focusIndex change, including the very first arrival. Mute via `sound.mute: true`. See `mem://features/sound-system`.
- Owns Next/Prev like FocusTimelineSlide via `tryAdvance` ref. Returns false on chain edges so the deck advances to a sibling.
- Right-edge dot column is the jump UI; gold pill marks active. `Step NN / NN` mono label below.
- Reduced motion: snap camera + scale + blur. Whoosh still plays unless slide sets `sound.mute`.
