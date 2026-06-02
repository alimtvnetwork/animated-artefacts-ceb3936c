# Image & SVG Examples Deck

> Deck: `front-end/project/image-examples/`. Open with `?deck=image-examples`.
> A living reference for every supported image source and placement slot.
> See `spec/21-slides-system/images/01-image-authoring.md` for the full contract.

| # | Slide | Source | `imageRole` | Demonstrates |
|---|-------|--------|-------------|--------------|
| 1 | cover | — | — | Intro title |
| 2 | image-from-asset | `/assets/examples/photo.png` | `bodyFigure` | Public asset file |
| 3 | svg-figure | `/assets/examples/diagram.svg` | `bodyFigure` | `.svg` file |
| 4 | base64-png | `data:image/png;base64,…` | `bodyFigure` | Inline Base64 raster |
| 5 | inline-svg-data-uri | `data:image/svg+xml,…` | `bodyFigure` | Inline vector data URI |
| 6 | inline-thumbnail | `/assets/examples/photo.png` | `inlineThumbnail` | Smaller thumbnail slot |
| 7 | icon-badge | `/assets/examples/diagram.svg` | `iconBadge` | Tiny pictogram slot |

## Key takeaways

- All four sources flow through the **same** field: `content.image`.
- Slots 2–5 share `bodyFigure` to show that *source* and *slot* are orthogonal.
- Slots 6–7 keep the same images but change `imageRole` to show slot sizing.
- Example assets live in `public/assets/examples/` (kept tiny on purpose).
