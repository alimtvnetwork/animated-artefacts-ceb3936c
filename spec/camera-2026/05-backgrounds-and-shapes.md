# 05 — Backgrounds & Shapes (the squircle rim)

> **⚠️ CURRENT TRUTH (2026-06-04 v3): the rim is PNG-PLATE + MASK — see [§8](#8--implemented-2026-06-04-v3--png-plate--transparent-mask).**
> Per presenter direction, the v2 "CSS-only rim" decision is **REVERSED**.
> The overlay composites a **PNG plate** (`04-squircle-plate-gold-shadow.png`)
> behind the live video, and the video is cropped with a **transparent squircle
> mask** (`02-squircle-mask-black.png` as `mask-image`), one layered over the
> other. `01-reference-frame-gold-rim.png` is **how it should look** (visual
> target only — NOT used as plate). See §8 (v3) for the recipe.


## A. Reference images (`./assets/`)

| File | Role |
|------|------|
| `01-reference-frame-gold-rim.png` | **Visual target only** — how the finished camera should look. NOT used as a plate or mask at runtime. |
| `02-squircle-mask-black.png` | **RUNTIME MASK** — used as `mask-image` to crop the live video to a transparent squircle. |
| `04-squircle-plate-gold-shadow.png` | **RUNTIME PLATE** — gold→ember rim + drop-shadow PNG, composited behind the masked video. |

> **Note (2026-06-04):** the presenter also referenced an "image 3"
> (`03-…white-shadow.png`) for the mask, but that file was deleted in the
> 2026-06-02 prune and is **not present** in `./assets/`. The runtime mask is
> `02-squircle-mask-black.png`. If a distinct image-3 mask is required, it must
> be re-supplied before it can be wired in.

## B. Layering model (v3 — the correct one)

Bottom → top:

1. **Plate** — `04-squircle-plate-gold-shadow.png`, sized ~+12–16% larger than
   the video box, centered. Provides the gold→ember rim + soft drop shadow.
2. **Masked video** — the live `<video>` (objectFit cover, mirrored) with
   `mask-image: url(02-squircle-mask-black.png)`, `mask-size: 100% 100%`,
   `mask-repeat: no-repeat`, cropping it to the transparent squircle so only the
   squircle interior of the feed shows, sitting inside the plate's rim.

The interior of the mask is transparent (alpha), so the slide behind shows
through the corners while the plate supplies the rim.



## 7. Theme & contrast rules (do NOT break these)

- All tokenized glow/halo colors via `hsl(var(--gold))`, `hsl(var(--ember))`,
  `hsl(var(--background))`. **No inline hex** for CSS-supplied color.
- The squircle interior is **transparent** (the mask's alpha) on every theme —
  the slide behind shows through the corners. Only the plate's gold→ember rim +
  drop shadow and the masked live video appear inside the curve.
- Halo (`h`) is independent: a vignette *around* the box; it can be on with the
  plate rim. Halo + frame share the same squircle silhouette so the glow hugs
  the curve.
- Everything animates only when `prefers-reduced-motion` is not set.

## 8 — IMPLEMENTED (2026-06-04, v3) — PNG plate + transparent mask

Status: **current source of truth.** This **REVERSES** the 2026-06-02 v2
"CSS-only rim" decision per presenter direction. The runtime uses a **PNG plate**
behind the video and a **transparent squircle mask** on the video — one over the
other — exactly as the original layered request described.

Blind-reimplementation recipe (the only correct one):

1. **PNG imports.** `PresenterWebcamOverlay` imports BOTH the plate
   (`04-squircle-plate-gold-shadow.png`) and the mask
   (`02-squircle-mask-black.png`). Copy them into `src/assets/camera-2026/` (the
   folder must be created) so Vite bundles them.
2. **Plate layer** — render the plate as a `<img>`/background positioned behind
   the video, centered, sized ~+12–16% larger than the video box so its rim +
   drop shadow frame the feed. This supplies the gold→ember rim and shadow (no
   CSS border needed).
3. **Masked video layer** — the live `<video>` (objectFit cover, mirrored) gets:
   ```css
   -webkit-mask-image: url('…/02-squircle-mask-black.png');
   mask-image: url('…/02-squircle-mask-black.png');
   -webkit-mask-size: 100% 100%;   mask-size: 100% 100%;
   -webkit-mask-repeat: no-repeat; mask-repeat: no-repeat;
   ```
   so the feed is cropped to the transparent squircle and sits inside the plate
   rim. Interior is transparent (mask alpha), NOT a white/neutral fill.
4. **Shape modes** — squircle is the default plate/mask. Circle mode (`O`) and
   the minimized puck may still fall back to CSS `border-radius` (`50%` / `999px`)
   on the wrapper when no circular plate asset exists.
5. **Reference** — match `01-reference-frame-gold-rim.png` (visual target only,
   never used as a plate/mask).

> The v2 "no plate, no mask, border-radius only" recipe is superseded. Use the
> plate + transparent mask layering above. `01` is the look target, `04` is the
> plate, `02` is the mask.


