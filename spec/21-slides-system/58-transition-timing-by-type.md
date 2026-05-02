# Spec 58 — Per-transition-type timing override (`transitionTimingByType`)

**Version:** v0.168
**Status:** Implemented

## Why
v0.147 added `deck.transitionTiming` (one cadence for the whole deck) and
v0.167 added the Settings-page user override (one cadence per presenter).
Authors still asked for: *"every PushIn should be cinematic-slow, every
FadeIn should be snappy"* without pinning timing on every slide.

This spec adds a JSON field that targets a specific transition family.

## Field

```ts
transitionTimingByType?: Partial<Record<SlideTransitionValue, TransitionTimingSpec>>;
```

Available on **both**:
- `deck.json` — applies to every slide whose `transition` matches a key.
- `slide.content` — applies to THIS slide only when its `transition` matches.

Keys: `'FadeIn' | 'SlideIn' | 'PushIn' | 'PushLeft' | 'PushRight'`
Value: same `TransitionTimingSpec` used elsewhere (`durationMs?`, `delayMs?`, `easing?`).

## Precedence (per field)

| # | Source                                                     | Scope                      |
|---|------------------------------------------------------------|----------------------------|
| 1 | `slide.content.transitionTiming.{field}`                   | this slide, all transitions |
| 2 | `slide.content.transitionTimingByType[T].{field}`          | this slide, transition T    |
| 3 | `deck.transitionTimingByType[T].{field}`                   | every slide, transition T   |
| 4 | `deck.transitionTiming.{field}`                            | every slide, all transitions |
| 5 | Built-in `SLIDE_TRANSITION_CONFIG` (550ms, expoOut)        | fallback                    |

Each field (`durationMs`, `delayMs`, `easing`) resolves independently — a
deck-by-type entry that pins only `easing` lets duration fall through to
`deck.transitionTiming` or the built-in.

## Example

```json
{
  "deckSlug": "showcase",
  "transitionTiming": { "durationMs": 600 },
  "transitionTimingByType": {
    "FadeIn":  { "durationMs": 250, "easing": "easeOut" },
    "PushIn":  { "durationMs": 1100, "easing": "expoOut" },
    "SlideIn": { "easing": "backOut" }
  }
}
```

Result, per slide:
- A `FadeIn` slide → 250ms easeOut.
- A `PushIn` slide → 1100ms expoOut.
- A `SlideIn` slide → 600ms (from deck-wide) backOut (from by-type).
- A `PushLeft` slide → 600ms expoOut (built-in easing falls through).

A slide that ALSO sets `content.transitionTiming.durationMs = 200`
overrides any of the above for that one slide.

## Non-goals
- The Settings-page UI does NOT expose by-type overrides — it stays a
  three-knob "one cadence" panel. Authors who want by-type control work
  in the deck JSON (or, in the future, the deck-meta builder UI).
