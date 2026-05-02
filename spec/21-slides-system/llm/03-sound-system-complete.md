# 03 — Sound System (Canonical Playbook)

> Replaces — for new builds — spec 21 + every addendum. The original is
> kept for archeology.

---

## 1. Mental model

```
   slide spec                event handler
       │                          │
       ▼                          ▼
   slideSound.play(kind, volume)
       │
       ▼
  Singleton manager (src/slides/sound.ts)
       │
       ├─► AudioContext (lazy; created on first play)
       │       │
       │       └─► document.pointerdown / keydown   ← unlock listener
       │              (one-shot, calls audioCtx.resume())
       │
       ├─► prefetched: Map<url, ArrayBuffer>        ← module-load fetch
       │
       ├─► loadAsset(kind) → AudioBuffer (cached)
       │
       └─► On play():
              - If document.hidden → no-op
              - If muted (localStorage) → no-op
              - If same-kind within 60 ms → no-op (debounce)
              - If buffer not ready: wait up to READY_WAIT_MS=800
                  - cinematic kinds (whoosh / zoom / fadeZoom): wait, no synth fallback
                  - 'click' / 'fadeClick': fall back to procedural synth
              - Build BufferSource + GainNode
              - Apply runtime envelope:
                  0 → volume (attack)
                  hold
                  volume → 0 (release tail)
              - If ducksPrevious & a same-kind source is still ringing: ramp old to 0 in 50 ms
              - Connect to destination, start.
```

---

## 2. Asset table (current truth — supersedes spec 21 §0)

| Kind | URL | Source size | Default vol | Attack | Release | Ducks prev | Used by |
|------|-----|-------------|-------------|--------|---------|------------|---------|
| `whoosh`     | `/sounds/fade_swoosh_v2.mp3` | 350 ms, ~6.7 KB | 0.45 | 0.06 s | 0.12 s | yes | StepTimeline + AdvanceStep focus changes |
| `click`      | `/sounds/click.mp3`          | ~2 s            | 0.18 | 0.005 s| 0.06 s | no  | Slide nav, capsule clicks, dot pagination |
| `fadeClick`  | `/sounds/click.mp3` *(reuses)* | same          | 0.09 | 0.05 s | 0.18 s | no  | Soft tap precursor before a bigger cue |
| `zoom`       | `/sounds/zoom.mp3`           | ~2.8 s          | 0.55 | 0.04 s | 0.18 s | yes | Author opt-in for "grow" entrances |
| `fadeZoom`   | `/sounds/fade_zoom.mp3`      | ~2.8 s, -8 dB   | 0.40 | 0.04 s | … | yes | Capsule expand morph (rides the layoutId card grow) |
| `pop`        | (synth)                      | ~120 ms         | 0.45 | — | — | no  | Procedural; reserved for tiny UI accents |

> `fadeClick` is **not** a separate asset — it reuses `click.mp3` with a
> softer envelope. Same buffer, two cues. Don't add a second MP3.

### How `fade_swoosh_v2.mp3` was made

```bash
ffmpeg -i public/sounds/swoosh.mp3 \
  -af "atrim=start=0.08:end=0.43,asetpts=PTS-STARTPTS,
       afade=t=in:st=0:d=0.08,afade=t=out:st=0.21:d=0.14,
       volume=0.71" \
  -ac 2 -b:a 128k public/sounds/fade_swoosh_v2.mp3
```

Changes vs the older `fade_swoosh.mp3`: shorter (0.5 → 0.35s), softer
attack (40 → 80ms), longer tail (100 → 140ms), -3 dB gain (so the
runtime `volume=0.45` is gentle).

---

## 3. JSON contract (per-slide)

```jsonc
{
  "sound": {
    "on": "enter" | "focus" | "click",   // default: "enter"
    "kind": "whoosh" | "click" | "pop" | "zoom" | "fadeZoom",
                                          // default: "whoosh"
    "volume": 0.45,                       // 0..1, default per-kind
    "mute": false                          // hard override; default false
  }
}
```

Triggers:

- `enter` — fires once when the slide enters the viewport. Hero / title.
- `focus` — fires on every sub-element focus change. AdvanceStep /
  StepTimeline default.
- `click` — fires when the slide's primary CTA / hotspot is clicked.

---

## 4. Runtime API

```ts
import { slideSound } from '@/slides/sound';

slideSound.play(kind: SoundKind, volume?: number): void
slideSound.setMuted(muted: boolean): void   // global mute, persisted
slideSound.isMuted(): boolean
```

**`SoundKind`** = `'whoosh' | 'click' | 'fadeClick' | 'pop' | 'zoom' | 'fadeZoom'`.

