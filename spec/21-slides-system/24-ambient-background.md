# 24 — Ambient Background (Reusable Icon Constellation)

A reusable, full-bleed background layer that scatters faint, slowly
drifting line-art icons behind a slide's content. Originally extracted
from `TitleSlide` so other slide types (StepTimeline first) can share
the same atmospheric depth as the hero slide.

## 1. Component

`src/slides/components/AmbientBackground.tsx`

```ts
interface AmbientBackgroundProps {
  /** Stable seed → deterministic icon layout. Pass a slide title or slug. */
  seed: string;
  /** Lucide icon set to scatter. Defaults to a generic productivity set. */
  icons?: ComponentType<LucideProps>[];
  /** Number of icons to render. Default 14. */
  count?: number;
  /** Peak opacity per icon (default 0.05). */
  opacity?: number;
  /** Drift radius in % of stage. Default 0 (static). 0.4 = subtle float. */
  drift?: number;
  /** When true, renders a soft radial gold/amber glow above the icons. */
  glow?: boolean;
}
```

## 2. Visual rules

- Icons render at 5% opacity (`--ambient-opacity` token; default `0.05`).
- Stroke width 1, sized 26–50px (random per-icon, deterministic).
- Avoid the central 30% × 30% safe zone so icons don't crowd content.
- When `drift > 0`, each icon Framer-animates with a 12–22s sine loop
  on x + y of `±drift%`. Each icon has a different phase so the field
  feels organic, not synced.
- When `glow=true`, a single radial gradient (amber `hsl(28 75% 11%)`)
  is layered above the icons, behind content.

## 3. Per-slide-type icon themes

| Slide type | Default icons |
|---|---|
| TitleSlide | `FileText, Video, MessageSquare, Clipboard, UserCheck, Book, GitBranch, Users` (existing) |
| StepTimelineSlide | `Compass, Target, Hammer, TrendingUp, Workflow, Layers, Activity, Sparkles` |
| CapsuleListSlide | `Layers, Box, Grid, Tag, Sparkles, Zap` |
| FocusTimelineSlide | `Telescope, Crosshair, Aperture, Focus` |
| QrMeetingSlide / Contact | `Mail, Phone, Calendar, MessageSquare, Send, Heart` |

The slide is free to override via the `icons` prop.

## 4. Per-slide drift

For step-driven slides (StepTimeline) the drift may be tied to the
active step — e.g. icons drift slightly to the right when stepping
forward, slightly to the left when stepping backward. Implementation
detail: optional `direction?: -1 | 0 | 1` prop that biases the
sine offset. Default: undirected drift.

## 5. Performance

- Pure CSS keyframe drift (no JS animation loop).
- `pointer-events: none` and `aria-hidden="true"`.
- Reduced motion: drift disabled, icons static at full opacity.

## 6. Where it ships first

- `TitleSlide` — refactored to consume `<AmbientBackground>` instead of
  inlining the scatter logic.
- `StepTimelineSlide` — wraps the slide body so the chain reads on a
  living background.

Other slide types adopt opt-in via a slide-spec field
(`spec.ambientBackground: false | true | { icons, drift, opacity }`).
Default for new slide types: **off** — opt in deliberately.

## Addendum — v0.43.0 idle Lissajous sway

The user complained icons looked frozen until they moved the mouse
("they should move … without moving any mouse a little bit so they feel
live-like"). Root cause: cursor-parallax target was `(0,0)` pre-mousemove.

Fix: a single rAF loop now drives BOTH idle sway and cursor smoothing.

- Idle target = Lissajous figure with coprime periods (7s × 11s):
  `x = sin(t·2π/7)·0.18`, `y = cos(t·2π/11)·0.18`. Never visibly repeats.
- Idle amplitude 0.18 ≈ 36% of the ±0.5 cursor range — visible but doesn't
  fight a real cursor.
- Mouse handover: `idleBlend` ramps 0→1 over 1000ms after the mouse stops
  (200ms grace window). Real cursor dominates while moving; idle resumes
  smoothly once still.
- Easing: `cursor = lerp(cursor, target, 0.08)` per frame. Critically
  damped, no spring deps.
- Reduced motion: rAF loop is skipped — static icons honor a11y prefs.
