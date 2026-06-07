# 11 — Reduced Motion

What a step slide must disable vs. keep when motion is reduced. The rule:
**drop movement, keep meaning.** Transforms, scale, and the swipe pulse go away;
opacity and blur (the depth/focus cues) survive so the active step still reads
as active.

Two independent triggers, mirrored intentionally:

1. OS preference — `@media (prefers-reduced-motion: reduce)`
   (`src/index.css:371`).
2. In-app toggle / `?reduceMotion=1` flag — `:root[data-reduce-motion="true"]`
   (`src/index.css:380`, step mirror at `src/index.css:1707-1730`). See
   `src/slides/components/reducedMotionToggle.ts`.

The TSX side reads `useReducedMotion()` (`FocusTimelineSlide.tsx:38`) and
flattens its inline `scale`/`translate` (`:132-133`) to `1`/`0`.

---

## 1. What gets disabled

| Effect | Normal | Reduced |
|---|---|---|
| `.step-title` transform (translateY + scale) | per-state | `transform: none !important` (`index.css:1714,1717-1719`) |
| Per-variant active animation (lift/slide/parallax) | keyframes | `animation: none !important` (`index.css:1725-1729`) |
| Swipe-pulse `::before` | one-shot | `animation: none; display: none` (`index.css:1721-1724`) |
| Inline JS `scale`/`translate` | computed | `1` / `0` when `reduced` |

## 2. What is preserved (do NOT drop)

- **Opacity ramp** — active 1.0 → adjacent 0.62 → far 0.55. Kept because it
  carries the focus hierarchy, not motion.
- **Blur ramp** — active 0px → adjacent 1.2px → far 2.5px (`index.css:1551-1553`).
  Blur is a static depth cue, not movement; it stays.
- **Color/opacity transitions** — the reduced mirror keeps a `color`/`opacity`/
  `text-shadow` transition (`index.css:1709-1713`) so state changes still
  cross-fade calmly instead of snapping.

## 3. Why mirror two selectors

The `@media` block only fires on OS preference. The
`:root[data-reduce-motion="true"]` block lets the in-app chrome toggle and the
`?reduceMotion=1` URL flag flatten motion even when the OS pref is off. Both
must stay in sync — if you add a new step animation, disable it in **both**.

---

## Acceptance

- [ ] Transforms, per-variant keyframes, and the swipe pulse are off under both
      triggers.
- [ ] Opacity ramp and blur ramp remain intact (focus still readable).
- [ ] Any new step motion is disabled in both the `@media` and
      `[data-reduce-motion]` selectors.
