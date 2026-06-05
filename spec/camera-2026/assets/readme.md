# camera-2026 — image assets

Reference + runtime plate/mask images for the presenter camera. See
`spec/camera-2026/05-backgrounds-and-shapes.md` §8 (v3) for usage.

| File | Role |
|------|------|
| `01-reference-frame-gold-rim.png` | **Visual target only** — how the finished camera should look. NOT used at runtime. |
| `02-squircle-mask-black.png` | **RUNTIME MASK** — used as `mask-image` to crop the live video to a transparent squircle. |
| `04-squircle-plate-gold-shadow.png` | **RUNTIME PLATE** — gold→ember rim + drop-shadow PNG composited behind the masked video. |

> **2026-06-04 v3:** the runtime is **PNG plate + transparent mask** (one over
> the other), reversing the 2026-06-02 v2 "CSS-only" decision. Copy `02` and
> `04` into `src/assets/camera-2026/` so Vite bundles them; the overlay imports
> both. `01` is the look target only.
>
> **Missing asset:** the presenter referenced an "image 3"
> (`03-…white-shadow.png`) which was deleted in the 2026-06-02 prune and is not
> present here. The mask in use is `02-squircle-mask-black.png`. If a distinct
> image-3 mask is needed, it must be re-supplied.
