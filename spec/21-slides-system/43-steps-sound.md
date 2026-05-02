# 43 — Steps Sound Spec (Enriched)

> **Last Enriched:** 2026-04-26 · **Phase 3/20** · Companion to
> `42-steps-motion.md`. Extends the global sound system in
> `21-sound-system.md`. Runtime source of truth: `src/slides/sound.ts`.

## 1. Trigger map for `StepTimelineSlide`

| Event | Sound kind | Volume | Where in code | Debounce |
|---|---|---|---|---|
| Active step changes (any cause) | `whoosh` | `0.50` | `useFocusTimeline` → `slideSound.play('whoosh', 0.5)` | 60ms same-kind |
| User clicks an inactive row | `fadeClick` (precursor) → `whoosh` | `0.09` → `0.50` | `StepTimelineSlide.tsx` row `onClick` | 60ms same-kind |
| Keyboard ←/→/↑/↓/Home/End | `whoosh` | `0.50` | spec 33 §2 keyboard handler | 60ms same-kind |
| Play/Pause toggle (button + `P` key) | `click` | `0.18` | `StepTimelineSlide.tsx` line 91 | 60ms same-kind |
| Autoplay tick advancing `active` | `whoosh` | `0.50` | autoplay interval triggers focus change | 60ms same-kind |

Whoosh is the only **cinematic cue** on this slide — it is the cursor-
landing sound. `fadeClick` is the **soft mechanical precursor** that
plays the instant the user's finger/mouse hits the row, before the
whoosh resolves the focus change. `click` is reserved for the Play/Pause
control toggle (a UI affordance, not a focus event).

## 2. Asset table (locked 2026-04-27)

| Kind | URL | Default volume | Attack | Release | Ducks previous |
|---|---|---|---|---|---|
| `whoosh` | `/sounds/fade_swoosh_v2.mp3` | `0.45` | `0.06s` | `0.12s` | **yes** |
| `click` | `/sounds/click.mp3` | `0.18` | `0.005s` | `0.06s` | no |
| `fadeClick` | `/sounds/click.mp3` | `0.09` | `0.04s` | `0.18s` | no |

The Step slide always **overrides** whoosh volume to `0.50` (slightly
hotter than the default `0.45`) because the audience hears it as a
focus cue, not ambient noise.

## 3. Debounce rule

`slideSound.play()` accepts `{ dedupeMs }`; default `60ms`. Re-triggering
the same kind inside that window is a no-op. This catches:

- React strict-mode double-effects.
- Click + keyboard chained handlers.
- Autoplay tick landing on the same `active` index a second time.

Cross-kind plays are **never** blocked — `fadeClick` + `whoosh` on the
same row click is intentional and audible.

## 4. Asset readiness & autoplay policy

- `AudioContext` is created lazily; resumed on first `pointerdown` /
  `keydown`. Before that gesture, `play()` is a **silent no-op** (browser
  policy).
- `READY_WAIT_MS = 800`. Cinematic cues (`whoosh`, `zoom`, `fadeZoom`)
  wait up to 800ms for the asset buffer rather than falling back to a
  procedural synth — this fixed the "first whoosh sounds like the synth"
  bug on the very first focus change.
- `click` and `fadeClick` **may** fall back to a procedural synth on
  decode failure; cinematic cues never do.

## 5. Mute behavior

- Persistence key: `localStorage['slide-sound-muted']` (boolean string).
- Mute state is global across the deck; survives reload.
- `M` key toggles mute (handled by the deck-level controller, not the
  slide). When muted, every `play()` is a no-op — no envelope, no
  AudioContext spin-up.

## 6. Author-facing override

In JSON authors may declare:

```json
{ "sound": { "on": "focus", "kind": "whoosh", "volume": 0.5 } }
```

`on` ∈ `enter | focus | click`. For `StepTimelineSlide` the runtime
ignores `on: enter` (focus changes are the only meaningful event) and
treats unspecified `sound` as `{ on: 'focus', kind: 'whoosh', volume: 0.5 }`.

## 7. Acceptance criteria

- First whoosh after page-load gesture must sound identical to
  subsequent whooshes (asset, not synth).
- Rapid clicks across rows produce one whoosh per landing, not a pile-up
  (`ducksPrevious: true`).
- Mute persists across reload.
- With `prefers-reduced-motion: reduce`, sound still plays — reduced-
  motion governs visuals only. Mute is the audio kill-switch.

## 8. Open questions & changelog

- Open: should `fadeClick` precursor be opt-in per slide, or always-on
  for `StepTimelineSlide`? Current: always-on.
- 2026-04-26 (v0.79.1): Phase 3 — extracted steps-only sound contract
  from spec 21 + `sound.ts`.