The manager is **not** a hook. Slides import `slideSound` directly and
call from their `useEffect` / `onClick`. There is no provider, no
context, no React state.

---

## 5. Wiring recipes

### 5.1 Slide opts in for `on: 'focus'` (StepTimeline / AdvanceStep)

```ts
useEffect(() => {
  const s = spec.sound ?? { on: 'focus', kind: 'whoosh', volume: 0.45 };
  if (s.on !== 'focus' || s.mute) return;
  slideSound.play(s.kind ?? 'whoosh', s.volume ?? 0.45);
}, [activeIndex]);
```

### 5.2 Slide opts in for `on: 'enter'` (hero / title)

```ts
useEffect(() => {
  const s = spec.sound;
  if (!s || s.on !== 'enter' || s.mute) return;
  slideSound.play(s.kind ?? 'whoosh', s.volume ?? 0.45);
}, []); // mount-only
```

### 5.3 Click handler with soft precursor

```tsx
<button onClick={() => {
  slideSound.play('fadeClick');           // soft tap precursor
  setTimeout(() => slideSound.play('whoosh'), 60);  // big cue
  doTheThing();
}} />
```

### 5.4 Always-mute a slide

```jsonc
{ "sound": { "mute": true } }
```

---

## 6. Behavior contracts (must hold)

1. **Autoplay policy** — `play()` is a silent no-op until the user has
   clicked, tapped, or pressed a key inside the deck. The unlock listener
   is one-shot (`pointerdown` + `keydown` on `document`). After unlock,
   future calls work normally.
2. **Background tab guard** — `play()` is a no-op when
   `document.hidden`. Background tabs never randomly whoosh.
3. **Same-kind debounce** — re-triggering the same kind within
   `dedupeMs` (default 60 ms) is a no-op. Cross-kind plays are never
   blocked, so a `fadeClick` + `whoosh` fired the same frame both ring.
4. **Ducking** — for kinds with `ducksPrevious: true` (whoosh, zoom,
   fadeZoom), a new play ramps the previous source's gain to 0 over
   50 ms before starting the new one. Prevents stacked plays from
   becoming a roar.
5. **First-play guarantee** — every asset URL is `fetch()`ed at module
   load into a `prefetched: Map<url, ArrayBuffer>` BEFORE any
   AudioContext exists. Once unlocked, decode happens from cached bytes
   (no second round-trip). The first cue therefore hits the real MP3,
   not the fallback synth, in ~99% of sessions.
6. **No synth fallback for cinematic cues** — `play('whoosh' | 'zoom' |
   'fadeZoom')` with an unloaded buffer waits up to `READY_WAIT_MS = 800`
   ms for the load. Past 800 ms the cue is **dropped** rather than
   firing the (very different sounding) synth.
7. **Race protection** — the deferred play checks `lastPlay.get(kind)`
   matches the original timestamp; if a newer same-kind call happened
   while waiting, the older one is dropped.
8. **Global mute** — `setMuted(true)` persists `slide-sound-muted=1` to
   `localStorage`. `play()` is a no-op while muted. Survives reload.

---

## 7. Adding sound to a brand-new slide type

1. Decide the trigger: `enter` (mount) or `focus` (sub-element change).
2. In the slide renderer, add an effect:
   ```ts
   useEffect(() => {
     const s = spec.sound;
     if (!s || s.mute) return;
     if (s.on !== 'focus' /* or whatever you chose */) return;
     slideSound.play(s.kind ?? 'whoosh', s.volume ?? 0.45);
   }, [/* dep that triggers focus changes */]);
   ```
3. Pick a sensible default in the JSON template
   (`spec/slides/llm/06-json-authoring-cheatsheet.md`).
4. If the new cue uses a new MP3, drop it in `public/sounds/`, add an
   entry to `ASSETS` in `src/slides/sound.ts`, extend the `SoundKind`
   union, and update the asset table here.
5. Acceptance: load the slide, click once, observe one whoosh per
   intended trigger. Toggle global mute, observe silence. Set
   `sound.mute: true` on the slide JSON, observe silence.

---

## 8. What to NEVER do

- Do **not** call `play()` on every render. Always inside `useEffect`
  with a dep array.
- Do **not** create your own `AudioContext`. Use the singleton.
- Do **not** add a new "fade-tap" or "whisper-click" MP3 — use the
  envelope (volume + attack + release) on the existing `click.mp3` (see
  `fadeClick`).
- Do **not** raise default volumes above ~0.55. The deck plays sound
  through laptop speakers in pitch sessions; loud cues are jarring.
- Do **not** wire sound directly to `setActive` setters via callbacks —
  always derive from the `active` state in an effect, so the *one
  source of truth* (state) drives *one cue* (effect).
