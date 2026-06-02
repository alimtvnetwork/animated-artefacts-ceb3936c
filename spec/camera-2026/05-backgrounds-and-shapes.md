# 05 — Backgrounds & Shapes (the squircle plates)

> **This is the new request.** The presenter wants the camera to look *bigger*
> and *richer* by sitting on a decorative **squircle background plate** with a
> gold→ember rim and a soft drop shadow — the OBS-style look in the reference
> image. This file is the complete recipe.

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
  /* gold plate fill (use transparent for the white/neutral variant) */
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
- The white plate variant must still read on light themes — on paper-ink the
  `--background` flips, so the drop shadow must reference `--background` not a raw
  dark value.
- Halo (`h`) and plate are independent: halo is a vignette *around* the box;
  plate is a solid backing *behind* it. Both can be on at once.
- Everything animates only when `prefers-reduced-motion` is not set.

Continue to [`06-implementation-steps-1-30.md`](./06-implementation-steps-1-30.md).

## 8 — IMPLEMENTED (2026-06-02) — exact wiring in `PresenterWebcamOverlay`

Status: **shipped on the live `on` card.** Blind-reimplementation recipe:

1. **Assets copied into the bundle** — `02-squircle-mask-black.png` and
   `04-squircle-plate-gold-shadow.png` live in `src/assets/camera-2026/`. The
   overlay imports **only these two**. There is no white/neutral plate import.
2. **Squircle crop** — the inner frame keeps the §3a superellipse
   `borderRadius: '38% / 34%'` as the fallback/readability shape, **and** when
   the frame is in the rectangle/squircle mode it also applies
   `mask-image: url(02-squircle-mask-black.png)` with `mask-size:100% 100%`,
   `mask-repeat:no-repeat`, `mask-position:center`. This makes the live crop
   match the spec silhouette exactly while preserving the same DOM node and
   keeping circle mode (`50%`) / minimized puck (`999`) simple.
3. **Plate layer (the rim/shadow) — SINGLE transparent plate** — exactly ONE
   decorative `<img>` is rendered *before* the inner frame inside the stable
   outer wrapper:
   - **Brand plate:** `04-squircle-plate-gold-shadow.png` at `zIndex:1`. It bakes
     the squircle curve, the gold→ember rim and the soft drop shadow on a
     **fully transparent** background. Nothing fills the squircle body — the
     interior stays transparent so the live video is the only thing the audience
     sees inside the curve.
   - Uses `platePad = Math.round(visualWidth * 0.07)` → plate grows `platePad`
     on every side, so the visible rim/shadow is proportional across every size.
   - `left/top = HALO - platePad`, `width/height = visual{Width,Height} +
     platePad*2`, `pointerEvents:'none'`, `aria-hidden`, `draggable={false}`.
   - The live inner frame is `zIndex:2` so the masked video sits above the plate.
   - The plate uses the same 420ms cubic-bezier left/top/width/height transition
     as the frame so move/resize/shape morphs stay locked.

   **DO NOT** stack a second opaque "paper"/white plate behind this. The earlier
   `03-squircle-plate-white-shadow.png` base plate was removed because it filled
   the squircle white behind the video (rejected look) and added no value.
4. **Visibility gate** — `showPlate = !minimized && !circleShape`. The plate is
   hidden in circle mode (the round crop owns its own ring and the squircle plate
   would no longer match) and when minimized to a puck.
5. **Resulting look** — transparent squircle interior + live video + a single
   gold→ember rim crescent and soft shadow. Matches reference `01` (rim only) and
   the user's approved screenshot (camera fills the curve, no white body).
6. **No raw hex** — the rim/shadow artwork ships inside the gold PNG; the frame's
   own border and glow still use `hsl(var(--gold))` / `hsl(var(--background))`
   tokens per §7.

> The white/neutral plate variant (`03`) and any `plateVariant` toggle are
> **explicitly out of scope** — the squircle interior must remain transparent.
> Only a pure-CSS rim (§4) is an acceptable future alternative to the gold PNG.
