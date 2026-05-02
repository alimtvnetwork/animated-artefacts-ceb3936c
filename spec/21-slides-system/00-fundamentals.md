# Slide System — Fundamentals

This document is the source of truth for how every slide in every deck behaves.
Decks live under `spec/slides/{deck-slug}/` with one JSON file per slide and a
`deck.json` manifest. JSON is the runtime source of truth — Markdown files are
companion notes only.

## 1. Per-slide flags (top-level JSON)

| Field               | Type      | Default   | Purpose |
|---------------------|-----------|-----------|---------|
| `slideNumber`       | int       | required  | Stable identity, used in URL `/N`. |
| `slideName`         | string    | required  | Human label, used in filenames. |
| `slideType`         | enum      | required  | One of `TitleSlide`, `KeywordSlide`, `CapsuleListSlide`, `StepTimelineSlide`, `ImageSlide`, `QrMeetingSlide`, `SectionDividerSlide`. |
| `transition`        | enum      | required  | `FadeIn`, `SlideIn`, `PushIn`, `PushLeft`, `PushRight`. |
| `textAnimation`     | enum      | required  | `Bounce`, `FadeIn`, `SlideUp`, `Stagger`. |
| **`enabled`**       | bool      | `true`    | **Kill switch.** If `false`, the slide is excluded from the linear flow and the indicator. Click-reveal targets are also unreachable. Use to mute a slide without deleting the file. |
| `isClickReveal`     | bool      | `false`   | If true, slide is hidden from linear flow; only reached via a parent capsule click. |
| `parentSlide`       | int\|null | null      | Required when `isClickReveal: true`. Going Next from a click-reveal returns here. |
| `showBrandHeader`   | bool      | `true`    | Render Riseup Asia logo (top-left). |
| `showPresenterChip` | bool      | `true`    | Render presenter pill (top-right). |
| `titleStyle`        | enum      | `"cream"` | `"cream"` (solid cream, default), `"white"` (pure white, max contrast), `"gold"` (solid gold-glow), `"gradient"` (legacy gold gradient — avoid for new slides). |
| `titleShimmer`      | bool      | `false`   | Plays a one-shot shimmer sweep across the title on entrance (works on solid colors too). |
| `notes`             | string    | `""`      | **Speaker-only.** Markdown-light narration shown in the Presenter view (`/present`). Never displayed to the audience. See `05-presenter-view.md`. |
| `content`           | object    | required  | Slide-type-specific payload (see slide-types catalog). |

### Why `enabled`

The presenter often wants to mute a slide without deleting it (timing, audience,
draft work). Setting `"enabled": false` removes it from the deck immediately.
The slide JSON, MD, and any associated assets stay on disk for later.

## 2. Color & animation rules

- **No always-on gradients.** Prefer solid colors. Title default = solid cream.
- **Gradients are allowed only when paired with motion.** If you use a gradient,
  add a moving highlight on top (the `shimmer-sweep` utility) so it feels alive.
- One color per emphasis surface (title, step pill, capsule). Stack contrasts via
  capsule colors, not gradients on text.
- Respect `prefers-reduced-motion` — already handled globally in `index.css`.

## 3. Brand header & safe area

`BrandHeader` is a fixed `h-24` band. Every slide body reserves `pt-32 pb-20`
so titles never collide with the logo. If you build a new slide type, keep the
same padding contract.

The Riseup Asia logo renders at `h-16` (was `h-9`) for stronger brand presence
and includes a soft drop-shadow for legibility on busy backgrounds.

## 4. Controller behavior

- Position: **bottom-right**.
- **Collapsed by default:** a single 48×48px gold-arrow button at ~55% opacity. Click to advance one slide.
- **Expands to the full pill on hover** (or after `mousemove` within 2.2s, or while the share/manifest popovers are open).
- Always mounted; the collapsed/expanded swap is a Framer Motion `AnimatePresence` cross-fade with scale, never a position change.
- Full details and contents in `02-controller.md`.

### Title overflow guard

All titles use `clamp(min, vw, max)` for font-size and `max-w-[92vw]` so a long
title can never push past the viewport edge. The slide body wrapper sets
`overflow-hidden` as a final safety net. Never hard-code a fixed `text-[Nrem]`
size on `<h1>`/`<h2>` titles.

## 5. Routing

Flat: `/{slideNumber}`. Click-reveal slides have their own URL but are not
reachable through linear navigation. The URL syncs on every change and is
deep-linkable.

## 6. Authoring checklist

When adding a new slide:

1. Create `spec/slides/{deck}/NN-name.json` with all top-level flags above.
2. Create `spec/slides/{deck}/NN-name.md` with a one-paragraph design note.
3. Add `NN-name` to `deck.json` `slides` array.
4. Default `titleStyle: "cream"`, `titleShimmer: true`, `enabled: true`.
5. Use capsule colors (`gold`, `ember`, `cream`, `ink`, `outline`) for emphasis.
6. Keep content keyword-only — presenter narrates the rest.

## 7. Hotspots (free-floating click-reveal regions)

Capsules are not the only way to trigger a click-reveal slide. Any slide can
declare `content.hotspots[]` — invisible (or faintly outlined) rectangles
positioned in **percentages of the 1920×1080 stage** that reveal a target slide
on click.

```json
"hotspots": [
  { "revealSlide": 12, "x": 10, "y": 30, "width": 25, "height": 20, "label": "Strategy detail", "style": "ghost" }
]
```

Use this to make a word in a title, a region of an image, or a step in a
timeline interactive — without redesigning the slide around capsules. Set
`style: "outline"` while authoring to see where the boxes sit, then flip back
to `"ghost"` (default) for presentations.

## 8. Click-reveal UX (badge + reveal hints)

Click-reveal slides ship with two affordances so presenters never feel lost:

1. **Hidden-detail badge.** Every slide with `isClickReveal: true` and a
   `parentSlide` automatically renders a `ClickRevealBadge` near the top:
   a gold "Hidden detail" pill plus a "Back to {parent}" button. Clicking
   Back navigates to the parent in `'backward'` direction. Implemented in
   `src/slides/components/ClickRevealBadge.tsx`.

2. **Reveal hints toggle.** On any slide that exposes click-reveal capsules
   or hotspots, the controller shows an Eye/EyeOff button. When on:
   - Click-reveal capsules get a gold ring + slow pulse.
   - The "↗" arrow on those capsules turns gold instead of dim.
   - The toggle state persists across navigation via `localStorage`
     (`riseup.revealHints`).

   The button is **hidden** on slides without any reveal entrypoints to
   avoid clutter. The native `title` tooltip on every reveal capsule names
   the target slide ("Reveal: Strategy") whether or not hints are on.


