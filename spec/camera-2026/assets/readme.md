# camera-2026 — image assets

Reference + runtime plate/mask images for the presenter camera. See
`spec/camera-2026/05-backgrounds-and-shapes.md` §8 (v3) for usage.

| File | Role |
|------|------|
| `01-reference-frame-gold-rim.png` | **Visual target only** — how the finished camera should look. NOT used at runtime. |
| `02-squircle-mask-black.png` | **SOURCE MASK REFERENCE** — the live app uses `src/assets/camera-2026/squircle-mask.png` as the runtime `mask-image`. |
| `03-squircle-plate-white-shadow.png` | **WHITE PLATE VARIANT** — same plate as `04` with the gold→ember rim recolored to pure white + drop shadow. Use as the runtime plate when a white rim is desired. |
| `04-squircle-plate-gold-shadow.png` | **SOURCE PLATE REFERENCE** — the live app uses `src/assets/camera-2026/squircle-plate-gold.png` behind the masked video. |

> **2026-06-04 v3:** the runtime is **PNG plate + transparent mask** (one over
> the other), reversing the 2026-06-02 v2 "CSS-only" decision. The live app
> imports `src/assets/camera-2026/squircle-plate-gold.png` and
> `src/assets/camera-2026/squircle-mask.png`; `03` / `04` / `02` here are the
> reference-source assets those runtime files were derived from. `01` is the
> look target only.
>
> **2026-06-05:** `03-squircle-plate-white-shadow.png` was regenerated from `04`
> by recoloring the gold rim to white (presenter request). It is the white-rim
> alternative to the gold `04` plate.
