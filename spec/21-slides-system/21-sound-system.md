# Spec 21 — Slide Sound System (per-slide audio cues)

> **Codename in chat:** "**slide sound**" / "sound cue".
> Source of truth: `src/slides/sound.ts` + `SlideSpec.sound` in
> `src/slides/types.ts`.

---

## 0. v0.37.0 update — asset library expanded

The system now ships four MP3-backed cues plus one pure-synth cue. The
SoundKind union is **`'whoosh' | 'click' | 'pop' | 'zoom' | 'fadeZoom'`**.
`click` is no longer a square-osc synth by default — the synth is now the
"buffer not yet loaded" fallback for `click` only.

| Kind | Source | Default vol | Used by |
|------|--------|-------------|---------|
| `whoosh`   | `/sounds/fade_swoosh_v2.mp3` | 0.45 | AdvanceStep / StepTimeline focus changes |
| `click`    | `/sounds/click.mp3`          | 0.35 | Slide nav (next/prev/jump), capsule clicks |
| `zoom`     | `/sounds/zoom.mp3`           | 0.55 | Author opt-in for "grow" entrances |
| `fadeZoom` | `/sounds/fade_zoom.mp3`      | 0.40 | Capsule expand morph (rides the layoutId card grow) |
| `pop`      | (synth)                      | 0.45 | Procedural; reserved for tiny UI accents |

`fadeZoom` is a derived asset — see "Asset provenance" in
`mem://features/sound-system` for the ffmpeg command.

Same-kind plays are now **debounced (60ms default)** to absorb React
strict-mode double-fires. Cross-kind plays are never blocked, so a `click`
+ `fadeZoom` fired the same frame both ring through (this is exactly what
capsule expand needs).

---

## 1. Goal

Let presenters attach short audio cues to slides. Sounds live as MP3 assets
under `public/sounds/` plus tiny procedural fallbacks for cues that don't
need an asset (`pop`, and the "buffer not yet loaded" path for `whoosh` /
`click`).

The deck stays a static frontend bundle — no runtime audio synthesis
service is required.

---

## 2. JSON contract

Every slide may declare an optional `sound` block:

```jsonc
{
  "sound": {
    "on": "enter" | "focus" | "click",                          // default: "enter"
    "kind": "whoosh" | "click" | "pop" | "zoom" | "fadeZoom",   // default: "whoosh"
    "volume": 0.45,                                              // 0..1, default per-kind
    "mute": false                                                // hard override; default false
  }
}
```

Triggers:

- `enter` — fires once when the slide enters the viewport (transition begins).
  Use for hero/title slides.
- `focus` — fires every time a sub-element inside the slide gains focus
  (AdvanceStep frame change, FocusTimeline focusOn, hover-cued reveal).
  This is the AdvanceStep default.
- `click` — fires when the slide's primary CTA / hotspot is clicked.

`kind` selects which procedural synth to use:

- `whoosh` — ~280ms swept band-pass white-noise burst, low-pass 1200→4000Hz
  with an exponential gain ramp `0 → 1 → 0`. Reads as a camera move.
- `click` — ~60ms square-wave 1.2kHz click with a 5ms attack and 50ms
  exponential decay. Reads as a UI confirmation.
- `pop` — ~120ms sine 380→640Hz upward chirp. Reads as a soft pop / reveal.

---

## 3. Runtime contract

`src/slides/sound.ts` exports a singleton `slideSound` with three methods:

```ts
slideSound.play(kind: SoundKind, volume?: number): void
slideSound.setMuted(muted: boolean): void   // global mute, persisted
slideSound.isMuted(): boolean
```

Behavior:

- **Lazy AudioContext** — created on first call, never on import.
- **Autoplay policy** — `play()` is a no-op until the user has clicked,
  tapped, or pressed a key inside the deck. The manager attaches a
  one-shot `pointerdown` + `keydown` listener on `document` to call
  `audioCtx.resume()`. After resume future calls work.
- **Background tab guard** — `play()` is a no-op when `document.hidden`.
- **Global mute** — `setMuted(true)` persists `slide-sound-muted=1` to
  `localStorage`; `slideSound.play()` is a no-op while muted.
- **Per-slide mute** — slides read `spec.sound?.mute` themselves and skip
  the call if true.

The manager is intentionally **not a hook**. Slides import `slideSound`
directly and call `slideSound.play(kind, volume)` from their event
handlers. There is no React state, no provider, no context.

