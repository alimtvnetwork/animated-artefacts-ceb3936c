# camera-2026 — image assets

Reference + background-plate images for the presenter camera. Mirrored from
`spec/camera-2026/assets/`. See `spec/camera-2026/05-backgrounds-and-shapes.md`
for usage.

| File | Role |
|------|------|
| `01-reference-frame-gold-rim.png` | Visual target — squircle camera frame with gold→ember rim on a dark slide. Reference only. |
| ~~`02-squircle-mask-black.png`~~ | No longer used at runtime (2026-06-02 v2) — overlay crops via `border-radius`. Shape reference only. |
| ~~`04-squircle-plate-gold-shadow.png`~~ | No longer used at runtime (2026-06-02 v2) — baked rim read as a thick opaque ring (rejected). Rim is now CSS-only. Reference only. |

> **Pruned 2026-06-02:** `03-squircle-plate-white-shadow.png` (rejected opaque
> white fill plate) and the `cam2/cam3/cam4.png` duplicate copies were deleted —
> they had no value and added confusion. Only `01`, `02`, `04` survive as visual
> diff references.

**Runtime is CSS-only.** `src/assets/camera-2026/` is empty; the overlay imports
no plate/mask PNG. Silhouette = `border-radius`, rim = gold border + layered
`box-shadow`, interior transparent. See spec file `05` §8 (v2).
