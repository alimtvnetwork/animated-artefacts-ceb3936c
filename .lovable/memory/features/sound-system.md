---
name: sound-system
description: Per-slide audio cue system. Five kinds — whoosh / click / pop / zoom / fadeZoom. Whoosh, click, zoom, fadeZoom are MP3 assets with runtime fade envelopes; pop synthesized. Opt-in via SlideSpec.sound, autoplay-policy aware, global mute persisted, previous play of the same kind ducked on rapid replays, same-kind 60ms debounce. v0.43.0 — boot-time prefetch + play-when-ready replaces synth fallback for whoosh/zoom/fadeZoom so the FIRST cinematic cue of a session always plays the real MP3.
type: feature
---

When the user says "**slide sound**" or "sound cue" they mean the
per-slide audio system specced in `spec/slides/21-sound-system.md`. The
runtime is `src/slides/sound.ts`.

## Asset library (locked v0.37.0 — 2026-04-27)

| Kind | URL | Length | Default vol | Notes |
|------|------|--------|-------------|-------|
| `whoosh`   | `/sounds/fade_swoosh_v2.mp3` | 0.35s | 0.45 | 80ms in / 140ms out, −3dB |
| `click`    | `/sounds/click.mp3`          | ~2.0s | 0.35 | Real mechanical click; replaces the old square-osc synth as the default. Synth is now only a hard-failure fallback (network/decode error). |
| `zoom`     | `/sounds/zoom.mp3`           | ~2.8s | 0.55 | Rising whoosh, full energy. Used for capsule expand AND any "grow" entrance cue the author wants. |
| `fadeZoom` | `/sounds/fade_zoom.mp3`      | ~2.8s | 0.40 | ffmpeg-derived: −8dB + 0.4s in / 0.7s out fades. Lower-energy variant of `zoom` for moments where the cue has to coexist with another sound (e.g. a click that fired the same frame). |
| `pop`      | (synth)                      | 0.12s | 0.45 | Sine 380→640Hz upchirp. Still procedural — UI cue, not cinematic. |

## First-play guarantee (v0.43.0 — locked)

The user reported that the FIRST whoosh played on a session (typically
arriving on the StepTimeline slide for the first time) sounded "like a
default whoosh", noticeably different from later whooshes. Root cause:
the asset buffer hadn't decoded yet, so `play('whoosh')` fell back to
`synthWhoosh()` (filtered noise). Fix:

1. **Constructor-time prefetch**: `prefetchAllAssets()` runs at module
   load, fetching every MP3 into `this.prefetched: Map<string, ArrayBuffer>`
   BEFORE we have an AudioContext. The slow part (network) finishes in
   the background while the user is still reading the title slide.
2. **`loadAsset` consumes prefetched bytes**: when an AudioContext finally
   exists (first user gesture), we decode from cached bytes — no second
   network round-trip. Prefetched bytes are freed once decoded.
3. **No synth fallback for cinematic cues**: `play('whoosh' | 'zoom' |
   'fadeZoom')` with an unloaded buffer no longer fires the synth.
   Instead it `await`s the load (capped at `READY_WAIT_MS = 800ms`) and
   plays the real MP3 the moment it lands. Past 800ms the cue is dropped
   rather than firing stale audio. `click` still falls back to the synth
   on hard failure (network down) because a missing click is worse than
   a slightly different one.
4. **Race protection**: the deferred play checks `lastPlay.get(kind)`
   matches the original timestamp — if a newer same-kind call happened
   while we were waiting, the older one is dropped.

`READY_WAIT_MS` is intentionally generous (800ms) because in practice
the prefetch finishes inside ~400ms, so the wait almost always resolves
under 50ms after the gesture-driven AudioContext unlock.

## Wiring (where each kind plays)

- **Slide nav** (`SlideDeckPage.next/prev/jump`, `onCapsuleClickReveal`) →
  `slideSound.play('click')`. Includes keyboard arrows. The 60ms same-kind
  dedupe prevents key-repeat from machine-gunning the click.
- **Capsule click** (`CapsuleListSlide.handleCapsuleClick`) → always plays
  `click`. If the capsule has an `expand` payload it ALSO plays `fadeZoom`
  to ride the layoutId morph from capsule → expanded card. Cross-kind, so
  the click isn't ducked.
- **AdvanceStepSlide / StepTimelineSlide** → still call
  `slideSound.play('whoosh', vol)` on focus changes (unchanged from v0.36).

## Locked rules

- **All asset cues** share one buffered-source code path (`playBuffer`) with
  a per-kind `AssetSpec` (volume / attack / release / ducksPrevious).
  Adding a new MP3 cue is one entry in the `ASSETS` map — no new method.
- **Runtime envelope on top of every asset**: linear attack + release per
  spec, applied even when the asset has baked-in fades. Belt + braces —
  guarantees no click on rapid replays.
- **Previous play of the same kind is ducked** when `ducksPrevious=true`
  (whoosh / zoom / fadeZoom): 50ms ramp to 0 + stop. Prevents stacked
  plays from roaring. Click does NOT duck — repeats are the point.
- **Same-kind debounce**: re-triggering the same kind within 60ms
  (overridable via `play(kind, vol, { dedupeMs })`) is a no-op. Prevents
  React strict-mode double-fires and accidental double-handlers.
  Cross-kind plays are never blocked.
- **First-call behavior** (v0.43.0): cinematic cues await the real buffer
  up to 800ms. `click` still has a synth safety net for total network
  failure. `pop` is always synth (it IS the design).
- JSON shape: `sound: { on: 'enter'|'focus'|'click', kind: SoundKind, volume: 0..1, mute: boolean }`.
  Defaults: `on='enter'`, `kind='whoosh'`, `volume=0.45`.
- Singleton `slideSound` — NOT a hook. Slides call `slideSound.play(kind, volume)`
  from effects/handlers.
- Autoplay policy: lazy AudioContext + resume on first `pointerdown`/`keydown`.
  Pre-gesture calls are silent no-ops.
- Background-tab guard via `document.hidden`. Global mute persisted in
  `localStorage` key `slide-sound-muted`.
- Reduced-motion does NOT mute — sound is a cue, not motion. Per-slide
  opt-out via `sound.mute: true`.

## Asset provenance

- `zoom.mp3` — user-uploaded `Zoom.mp3` on 2026-04-27, copied verbatim to
  `public/sounds/zoom.mp3` AND `src/assets/sounds/zoom.mp3` (the `assets/`
  copy is the source-of-truth for re-deriving variants).
- `fade_zoom.mp3` — derived from `zoom.mp3` via:
  `ffmpeg -i zoom.mp3 -af "volume=-8dB,afade=t=in:st=0:d=0.4,afade=t=out:st=2.1:d=0.7" -q:a 4 fade_zoom.mp3`.
  Re-run that command if `zoom.mp3` is ever replaced.
- `click.mp3` — user-uploaded `Click.mp3` on 2026-04-27, copied verbatim.
