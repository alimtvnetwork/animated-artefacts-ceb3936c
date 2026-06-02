# 05 — Backgrounds & Shapes (the squircle rim)

> **⚠️ CURRENT TRUTH (2026-06-02 v2): the rim is CSS-only — see [§8](#8--implemented-2026-06-02-v2--css-only-rim-no-png-platemask).**
> The overlay imports **no** plate/mask PNG. The squircle silhouette comes from
> `border-radius: 38% / 34%`, the rim from a `2px` gold border + layered
> `box-shadow`, and the interior is transparent (approved look = reference
> image 3). §1–§6 below are **historical** (the original PNG-plate request);
> they are kept for context but the plate path was rejected — its baked
> fill/rim read as a thick opaque ring. Do not implement §1–§6 as-is.


## 1. The four shipped images (`./assets/`)

| File | Pixel look | Role in the layer stack |
|------|-----------|--------------------------|
| `01-reference-frame-gold-rim.png` | Squircle, white interior, **gold→red glowing rim** on near-black. | A development **reference only** — it is NOT shipped and NOT imported. The white interior is a placeholder; the live camera fills that area. |
| `02-squircle-mask-black.png` | Solid **black squircle** silhouette, no shadow. | The exact **shape mask** — use as `mask-image`/`clip` to cut the video into a squircle. |
| `04-squircle-plate-gold-shadow.png` | **Gold→ember** squircle rim + soft drop shadow on a **fully transparent** background. | The **only** shipped background plate. Sits behind the masked video; transparent everywhere except the rim/shadow. |

> **Removed (2026-06-02):** `03-squircle-plate-white-shadow.png`. It rendered an
> opaque white squircle *behind* the video (see the rejected screenshot — a flat
> white body around the camera) and added no value. The overlay no longer imports
> it and the asset was deleted. Do **not** reintroduce a white/neutral fill plate.
> The squircle interior must be **transparent** — only the live video + the gold
> rim show.

A **squircle** is a superellipse — rounder than a rounded-rect, flatter than a
circle. The black mask gives the precise curve so CSS and the PNG agree.

## 2. The layer stack (how the background sits *beside/behind* the camera)

The plate is **larger** than the video and centered behind it, so a rim of the
plate shows on all sides — that "frame" is what makes the camera read as bigger.

```text
 z0  ── drop shadow (from the plate PNG, or CSS box-shadow)
 z1  ── BACKGROUND PLATE   (squircle, ~+12–16% bigger than the video box)
 z2  ── RIM / GLOW         (gold→ember ring, 6–10px, the reference look)
 z3  ── VIDEO (masked to the squircle, mirrored, optional auto-frame transform)
 z4  ── chrome (zoom +/- , fullscreen, focus, minimize, X) — fades on hover
```

The plate "padding" (the visible rim) is the key knob: `platePad = round(boxW * 0.07)`
on each side → the plate box is `boxW + 2*platePad` wide. Keep it proportional so
S/M/L/XL all look consistent.

## 3. Pure-CSS squircle (preferred — no PNG at runtime)

Reproduce the shape in CSS so it scales crisply and theme-tints freely. Two
options:

**a) `border-radius` superellipse approximation** (good enough, cheapest):
```css
.cam-squircle {            /* radius ≈ 38% of the short side reads as a squircle */
  border-radius: 38% / 34%;
  overflow: hidden;        /* clips the <video> */
}
```

**b) CSS `mask-image` from the black mask PNG** (pixel-exact to the reference):
```css
.cam-squircle-masked {
  -webkit-mask-image: url('/assets/camera-2026/02-squircle-mask-black.png');
          mask-image: url('/assets/camera-2026/02-squircle-mask-black.png');
  -webkit-mask-size: 100% 100%;  mask-size: 100% 100%;
  -webkit-mask-repeat: no-repeat; mask-repeat: no-repeat;
}
```

> Use the mask approach when you need the curve to match the reference exactly;
> use `border-radius` for the cheap path. The circle shortcut `O` overrides both
> with `border-radius: 999px`.

## 4. The plate + gold rim (CSS, theme-tokenized)

