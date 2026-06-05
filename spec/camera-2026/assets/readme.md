# camera-2026 — image assets

Reference + runtime plate/mask images for the presenter camera. See
`spec/camera-2026/05-backgrounds-and-shapes.md` §8 (v3) for usage.

| File | Role |
|------|------|
| `01-reference-frame-gold-rim.png` | **Visual target only** — how the finished camera should look. NOT used at runtime. |
| `02-squircle-mask-black.png` | **RUNTIME MASK** — used as `mask-image` to crop the live video to a transparent squircle. |
| `03-squircle-plate-white-shadow.png` | **WHITE PLATE VARIANT** — same plate as `04` with the gold→ember rim recolored to pure white + drop shadow. Use as the runtime plate when a white rim is desired. |
| `04-squircle-plate-gold-shadow.png` | **RUNTIME PLATE** — gold→ember rim + drop-shadow PNG composited behind the masked video. |

> **2026-06-04 v3:** the runtime is **PNG plate + transparent mask** (one over
> the other), reversing the 2026-06-02 v2 "CSS-only" decision. Copy the chosen
> plate (`03` white or `04` gold) plus `02` into `src/assets/camera-2026/` so
> Vite bundles them; the overlay imports both. `01` is the look target only.
>
> **2026-06-05:** `03-squircle-plate-white-shadow.png` was regenerated from `04`
> by recoloring the gold rim to white (presenter request). It is the white-rim
> alternative to the gold `04` plate.
