# 02 — Hold-Enter Autoplay: Threshold + Cadence + Scope

- Task: "Implement autoplay so the deck advances to the next slide when I press and hold Enter, with the same fade/slide transitions for each step timeline reveal."
- Spec refs: `src/pages/SlideDeckPage.tsx` keyboard effect (single source of truth for all bindings); `src/slides/hooks/useFocusTimeline.ts` (`tryAdvance` short-circuit pattern); existing `next()` already chains step-reveals → slide nav.

## Point A — Hold threshold (how long until autoplay starts)

Options:
1. **400ms** (chosen). Pros: fast enough to feel responsive; long enough that a normal "tap to advance" never accidentally triggers autoplay; matches typical "long press" UX (Material 500ms, iOS 350ms — split the difference). Cons: subjective.
2. 250ms. Pros: snappier. Cons: risk of accidental autoplay on a slightly-too-long tap.
3. 700ms. Pros: definitely intentional. Cons: feels laggy when the presenter wants to "fly through" a slide.

**Recommendation: 400ms** — best balance of intent vs. responsiveness.

## Point B — Tick cadence (how fast slides/steps advance while held)

Options:
1. **900ms per tick** (chosen). Pros: roughly matches the default StepTimeline reveal duration (~700–900ms) so each step has time to play its entrance animation before the next fires; comfortable reading pace for an audience watching unattended autoplay. Cons: still a guess without watching the user's specific deck.
2. 500ms. Pros: zippy demo mode. Cons: many step animations would be cut off mid-flight; audience can't read keyword chips before they leave.
3. Adapt to the active slide's `transitionTiming.durationMs + 200ms`. Pros: always gives the animation a moment to complete. Cons: requires reading slide spec at tick time; uneven cadence between slide types feels jittery; adds coupling.

**Recommendation: 900ms fixed** — predictable, matches the longest of the default entrance presets. Easy to make configurable later via `/settings` if the user wants 500/900/1500 presets.

## Point C — Which key triggers autoplay

Options:
1. **Enter only** (chosen — matches the user's request verbatim). Pros: ArrowRight/Space stay as pure single-advance keys, so a presenter can still rapid-tap them without ever entering autoplay. Cons: Enter is a less-common navigation key in some presenter remotes.
2. Enter AND Space AND ArrowRight. Pros: any forward key triggers autoplay on hold. Cons: violates the user's specific phrasing; risk of accidental autoplay during normal presentation.
3. A dedicated key (e.g. `A`). Pros: unambiguous. Cons: not what the user asked for; learning curve.

**Recommendation: Enter only** — exact match to the request.

## Point D — What "advance" means on a step-timeline slide

Options:
1. **Walk each step reveal first, then cross into the next deck slide** (chosen — what the user explicitly asked for: "the same fade/slide transitions for each step timeline reveal"). The existing `next()` already does this via `focusRef.current?.tryAdvance('forward')` short-circuit, so autoplay just calls `next()` on each tick. Pros: zero new code paths; reuses authored per-step entrance animations; chain-boundary handoff is already battle-tested. Cons: slides without `tryAdvance` (most types) advance one whole slide per tick — that's correct but worth flagging.
2. Always advance one whole deck slide per tick (skip intra-slide steps). Pros: predictable cadence. Cons: directly contradicts the user's "for each step timeline reveal" requirement.
3. Run the slide's `stepTiming` autoplay loop instead. Pros: lets each slide define its own cadence. Cons: requires per-slide-type integration; out of scope for a global hold-Enter handler.

**Recommendation: option 1** — exactly matches the request and ships in 30 lines.

## Point E — Stop conditions

Options:
1. **`keyup` on Enter + `window blur`** (chosen). Stops on key release AND when the window loses focus (alt-tab, OS dialog, fullscreen toggle drop). Pros: covers the common "I lifted my finger" and "I switched apps" cases. Cons: doesn't auto-stop at the deck end — but `next()` simply no-ops past the last slide, so the interval just ticks harmlessly until release.
2. Add explicit "stop at last slide" logic. Pros: cancels CPU work microseconds earlier. Cons: trivial overhead; not user-visible.

**Recommendation: option 1** — sufficient for the user-visible contract.

## Action taken

- Rewrote the keyboard `useEffect` in `src/pages/SlideDeckPage.tsx` to:
  - Branch on `e.key === 'Enter'`: ignore OS keyrepeat (`e.repeat`), fire `next()` immediately, arm a `setTimeout(AUTOPLAY_HOLD_MS=400)` that on fire starts a `setInterval(next, AUTOPLAY_TICK_MS=900)`.
  - Add `keyup` listener that calls `stopAutoplay()` when Enter is released.
  - Add `blur` listener that calls `stopAutoplay()` when the window loses focus.
  - Cleanup all three listeners + any pending timer/interval on unmount.
- ArrowRight, Space, ArrowLeft, Backspace, G, F, Escape behavior unchanged.

## Reversible?

Yes — restoring the original 17-line `useEffect` returns to v0.119 behavior. No persisted state, no schema change.

## Follow-ups the user may want to weigh in on

- Should the 400ms / 900ms values live in `/settings` (`presetSettings.ts`) so the presenter can tune them per venue?
- Should ArrowRight/Space also support hold-to-autoplay, or stay as pure single-advance keys?
- Add a visible "Autoplaying…" badge in the controller while the interval is active?
