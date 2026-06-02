# Steps-Based Slides — Spec Folder

> **Audience: a "blind" AI implementer.** You may not have seen this codebase.
> This folder tells you *everything* you need to (re)build the step-based slide
> family from scratch, in order, with no guessing. Read the files in the order
> below. Every rule here is normative — if the code and this spec disagree, the
> spec is the intended behavior; fix the code.

## What "steps-based slides" means

A **steps-based slide** presents an ordered list of items — an agenda, a
process, a timeline, a chain of phases. Each item has an **index number**, a
**title**, and optional supporting text and a **capsule** (a small colored
pill, e.g. a duration tag). The whole family shares one mental model:

```
   01   Big Title For This Step              [ 5 min ]
        one-line supporting subtitle
   ───────────────────────────────────────────────────
   02   Next Step Title                      [ 12 min ]
        supporting subtitle
```

There are five members of the family. They differ only in *layout* and
*motion* — the **data model is shared** (see `01-data-model.md`):

| SlideType            | Shape                                   | Use for                          |
|----------------------|-----------------------------------------|----------------------------------|
| `SessionOutlineSlide`| Vertical numbered agenda (the "outline")| Chapter opener / agenda          |
| `StepTimelineSlide`  | Left rail of steps + right detail panel | Walking through a process live   |
| `FocusTimelineSlide` | Timeline that spotlights one active step| Narrated, one-step-at-a-time     |
| `AdvanceStepSlide`   | Cinematic carousel of steps             | Big reveal, one step per advance |
| `StepsChain3DSlide`  | 3D depth chain of step cards            | Premium "journey" visual         |

**This spec folder focuses on `SessionOutlineSlide` (the outline section)** as
the canonical, simplest member, then generalizes. If you implement the outline
exactly per `02-session-outline-slide.md`, the others are variations on the
same data + token rules.

## Reading order (do not skip)

1. `00-overview.md` — the family, shared principles, non-negotiable house rules.
2. `01-data-model.md` — the exact `content` schema every step slide consumes.
3. `02-session-outline-slide.md` — the outline section, fully specified.
4. `03-layout-and-tokens.md` — geometry, gutters, semantic classes, color tokens.
5. `04-animation-and-reveal.md` — stagger reveal, active-row highlight, reduced motion.
6. `05-implementation-checklist.md` — the literal build order for a blind AI.
7. `06-acceptance-and-qa.md` — how to prove it works before you call it done.

## Hard rules (repeated everywhere because they matter)

- **Keywords-only content.** Titles and subtitles are short phrases, never
  paragraphs. The presenter narrates; the slide is a visual anchor.
- **Capsules MUST use `.capsule-{tone}` classNames.** Never inline
  `style={{ background / color }}` that references brand tokens
  (`--gold/--ember/--cream/--ink/--white`). Those tokens flip meaning on light
  themes and inline chips collapse to dark-on-dark. Use `.capsule-meta` for
  time/duration tags.
- **Use semantic typography classes** (`.slide-title-content`, `.slide-eyebrow`,
  `.step-title`) — never inline `text-shadow`; the weight-shadow tokens are
  applied automatically.
- **Everything horizontal reads from `--brand-inset-x`**, everything vertical
  from `--brand-inset-y`, so the title block, rail, and capsules stay aligned.
- **Respect `prefers-reduced-motion`** — drop transforms to a short opacity
  crossfade.
- **JSON is the source of truth at runtime.** The slide component only renders
  what `spec.content` provides; no hardcoded copy.
