# 41 — Session Outline (sample deck)

**Type:** `SessionOutlineSlide` · **Seq:** 41

## Intent
The canonical agenda / chapter-opener. A title block sits on top, then a
vertical numbered list of 4 outline rows. Used as the "here's the map" beat
right after a section divider, before diving into content.

## Why these choices
- **4 items** — within the 2–8 budget; comfortable on the 1080px stage with
  no shrinking.
- **`activeIndex: 0`** — opens with row 1 (Recap) glowing gold while the rest
  dim to 0.55, signalling "we are here". As the talk advances the presenter
  bumps the active index per chapter.
- **capsule vs meta mix** — emphasis rows (Recap, The build) use colored
  `capsule` tones (`gold`, `ember`); the lighter beats use plain `meta` text.
  This keeps the rhythm varied without overloading every row with color.
- **`Stagger` text animation** — rows reveal top-to-bottom so the eye tracks
  the agenda in reading order.

## Keywords-only check
Every title is ≤2 words; every subtitle is one short line. Presenter narrates
the detail — slide is the visual anchor.

## Theme safety
Renderer uses `.capsule-{tone}` classNames and `text-[hsl(var(--white)/…)]`
tokens only, so the slide stays legible on light themes (paper-ink,
github-light). No literal `text-white` or inline brand-token pill styles.

See system spec: `spec/21-slides-system/steps-based-slides/`.
