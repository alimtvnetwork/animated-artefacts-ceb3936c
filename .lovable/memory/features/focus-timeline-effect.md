---
name: focus-timeline-effect
description: "Focus-timeline animation pattern — one step at center stage, larger with description; siblings dim and recede. Advances on slide-Next."
type: feature
---

# Focus Timeline Effect

A reusable timeline animation pattern where one step is in the **limelight** at
center stage (larger, full color, with a description) while neighboring steps
**dim, fade, and shrink**. Advancing the focus is driven by the deck's normal
**Next/Prev** controls — each press moves the focus along the chain like
flipping pages, NOT a separate auto-loop.

## Mental model

> "A long chain of events where the one currently in the limelight is bigger
> and described, and the others fade in/out around it."

Think of a **horizontal carousel of cards**, where the center card is the hero
and side cards are dimmed previews. Stepping Next pushes the chain leftward:
the current center slides off, the next card becomes center, the one after
peeks in from the right.

## Behavior contract

| Aspect | Rule |
|--------|------|
| **Visible window** | 3 steps at once: previous (dim), focus (limelight), next (dim). Optional 5-step variant for sparse decks. Never show all steps at once — the whole point is focus. |
| **Focus styling** | Scale ≈1.0, full color title, gold capsule label, **description visible** below the title. |
| **Side styling** | Scale ≈0.7–0.8, opacity 0.35, no description, label only. Pointer-events disabled. |
| **Off-window** | Fully hidden (opacity 0). Do NOT crowd the layout with stubs. |
| **Advance trigger** | The deck's existing **Next/Prev** controls (arrow keys, controller buttons, swipe). Each press moves focus by one. Auto-advance is OFF by default (different from `StepTimelineSlide`). |
| **Layout** | Horizontal by default (cards slide left-to-right). Vertical opt-in via `direction: "vertical"` (cards slide bottom-to-top, focus row centered). |
| **Connector** | Thin gold line behind the chain. Filled portion = steps already passed. |
| **Step indicator** | Top-of-slide pill `Step N of M` + dot row (filled = passed, ring = focus, ghost = upcoming). |
| **Last-step Next** | Goes to the *next deck slide*, not back to step 1. The timeline is treated as a single slide for routing purposes. |
| **First-step Prev** | Goes to the *previous deck slide*. |
| **Reduced motion** | All steps render at full opacity in a static vertical list. No scale transforms, no slide animation. The focus indicator still highlights the active step. |

## When to use vs `StepTimelineSlide`

| Use `StepTimelineSlide` | Use `FocusTimelineSlide` |
|--------------------------|----------------------------|
| Process overview ("here are our 4 phases") | Story / journey ("walk through each milestone") |
| Audience needs all steps in view | Audience needs to absorb one step at a time |
| Auto-advances on its own (~2.2s loop) | Presenter controls pacing with Next/Prev |
| All step descriptions are short labels | Each step has a real description / talking point |

If unsure, default to `StepTimelineSlide` — it's lighter. Switch to focus when
the presenter needs to *narrate* each step.

## JSON shape

```jsonc
{
  "slideType": "FocusTimelineSlide",
  "transition": "FadeIn",       // outer slide transition; inner step animation is independent
  "textAnimation": "FadeIn",
  "content": {
    "eyebrow": "The journey",
    "title": "How a project unfolds",
    "direction": "horizontal",  // "horizontal" | "vertical", default "horizontal"
    "windowSize": 3,             // 3 | 5, default 3
    "steps": [
      {
        "label": "Stage 1",
        "title": "Discovery",
        "description": "Two-week sprint of audits, interviews, and competitive teardown so we ship from evidence, not vibes.",
        "capsule": { "text": "Week 1-2", "color": "gold" }
      },
      // ...
    ]
  }
}
```

`steps[].description` is the new required field that distinguishes this from
`StepTimelineSlide.steps[].subtitle` (which is a one-line caption). Descriptions
are 1–2 sentences, narrative tone.

## Animation specifics

**Transition between focus states** (when Next/Prev fires):
- Old focus: scale 1 → 0.75, opacity 1 → 0.35, x translate -120% (or y for vertical), 480ms ease `[0.22, 1, 0.36, 1]`.
- New focus: scale 0.75 → 1, opacity 0.35 → 1, x translate 0, 480ms same ease.
- Description: fades in 200ms after the new focus settles (delay 200ms).
- Connector fill: animates `width` (or `height`) to `(focusIndex / (total-1)) * 100%` over 500ms.

**Reduced motion**: drop scale and translate; keep opacity transitions only.

## Routing integration

The slide owns an internal `focusIndex` state. The deck-level Next/Prev handlers
must check `slide.slideType === 'FocusTimelineSlide'` and call into a slide-level
handler first (via a ref or context). Only when the focus is at the boundary
(`focusIndex === 0` and Prev, or `focusIndex === total-1` and Next) does navigation
fall through to the deck.

Implementation: expose an imperative ref:

```ts
type FocusTimelineHandle = {
  /** Returns true if the slide consumed the navigation. */
  tryAdvance: (dir: 'forward' | 'backward') => boolean;
};
```

`SlideDeckPage.next/prev` calls `ref.current?.tryAdvance(dir)`; only navigates
to the next/prev deck slide when the call returns `false`.

## Reusable hook

The focus-step state machine lives in `useFocusTimeline(steps)` so any future
slide type that wants the same effect (carousel of testimonials, gallery of
case studies) can reuse it without duplicating the logic.

```ts
const { focusIndex, focusOn, next, prev, isAtStart, isAtEnd } = useFocusTimeline(steps);
```

## Files (when implemented)

- `src/slides/types/FocusTimelineSlide.tsx` — the slide component.
- `src/slides/hooks/useFocusTimeline.ts` — reusable state machine.
- `src/slides/enums.ts` — add `'FocusTimelineSlide'` to `SlideTypeEnum`.
- `src/slides/types.ts` — add `direction`, `windowSize`, `steps[].description` to `SlideContent`/`StepSpec`.
- `spec/slides/11-focus-timeline.md` — full public spec.
- `spec/slides/slide.schema.json` — extend enum + step schema.

## Hard rules

1. **Never auto-advance.** Presenter is in control. Auto-advance belongs to `StepTimelineSlide`.
2. **Always show step indicator + connector.** Without these, audience loses the "X of Y" anchor.
3. **Description is required per step.** If a deck has only one-liners, use `StepTimelineSlide` instead.
4. **Honor `prefers-reduced-motion`** — fall back to a static list.
5. **One slide, many steps.** The whole timeline is one deck slide; internal stepping does NOT increment the slide URL.
