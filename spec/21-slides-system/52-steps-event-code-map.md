# 52 — Steps Event → Code Reference Map

> **Last Enriched:** 2026-04-26 · **Phase 5/20 (cont.)** · Companion to
> `45-steps-code-references.md` and `46-steps-code-references-2.md`.
> One row per runtime event on `StepTimelineSlide`, mapped to the
> exact symbol that owns it. Same authoring rules: ≤8 lines per
> snippet, no `any`, positive ifs, booleans prefixed.

The runtime files are the source of truth — when behaviour drifts,
update the line numbers below in the same PR. Specs 42 (motion) and
43 (sound) describe **what** happens; this file says **where**.

## 1. Event → owner table

| Event | Owner symbol | File · line (v0.98) | Key constant |
|---|---|---|---|
| Active step changes (any cause) | focus-cue effect | `StepTimelineSlide.tsx` §`useEffect([active])` ≈ L200–215 | `s.kind ?? 'whoosh'`, `s.volume ?? 0.5` |
| Autoplay tick | `useFocusTimeline` interval | `hooks/useFocusTimeline.ts` interval body | `STEP_INTERVAL_MS = 2200` |
| Pause window after interaction | `pushPause()` | `StepTimelineSlide.tsx` `handleStepClick` ≈ L228 | `PAUSE_MS = 6000` |
| Row click | `handleStepClick(idx)` | `StepTimelineSlide.tsx` ≈ L228–250 | `setLastInteraction('click')` |
| Row hover | `setHoveredIndex(idx)` | `StepTimelineSlide.tsx` row `onMouseEnter` | `setLastInteraction('hover')` |
| Play/Pause toggle (button + `P`) | toggle handler | `StepTimelineSlide.tsx` ≈ L91–95 | `slideSound.play('click', 0.18)` |
| Deck Next/Prev consumed | `tryStep(dir)` → imperative `tryAdvance` | `StepTimelineSlide.tsx` L275 | returns `boolean` |
| Reduced-motion fade | `isReducedMotion()` guard | `45-steps-code-references.md` §4 | `REDUCED_FADE_MS = 150` |
| Asset readiness wait | cinematic-cue gate | `sound.ts` `play('whoosh', …)` | `READY_WAIT_MS = 800` |
| Same-kind dedupe | `slideSound.play({ dedupeMs })` | `sound.ts` play impl | default `60ms` |

## 2. Snippet — focus-cue effect

```ts
useEffect(() => {
  if (active < 0) return;
  if (skipFirstFocusSound(active)) return;
  const s = spec.sound ?? DEFAULT_STEP_SOUND;
  if (s.mute === true) return;
  if ((s.on ?? 'focus') !== 'focus') return;
  if (lastPlayedActive.current === active) return;
  lastPlayedActive.current = active;
  slideSound.play(s.kind ?? 'whoosh', s.volume ?? 0.5);
}, [active, spec.sound]);
```

`DEFAULT_STEP_SOUND` lives next to the constants block (spec 45 §1) so
the effect body has zero magic literals.

## 3. Snippet — row click handler

```ts
function handleStepClick(idx: number): void {
  pushPause();
  setHoveredIndex(null);
  setLastInteraction('click');
  slideSound.play('fadeClick', 0.09); // soft precursor
  focusTo(idx);                        // whoosh fires from §2 effect
}
```

`fadeClick` is the mechanical **precursor**; the resulting `active`
change re-runs the effect in §2 which plays the cinematic `whoosh`.
Cross-kind plays bypass the 60ms dedupe window (spec 43 §3).

## 4. Snippet — deck Next/Prev short-circuit

```ts
useImperativeHandle(ref, () => ({ tryAdvance: tryStep }), [tryStep]);

function tryStep(dir: 'forward' | 'backward'): boolean {
  const consumed = dir === 'forward' ? focusNext() : focusPrev();
  return consumed === true;
}
```

The deck calls `tryAdvance` first; only when it returns `false` does the
controller navigate to the sibling slide. Never bypass this — it is the
contract that keeps step focus and slide navigation in sync.

## 5. Acceptance grep checks

```sh
grep -rn "slideSound.play('whoosh'" src/slides/types/StepTimelineSlide.tsx
grep -rn "STEP_INTERVAL_MS\|PAUSE_MS" src/slides/types/StepTimelineSlide.tsx
grep -rn "useImperativeHandle.*tryAdvance" src/slides/types/StepTimelineSlide.tsx
```

Each must return ≥1 hit. Zero hits means the contract has drifted —
update the table in §1 in the **same** PR that moves the code.

## 6. Open questions & changelog

- Open: lift `DEFAULT_STEP_SOUND` and `STEP_INTERVAL_MS`/`PAUSE_MS`
  into `src/slides/stepConstants.ts` so this map can link to one file
  instead of inline blocks. Mirrors the open question in spec 46 §10.
- 2026-04-26 (v0.99.0): Phase 5 (cont.) — added the event→owner table
  and §2–§5 snippets so each Step sound/timeline event maps to the
  exact function and key constant.