---

## 4. Wiring per slide type

### AdvanceStepSlide (spec 20)

```ts
useEffect(() => {
  const s = spec.sound ?? { on: 'focus', kind: 'whoosh', volume: 0.45 };
  if (s.on !== 'focus' || s.mute) return;
  slideSound.play(s.kind ?? 'whoosh', s.volume ?? 0.45);
}, [focusIndex]);
```

### Title-style slides (future opt-in)

```ts
useEffect(() => {
  const s = spec.sound;
  if (!s || s.on !== 'enter' || s.mute) return;
  slideSound.play(s.kind ?? 'whoosh', s.volume ?? 0.45);
}, []);  // mount-only
```

### Click-driven (future)

```tsx
<button onClick={() => {
  if (!spec.sound?.mute && spec.sound?.on === 'click') {
    slideSound.play(spec.sound.kind ?? 'pop', spec.sound.volume ?? 0.4);
  }
  // ...rest of handler
}} />
```

---

## 5. Settings (future, not in v1 ship)

A future `/settings` toggle "Slide audio cues" will call
`slideSound.setMuted(value)`. Persisted via the same localStorage key so
the user's preference survives page reloads.

---

## 6. Files of record

- Manager: `src/slides/sound.ts`
- Type defs: `src/slides/types.ts → SlideSpec.sound`, `SoundKind`,
  `SoundTrigger`
- JSON schema: `spec/slides/slide.schema.json` (`sound` object on
  `SlideSpec`)
- Memory mirror: `.lovable/memory/features/sound-system.md`

---

## 7. Test checklist

1. Loading a deck with no `sound` blocks plays no audio. Ever.
2. Loading the showcase `/3` (AdvanceStep) plays one whoosh after the
   first user click anywhere on the page (autoplay policy).
3. Pressing Next on `/3` plays exactly one whoosh per advance.
4. Switching to a background tab and pressing Next over there silently
   advances — no whoosh.
5. Setting `sound.mute: true` on a slide silences it specifically.
6. Calling `slideSound.setMuted(true)` from devtools silences the entire
   deck, persists across reload.
7. `kind: "click"` and `kind: "pop"` produce audibly distinct cues.

---

## 8. v1.1 addendum (2026-04-26) — MP3 whoosh + runtime fade envelope

User feedback: the procedural whoosh sounded like a noise burst, not a
cinematic camera move. They supplied `Swoosh_06.mp3` (1.58s) and asked us
to ship a trimmed, gentler version with proper fade-in/out.

### 8.1 Asset

- Source upload: `Swoosh_06.mp3` (1.58s, ~64KB).
- **Shipped asset**: `public/sounds/fade_swoosh.mp3` — a 0.5s trim with
  baked-in 40ms fade-in + 100ms fade-out and +1.2dB gain. Built with:
  ```
  ffmpeg -i Swoosh_06.mp3 \
    -af "atrim=start=0.05:end=0.55,asetpts=PTS-STARTPTS,
         afade=t=in:st=0:d=0.04,afade=t=out:st=0.40:d=0.10,
         volume=1.2" \
    -ac 2 -b:a 128k public/sounds/fade_swoosh.mp3
  ```
- Original (for reference / variations): `public/sounds/swoosh.mp3`.

### 8.2 Runtime behavior

`slideSound.play('whoosh', volume)`:

1. Lazy-fetches `/sounds/fade_swoosh.mp3` once, decodes via
   `AudioContext.decodeAudioData`, caches the `AudioBuffer`.
2. On every play, creates a fresh `BufferSource` + `GainNode` and applies
   a **runtime envelope on top of the baked-in fades** (belt + braces so
   rapid replays never click):
   - 60ms linear ramp `0 → volume`
   - hold at `volume` until `dur - 120ms`
   - 120ms linear ramp back to `0`
3. If a previous whoosh is still ringing, ducks it with a 50ms ramp to 0
   and stops it. This prevents stacked plays from turning into a roar
   when the user mashes Next.
4. If the asset fails to fetch/decode, falls back to the existing
   procedural whoosh synth so the cue is never silently dropped.

### 8.3 First-play behavior

The first time `play('whoosh')` is called before the buffer has loaded,
the manager kicks off the load AND plays the synth fallback for that one
call only. Every subsequent call uses the cached MP3. The unlock listener
also pre-warms the buffer on the first user gesture so the very first
focus arrival usually hits the asset path even on slow networks.

