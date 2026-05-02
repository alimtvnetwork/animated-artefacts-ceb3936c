# 44 — Steps Accessibility Spec (Enriched)

> **Last Enriched:** 2026-04-26 · **Phase 4/20** · Companions:
> `42-steps-motion.md`, `43-steps-sound.md`. Runtime: `StepTimelineSlide.tsx`
> + `useFocusTimeline.ts`.

## 1. Reduced motion (`prefers-reduced-motion: reduce`)

Detect once on mount via
`window.matchMedia('(prefers-reduced-motion: reduce)')`. Re-evaluate on
the media-query `change` event so toggling OS settings during a session
takes effect without reload.

| Surface | Default motion | Reduced-motion behavior |
|---|---|---|
| Active row title | Font-size jump + opacity ramp + 280ms slide-in | Opacity-only cross-fade, **150ms** cap |
| Detail panel snap | Spring `y/scale` + fade | Opacity cross-fade, 150ms |
| Inner panel stagger | 0.05/0.12/0.18/0.26s | Single 150ms fade for the whole block |
| Connector grow | 320ms ease | Instant snap to new height |
| Numbered chip | Ring grow + glow on active | Ring colour change only, no animation |
| Autoplay | Default OFF (user choice) | Unchanged — autoplay is content, not motion |

Rule: **never** disable a state change — only the animation that carries
it. The user must still see "row 3 is active"; we just stop pretending
we're flying there.

## 2. Color & contrast

Background is `--ink` (`#0D0D0D`). Title contrast targets:

| State | Foreground | Ratio vs `#0D0D0D` | WCAG |
|---|---|---|---|
| Active title | `hsl(0 0% 100%)` (`#FFFFFF`) | **20.5:1** | AAA |
| Adjacent title | `hsl(0 0% 100% / 0.75)` ≈ `#BFBFBF` | **9.5:1** | AAA |
| Far title | `hsl(0 0% 100% / 0.55)` ≈ `#8C8C8C` | **4.9:1** | AA Large only |
| Eyebrow (gold) | `hsl(40 96% 48%)` ≈ `#F3A502` | **9.6:1** | AAA |
| Capsule outline border | `hsl(40 96% 48% / 0.6)` | n/a (border) | — |

**Far rows fail WCAG AA for body text.** They are intentionally muted to
read as "background context." Author rule: never put critical
information that the audience must read in a far-state row — those rows
are for visual rhythm only.

## 3. Focus order (keyboard)

Tab order on the slide:

1. Play / Pause icon button (single 28×28 control).
2. Each step row (the `<button>` wrapper) in source order.
3. The currently-active step's CTA pill (if `step.cta` is defined).

`tabindex` is not overridden; DOM order = focus order. Each row is a
real `<button type="button">` — never a `<div role="button">`.

## 4. ARIA wiring

| Element | Attribute | Value |
|---|---|---|
| Slide root | `role` | `region` |
| Slide root | `aria-label` | `"Step timeline: " + slide.title` |
| Step list | `role` | `list` |
| Step row | `role` | `listitem` (then a nested `<button>`) |
| Step row button | `aria-current` | `"step"` when this row is `active` |
| Play / Pause | `aria-label` | `"Play autoplay"` ↔ `"Pause autoplay"` |
| Play / Pause | `aria-pressed` | reflects autoplay-on |
| Detail panel | `aria-live` | `"polite"` |
| Detail panel | `aria-atomic` | `"true"` (re-read whole panel on change) |

`aria-live="polite"` is the SR signal for the focus-change event. Do
**not** also fire a sound-mediated SR cue — the screen reader already
reads the description.

## 5. Keyboard contract

| Keys | Action |
|---|---|
| `→` / `↓` | `focusNext()` (clamped at last) |
| `←` / `↑` | `focusPrev()` (clamped at first) |
| `Home` / `End` | Jump first / last |
| `P` | Toggle autoplay |
| `Enter` / `Space` on row | Same as click |
| `M` (deck-level) | Toggle global mute |

Listener attached to `window` while slide is mounted **and**
`document.visibilityState === 'visible'`. Removed on unmount and on
`visibilitychange → hidden`.

## 6. Acceptance criteria

- VoiceOver / NVDA reads the active step's eyebrow + title + description
  exactly once per focus change.
- All keyboard actions work without a pointer attached.
- With reduced motion on: no transform animations fire (verified via
  `getAnimations()` returning empty for transform properties).
- Color picker on each title state hits the ratios in §2.

## 7. Open questions & changelog

- Open: `aria-hidden="true"` on far rows? Current: no.
- 2026-04-26 (v0.79.2): Phase 4 — pinned WCAG ratios + ARIA contract.
- 2026-04-26 (v0.100.0): Phase 4 implemented in `StepTimelineSlide.tsx` —
  slide root now `role="region"` + `aria-label="Step timeline: {title}"`;
  step container `role="list"` with `role="listitem"` + `aria-setsize`/
  `aria-posinset` per row; row buttons gained `aria-label="Step N of M:
  {title}"` and a stronger `focus-visible:ring-2 ring-gold/70 ring-offset-2`;
  detail panel marked `aria-live="polite" aria-atomic="true"`; keyboard
  listener now attaches/detaches on `visibilitychange` so a hidden tab
  releases keys. Reduced-motion already snaps row entrance (`initialX = 0`)
  and 150ms-caps the detail-panel crossfade — no further motion change
  needed.

