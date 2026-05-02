# 11 — Focus Timeline Effect

A timeline rendering mode where **one step occupies the center stage** with
full color and a description, while neighboring steps dim, shrink, and recede.
Stepping through the chain is driven by the deck's regular **Next/Prev**
controls — each press flips the focus to the next step like turning a page.

This is distinct from `StepTimelineSlide` (which shows every step at once and
auto-advances a highlight cursor). Use `FocusTimelineSlide` when the presenter
wants to *narrate* each step in turn.

## Mental model

> A long chain of events. The one in the limelight is bigger, fully colored,
> with a description. The others fade in and out around it.

Horizontal carousel of cards, center card is hero, sides are dim previews.

## Visible window

- **Default:** 3 steps visible at once — `prev (dim) · focus (hero) · next (dim)`.
- **Sparse decks:** opt into 5 visible (`windowSize: 5`).
- **Off-window:** fully hidden. Do not crowd the layout with stubs.

## Per-step states

| State | Scale | Opacity | Description | Pointer events |
|-------|-------|---------|-------------|----------------|
| Focus | 1.0 | 1.0 | Visible | Enabled |
| Side (prev/next) | 0.75 | 0.35 | Hidden | Disabled |
| Off-window | — | 0 | Hidden | Disabled |

## Navigation contract

The slide owns an internal `focusIndex`. The deck's Next/Prev handlers ask
the slide to consume the input first; the deck navigates to a sibling slide
**only at the boundaries**:

```
prev at focusIndex 0      → previous deck slide
next at focusIndex N-1    → next deck slide
otherwise                 → focusIndex ± 1
```

This is exposed via an imperative ref:

```ts
type FocusTimelineHandle = {
  tryAdvance: (dir: 'forward' | 'backward') => boolean; // true = consumed
};
```

`SlideDeckPage` checks `ref.current?.tryAdvance(dir)` before navigating away.

## Animations

| Element | Animation |
|---------|-----------|
| Old focus → side | scale 1 → 0.75, opacity 1 → 0.35, translate −120% on the axis, **480ms** ease `[0.22, 1, 0.36, 1]`. |
| New focus | scale 0.75 → 1, opacity 0.35 → 1, translate 0, **480ms** same ease. |
| Description | Fades in **200ms** after focus settles (delay 200ms). |
| Connector | `width` (horizontal) or `height` (vertical) to `(focusIndex / (total-1)) * 100%`, **500ms**. |
| Reduced motion | Drop scale + translate. Keep opacity. Render every step in a static list. |

## JSON schema

```jsonc
{
  "slideType": "FocusTimelineSlide",
  "transition": "FadeIn",
  "textAnimation": "FadeIn",
  "showBrandHeader": true,
  "content": {
    "eyebrow": "The journey",
    "title": "How a project unfolds",
    "direction": "horizontal",  // "horizontal" | "vertical" (default "horizontal")
    "windowSize": 3,             // 3 | 5 (default 3)
    "steps": [
      {
        "label": "Stage 1",
        "title": "Discovery",
        "description": "Two-week sprint of audits, interviews, and competitive teardown so we ship from evidence, not vibes.",
        "capsule": { "text": "Week 1-2", "color": "gold" }
      }
    ]
  }
}
```

### New fields vs `StepTimelineSlide`

- `content.direction` (`horizontal` | `vertical`) — chain axis.
- `content.windowSize` (`3` | `5`) — how many steps are visible at once.
- `steps[].description` — **required**, 1–2 sentences. This replaces the
  one-liner role of `subtitle`. Decks with only short labels should keep using
  `StepTimelineSlide`.

## Layout

### Horizontal (default)
```
[ eyebrow ]
[ title ]
[ ─── connector with progress fill ─── ]
   prev (dim)     [ FOCUS card, large ]     next (dim)
                  [ description, 1-2 lines ]
[ Step N of M  · ● ● ○ ○ ○ ]
```

### Vertical
```
[ eyebrow ]
[ title ]
                              prev (dim)
                          ┃   [ FOCUS card ]
connector with             ┃  description
progress fill              ┃   next (dim)
[ Step N of M ]
```

## Step indicator

Always rendered. Combines:

- A **pill** (`Step N / M`) — same component as `StepTimelineSlide`'s pill.
- A **dot row** — one dot per step:
  - Filled gold — already passed (`i < focusIndex`).
  - Gold ring + glow — current focus.
  - Hollow gold/30 — upcoming.

## Reusable hook

```ts
const {
  focusIndex,
  focusOn,
  next,
  prev,
  isAtStart,
  isAtEnd,
} = useFocusTimeline(steps);
```

Lives at `src/slides/hooks/useFocusTimeline.ts`. Any future "carousel of one"
slide type (testimonial walk-through, before/after gallery) reuses it.

## Hard rules

1. **No auto-advance.** Always presenter-driven. Auto-loop is `StepTimelineSlide`'s job.
2. **Indicator + connector are mandatory.** They anchor the audience to "where am I in the chain".
3. **Descriptions are required per step.** Otherwise use `StepTimelineSlide`.
4. **One deck slide.** Internal stepping does NOT change the URL slide number.
5. **Honor `prefers-reduced-motion`** — fall back to a static, full-opacity list.

## See also

- `00-fundamentals.md §3` — slide flags every slide honors.
- `03-animation-rules.md` — global transition + ease tokens.
- `mem://features/focus-timeline-effect` — implementation memory entry.
