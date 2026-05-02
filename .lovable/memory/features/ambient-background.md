---
name: ambient-background
description: Reusable AmbientBackground component (icon scatter + radial glow + cursor-parallax + idle Lissajous sway). Opt-in via `slide.ambientBackground`. Presets: devtools / productivity / process / minimal. StepTimelineSlide always renders its own and ignores the field. v0.43.0 — drives a continuous Lissajous sway when the cursor is idle so the field reads as alive on first arrival.
type: feature
---

## Spec
`spec/slides/24-ambient-background.md`.

## File
`src/slides/components/AmbientBackground.tsx`.

## API

```ts
<AmbientBackground
  seed="engagement-process"
  icons={[Code2, Terminal, GitBranch, Figma]}
  count={14}
  opacity={0.05}
  drift={0.4}
  glow
  parallax={22}                       // v0.29 — cursor-tracking float (px)
  accentColors={{ 0: '#007ACC', 4: '#F24E1E' }}  // v0.29 — brand-color anchors
/>
```

All props optional except `seed`. Seed must be deterministic per slide
so the layout doesn't reshuffle on every render.

## Rules
- 5% opacity default. Avoid central 30%×30% safe zone.
- Drift is CSS-keyframe-based (no JS RAF for the per-icon loop), 12–22s
  per icon, randomized phase. Reduced motion disables drift.
- `pointer-events: none`, `aria-hidden`.
- TitleSlide migrated to consume this component (was inlined before).
- StepTimelineSlide v3 wraps its content with this layer.

## Idle Lissajous sway (v0.43.0 — locked)

The user complained icons "should move … without moving any mouse a
little bit so that they feel like live-like". Root cause: cursor-parallax
target was `(0,0)` until first mousemove, so first arrival looked frozen.

Fix: a single rAF loop drives both idle sway and cursor smoothing.

- **Idle target** = Lissajous: `x = sin(t·2π/7)·0.18`,
  `y = cos(t·2π/11)·0.18`. Coprime periods so the figure never visibly
  repeats. Amplitude 0.18 ≈ 36% of the full ±0.5 cursor range.
- **Mouse handover**: idleBlend ramps 0 → 1 over 1000ms after the mouse
  stops (200ms grace). Real cursor wins while moving; idle takes back
  over once still.
- **Easing**: `cursor = lerp(cursor, target, 0.08)` per frame. No spring
  deps, no overshoot.
- **Reduced motion**: rAF loop is skipped entirely — static icons.

Cost: 1× rAF, `setState` only when the position actually changes
(threshold 0.0005). Negligible CPU.

## Per-slide-type defaults
| Slide | Icons |
|---|---|
| TitleSlide | FileText, Video, MessageSquare, Clipboard, UserCheck, Book, GitBranch, Users |
| StepTimelineSlide | Compass, Target, Hammer, TrendingUp, Workflow, Layers, Activity, Sparkles |

Other slide types opt-in via slide-spec field (default off).
