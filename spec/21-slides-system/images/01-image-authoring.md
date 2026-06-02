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
