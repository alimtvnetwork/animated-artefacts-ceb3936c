---
name: step-timeline-v3
description: StepTimeline v3.9+ motion + layout — quiet first-load Step 1, Ubuntu step headers, true full-width trimmed-logo header, header-anchored body grid. See specs 33, 34, 36, 37.
type: feature
---

## Spec
`spec/slides/23-step-timeline-v3.md` (this is a motion + ambient layer
on top of `17-step-timeline-v2.md`'s structural rules).

## What v3 changes vs v2.5

1. **Longer fades** — active text 1100ms (was 420ms) with `expo-out`
   `cubic-bezier(0.19, 1, 0.22, 1)`. Right description 900ms (was 420ms).
   TranslateX -32px → 0 (was -24px). NO blur.
2. **Breathing badge halo** — `step-badge-radiate` keyframe, 2400ms
   ease-in-out infinite. Active badge h-12/w-12 (was h-11). The
   one-shot bubble-in still fires on activation; the radiate is the
   continuous ambient pulse on top of it.
3. **Ghost step numeral** — giant faded numeral stamped top-right of
   the slide background. Cross-fades on every active change. Color
   `hsl(var(--gold) / 0.045)`. Behind content, above ambient layer.
4. **Pure-white text** — eyebrow / title in right description panel
   forced to `hsl(0 0% 100%)`. Inactive timeline rows fade through
   75% / 55% white.
5. **Ambient background** — wraps the slide via `<AmbientBackground>`
   (spec 24). Icons: Compass, Target, Hammer, TrendingUp, Workflow,
   Layers, Activity, Sparkles. Drift on (subtle).

## What v3 preserves from v2.5

- NO `transform: scale` anywhere. Depth is real font-size jumps.
- Step-first deck Next/Prev via `tryAdvance`.
- Autoplay OFF by default. Icon-only Play/Pause + tiny "STEP NN / NN".
- Single right-side description panel (not inline).
- 6s pause-after-interaction window.
- Whoosh sound on every active change.
- Reduced motion: text fade collapses to 150ms opacity, badge radiate
  off, ghost numeral cross-fade collapses to instant swap.

## Constants (JS)
- `STEP_INTERVAL_MS = 2200`
- `PAUSE_MS = 6000`
- `REVEAL_BASE_DELAY = 0.3`
- `REVEAL_STAGGER = 0.18`
- `ACTIVE_FADE_MS = 1500` (v3.1 — was 1100)
- `RIGHT_FADE_MS = 900`
- `GHOST_FADE_MS = 1200` (v3.1 — was 900; entrance variant alternates per step)

## v3.1 (2026-04-26) — additions

- **Smaller, raised number chips** — active 36px (was 48px), idle 28px (was 36px),
  with `-mt-1` so they sit above the title baseline. Connector recentered to
  `left-[14px]`. The chip reads as a marker, not a button; the title is the focus.
- **Dev-tool ambient icons** — `STEP_AMBIENT_ICONS` is now Code2 / Terminal /
  GitBranch / Github / Figma / Boxes / Container / Cpu / Cloud / Database /
  Braces / Bug. Index 0 (VS Code blue `#007ACC`) and index 4 (Figma orange
  `#F24E1E`) render in real brand color via `accentColors`; the rest stay
  monochrome at `opacity 0.05`.
- **Cursor parallax** — `<AmbientBackground parallax={22} />` shifts each
  icon opposite the cursor by `parallax * weight` px (per-icon weight 0.4–1.0).
  Throttled with `requestAnimationFrame`; off when `prefers-reduced-motion`.
- **Alternating ghost numeral entrance** — variant cycles per step:
  `i % 3 === 0` → fade, `=== 1` → slide-right, `=== 2` → slide-up. Duration
  bumped to 1200ms.

## v3.2 (2026-04-26) — additions

Spec: `spec/slides/27-step-timeline-v3.2.md`. Three locked rules:

1. **Fixed-slot rows (no reflow)** — `.step-row` reserves
   `min-height: calc(var(--step-title-active) * 1.05)` and is
   `display:flex; align-items:center;`. The active row's font grows in
   place; siblings don't move. Still NO transform:scale.
2. **Superseded by v3.8** — step row titles now use Ubuntu, not Poppins.
   See `spec/slides/36-step-timeline-first-load-and-alignment.md`.
3. **Pure white at every state** — `.step-title` color is
   `hsl(0 0% 100%)` for active / adjacent / far. The dim ramp comes
   entirely from the row container's `opacity` (1 / 0.55 / 0.30), not
   from translucent text.
4. **Slide title white** — `03-process.json` `titleStyle` flipped
   `cream` → `white`, `titleShimmer` off.

## v3.3 (2026-04-26) — layout fix

- **`justify-start` not `justify-center`** on the slide content column so
  the title sits right below BrandHeader and never gets clipped on short
  (~720p) viewports. Padding reduced: `pt-24 lg:pt-28`, `pb-16`, `px-12 lg:px-16`.
- **Active size reduced** — `--step-title-active` `clamp(3rem, 5vw, 4.75rem)`
  → `clamp(2.25rem, 4.2vw, 3.75rem)`. Adjacent + far follow proportionally.
  4-step chains now fit on 720p without overflowing.
- **Tighter row gap** — `space-y-8` → `space-y-4 lg:space-y-6`.
- **Hard-white title** — slide-level `<h2>` gets an inline
  `style={{ color: 'hsl(0 0% 100%)' }}` in addition to `titleClassFor` so any
  stale localStorage manifest cream override can't bleed through.

## v3.4 (2026-04-26) — fullscreen/wide left lock (SUPERSEDED by v3.5)

The hard-left lock to the logo gutter was the wrong fix — it produced a
lopsided composition with dead space on the right.

## v3.5 (2026-04-26) — centered 1440px composition

Spec: `spec/slides/32-step-timeline-v3.3-centered-composition.md`.

- **`step-timeline-content` is centered, NOT left-locked.** Width
  `75%`, `max-width: 1440px`, `margin-inline: auto`. On a 1920px design
  canvas this gives 240px symmetric margins. Replaces the v3.4
  `width:100%; margin-left:0; padding-left:2.5rem` rule.
- **`step-timeline-grid` uses fixed 560:800 ratio** via
  `grid-template-columns: minmax(0, 560fr) minmax(0, 800fr)`. The
  third absorber column from v3.4 is gone. `align-items: center` so
  the detail panel midpoint matches the active step row midpoint.
- **Header title left edge ≡ Step List left edge.** Both anchored to
  the centered 1440px container's left line. This is the visual
  anchor of the entire composition — repeated user complaint root cause.
- **Ghost numeral** repositioned to sit behind the right column, no
  longer bleeding off-canvas (`right: max(2vw, calc((100vw - 1440px)/2 + 1rem))`).
- Fullscreen/wide mode and windowed mode now share the same horizontal
  layout; fullscreen only adjusts vertical padding for projection.
- **Removed**: `max-w-7xl`, `px-10`, `width:100% !important`,
   `margin-left:0 !important`, `padding-left:2.5rem !important`,
   `step-detail-panel transform:translateY(1.4rem)` — all in conflict
   with v3.5 centered composition.

## v3.6+ Interaction layer (v0.59 → v0.64)

Full spec: `spec/slides/33-step-timeline-interactions.md`. Summary:

- **v0.59 — Detail-panel snap.** `<AnimatePresence mode="wait">` keyed
  on `focusedIndex`: directional `y` (±12px), spring scale 0.985→1
  `{stiffness:380, damping:28}`, 280ms ease-out-expo opacity. Reduced
  motion → 150ms cross-fade.
- **v0.60 — Keyboard nav.** ←/↑ prev, →/↓ next, Home/End jump to
  ends. Plays whoosh, marks `lastInteraction='click'` (snappy profile),
  resets the 6s autoplay pause window.
- **v0.61 — Per-step CTA pill.** `StepSpec.cta = { text, href?,
  revealSlide?, variant?: 'gold'|'outline' }`. Renders below the
  description, fades in 120ms after the panel snap. Click plays
  `slideSound.play('click')` then opens `href` in a new tab OR jumps
  to `revealSlide`.
- **v0.62 — Step progress pill.** Replaces the bare counter. Tracks
  `focusedIndex = hoveredIndex ?? active`. Vertical flip on the
  current number via `AnimatePresence mode="popLayout"`. Container
  `border-gold/30 bg-gold/5 backdrop-blur-sm`. `role="status"
  aria-live="polite"`.
- **v0.63 — `stepPanelFeel` preset.** `'snappy' | 'cinematic' |
  'instant'`, default `cinematic`. Subscribed live via
  `subscribePresetSettings`. Click + keyboard ALWAYS spring; the
  preset only governs autoplay/hover transitions. Settings UI in
  `/settings` ("Step panel feel").
- **fade-click cue (sound system).** Reuses `click.mp3` with a runtime
  envelope (`volume 0.09`, `attack 50ms`, `release 180ms`). One asset,
  two cues. Authors call `slideSound.play('fadeClick')`. No second
  MP3 shipped.
- **v0.64 — Header alignment.** `BrandHeader` padding tightened to
  `px-3 sm:px-4 lg:px-5` so the wordmark hugs the viewport edge.
  Header is NOT inside the centered 1440px content container; the
  body still aligns its title with the step list left edge per v3.5.

### Author cheat-sheet

```json
{
  "label": "03",
  "title": "Build",
  "subtitle": "Engineering sprint",
  "description": "Daily reviews, weekly demos.",
  "cta": { "text": "See a sample sprint", "revealSlide": 7, "variant": "gold" }
}
```

### Builder UI

The in-app step editor (spec 33 §3 / `src/builder/ContentFieldEditor.tsx`)
exposes the CTA fields under each step row: text, href, reveal-slide
number, variant select. Authors never need to hand-edit JSON for the
v0.61 CTA pill.

## v3.7 — Body grid alignment toggle (v0.66 / spec 34)

- New preset setting `bodyAlignment: 'centered' | 'header-anchored'`
  (v0.68 default: `header-anchored`). Persisted in `riseup.presetSettings.v1`.
- `applyPresetSettings` stamps two CSS vars on `<html>`:
  `--body-grid-margin-left` and `--body-grid-margin-right`.
- `.step-timeline-content` reads them via inline style; the
  `:fullscreen` / `[data-wide-stage="true"]` rule in `index.css` reads
  them too — so the toggle holds in fullscreen.
- `header-anchored` sets margin-left to `clamp(1.5rem, 2vw, 2rem)`
  (matching `BrandHeader`'s `px-6 lg:px-8`) and margin-right to `auto`.
  The 1440px `max-width` cap is preserved in both modes.
- UI: `/settings` → "Body grid alignment" SelectField.
- Future body grids that want to participate read the SAME two vars —
  no parallel mechanism.

## v3.8 — First-load quiet + Ubuntu headers + left anchor (v0.68 / spec 36)

Spec: `spec/slides/36-step-timeline-first-load-and-alignment.md`.

- **Root cause:** `active` starts at `-1`, the pre-reveal display already
  shows Step 1 as the visual focus, then the reveal timer sets `active=0`.
  That remounted Step 1's active keyed nodes and fired the focus sound, so
  the first item appeared to animate/sound twice.
- **Fix:** the first `active=0` arrival is silent and non-retriggering:
  no `step-text-slide`, no `step-badge-bubble`, no whoosh. After the cursor
  leaves Step 1 (`active > 0`), returning to Step 1 behaves normally with
  animation + sound.
- **Ubuntu step headers:** `.step-row .step-title` now uses Ubuntu Bold.
  The old Poppins rule is retired because the deck's title voice must stay
  consistent on step headers.
- **Header-anchored default:** default body alignment is now
  `header-anchored`, with `--body-grid-margin-left: clamp(1.5rem, 2vw, 2rem)`
  initialized in CSS so Slide 3 aligns to the RiseupAsia logo even before
  localStorage settings hydrate. Users can still choose `centered` in
  `/settings` when they explicitly want the old centered composition.

## v3.9 — True full-width header edge (v0.69 / spec 37)

Spec: `spec/slides/37-header-true-full-width.md`.

- **Root cause:** the header wrapper was full-width, but the visible logo was
  still inset by two layers: wrapper padding (`px-6 lg:px-8`) plus 24px of
  transparent padding baked into `riseup-asia-logo.png`.
- **Fix:** BrandHeader now imports `riseup-asia-logo-trimmed.png` and uses
  independent tiny edge padding `px-2 sm:px-3 lg:px-4`. Header remains
  `absolute left-0 right-0`, outside body containers.
- **Body anchor updated:** header-anchored body mode now uses
  `clamp(0.5rem, 1vw, 1rem)` to match the visible logo edge, not the old
  24–32px wrapper inset.

## v3.10 — Body offset nudge (v0.70)

- Header stays at `px-2 sm:px-3 lg:px-4` (true viewport chrome).
- Body grid `--body-grid-margin-left` nudged to
  `clamp(0.625rem, calc(1vw + 2px), 1.125rem)` so the timeline line and the
  "HOW WE WORK / Engagement Process" title sit ~2-3px inboard of the visible
  logo edge. Reads as deliberate offset, not collision.

## v0.85 — Header offset (`content.headerOffsetPx`)

JSON-only per-slide knob (StepTimelineSlide). Range [-160, 160]px. Shifts
ONLY `.step-timeline-header` (eyebrow + title) via `translateX`. Step rows,
side panel, and ambient layer are unaffected. Used on showcase slide 3
("Engagement Process") with value `40` to align the title with the
description column. Distinct from `step.leftOffsetPx` (per-row padding +
cinematic reveal). Spec: `spec/slides/40-step-snap-to-guides.md` §"Header
offset". Schema: `spec/slides/slide.schema.json`.

## v0.86 — Right-edge snap (`step.rightOffsetPx`)

Per-step right-side companion to `leftOffsetPx`. Range [0, 160]px. Applied
as `paddingRight` on `.step-row`. Editor renders a second snap panel per
step with targets Body / Half / Rail. Does NOT trigger snap-reveal (only
the left field does — reveal animation reads from leftOffsetPx > 0).
Schema: Step.rightOffsetPx in slide.schema.json. Spec:
`spec/slides/40-step-snap-to-guides.md` §"Right-edge snap".
