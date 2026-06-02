# 27 — Slides Number (slide-number indicators)

> **Read me first.** This folder is the single, complete, blind-implementable
> spec for **everything that shows a slide number** in the Riseup Asia deck:
> where each number appears, how it looks, how clicking it jumps, what sound
> plays, and how it stays in sync with the URL.
>
> "Blind-implementable" means: a developer or AI who has **never seen this
> codebase** can rebuild every slide-number surface pixel-for-pixel and
> behaviour-for-behaviour using only the files in this folder. Every number,
> colour token, class name, sound cue and edge case is written down. Do not
> assume anything — if it matters, it is stated here.

## What is a "slide number"?

A 1-based integer telling the audience and presenter **which slide is on
screen** out of the total (e.g. `04 / 13`). It appears on **four live
surfaces** at once, each with a different job. They all read the same source
of truth (`currentLinear` / `total`) so they never disagree.

## The four surfaces (at a glance)

| # | Surface | Where on screen | Interactive? | File |
|---|---------|-----------------|--------------|------|
| 1 | **Presenter Top Bar** | top-center, pinned | no (display HUD) | `03-surface-top-bar.md` |
| 2 | **Slide Number Badge** | bottom-right corner | no (read-only) | `04-surface-bottom-badge.md` |
| 3 | **Dot Pagination** | bottom-center strip | yes (click a number → jump) | `05-surface-dot-pagination.md` |
| 4 | **Controller Indicator** | inside bottom-right controller pill | yes (click → type → Enter) | `06-surface-controller-indicator.md` |

A fifth, **legacy** surface (`TopSlideJumper`, section popover) is documented
in `07-surface-legacy-top-jumper.md` — it is OFF by default and only relevant
behind `?jumper=1`.

## Read in this order

1. `01-overview-and-glossary.md` — concepts, glossary, the golden rules.
2. `02-data-and-state.md` — what `current`, `currentLinear`, `total`,
   `slideNumber` mean and how they are derived. **Read before any surface.**
3. `03-…` through `07-…` — one file per surface, fully specified.
4. `08-jump-and-routing.md` — how a jump changes the URL and the active slide.
5. `09-sound.md` — the exact sound cue, asset, and volume on every jump.
6. `10-visibility-and-settings.md` — when each surface shows/hides.
7. `11-accessibility.md` — ARIA, screen-reader, reduced-motion contract.
8. `12-design-tokens.md` — every colour/size token used, in one table.
9. `13-acceptance-checklist.md` — the pass/fail list to verify the build.

## Golden rules (never violate)

- **One source of truth.** All four surfaces receive `current={currentLinear}`
  and `total={total}` from `SlideDeckPage`. Never compute a slide number
  locally inside a surface.
- **1-based, padded to 2 digits** on display surfaces (`01`, `09`, `13`) —
  except Dot Pagination, which shows the bare number inside each dot.
- **Gold = the current number.** The active number is always `text-gold`;
  the total and separators are dimmed foreground.
- **Jumping plays exactly one `click` cue** (see `09-sound.md`). Never stack
  cues; never play a cue on passive re-render.
- **Respect `prefers-reduced-motion`** — morph/spring animations collapse to
  near-instant (`duration: 0.01`).
- **Never appear in print/PDF/HTML export.** Every interactive chrome surface
  carries `data-print-hide="true"`.
