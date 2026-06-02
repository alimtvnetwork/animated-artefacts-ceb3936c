# 09 — Sound

The slide-number surfaces use exactly **one** cue, and only on a jump. This
file states the cue, the asset, the volume, and the rules. System of record:
`src/slides/sound.ts` (full system spec: `spec/slides/21-sound-system.md`).

## The cue used by slide-number jumps

- **Kind:** `'click'`
- **Asset:** `/sounds/click.mp3` (~2s mechanical click, but envelope-trimmed)
- **Volume:** `0.18` (intentionally soft — was 0.35, lowered because
  dot-pagination jumps felt too loud)
- **Attack:** `0.005s` · **Release:** `0.06s`
- **ducksPrevious:** `false`

Played via the singleton:

```ts
import { slideSound } from '@/slides/sound';
slideSound.play('click');
```

## When it fires (and when it must NOT)

| Action | Cue? |
|--------|------|
| Click a dot in Dot Pagination | ✅ `click` (inside `jump`) |
| Type a number + Enter in the controller indicator | ✅ `click` (inside `jump`) |
| Click a recent-jump history chip | ✅ `click` (calls `jump`) |
| Next / Prev buttons or keys | ✅ `click` |
| Click a slide in Grid Overview | ❌ silent (`goTo` directly, no `jump`) |
| Passive slide change / re-render | ❌ never |
| Hovering a dot / opening the input | ❌ never |

**Rule:** the cue lives inside `jump()` / `next()` / `prev()`. Display surfaces
never call `slideSound` themselves. This guarantees exactly one cue per jump
and none on render.

## Engine guarantees (from sound.ts)

- **Same-kind debounce:** re-triggering the same kind within `dedupeMs`
  (default **60ms**) is a no-op — protects against double-fire from React
  effect + onClick chains. So a rapid double click on a dot will not stack two
  `click` cues.
- **Autoplay policy:** the `AudioContext` is created lazily and resumed on the
  first `pointerdown`/`keydown` anywhere. Before that gesture, `play()` is a
  **silent no-op** (browser-mandated). The very first jump after page load may
  therefore be silent if no prior interaction occurred.
- **Runtime envelope:** every play applies a 60ms attack / 120ms release gain
  envelope so repeats never click harshly.
- **Mute:** global mute persists in `localStorage` under
  `'slide-sound-muted'`. When muted, all cues are suppressed.
- **Asset failure:** if `click.mp3` fails to decode, the manager falls back to
  a procedural synth where one exists for the kind.

## Other cues (do NOT use for number jumps)

`whoosh` (slide-to-slide cinematic), `zoom` / `fadeZoom` (StepTimeline /
camera), `fadeClick` (soft precursor for capsule presses) and `pop` exist in
the system but are **not** part of the slide-number contract. Keep number
jumps on `click` only.
