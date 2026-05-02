---
name: step-top-offset-and-timing
description: Per-step `topOffsetPx` (vertical snap, [-160,160] via translateY) + slide-level `stepTiming` preset (instant/snappy/smooth/cinematic/dramatic) + per-step enter/exit overrides. Default 'smooth' = legacy behaviour.
type: feature
---

# Step top-offset + timing presets (v0.90+)

Two coupled additions to `StepTimelineSlide`:

## Vertical snap — `step.topOffsetPx`

Range **[-160, 160]** stage px. Default 0. Implemented as
`transform: translateY(...)` so neighbouring rows DON'T reflow — the
column's natural layout slot is preserved.

Pairs with the existing `leftOffsetPx` (spec 40) and `rightOffsetPx`
(v0.86) so a step can be snapped on all three axes from JSON.

## Animation timing — `content.stepTiming` + `step.enter`/`step.exit`

Five named presets in `src/slides/stepTiming.ts`:

| Preset      | Enter         | Exit          |
|-------------|---------------|---------------|
| instant     | 0ms linear    | 0ms linear    |
| snappy      | 220ms easeOut | 180ms easeOut |
| smooth      | 480ms expoOut | 320ms expoOut | ← DEFAULT
| cinematic   | 900ms expoOut | 600ms expoOut |
| dramatic    | 1400ms expoOut| 900ms expoOut |

Slide-level: `"stepTiming": "cinematic"` (string shorthand) OR
`"stepTiming": { "preset": "cinematic", "enter": { "durationMs": 1100 } }`
(start from preset, override fields).

Per-step: `"enter": { "durationMs": 100, "easing": "easeOut" }` and
`"exit": {...}` win over slide-level.

**Precedence**: per-step → slide-level override → slide-level preset →
hard-coded `'smooth'`.

## Critical defaults / constraints

- `'smooth'` MUST stay the default — it's tuned to match the legacy
  hard-coded 0.5s expo-out so existing decks render identically when
  upgrading.
- Snap-reveal (spec 40, `leftOffsetPx > 0`) wins over the timing
  preset chain. The 1.1s land-on-guide animation is a behaviour of
  the lateral snap, not a tempo override.
- Resolver clamps `durationMs` and `delayMs` to [0, 4000] defensively.
- `topOffsetPx` MUST use `translateY`, never `marginTop` (would push
  neighbours).
- Reduced-motion bypasses the resolver entirely → all rows reveal in
  0.001s linear.

**Spec:** `spec/slides/49-step-top-offset-and-timing.md`. **Resolver:**
`src/slides/stepTiming.ts` (pure functions, testable in isolation).
