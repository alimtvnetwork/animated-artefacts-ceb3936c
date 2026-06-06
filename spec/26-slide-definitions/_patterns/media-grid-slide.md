# MediaGridSlide — Authoring Spec

> **Slide pattern.** A grid of **2–6 image/SVG tiles**, each with an optional
> one-line caption. The layout auto-derives from the tile count. Use it for
> galleries, logo walls, screenshot grids, or a set of related visuals that
> belong together as one idea.

---

## 1. Mental model

1. **One theme, many tiles.** The grid is a single idea expressed as a set
   (e.g. "our clients", "the four screens"). Not a dumping ground.
2. **Captions whisper.** Keep each caption to a few words; the image leads.
3. **Respect the cap.** Max 6 tiles (`densityCheck.capTiles`). More than that
   is two slides.

## 2. Fields (`content`)

| Field        | Type                         | Notes                                            |
| ------------ | ---------------------------- | ------------------------------------------------ |
| `mediaTiles` | `MediaTileSpec[]` (2–6)      | `{ src, caption? }`. `src` = any `<img src>`.     |
| `eyebrow`    | string                       | Optional kicker above the title.                 |
| `title`      | string                       | Optional headline (gold gradient).               |

## 3. Layout

Auto-derived from `mediaTiles.length`:

```text
2 → 1×2     3 → 1×3     4 → 2×2     5/6 → 2×3
```

Tiles use `object-cover`; entrance is an 80ms-staggered fade + rise.
Reduced-motion → instant fade.

## 4. Density cap

```json
"densityCheck": { "capTiles": 6 }
```

`checkDensity` counts `content.mediaTiles` and throws at boot if exceeded.

## 5. Minimal JSON

```json
{
  "slideType": "MediaGridSlide",
  "densityCheck": { "capTiles": 6 },
  "content": {
    "eyebrow": "GALLERY",
    "title": "A grid of moments",
    "mediaTiles": [
      { "src": "/assets/examples/photo.png", "caption": "One" },
      { "src": "/assets/examples/photo.png", "caption": "Two" },
      { "src": "/assets/examples/photo.png", "caption": "Three" },
      { "src": "/assets/examples/photo.png", "caption": "Four" }
    ]
  }
}
```

## 6. Rules

- One idea per slide (coding-guideline #12). ≤6 tiles.
- No inline hex — text uses semantic classes (`.slide-eyebrow`,
  `.slide-title-display`, `.slide-caption`, `text-gold-gradient`).
- Keep inline data-URI tiles small; prefer assets for large media.
