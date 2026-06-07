# 16 — Worked Example

A complete, annotated 4-step focus-timeline deck spec, end to end. This is the
canonical reference: copy it, change the words, keep the structure.

Source anchors:

- Component: `src/slides/types/FocusTimelineSlide.tsx`
- State owner: `src/slides/hooks/useFocusTimeline.ts`
- Schema: `spec/2096-steps-slide/02-data-model.md`
- Enums: `spec/2096-steps-slide/09-enums-and-state.md`

---

## The narrative

Four steps of a launch sequence. One narrow idea per step (rule 12). The
presenter narrates; each row is a keyword anchor, never a paragraph.

## The JSON (source of truth at runtime)

```json
{
  "type": "FocusTimelineSlide",
  "transition": "PushIn",
  "content": {
    "eyebrow": "Launch sequence",
    "title": "From spec to ship",
    "steps": [
      { "label": "Spec", "capsuleTone": "gold", "meta": "day 1" },
      { "label": "Build", "capsuleTone": "ember", "meta": "day 2-4" },
      { "label": "Verify", "capsuleTone": "gold", "meta": "day 5" },
      { "label": "Ship", "capsuleTone": "cream", "meta": "day 6" }
    ]
  }
}
```

## Annotations

- `transition: "PushIn"` — chosen from `CATALOG.json`; explicit per slide.
- `steps[].capsuleTone` maps to `.capsule-{tone}` classNames — never inline
  `style.background` (light-theme capsule fg rule).
- `steps[].meta` renders via `.capsule-meta` (Radix `--muted` tokens auto-flip).
- Exactly 4 steps: under the density cap, one idea each.

## Runtime flow

1. Deck mounts the slide; `useFocusTimeline` seeds `activeIndex = 0`.
2. Each row stamps `data-state` (`active | adjacent | far`) from `activeIndex`.
3. Next/Prev call `tryAdvance(dir)`; at boundary it returns `false` and the deck
   navigates to the neighbouring slide (see `10-interaction-contract.md`).
4. CSS binds opacity/blur/color to `data-state` (see `15-css-recipes.md`).
5. On focus arrival, the deck plays the `click` cue (see `13-sound.md`).

## Done signal

- All four labels render; Next walks Spec → Build → Verify → Ship.
- At Ship, Next leaves the slide; at Spec, Prev leaves the slide.
- Reduced-motion keeps opacity+blur, drops transforms; muted is silent.
