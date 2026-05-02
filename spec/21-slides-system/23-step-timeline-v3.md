# 23 — Step Timeline v3 (Cinematic Fade + Ghost Number)

**Supersedes the motion timing in spec 17 (v2.5).** Visual structure
(left timeline + right description, no CSS scale, real font-size depth)
is unchanged. v3 lengthens the entry fade, adds a slow breathing halo
to the active number badge, and stamps a giant **ghost step numeral**
into the slide background that cross-fades on every step change.

## 1. Motion timing (active row entry)

| Phase | v2.5 | v3 | Notes |
|---|---|---|---|
| Active text slide-in | 420ms | **1100ms** | Slow, cinematic. Eases the headline in. |
| Active text translateX | -24px → 0 | **-32px → 0** | Slightly longer travel for grace. |
| Right description fade | 420ms | **900ms** | Synced to text slide-in. |
| Right description x | -40 → 0 | **-48 → 0** | Same easing curve. |
| Easing | `cubic-bezier(0.16, 1, 0.3, 1)` | **`cubic-bezier(0.19, 1, 0.22, 1)`** | "expo-out" — long, smooth tail. |

Text fade-in is **opacity + translateX only**. NO blur, NO scale.
Reduced motion drops to 150ms opacity crossfade.

## 2. Active number badge — breathing halo

Existing `step-badge-bubble` keyframe (one-shot bubble-in on activation)
is preserved. v3 adds a continuous halo that "radiates":

```
@keyframes step-badge-radiate {
  0%, 100% { box-shadow: 0 0 0 0 hsl(var(--gold) / 0.55), 0 0 24px -2px hsl(var(--gold) / 0.55); }
  50%      { box-shadow: 0 0 0 10px hsl(var(--gold) / 0), 0 0 36px -2px hsl(var(--gold) / 0.85); }
}
.step-badge-radiate { animation: step-badge-radiate 2400ms ease-in-out infinite; }
```

Active badge size grows from h-11/w-11 → **h-12/w-12** (subtle, not huge).
Reduced motion: drop the radiate animation, keep the static glow.

## 3. Ghost step numeral (background watermark)

A massive faded numeral (the active step number) is stamped into the
slide background, top-right area. It cross-fades whenever `active`
changes — old numeral fades out (~700ms), new one fades in (~900ms,
delayed 150ms) so they overlap softly.

| Property | Value |
|---|---|
| Position | `absolute right-[-2vw] top-[18vh]` (clipped by overflow-hidden) |
| Font | `font-display`, 900 weight |
| Size | `clamp(20rem, 38vw, 44rem)` |
| Color | `hsl(var(--gold) / 0.045)` (just visible against noir) |
| Stroke | none (filled) — flat shape, not outlined |
| Letter | the active step number, padded to two digits (`01`, `02`) |
| z-index | behind content (`z-0`), above slide background |
| Pointer events | none, `aria-hidden` |
| Mask | optional radial mask so the numeral fades toward edges |

Cross-fade implementation: `<AnimatePresence mode="sync">` keyed by
`active`. Each numeral animates `opacity 0 → 1 → 0`.

## 4. Pure-white text rule

Every text element on the active row + right description panel uses
`hsl(0 0% 100%)` (pure white) for max contrast against noir. Inactive
rows fade through `hsl(0 0% 100% / 0.75)` → `0.55`. The eyebrow
`STEP NN — TITLE` in the right panel switches from gold to **white**
in v3 (gold reserved for the small `STEP NN` capsule pill above the
left-side step title).

The slide-level title ("Engagement Process") is also pure white via the
existing `titleStyle: "white"` path.

## 5. "Step NN / NN" autoplay counter

Already discreet in v2.5. v3 keeps it. The counter text is
`text-foreground/55` — DO NOT change to white (it should read as
secondary chrome, not content).

## 6. Reusability checklist

To reuse the v3 motion principles on another slide type:

- Use `expo-out` (`cubic-bezier(0.19, 1, 0.22, 1)`).
- Active-state entry fade ≥ 900ms, translate ≤ 48px.
- Pair every "active" focus with a slow-pulse halo (2.0–2.5s loop).
- Reserve a corner of the background for a single oversized typographic
  watermark that cross-fades on state change.
- All transitions remain transform + opacity only — no scale, no blur.
