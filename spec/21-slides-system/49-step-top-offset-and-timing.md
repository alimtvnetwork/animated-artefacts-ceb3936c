# Spec 49 — Step top offset + animation timing presets

Status: locked (v0.90.0)
Related: spec 17 (StepTimeline v2), spec 23 (StepTimeline v3 motion), spec 40 (left/right offset snap), spec 42 (steps motion).

## Why

After spec 40 added `leftOffsetPx` and `rightOffsetPx` for horizontal
snap alignment, the user requested two follow-ups:

1. A **vertical** snap counterpart so step rows can be nudged up or
   down to align with right-panel guides (description column, capsules,
   detail-panel CTA), or to break the column's perfect rhythm
   intentionally.
2. **Named animation presets** with a slide-level default + per-step
   override so the deck author can pick a tempo (snappy / smooth /
   cinematic / dramatic) once and fine-tune individual steps.

Both ship together because they're the same UX gesture: "I want to
control how a step row arrives — where AND when."

## Schema additions

### `StepSpec.topOffsetPx?: number`

Per-step VERTICAL nudge in stage px. Range **[-160, 160]**. Default 0.

- Positive → row shifts down. Negative → row shifts up.
- Implemented as `transform: translateY(...)` so the column's natural
  layout slot is **preserved** — neighbouring rows don't reflow.
- Pairs naturally with `leftOffsetPx` / `rightOffsetPx`. A step with
  `{leftOffsetPx: 32, topOffsetPx: -12}` reads as "snap right of the
  rail and lift slightly to clear the chip above".

### `StepSpec.enter?: StepAnimOverride` and `StepSpec.exit?: StepAnimOverride`

Per-step animation override blocks. Optional, partial — provide any
subset of `{ durationMs, delayMs, easing }` and the rest fall back to
the slide-level preset.

```ts
interface StepAnimOverride {
  durationMs?: number;        // [0, 4000]
  delayMs?: number;           // [0, 4000]
  easing?:
    | [number, number, number, number]   // cubic-bezier tuple
    | string;                            // named easing
}
```

Named easings accepted: `linear`, `easeIn`, `easeOut`, `easeInOut`,
`circIn`, `circOut`, `circInOut`, `backIn`, `backOut`, `backInOut`,
`expoIn`, `expoOut`, `expoInOut`. (Same set Framer Motion accepts as a
string.)

### `SlideContent.stepTiming?: StepTimingPresetName | { preset?, enter?, exit? }`

Slide-level default. Two shapes:

1. Quick: `"stepTiming": "cinematic"` — picks the named preset for both
   in and out.
2. Full: `"stepTiming": { "preset": "cinematic", "enter": { "durationMs": 1100 }, "exit": { "easing": "expoIn" } }`
   — start from a preset and override individual fields slide-wide.

### `StepTimingPresetName`

Five named presets defined in `src/slides/stepTiming.ts`:

| Preset       | Enter (ms / easing) | Exit (ms / easing) | Use when                                  |
|--------------|---------------------|--------------------|-------------------------------------------|
| `instant`    | 0 / linear          | 0 / linear         | QA / PDF export / disable-animation mode  |
| `snappy`     | 220 / easeOut       | 180 / easeOut      | UI-fast, dashboards, dense content        |
| `smooth`     | 480 / expoOut       | 320 / expoOut      | **DEFAULT** — current shipping behaviour  |
| `cinematic`  | 900 / expoOut       | 600 / expoOut      | Presentation-slow, deliberate pace        |
| `dramatic`   | 1400 / expoOut      | 900 / expoOut      | Showcase / hero step / single-step focus  |

`smooth` is the default so existing decks render IDENTICALLY when
upgrading to v0.90 — you opt into the new tempos by setting
`content.stepTiming` explicitly.

## Precedence chain

For each step's enter (and analogously exit) animation:

1. `step.enter` per-step JSON override  ← highest priority
2. `content.stepTiming.enter` slide-level override
3. `content.stepTiming.preset` (or string-shorthand) slide-level preset
4. Hard-coded `'smooth'` default

Any field in (1) or (2) that's `undefined` falls through to the next
level. So `step.enter = { delayMs: 200 }` keeps the slide preset's
duration + easing but waits 200ms longer.

## Snap-reveal interaction

The existing snap-reveal mode (`leftOffsetPx > 0` → 1.1s lands-onto-
guide animation, see spec 40 §"Reveal mode") **wins over** the timing
preset chain. That's intentional: snap-reveal is a *behaviour*, not a
*tempo* — the dramatic land-on-guide motion is part of what
`leftOffsetPx` means visually. If you want to suppress it for a
specific step while keeping its left offset, set `step.enter.durationMs
= 0` and the resolver short-circuits to a flat `slide` reveal
(implemented v0.211; covered by `src/test/snapRevealShortCircuit.test.ts`).

## Files

- `src/slides/types.ts` — added `StepSpec.topOffsetPx`, `.enter`,
  `.exit`; new `StepAnimOverride` interface; new `StepTimingPresetName`
  union; extended `SlideContent.stepTiming`.
- `src/slides/stepTiming.ts` — NEW. Preset table + `resolveStepEnter` +
  `resolveStepExit` + `resolveStepTopOffset`. Pure functions, no React.
  Single source of truth for the precedence chain.
- `src/slides/types/StepTimelineSlide.tsx` — replaced inline timing
  literals with `resolveStepEnter(s, c.stepTiming, legacyStaggerMs)`.
  Snap-reveal short-circuit kept. `topOffsetPx` applied via
  `transform: translateY(...)` in `padStyle`. Reduced-motion still
  short-circuits to 0.001s linear.

## Verification

1. `/3` (no `stepTiming` in JSON) renders identically to v0.89 —
   `'smooth'` default matches the previous hard-coded 0.5s expo-out.
2. Author a test slide with `"stepTiming": "dramatic"` → every row
   reveals over 1.4s with expo-out. Per-step `step.enter.durationMs:
   100` should override one row to a quick reveal.
3. Author a step with `topOffsetPx: -16` → that row visually lifts
   16px without disturbing neighbours.
4. `prefers-reduced-motion: reduce` → all rows reveal instantly
   regardless of preset (resolver bypassed). Verified via Chrome
   devtools rendering tab.
5. `topOffsetPx` clamped: try `topOffsetPx: 9999` → resolver returns
   160 (max).

## Future

- Builder UI in `/builder` Step editor: a "Top offset" slider mirroring
  the existing left/right slider, plus a "Timing" preset dropdown on
  the slide editor. Currently authored via JSON only — not a
  regression because `leftOffsetPx`/`rightOffsetPx` were JSON-only at
  spec 40 and got their UI in a follow-up loop.
- Optional: snap-reveal opt-out on a per-step basis when
  `step.enter.durationMs === 0` so authors can keep the lateral offset
  without the dramatic landing animation.
- Tests in `src/test/` for the resolver's precedence chain.

## Constraints (locked)

- `'smooth'` MUST stay the default. Changing the default = silent
  visual regression across every existing deck.
- The resolver MUST clamp duration/delay to [0, 4000]ms. Out-of-range
  values from a tampered JSON should not freeze the deck.
- `topOffsetPx` MUST use `transform: translateY` (not `marginTop`).
  Margin would push neighbouring rows; transform doesn't.
- Snap-reveal (spec 40) wins over the timing preset chain. Don't
  regress this — the dramatic land-on-guide motion is part of how
  `leftOffsetPx` reads.
