# 26 — Generic ClickReveal Contract

> **Phase 26.** Closes ambiguity around "make element X clickable to open
> hidden slide Y". Supersedes the per-feature wiring previously scattered
> across `CapsuleSpec`, `HotspotSpec`, and ad-hoc step CTAs.

## 1. The contract

Any element that wants to become a clickable click-reveal trigger declares
ONE OR BOTH of these fields on its spec:

```ts
interface ClickRevealTrigger {
  revealSlide?: number;          // navigate to /N
  expand?: CapsuleExpandSpec;    // open inline expanding card on the same slide
  revealLabel?: string;          // optional aria/CTA label override
}
```

**Activation is opt-in per element.** An element with neither field is NOT
clickable — no implicit "every step is a button" mode.

**Precedence:** when both are set, `expand` wins. Mirrors the existing
`CapsuleSpec` rule.

## 2. Hosts

| Host | Behavior on click |
|---|---|
| `CapsuleSpec` (existing) | `clickRevealSlide` → navigate · `expand` → inline card |
| `StepSpec` (new) | First click focuses the row · "Open" pill in the right detail panel fires the reveal |
| `HotspotSpec` (new) | Click fires `expand` (inline) or navigates via `revealSlide` |

For `StepSpec`, the renderer also adds a small `↗` arrow next to the title
when the step opts in, so the audience can see at a glance which steps have
a deeper page.

## 3. Renderer ownership

Inline-expand cards are owned by **`SlideStage`**, not by individual slide
types. `SlideStage` mounts a single `<ClickRevealExpandPanel>` and passes
an `onOpenExpand(payload)` callback down to:
- the active `SlideBody`
- the `HotspotLayer`

This means any slide type can adopt inline expand by accepting the prop
and wiring it to its trigger handler. No per-type dialog plumbing.

## 4. Authoring example — step-reveal

```json
{
  "slideType": "StepTimelineSlide",
  "content": {
    "title": "Engagement Process",
    "steps": [
      { "label": "01", "title": "Discovery", "revealSlide": 12 },
      {
        "label": "02",
        "title": "Strategy",
        "expand": {
          "title": "Strategy Sprint",
          "body": "Two weeks. Workshops, research, then a positioning brief.",
          "capsules": [{ "text": "Workshops", "color": "gold" }]
        }
      },
      { "label": "03", "title": "Build" }
    ]
  }
}
```

The reveal target slide (12) MUST still pair `isClickReveal: true` +
`parentSlide: <parent>`, exactly like spec 21.

## 5. Hotspot inline-expand

```json
{
  "content": {
    "hotspots": [
      {
        "x": 10, "y": 30, "width": 25, "height": 20,
        "label": "Strategy detail",
        "expand": {
          "title": "Strategy",
          "body": "Click-reveal opens an inline card. No navigation."
        }
      }
    ]
  }
}
```

## 6. Reveal hints affordance

The controller's existing eye-toggle now applies to step rows too —
opted-in rows get a soft pulsing gold ring (`step-row--reveal-hint`).
Hidden by default; revealed via `localStorage['riseup.revealHints']`.

## 7. Component map

| Concern | File |
|---|---|
| Generic dialog | `src/slides/components/ClickRevealExpandPanel.tsx` |
| Hotspot triggers | `src/slides/components/HotspotLayer.tsx` |
| Step triggers | `src/slides/types/StepTimelineSlide.tsx` |
| Capsule triggers | `src/slides/components/Capsule.tsx` + `CapsuleListSlide.tsx` |
| Stage wiring | `src/slides/SlideStage.tsx` |

## 8. Acceptance checklist

- [ ] Step rows with `revealSlide` or `expand` show the `↗` glyph.
- [ ] Right detail panel auto-renders an "Open …" pill when the step opts in
      and the author hasn't supplied an explicit `step.cta`.
- [ ] Step rows WITHOUT a trigger never render `↗` and never get the pill.
- [ ] Hotspots with only `expand` open the inline card; with only
      `revealSlide` they navigate; with both, `expand` wins.
- [ ] Inline expand respects `prefers-reduced-motion` (no spring) and
      closes on Esc / backdrop click / X.
- [ ] Reveal-hints toggle pulses opt-in step rows in addition to capsules.
