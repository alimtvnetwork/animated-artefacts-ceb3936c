# 56 — CLI cards page + guidelines "code preview" page

**Date:** 2026-05-03 · **Mode:** No-questions (window 2, task 17)

## Request

> "make it white please text please and all the links should be link in the
> CLI page and try to have the cli page like [image-3.png] also add pages
> like this with information [image-4.png]"

Three asks bundled:

1. **Title text white** on the "What Riseup Asia does" slide (image-2).
2. **Links must actually open** on the CLI page — every CLI / repo capsule
   should be a real link to GitHub.
3. **New page formats** matching image-3 (three big CLI cards row, each
   with emoji glyph + title + slug + one-liner + "View on GitHub →") and
   image-4 ("Coding & spec guidelines." headline + faux SPEC.md terminal
   card on the left + three info rows on the right with vertical accent
   rule).

## Decisions taken without asking

- **#1 done:** `07-about-riseup.json` `titleStyle` flipped `gold → white`.
- **#2 done:** added `cta: { text, href }` to every capsule expand on
  slides 5 (Movie/Alarm/Gitmap CLIs) and 6 (gitmap-v13 / movie-cli-v8 /
  alarm-app-v3 / Presentation). The expand-card already renders `cta` as a
  pill that calls `window.open(href, '_blank')`. Click capsule → card
  morphs out → "View on GitHub →" pill is the link. URLs match the
  existing `hoverText` strings (`github.com/alimtvnetwork/<repo>`).
- **#3 NOT implemented:** building two brand-new slide layouts is outside
  this loop's scope. Both need new `slideType` enum values, contracts,
  CATALOG entries, sample JSON, density caps, tests — and several visual
  details aren't pinned down (emoji vs lucide icon, terminal-card font /
  background token, info-row icon set, whether the "code preview" is
  authored markdown or live-formatted source).

## Ambiguities for batch clarification

- **CLI cards layout (image-3)** — should this become:
  - (a) a new `CardGridSlide` slide type the deck can reuse, or
  - (b) a one-off variant of `CapsuleListSlide` with `display: "cards"` +
        `card.icon|emoji|slug|description|href`, or
  - (c) just a re-themed StepTimeline / Focus row?
  Card icons in the screenshot are emoji (⏰ 🎬 🌐) — confirm emoji vs
  lucide icon set.
- **Guidelines "code preview" (image-4)** — looks like a 2-column
  `LayoutSlide`:
  - left: a faux-terminal card showing `SPEC.md` headings (`# Project
    Spec / ## Goals / ## Constraints / …`) — needs a `CodePreviewBlock`
    sub-component (mono font, syntax tint, window chrome, "JUST RELEASED"
    chip).
  - right: 3 info rows (icon-rule, h3 title, body line) — same shape as
    `FocusTimeline` items but stacked, no timeline rail.
  Confirm whether to ship as a single new `SpecPreviewSlide` or as
  composable primitives (`CodePreviewBlock` + `InfoRowList`) the existing
  `LayoutSlide` can host.
- **Routing** — user said "add pages like this with information"
  (plural). Are these new slides for the **session-4-ai-coding** deck, or
  a separate deck? (Image-4 mentions "Coding & spec guidelines." which
  matches slide 8 `08-guidelines.json` — so likely a richer rebuild of
  slide 8 rather than a brand-new deck.)

To unblock now, slide 8 stays as the keyword version; the visual upgrade
lands once the slide-type direction is picked.

## Files touched this loop

- `front-end/project/session-4-ai-coding/data/slides/05-ship-today.json`
  — added `cta` to all 3 expands.
- `front-end/project/session-4-ai-coding/data/slides/06-references.json`
  — added `cta` to all 4 expands (incl. Presentation URL).
- `front-end/project/session-4-ai-coding/data/slides/07-about-riseup.json`
  — `titleStyle: "gold" → "white"`.
- `.lovable/question-and-ambiguity/task-counter.md` — bump 16 → 17.
