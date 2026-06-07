# 13 — Sound

The focus-arrival audio cue: a soft mechanical click when the presenter advances
or retreats a step. Sound is an accent, never a requirement — it must degrade
silently.

Source anchors:

- Manager: `src/slides/sound.ts` (`slideSound`, `SoundKind`, `setMuted`,
  `isMuted`, `play`).
- Trigger: `src/pages/SlideDeckPage.tsx:269/281` — `slideSound.play('click')`
  fires inside `next`/`prev` **after** `tryAdvance` returns (so it plays for both
  internal step advances and slide-to-slide moves).
- Mute persistence: `MUTE_STORAGE_KEY = 'slide-sound-muted'` (`sound.ts:36`).

---

## 1. Which cue

| Event | Kind | Volume | Notes |
|---|---|---|---|
| Step advance / retreat | `click` | `0.18` (`sound.ts:79`) | soft mechanical click, kept low |
| Soft precursor tap | `fadeClick` | `0.09` | same source, long fade envelope |

`SoundKind` is the closed union `'whoosh' | 'click' | 'fadeClick' | 'pop' |
'zoom' | 'fadeZoom'` — never pass a raw string. A 60ms attack / 120ms release
gain envelope is applied per play so repeated advances never machine-gun.

## 2. Silent-degradation rules (mandatory)

- **Autoplay policy:** the `AudioContext` is created lazily and resumed on first
  user gesture; before that, `play()` is a **silent no-op** (browser-mandated).
  Never block navigation waiting on audio.
- **Mute:** `setMuted(true)` persists to `localStorage`; `isMuted()` reads it.
  When muted, `play()` returns immediately. localStorage failures (private mode)
  fall back to unmuted — caught, not thrown.
- **Decode failure:** if the asset fails to decode the manager falls back
  silently; a missing sound must never surface as an error to the user.

## 3. Interaction with reduced motion

Reduced motion (see `11-reduced-motion.md`) governs **visual** motion only and
does NOT auto-mute — audio is controlled solely by the mute toggle. Keep the two
concerns separate: a user may want calm visuals but keep the arrival cue, or
vice-versa.

---

## Acceptance

- [ ] Step nav plays `click` at low volume via `slideSound.play('click')`.
- [ ] `play()` is a no-op before first gesture, when muted, and on decode fail —
      never blocking and never throwing.
- [ ] Mute state persists across reloads; reduced motion does not mute audio.
