# 09 — Title Background

> **Phase 8/20** · The title slide and section dividers carry the most
> visual weight in the deck. This file pins their background recipe.

## 1. Title slide (`TitleSlide`) — cinematic constellation

The title is the only slide where motion is the **primary** visual
interest; the typography is secondary by design.

| Layer | Setting |
|---|---|
| Plate | `hsl(var(--ink))` |
| Ambient variant | `constellation` (Lissajous sway, see spec
`spec/slides/llm/04-ambient-and-title-background.md`) |
| Particle count | `42` (target — perf-tested on 1080p projector) |
| Particle color | `hsl(var(--gold) / 0.45)` |
| Trail | `6px` blur, `0.18` alpha |
| Sway equation | `x = sin(t · 2π / 7) · 0.18` (period 7s) |
| Vignette | `radial-gradient(ellipse at 50% 50%, transparent 40%, hsl(var(--ink) / 0.85) 100%)` |

The vignette pulls the eye to the center where the wordmark + presenter
name sit.

## 2. Section divider — bold ambient swap

Dividers reuse the title plate but swap to `pulse` or `sweep` ambient
to mark the chapter break. **Never** put new copy on a divider — only
the section title and its index (`II`, `III`, …).

## 3. Wordmark placement

| Element | Position | Size |
|---|---|---|
| Riseup Asia logo | Centered, y = `420px` | `width: 360px` |
| Presenter chip | Centered, y = `560px` | `width: 280px` |
| Title text | Centered, y = `680px` | `font-size: clamp(3rem, 12vw, 9rem)` |

Always pin to canvas y-coordinates from the 1080 grid — never `top:
50%`. The vignette + ambient depend on absolute positioning.

## 4. Required contrast

Title text on the constellation field must hit **≥ 7:1** against the
darkest visible vignette pixel. The ink + 0.85 vignette layer ensures
this even when ambient particles cluster — particle alpha is capped at
`0.45` precisely to preserve this floor.

| Element | Token | Ratio |
|---|---|---|
| Title text | `hsl(var(--cream))` ≈ `#FFF1D6` | **17.8:1** |
| Eyebrow | `hsl(var(--gold))` ≈ `#F3A502` | **9.6:1** |
| Subtitle | `hsl(var(--cream) / 0.85)` | **15.0:1** |

## 5. Forbidden on title

- A second background image (logo bg, hero photo) — kills the
  constellation rhythm.
- A gold/ember overlay fill — re-mutes the wordmark.
- Animated text alongside ambient motion — competes for attention. Use
  one or the other, not both.

## 6. Acceptance

- First paint shows ink plate + constellation within 200ms (no flash of
  unstyled background).
- With `prefers-reduced-motion: reduce`, ambient sway pauses but
  particles remain visible (pin them at their idle positions).
- Vignette mask is rendered — pure ink without vignette flunks contrast
  and looks flat.

## 7. Open questions & changelog

- Open: allow per-deck override of the constellation color (e.g. ember
  for a sales deck)? Default: gold only.
- 2026-04-26 (v0.80.2): Phase 8 — pinned title background recipe with
  constellation params, vignette, contrast floors.
