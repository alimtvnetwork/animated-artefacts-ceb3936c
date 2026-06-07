# 08 — Motion Constants (single source of truth)

This file is the **code-cited table** of every timing, easing, and opacity used
by step slides. When the spec and code disagree on a raw number, the code wins —
so every value here cites its `src/index.css` line. Do not hardcode any of these
in a component (coding-guidelines rule 6).

---

## 1. Easing tokens

| Token | Value | Line | Used for |
|---|---|---|---|
| `--step-text-ease` | `cubic-bezier(0.19, 1, 0.22, 1)` (expo-out) | `src/index.css:229` | opacity / color / filter / text-shadow on rows |
| (inline) lift/size ease | `cubic-bezier(0.22, 1, 0.36, 1)` | `src/index.css:1525-1526` | font-size + transform "rise to focus" |

---

## 2. Durations

| Purpose | Duration | Line |
|---|---|---|
| Row opacity / color crossfade | `1300ms` | `src/index.css:1505-1506,1527-1529` |
| Font-size + transform (depth lift) | `700ms` | `src/index.css:1525-1526` |
| Per-variant active keyframes (lift/slide) | `700ms` | `src/index.css:1595,1607` |
| Parallax keyframe | `720ms` | (parallax variant) |
| Blur/filter ramp | `900ms` | `src/index.css:1549` |
| Count-up fast / slow | `--dur-count-fast: 900ms` / `--dur-count-slow: 1800ms` | `src/index.css:132-133` |

> Rationale: opacity/color stay slow (1300ms expo-out) so dim↔active reads
> cinematic; font-size+transform run shorter (700ms) so emphasis leads the
> crossfade — the "confident rise to focus." See `mem://design/step-row-motion-parity`.

---

## 3. Opacity ramp tokens

| Token | Value | Line |
|---|---|---|
| `--step-opacity-active` | `1` | `src/index.css:220` |
| `--step-opacity-adjacent` | `0.55` | `src/index.css:221` |
| `--step-opacity-far` | `0.30` | `src/index.css:222` |

> Note: these are the **row-opacity** tokens. The `.step-title` color uses a
> separate foreground-alpha ramp (active 1.0 / adjacent 0.62 / far 0.55, see
> `06-typography.md §3`) so glyphs stay legible on light themes.

---

## 4. Blur ramp (static cue, survives reduced motion)

| State | Blur | Line |
|---|---|---|
| active | `blur(0px)` | `src/index.css:1551` |
| adjacent | `blur(1.2px)` | `src/index.css:1552` |
| far | `blur(2.5px)` | `src/index.css:1553` |

Blur is a **static hierarchy cue** — only its *transition* is dropped under
reduced motion (`11-reduced-motion.md`), the blur value itself stays.

---

## 5. Reduced-motion zeroing

`--dur-count-fast` / `--dur-count-slow` collapse to `0ms` under
`prefers-reduced-motion` (`src/index.css:374,383-384`). See `11-reduced-motion.md`
for the full disable/keep list.

---

## Acceptance

- [ ] No step component hardcodes a duration/ease — all reference tokens or the
      cited inline values.
- [ ] Opacity ramp matches `1 / 0.55 / 0.30`; title-color alpha is the separate
      `1.0 / 0.62 / 0.55` ramp.
- [ ] Blur values survive reduced motion; only transitions drop.
