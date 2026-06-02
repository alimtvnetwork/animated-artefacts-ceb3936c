# camera-2026 — image assets

Reference + background-plate images for the presenter camera. Mirrored from
`spec/camera-2026/assets/`. See `spec/camera-2026/05-backgrounds-and-shapes.md`
for usage.

| File | Role |
|------|------|
| `01-reference-frame-gold-rim.png` | Visual target — squircle camera frame with gold→ember rim on a dark slide. |
| `02-squircle-mask-black.png` | Exact squircle outline — use as CSS `mask-image`. |
| `03-squircle-plate-white-shadow.png` | Neutral background plate (white + drop shadow). |
| `04-squircle-plate-gold-shadow.png` | Gold background plate (brand variant). |

To use at runtime: copy into `src/assets/camera-2026/` (or make a Lovable asset
pointer) and import — see spec file 05 §6. Prefer the CSS squircle/plate path so
colors theme-tint via `--gold`/`--ember`.
