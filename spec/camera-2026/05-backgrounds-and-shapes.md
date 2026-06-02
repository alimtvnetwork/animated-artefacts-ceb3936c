# 05 — Backgrounds & Shapes (the squircle rim)

> **⚠️ CURRENT TRUTH (2026-06-02 v2): the rim is CSS-only — see [§8](#8--implemented-2026-06-02-v2--css-only-rim-no-png-platemask).**
> The overlay imports **no** plate/mask PNG. The squircle silhouette comes from
> `border-radius: 38% / 34%`, the rim from a `2px` gold border + layered
> `box-shadow`, and the interior is transparent (approved look = reference
> image 3). §1–§6 below are **historical** (the original PNG-plate request);
> they are kept for context but the plate path was rejected — its baked
> fill/rim read as a thick opaque ring. Do not implement §1–§6 as-is.


## A. Reference images (`./assets/`) — diff targets only

| File | Role |
|------|------|
| `01-reference-frame-gold-rim.png` | The approved visual target — squircle camera, thin gold→ember rim, transparent interior (image 3). |
| `02-squircle-mask-black.png` | Historical shape reference. Runtime uses `border-radius`, **not** this mask. |
| `04-squircle-plate-gold-shadow.png` | **REJECTED** baked-plate recipe — its thick opaque ring is the bug we fixed. Reference only. |

*Pruned 2026-06-02:* `03-…white-shadow.png` (opaque white fill plate) + `cam2/3/4.png` duplicates — deleted, no value.

## B. Rejected approach (historical, do NOT implement)

The original request layered a **background plate PNG** (squircle, ~+12–16% larger
than the video) behind the camera, with the rim + drop shadow baked into the
image and the video masked on top. This shipped briefly and was **rejected**: the
baked fill + thick rim read as a solid opaque band around the camera (image 1),
and the white-fill variant added a flat white body. **No plate, no mask-image, no
`platePad`, no white/neutral fill.** The full correct recipe is §8 below.



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

