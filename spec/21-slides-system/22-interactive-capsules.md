# 22 — Interactive Capsules (hover label-flip + expanding card)

A reusable interaction pattern for `CapsuleSpec` that turns plain pill
labels into an explorable surface. Two layered behaviors, both opt-in:

1. **Hover label-flip** — the resting label rotates out the top, the
   `hoverText` rotates in from below. A tactile, non-disruptive way to
   surface a one-line elaboration.
2. **Expanding card** — clicking a capsule grows it into a full panel on
   the **same slide** (no URL change). Other capsules dim and blur. Click
   the backdrop or press `Esc` to collapse.

Both behaviors are driven entirely by JSON. Authors don't write any code.

## When to use

| Want | Use |
|------|-----|
| Persistent grid of clickable pills with no extra context | bare `CapsuleSpec` |
| Surface a one-line subtitle on hover | add `hoverText` |
| Show 1-2 paragraphs of detail without leaving the slide | add `expand` |
| Route to a fully separate detail slide | use legacy `clickRevealSlide` |
| Both (hover hint + click reveal) | combine `hoverText` + `expand` |

`expand` and `clickRevealSlide` may both be present. **`expand` wins** — the
inline card opens. Author-side migration: keep `clickRevealSlide` until you
write the `expand` payload, then drop it.

## Schema

```jsonc
{
  "text": "Strategy",          // resting label
  "color": "gold",
  "hoverText": "Frame the bet", // optional — vertical flip on hover
  "clickRevealSlide": 4,        // legacy — routes to slide #4 if no `expand`
  "expand": {                   // optional — inline expanding card
    "eyebrow": "Capability · Strategy",
    "title":   "Strategy",      // falls back to `text`
    "body":    "We narrow ambiguous goals to a single measurable bet…",
    "capsules": [               // sub-pills inside the card
      { "text": "Workshops", "color": "gold" },
      { "text": "Research",  "color": "ember" }
    ],
    "cta": {                    // optional CTA button at the bottom
      "text": "See full case study",
      "onClickRevealSlide": 4   // OR href: "https://…"
    }
  }
}
```

### Rules

1. `hoverText` ≤ 28 chars. Anything longer truncates the flip motion.
2. `expand.body` is keyword-first per the deck-wide content rule. 1-2
   sentences max. Long bodies break the card layout.
3. `expand.capsules` ≤ 6. The card is a focal moment, not a wall.
4. Avoid mixing `expand` and `clickRevealSlide` long-term — either keep the
   detail in-deck (slide), or in-card (`expand`), not both.

## Animation choreography

### Hover label-flip (§2)

1. Resting label is rendered inline with the capsule.
2. On `pointerenter` / `focus`:
   - Resting label rotates out: `translateY(0%) → translateY(-120%)`,
     `opacity 1 → 0`, 320ms ease `[0.22, 1, 0.36, 1]`.
   - Hover label slides in from below: `translateY(120%) → translateY(0)`,
     `opacity 0 → 1`, same 320ms ease (synchronized).
3. Mouse-leave / blur reverses the flip.
4. Button width is reserved by an invisible duplicate of the longer of
   `text` or `hoverText` so the row doesn't reflow on hover.
5. `prefers-reduced-motion`: the flip is suppressed entirely; the resting
   label stays. Hover still receives the lift-shadow + arrow nudge.

### Arrow affordance (§2.5)

Any clickable capsule (`expand` OR `clickRevealSlide` OR external `onClick`)
renders an `ArrowUpRight` icon to the right of the label.

- Resting: 70% opacity (or 100% in highlight-reveal mode).
- Hover: animates `x: +2, y: -2, opacity: 1` over 250ms.
- Reduced motion: static.

This replaces the legacy `↗` glyph.

### Expanding card (§3)

1. Click triggers `setExpandedIdx(i)` on the slide.
2. Source capsule gets `data-expanding="true"` and fades to `opacity: 0,
   pointer-events: none`. Other siblings animate to `opacity: 0.25, blur(1px)`.
3. A fixed-position backdrop fades in over the slide (`hsl(0 0% 5% / 0.55)`,
   `backdrop-filter: blur(6px)`, 300ms).
4. The card itself shares `layoutId="capsule-{slideNumber}-{i}"` with the
   source capsule — Framer Motion interpolates the rect, so the card
   visibly **morphs out of the capsule** instead of fading in from
   nowhere. Spring `stiffness: 320, damping: 32, mass: 0.7`.
5. Inside the card, content fades in with a 180ms delay so the morph
   reads first.
6. Closing reverses every step: card morphs back to capsule rect, backdrop
   fades, siblings restore.

### Triggers that close the card

| Trigger | Behavior |
|---------|----------|
| Click the backdrop (outside the card) | Close |
| Press `Esc` | Close (ignored when focus is in a form field) |
| Click the close ✕ button (top-right of card) | Close |
| Navigate to another slide | Auto-close (slide spec change resets state) |
| CTA with `onClickRevealSlide` | Close + navigate |
| CTA with `href` | Open in new tab; card stays |

## Reduced motion

- Label-flip → suppressed (resting label stays).
- Arrow nudge → suppressed.
- Backdrop blur → instant.
- Card morph → snaps to final rect (`duration: 0.01`).
- Sibling dim → instant opacity change, no blur.

## Reuse on other slide types

The pattern lives inside `CapsuleListSlide.tsx` for now. To reuse it on
another slide type that renders `CapsuleSpec[]` (e.g. a future
`PricingSlide` or `TeamSlide`):

1. Lift the `expandedIdx` state + the Esc handler into a hook,
   `useCapsuleExpand(slideNumber, capsules)`.
2. Render the same `<AnimatePresence>` overlay block, keyed by
   `capsule-{slideNumber}-{i}`.
3. Pass `isExpanding={expandedIdx === i}` to each `<Capsule>`.

Until a second slide type needs this, keep it inline. Do not extract
prematurely.

## Authoring example

```jsonc
// spec/slides/showcase/02-capabilities.json
{
  "slideType": "CapsuleListSlide",
  "content": {
    "title": "Capabilities",
    "capsules": [
      {
        "text": "Strategy",
        "color": "gold",
        "hoverText": "Frame the bet",
        "expand": {
          "eyebrow": "Capability · Strategy",
          "body": "We narrow ambiguous goals to a single measurable bet.",
          "capsules": [
            { "text": "Workshops", "color": "gold" },
            { "text": "Research",  "color": "ember" }
          ]
        }
      }
    ]
  }
}
```

## Acceptance criteria

1. Hover on a capsule with `hoverText` plays the vertical label flip.
2. Hover on a capsule WITHOUT `hoverText` is a no-op (resting label stays).
3. Click on a capsule with `expand` opens the card; siblings dim/blur.
4. Click on a capsule with only `clickRevealSlide` (legacy) routes to that
   slide via `onCapsuleClickReveal` (existing behavior preserved).
5. `Esc` and backdrop click both close the card.
6. Card share-element morph uses `layoutId="capsule-{slideNumber}-{i}"`.
7. `prefers-reduced-motion` suppresses every transform; functionality
   (open / close / arrow) still works.
8. Card auto-closes when the user navigates to a different slide.
9. Capsule width does not reflow on hover (label-flip uses absolute
   positioning over an invisible width-reservation copy).

## See also

- `spec/slides/00-fundamentals.md` — slide flags & content shape.
- `spec/slides/16-cinematic-capsule-animation.md` — entrance animation that
  precedes any interaction.
- `mem://features/interactive-capsules` — implementation memory entry.
- `mem://design/contrast` — title contrast rule pulled out of this work.
