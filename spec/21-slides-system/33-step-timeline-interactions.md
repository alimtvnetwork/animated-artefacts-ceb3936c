# Spec 33 — StepTimeline Interaction Layer (v0.59 → v0.64)

Status: locked (2026-04-26)
Supersedes: nothing — extends specs `17-step-timeline-v2`, `23-step-timeline-v3`,
`27-step-timeline-v3.2`, `32-step-timeline-v3.3-centered-composition`,
`36-step-timeline-first-load-and-alignment`.

This document captures the interaction features that landed on
`StepTimelineSlide` between releases v0.59 and v0.63, plus the v0.64
header alignment fix. It is the single hand-off doc for any model
picking up future work on this slide type.

---

## 1. Detail-panel snap transition (v0.59)

When the focused step changes (via click, keyboard, or autoplay) the
right-hand description panel performs a directional snap:

- **Active fade** — opacity 0 → 1, 280ms `ease-out-expo`.
- **Vertical translate** — `y: 12px → 0` for forward, `y: -12px → 0` for backward.
- **Subtle scale** — `0.985 → 1`, spring `{ stiffness: 380, damping: 28 }`.
- **Exit** — opposite direction, 220ms `ease-out`.
- Wrapped in `<AnimatePresence mode="wait">` keyed on `focusedIndex`.

Direction is derived by comparing previous vs. next index. Reduced-motion
collapses the whole transition to a 150ms opacity cross-fade.

## 2. Keyboard navigation (v0.60)

- **ArrowRight / ArrowDown** → `focusNext()` (clamped at last step).
- **ArrowLeft / ArrowUp** → `focusPrev()` (clamped at first step).
- **Home / End** → jump to first / last.
- Triggers the same snap transition as click and plays `slideSound.play('whoosh')`.
- Marks `lastInteraction = 'click'` so the snappy spring profile is used.
- Listener is attached to `window` while the slide is mounted **and**
  `document.visibilityState === 'visible'`. Removed on unmount.
- Resets the autoplay pause window (6s, see spec 23).

## 3. Per-step CTA pill (v0.61)

Schema (already in `src/slides/types.ts`):

```ts
interface StepCtaSpec {
  text: string;            // visible label
  href?: string;           // external URL → opens in new tab
  revealSlide?: number;    // deck-internal navigation
  variant?: 'gold' | 'outline'; // default 'gold'
}

interface StepSpec {
  // … existing fields …
  cta?: StepCtaSpec;
}
```

Rendering rules:

- Pill renders inside the right detail panel, BELOW the description, with
  `mt-6` and `inline-flex items-center gap-2` layout.
- Animates in alongside the panel snap (delay 120ms, opacity + 6px slide).
- Animates out instantly when `focusedIndex` changes (no stale CTA flash).
- Click ordering: `slideSound.play('click')` → either `window.open(href, '_blank')`
  or `deck.jump(revealSlide)`.
- `variant='gold'` → solid `bg-gold text-ink`; `variant='outline'` →
  `border border-gold/45 text-gold bg-transparent`. Hover scales 1.02.
- Honours `prefers-reduced-motion` (no scale, instant fade).

Authoring example:

```json
{
  "label": "03",
  "title": "Build",
  "description": "Engineering sprint with daily reviews.",
  "cta": { "text": "See sample sprint", "revealSlide": 7, "variant": "gold" }
}
```

## 4. Step progress pill (v0.62)

Replaces the bare numeric counter previously rendered next to the play /
pause control.

- Container: `inline-flex items-center gap-1.5 rounded-full
  border border-gold/30 bg-gold/5 px-3 py-1 backdrop-blur-sm`.
- Eyebrow: `STEP` (10px, `tracking-[0.28em]`, `text-gold/80`).
- Number: `focusedIndex + 1`, padded to 2 digits, `tabular-nums`,
  `font-bold text-gold`, animated via Framer Motion `AnimatePresence`
  with `mode="popLayout"`, vertical flip (`y: 8 → 0 → -8`, 220ms).
- Separator: `of` (11px, `text-foreground/40`).
- Total: `total`, padded to 2 digits, `tabular-nums text-foreground/65`.
- `role="status"` + `aria-live="polite"` for screen-reader updates.
- The pill tracks `focusedIndex = hoveredIndex ?? active`, so it updates
  during hover previews, click, keyboard, and autoplay alike.

## 5. Panel-feel setting (v0.63)

Adds a global preset toggle that lets non-developers pick the panel
animation feel.

