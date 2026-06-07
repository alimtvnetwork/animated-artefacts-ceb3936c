# LogoWallSlide — Authoring Spec

> **Slide pattern.** A tidy grid of **brand/partner logos** with an optional
> eyebrow + title. Logos render desaturated by default and reveal full color on
> hover. Use it for "trusted by", partner, sponsor, or client walls.

---

## 1. Mental model

1. **One field, many marks.** The wall is a single statement ("trusted by")
   expressed as a calm set of logos — not a feature list.
2. **Logos whisper, then sing.** Grayscale at rest keeps the wall unified; color
   on hover gives life without noise.
3. **Keep it scannable.** 2–12 logos. More than ~12 reads as clutter — split it.

## 2. Fields (`content`)

| Field       | Type                  | Notes                                                      |
| ----------- | --------------------- | ---------------------------------------------------------- |
| `logos`     | `LogoSpec[]` (2–12)   | `{ src, name?, href? }`. `src` = any `<img src>`. Required. |
| `eyebrow`   | string                | Optional kicker above the title.                           |
| `title`     | string                | Optional headline (gold gradient).                         |
| `columns`   | number (2–6)          | Optional fixed column count. Omit to auto-derive.          |
| `grayscale` | boolean (default `true`) | `false` = always-color wall.                            |

`name` is used as the image **alt text**. `href` is decorative metadata only —
it is **not** navigated in presentation mode.

## 3. Layout

Column count auto-derives from `logos.length` unless `columns` is set:

```text
≤4 → N cols (min 2)    5–9 → 3 cols    10–12 → 4 cols    13+ → 5 cols
```

Each logo sits in a soft bordered cell (`object-contain`, capped height).
Entrance is a 60ms-staggered fade + rise. Reduced-motion (or
`content.freezeOnReducedMotion`) → instant fade, no stagger.

## 4. Minimal JSON

```json
{
  "slideType": "LogoWallSlide",
  "content": {
    "eyebrow": "TRUSTED BY",
    "title": "Partners & Clients",
    "grayscale": true,
    "logos": [
      { "src": "/assets/examples/logo.svg", "name": "Acme" },
      { "src": "/assets/examples/logo.svg", "name": "Globex" },
      { "src": "/assets/examples/logo.svg", "name": "Initech" },
      { "src": "/assets/examples/logo.svg", "name": "Umbrella" }
    ]
  }
}
```

## 5. Rules

- One idea per slide (coding-guideline #12). 2–12 logos.
- No inline hex — text uses semantic classes (`.slide-eyebrow`,
  `.slide-title-display`, `text-gold-gradient`).
- Provide `name` for every logo so alt text is meaningful (a11y house rule).
- Keep inline data-URI logos small; prefer assets for large/raster marks.
