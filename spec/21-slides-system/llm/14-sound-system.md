# 14 — Sound System (LLM Pack Pointer)

> **Phase 11/20** · Pointer doc. The full asset table + flow lives in
> `03-sound-system-complete.md`. Steps-specific contract lives in
> `spec/slides/43-steps-sound.md`. Runtime: `src/slides/sound.ts`.

## 1. Trigger taxonomy

| Trigger | Default kind | Volume | When to fire |
|---|---|---|---|
| Slide enter | `whoosh` | `0.45` | Slide becomes visible |
| Focus change (step / capsule active) | `whoosh` | `0.50` | Active index changes |
| Soft click precursor | `fadeClick` | `0.09` | Press lands before a `whoosh` |
| Hard click (toggle button) | `click` | `0.18` | Play/Pause, dot pagination |

Authors opt-in per slide via:

```json
{ "sound": { "on": "focus", "kind": "whoosh", "volume": 0.5 } }
```

`on` ∈ `enter | focus | click`. Default for `StepTimelineSlide` is
`{ on: 'focus', kind: 'whoosh', volume: 0.5 }`. Default for static
slides is no auto-sound.

## 2. Asset table (locked)

| Kind | URL | Volume | Attack | Release | Ducks previous |
|---|---|---|---|---|---|
| `whoosh` | `/sounds/fade_swoosh_v2.mp3` | `0.45` | `0.06s` | `0.12s` | yes |
| `click` | `/sounds/click.mp3` | `0.18` | `0.005s` | `0.06s` | no |
| `fadeClick` | `/sounds/click.mp3` | `0.09` | `0.04s` | `0.18s` | no |
| `zoom` | `/sounds/zoom.mp3` | `0.55` | — | — | yes |
| `fadeZoom` | `/sounds/fade_zoom.mp3` | `0.4` | `0.4s` | `0.7s` | yes |

`whoosh`, `zoom`, `fadeZoom` are **cinematic cues** — they wait up to
`READY_WAIT_MS = 800ms` for the asset buffer rather than fall back to
the procedural synth. `click` / `fadeClick` may fall back.

## 3. Debounce + autoplay policy

- Same-kind plays inside `dedupeMs = 60ms` are no-ops. Cross-kind plays
  never blocked.
- `AudioContext` is created lazily; resumed on the first
  `pointerdown` / `keydown`. Until that gesture, every `play()` is a
  silent no-op (browser autoplay policy).
- Mute persists in `localStorage['slide-sound-muted']`. `M` toggles.

## 4. When **not** to add sound

- Decorative reveals (eyebrow fade-in, capsule pop) — silence.
- Hover-only state changes — silence (the user is exploring, not
  committing).
- Anything inside an inactive slide — `SlideStage` already guards play
  on the active slide.

## 5. Forbidden

- A new sound asset added without a memory note + version bump.
- Multiple cinematic cues on the same trigger (`whoosh` + `zoom`
  together — pick one).
- A slide that auto-plays sound on enter without `sound.on === 'enter'`
  in the JSON.

## 6. Acceptance

- First whoosh after page-load gesture sounds identical to subsequent
  plays (asset, not procedural synth).
- Rapid focus changes produce one duck-and-replace per landing — no
  pile-up.
- Mute survives reload.

## 7. Open questions & changelog

- Open: per-deck volume override (e.g. for in-room presentations vs.
  recorded video)? Default: no.
- 2026-04-26 (v0.80.5): Phase 11 — pointer doc summarizing triggers,
  asset table, debounce, autoplay policy.
