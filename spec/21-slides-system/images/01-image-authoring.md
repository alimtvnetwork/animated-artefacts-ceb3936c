# 01 — Image Authoring (how & where images go in JSON)

> Audience: anyone (human or AI) adding an image to a slide. Images are
> declarative: you set **one** string field — `content.image` — and the
> placement resolver picks size, aspect, fit, and chrome from the **slot**.

## The one field

```json
"content": { "image": "<src>" }
```

`<src>` is anything a browser `<img src>` accepts. Four supported sources:

| Source | Example `image` value | When to use |
|--------|----------------------|-------------|
| **Public asset** | `"/assets/examples/photo.png"` | Files in `public/assets/**`. Best for real photos / large art. |
| **`.svg` file** | `"/assets/examples/diagram.svg"` | Vector diagrams shipped as files. Scales crisply. |
| **Base64 PNG** | `"data:image/png;base64,iVBORw0K…"` | Tiny self-contained raster, no extra file. Keep under ~10 KB. |
| **Inline SVG data URI** | `"data:image/svg+xml,%3Csvg…%3C/svg%3E"` | Self-contained vector. URL-encode `#`→`%23`, `<`→`%3C`, etc. |

Large binaries (real photos, hi-res art) belong on the CDN via the
`lovable-assets` pipeline, not inline Base64.

## Where it lands — slots

The resolver (`src/slides/imagePlacement.ts`) maps the image to a **slot**.
You can override the auto-pick with `content.imageRole`:

```json
"content": { "image": "/assets/examples/diagram.svg", "imageRole": "bodyFigure" }
```

| `imageRole` | Position / size | Use for |
|-------------|-----------------|---------|
| `bodyFigure` | Centered, max 1600×864 stage px, soft card | Default body figure (ImageSlide). |
| `titleHero` | Large hero beside/behind a title | TitleSlide hero art. |
| `inlineThumbnail` | Small, next to capsules / steps | Per-row thumbnail. |
| `iconBadge` | Tiny pictogram chip | Inline icon / emblem. |
| `headerLogo` / `presenterAvatar` / `qrOverlay` | Brand header / QR | Chrome — usually auto-inferred. |

**Rule:** omit `imageRole` and the resolver infers from filename/slug/slide
type (`ImageSlide` → `bodyFigure`). Set it only when you want a different slot.

## Live examples

The `image-examples` deck (`front-end/project/image-examples/`) renders one
slide per source + slot. Open it with `?deck=image-examples`. Each slide has a
JSON+MD pair under `spec/26-slide-definitions/image-examples/`.

## House rules

- One `image` per `ImageSlide`. Multiple figures → multiple slides.
- Never hand-tune width/height in JSON — the slot owns sizing.
- Alt text falls back to `content.title`; provide a real title for a11y.
- Keep Base64/data-URI strings on a single JSON line (no wrapping).

## Patterns added in batch 31–40

### Caption under a figure (`ImageSlide`)
```json
"content": { "image": "/assets/examples/photo.png", "caption": "One short line." }
```
The caption renders under the figure as `.slide-caption` and feeds the image's
alt text when no `title` is set.

### Gallery row (2–3 figures)
```json
"content": {
  "images": ["/assets/examples/photo.png", "/assets/examples/diagram.svg"],
  "caption": "Each entry uses the inlineThumbnail slot."
}
```
When `images[]` is present, `image` is ignored. Keep to **≤3** to respect the
density budget.

### Per-step thumbnails (`StepTimelineSlide`)
```json
"steps": [
  { "label": "Step 1", "title": "Asset", "image": "/assets/examples/photo.png" }
]
```
Each step may carry its own `image` (+ optional `imageRole`, default
`inlineThumbnail`) rendered beside the row.

## Size budget for inline images

Inline Base64 / data-URI images live inside the JSON and bloat every load.
`ImageSlide` logs a **dev-only warning** when an inline image exceeds ~10 KB,
and the deck sanity test fails any inline image over 20 KB. For anything
larger, ship the file through the `lovable-assets` CDN pipeline and reference
its URL instead.
