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

- All colors via tokens: `hsl(var(--gold))`, `hsl(var(--ember))`,
  `hsl(var(--background))`. **No inline hex.**
- The squircle interior is **transparent** on every theme — there is no white
  fill body to read. Only the gold→ember rim + soft shadow and the live video
  appear inside the curve.
- Halo (`h`) is independent: a vignette *around* the box; it can be on with the
  rim. Halo + frame share the same `border-radius` so the glow hugs the curve.
- Everything animates only when `prefers-reduced-motion` is not set.

## 8 — IMPLEMENTED (2026-06-02, v2) — CSS-only rim, NO PNG plate/mask

Status: **shipped on the live `on` card.** This supersedes the earlier
PNG-plate recipe. The rejected look (image 1) was a **thick opaque gold/orange
ring** produced by the `04-squircle-plate-gold-shadow.png` plate — its baked
fill + thick rim read as a solid band around the camera. The plate image (image
2) is a white-filled squircle with a thick offset rim and has **no value**. The
approved look (image 3) is simply the **live video cropped to a squircle with a
thin gold→ember rim and a soft drop shadow, transparent interior**.

Blind-reimplementation recipe (the only correct one):

1. **No PNG imports.** `PresenterWebcamOverlay` imports **neither**
   `04-squircle-plate-gold-shadow.png` **nor** `02-squircle-mask-black.png`.
   There is no plate `<img>`, no `mask-image`, no `platePad`, no `showPlate`.
2. **Silhouette** — the inner frame uses `borderRadius: '38% / 34%'`
   (superellipse approximation) for the squircle, `50%` for circle mode, `999`
   for the minimized puck. `overflow: hidden` clips the `<video>`.
3. **Transparent interior** — the frame `background` is `transparent`; the live
   `<video>` (objectFit cover, mirrored) is the only thing inside the curve.
4. **Thin rim + soft shadow (the whole look)** — on the inner frame:
   ```css
   border: 2px solid hsl(var(--gold) / 0.85);
   box-shadow:
     0 0 0 1px hsl(var(--ember) / 0.25),     /* warm ember edge */
     0 0 28px hsl(var(--gold) / 0.22),        /* soft gold glow */
     0 16px 40px hsl(var(--background) / 0.7); /* drop shadow */
   ```
   This follows the `border-radius` curve exactly (no mask to clip it) and
   matches image 3.
5. **No raw hex** — all colors via `--gold` / `--ember` / `--background` tokens.

> **DO NOT** reintroduce `04-…plate-gold-shadow.png`, `02-…mask-black.png`, a
> white/neutral fill plate, a `platePad` rim, or a `mask-image` crop. They each
> reproduce the rejected thick-ring / white-body look. The rim is CSS-only.