Never hardcode hex — use the brand tokens (`--gold`, `--ember`, `--background`).
The reference rim is a gold→ember gradient ring with an outer glow:

```css
.cam-plate {
  position: absolute; inset: calc(var(--plate-pad) * -1);  /* grow beyond the video */
  border-radius: 38% / 34%;
  /* rim/shadow only — interior stays transparent; never a solid fill */
  background: hsl(var(--gold));
  /* the gold→ember rim + outer glow that matches 01-reference-frame */
  box-shadow:
    0 0 0 6px hsl(var(--gold) / 0.0),                 /* base */
    0 0 18px hsl(var(--gold) / 0.45),                 /* inner glow */
    0 0 44px hsl(var(--ember) / 0.30),                /* ember bleed */
    0 24px 48px hsl(var(--background) / 0.65);        /* drop shadow */
}
.cam-rim {                          /* the bright gradient ring on top of the plate */
  position: absolute; inset: 0; border-radius: inherit; padding: 6px;
  background: linear-gradient(135deg, hsl(var(--gold)), hsl(var(--ember)));
  -webkit-mask:
    linear-gradient(#000 0 0) content-box,
    linear-gradient(#000 0 0);
  -webkit-mask-composite: xor; mask-composite: exclude;  /* ring, not fill */
}
```

## 5. Wiring into the overlay (JSX sketch)

Add a plate behind the existing masked video. Keep the live `<video>` node stable
(never remount on shape/plate change — file 02 §4).

```tsx
const platePad = Math.round(size.w * 0.07);
<div className="cam-frame" style={{ width: size.w, height: size.h, position: 'absolute',
                                    left: position.x, top: position.y }}>
  {plateEnabled && <div className="cam-plate" style={{ ['--plate-pad' as any]: `${platePad}px` }} />}
  {plateEnabled && <div className="cam-rim" />}
  <div ref={shapeFrameRef}
       className={circleShape ? 'cam-circle' : 'cam-squircle'}
       style={{ position: 'relative', zIndex: 3, overflow: 'hidden' }}>
    <video ref={bindFloatingVideo} autoPlay playsInline muted
           style={{ width: '100%', height: '100%', objectFit: 'cover',
                    transform: autoFrame.transform /* includes scaleX(-1) */ }} />
  </div>
</div>
```

A `plateVariant` flag is **not** shipped. The only states are plate ON (gold,
transparent interior) when `showPlate` is true, and OFF (circle/minimized). A
white/neutral fill plate is forbidden — the squircle interior stays transparent.

## 6. Using the PNGs at runtime (if you choose images over CSS)

The PNGs live at `assets/camera-2026/*` (repo) and `spec/camera-2026/assets/*`
(this spec). To render them in the React app:

1. Copy the file into `src/assets/camera-2026/` **or** create a Lovable asset
   pointer (`lovable-assets create --file … > …png.asset.json`).
2. Import and use:
   ```tsx
   import plateGold from '@/assets/camera-2026/04-squircle-plate-gold-shadow.png';
   <img src={plateGold} alt="" aria-hidden className="cam-plate-img" />
   ```
3. Size the plate `img` to `boxW + 2*platePad`, center it, give it
   `z-index: 1`, `pointer-events: none`.

> Prefer the CSS path (§3–§4): it theme-tints with `--gold`/`--ember`, scales
> without blur, and adds no network/bundle weight. Use the PNGs only if a
> designer wants the exact hand-tuned curve/shadow.

## 7. Theme & contrast rules (do NOT break these)

- All colors via tokens: `hsl(var(--gold))`, `hsl(var(--ember))`,
  `hsl(var(--background))`. **No inline hex.**
- The squircle interior is **transparent** on every theme — there is no white
  fill body to read. Only the gold→ember rim + soft shadow (baked into the gold
  PNG, or the §4 CSS rim) and the live video appear inside the curve.
- Halo (`h`) and plate are independent: halo is a vignette *around* the box;
  the plate is the transparent-interior rim/shadow *behind* it. Both can be on.
- Everything animates only when `prefers-reduced-motion` is not set.

Continue to [`06-implementation-steps-1-30.md`](./06-implementation-steps-1-30.md).

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

