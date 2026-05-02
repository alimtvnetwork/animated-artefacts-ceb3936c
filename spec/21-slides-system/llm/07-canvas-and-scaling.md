# 07 — Canvas & Scaling

> **Phase 7/20** · Read this **before** authoring any slide. Canvas is
> fixed; scaling is uniform; every layout number derives from this file.

## 1. Master canvas — fixed

Every slide is authored against a **1920 × 1080** logical canvas. The
runtime then scales it to fit the viewport.

| Constant | Value | Where |
|---|---|---|
| `SLIDE_W` | `1920` | `src/slides/components/SlidePreview.tsx:14` |
| `SLIDE_H` | `1080` | `src/slides/components/SlidePreview.tsx:15` |

Aspect ratio is therefore **16 : 9**. Authoring against any other ratio
breaks both `SlideStage` and `SlidePreview`.

## 2. Uniform scale — `min(scaleX, scaleY)`

Both `SlideStage` (live view) and `SlidePreview` (thumbnail) compute one
scale factor and apply it via CSS `transform: scale(s)` on a child
positioned absolutely at `width: 1920px; height: 1080px`. The container
clips overflow.

```ts
const scale = Math.min(viewportW / SLIDE_W, viewportH / SLIDE_H);
// stage: width:1920, height:1080, transform: scale(s), transform-origin: top left
// container: width:1920*s, height:1080*s, centered with margin auto
```

**Never** use `scaleX` ≠ `scaleY` — content distorts. **Never** scale
the parent container (the unscaled 1920×1080 box must exist for layout
math to stay sane).

## 3. Centering math (1440 master content area)

The visible content lives inside a centered **1440px** column on the
1920px canvas, with symmetric **240px** side margins. Vertical zones:

| Token (in `src/index.css :root`) | Value | Notes |
|---|---|---|
| `--slide-safe-inset` | `80px` | Edge safe-area on every side |
| `--slide-content-max-width` | `1440px` | Hard cap for centered content |
| `--slide-content-x-start` | `240px` | `(1920 − 1440) / 2` |
| `--slide-content-x-end` | `1680px` | `1920 − 240` |
| `--slide-header-zone-top` | `80px` | Inside safe area |
| `--slide-header-zone-height` | `180px` | |
| `--slide-body-zone-top` | `300px` | 40px gap below header |
| `--slide-body-zone-height` | `560px` | |
| `--slide-footer-zone-top` | `900px` | 40px gap below body |

Sanity: `560 + 80 + 800 = 1440` (step list + gutter + detail). Margins:
`(1920 − 1440) / 2 = 240`.

## 4. `.slide-content` font scaling

Body text inside a slide uses `clamp()` against the **canvas width**, not
the viewport — because the canvas is the unit of design. Pattern:

```css
.slide-content { font-size: clamp(1rem, 1.2vw, 1.25rem); }
```

`vw` is a proxy here: at the design viewport (1920px) the canvas equals
the viewport. When the runtime scales down, `transform: scale()`
shrinks rendered glyphs uniformly — `clamp()` only kicks in when the
viewport itself is unusually narrow (e.g. an inline editor preview).

## 5. Hard rules

- **No 4:3, no 21:9** — the deck is 16:9 only. New aspect ratios require
  a stage refactor and a memory rule.
- **No magic numbers in components** — every spacing value comes from
  the table above or a Tailwind utility derived from it.
- **No nested `transform: scale()`** — only the stage layer scales. Step
  rows, capsules, etc. must use real font-size jumps (see spec 42).

## 6. Acceptance

- `getBoundingClientRect()` of the unscaled stage is exactly
  `1920 × 1080`.
- Resize browser to any size: scaled output preserves 16:9 with
  letterboxing on the limiting axis.
- Print stylesheet (if added later) overrides scale to `1` and prints
  the canvas at 1:1.

## 7. Open questions & changelog

- Open: support a 1920×1200 16:10 mode for kiosk decks? Current: no.
- 2026-04-26 (v0.80.1): Phase 7 — pinned canvas constants, scale
  formula, and 1440 centered grid math.