### 8.4 Reusability

The envelope constants (`WHOOSH_ATTACK_S = 0.06`,
`WHOOSH_RELEASE_S = 0.12`) live as module-scope constants in
`src/slides/sound.ts`. To reuse the same MP3 for a different cue (e.g. a
longer "section change" whoosh), add a new buffer URL constant + a new
`SoundKind` value rather than tweaking the constants in place — the
envelope shape is intentionally short for step changes.

### 8.5 Test additions

8. After loading any deck and clicking once, calling `slideSound.play(
   'whoosh')` from devtools plays the MP3 (not the noise burst).
9. Pressing Next 5 times in 1 second on `/3` produces 5 distinct whooshes
   that fade naturally — never a single sustained roar.
10. Throttling the network to "Slow 3G" and reloading: the first focus
    arrival plays the synth fallback, every subsequent arrival plays the
    MP3.
11. Blocking `/sounds/fade_swoosh.mp3` (devtools network override → 404)
    permanently falls back to the synth — no console errors thrown.

---

## 9. v1.2 addendum (2026-04-26) — fade_swoosh_v2

User feedback after v1.1: the 0.5s whoosh was still slightly too loud and
the in/out fades too short, so rapid step changes felt punchy rather than
cinematic.

### 9.1 New asset

`public/sounds/fade_swoosh_v2.mp3` — 0.35s, ~6.7KB. Built with:

```
ffmpeg -i public/sounds/swoosh.mp3 \
  -af "atrim=start=0.08:end=0.43,asetpts=PTS-STARTPTS,
       afade=t=in:st=0:d=0.08,afade=t=out:st=0.21:d=0.14,
       volume=0.71" \
  -ac 2 -b:a 128k public/sounds/fade_swoosh_v2.mp3
```

Changes vs v1 (`fade_swoosh.mp3`):
- Duration 0.50s → **0.35s** (snappier between rapid step changes).
- Baked fade-in 40ms → **80ms** (softer attack).
- Baked fade-out 100ms → **140ms** (longer tail).
- Gain +1.2dB → **−3dB** (volume 1.2 → 0.71) so the runtime `volume`
  parameter sits in a more usable range — `0.35` on StepTimeline now
  reads as a gentle hush rather than a loud burst.

### 9.2 Runtime

`WHOOSH_URL` in `src/slides/sound.ts` now points at
`/sounds/fade_swoosh_v2.mp3`. The 60ms / 120ms runtime envelope still
applies on top — no other code changes needed. v1
(`fade_swoosh.mp3`) stays on disk in case anyone needs the louder cut for
hero/title slides; just point a future `WHOOSH_HERO_URL` constant at it.

### 9.3 Test additions

12. Pressing Next on `/3` produces a noticeably softer, shorter whoosh
    than v1.
13. Mashing Next 5x in a second still ducks cleanly (existing
    `activeWhoosh` ducking logic is unchanged).
14. With `sound.mute: true` on a slide spec the cue stays silent — the
    asset swap doesn't affect mute behavior.

## Addendum — v0.43.0 first-play guarantee

The "first whoosh of a session sounds wrong" bug: when the first
StepTimelineSlide armed its focus cue before the MP3 had decoded, the
manager fell back to `synthWhoosh` (filtered noise), which sounds
audibly different from the real MP3. Fix:

1. **Constructor-time prefetch** — every `ASSETS` entry is `fetch()`ed
   into a `prefetched: Map<string, ArrayBuffer>` at module load, before
   any AudioContext exists. The slow part (network) finishes in the
   background while the user is still on the title slide.
2. **`loadAsset` consumes prefetched bytes** — once unlocked, decode
   from the cached bytes, no second round-trip. Prefetched copy is
   freed after decode.
3. **No synth fallback for cinematic cues** — `play('whoosh' | 'zoom' |
   'fadeZoom')` with an unloaded buffer awaits the load (capped at
   `READY_WAIT_MS = 800ms`) and plays the real MP3 the moment it lands.
   Past 800ms the cue is dropped rather than firing stale or wrong audio.
   `click` keeps a synth safety net for hard network failure.
4. **Race protection** — the deferred play checks `lastPlay.get(kind)`
   matches the original timestamp; if a newer same-kind call happened
   while waiting, the older one is dropped.