- Schema (`src/slides/presetSettings.ts`):
  `stepPanelFeel: 'snappy' | 'cinematic' | 'instant'`. Default `'cinematic'`.
- Subscribed at runtime via `subscribePresetSettings()` so the slide
  reacts immediately when the user changes the setting in
  `/settings`.
- Settings UI: `SelectField` labelled "Step panel feel" with helper
  text:
  > Click & keyboard always feel snappy. This controls how the panel
  > transitions during autoplay and hover previews.

Resolution table:

| Trigger              | snappy | cinematic | instant |
|----------------------|--------|-----------|---------|
| Click / keyboard     | spring | spring    | spring  |
| Autoplay / hover     | spring | 1.0s expo | 150ms fade |
| `prefers-reduced-motion` | always 150ms fade |

Springs use `{ stiffness: 380, damping: 30 }` for `y` and
`{ stiffness: 380, damping: 28 }` for `scale`, with a 280ms
`ease-out-expo` opacity. The cinematic preset uses
`x` (24px) + opacity, 1000ms, `ease-out-expo`
(`cubic-bezier(0.19, 1, 0.22, 1)`).

## 6. Soft fade-click cue (sound system, v0.59+)

The "fade-click" cue requested for capsule / dot / step interactions does
NOT ship as a separate MP3. It is a runtime variant of `click.mp3`:

```ts
fadeClick: {
  url: '/sounds/click.mp3',
  volume: 0.09,    // ~−12dB vs. default click
  attack: 0.05,    // 50ms fade-in
  release: 0.18,   // 180ms fade-out tail
  ducksPrevious: false,
}
```

Authors call `slideSound.play('fadeClick')`. The runtime envelope
(applied by `playBuffer`) reshapes the same buffer into a soft tap that
sits politely under a louder follow-up cue (whoosh / zoom). One asset,
two cues — no new download.

## 7. Header alignment (v0.64)

`BrandHeader` is intentionally rendered OUTSIDE the centered 1440px
content container. v0.64 reduces its internal padding from
`px-6 lg:px-8` (24/32px) to `px-3 sm:px-4 lg:px-5` (12/16/20px) so the
"RiseupAsia" wordmark and the presenter chip hug the true viewport
edges. This decouples the header rhythm from the body grid (the body
title still aligns with the step list left edge per spec 32).

---

## Verification checklist

When picking this slide up, regression-test the following before
shipping:

1. Click a step → panel snaps in 280ms with spring; CTA pill appears 120ms after.
2. Press ←/→ on the slide → same snap, sound fires.
3. Hover a step row → progress pill updates, ghost numeral cross-fades,
   description preview shows. Mouse-leave restores the autoplay step.
4. Toggle the "Step panel feel" setting → cinematic vs. snappy is
   immediately visible during autoplay (no reload required).
5. Turn `prefers-reduced-motion` on → all animations collapse to 150ms
   opacity cross-fades.
6. CTA with `href` opens in a new tab; CTA with `revealSlide` jumps
   without refreshing.
7. Header logo sits within ~24-32px of the viewport's left edge at
   every breakpoint, and the default StepTimeline body grid aligns to
   that same logo line.
8. Fresh-load Step 1 is quiet: no replayed active animation and no
   whoosh on the initial `active=-1 → 0` handoff. Moving away and back
   to Step 1 later still plays animation + sound.

## v0.73 — Active-step focus-into-view

After every nav action (Enter, Right Arrow forward, Left Arrow backward,
click on a row, autoplay tick, digit-key jump, Home/End, ArrowUp/Down),
the active step row now self-scrolls into view via:

```ts
stepRefs.current[active]?.scrollIntoView({
  behavior: reduced ? 'auto' : 'smooth',
  block:    'nearest',
  inline:   'nearest',
});
```

Why `block: 'nearest'`:
- When the active row is already on-screen the call is a no-op — no jolt
  on a desktop preview where the whole timeline fits in the viewport.
- When it's clipped at the bottom edge (common on a 13" laptop in the
  fullscreen layout, or a tablet in landscape) it slides up just enough
  to reveal the row in full — never centers, never over-scrolls.

Why we tie it to `active` (not the click handler):
- One effect handles every nav source — keyboard, mouse, autoplay, deck
  Next/Prev — so the focus alignment is guaranteed identical regardless
  of how the cursor moved. No risk of one path forgetting to scroll.

Reduced-motion: still scrolls (alignment matters more than smoothness),
but uses `behavior: 'auto'` to snap instantly with no easing.
