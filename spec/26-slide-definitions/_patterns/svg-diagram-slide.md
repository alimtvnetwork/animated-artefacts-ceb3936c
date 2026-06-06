# SvgDiagramSlide — Authoring Spec

> **Slide pattern.** A centered **inline SVG figure** with optional
> **annotation callouts** pinned over it by percent position. Use it when the
> idea is best carried by a freeform vector drawing — architecture sketches,
> flow figures, labelled schematics — that does not fit the rigid
> box-and-line `BoxDiagramSlide`.

---

## 1. Mental model

1. **The figure is the message.** If your diagram is just rectangles joined by
   lines, use `BoxDiagramSlide`/`ERDiagramSlide` instead.
2. **Callouts label, they don't narrate.** Two-to-four short markers max. The
   presenter explains; the slide points.
3. **One idea per slide** (coding-guideline #12). Density is a defect.

## 2. Fields (`content`)

| Field        | Type                                | Notes                                                              |
| ------------ | ----------------------------------- | ----------------------------------------------------------------- |
| `svgMarkup`  | string (raw `<svg>…</svg>`)         | Inline SVG. Wins over `image`. The figure scales to the box.      |
| `image`      | string (`.svg` asset / data-URI)    | Fallback figure via `<img>` when `svgMarkup` is absent.           |
| `callouts`   | `[{ x, y, label, tone? }]`          | Markers pinned by % (`x`/`y` 0–100). `tone`: `gold`\|`ember`\|`cream`. |
| `eyebrow`    | string                              | Optional kicker above the title.                                  |
| `title`      | string                              | Optional headline (gold gradient).                                |
| `caption`    | string                              | Optional one-line context under the figure.                       |

## 3. Behavior

- Figure renders inline SVG (`svgMarkup`) or an `<img>` (`image`), scaled with
  `object-contain` inside a centered 60%-height box.
- Callouts fade/stagger in (0.4s + 0.12s each). Reduced-motion → instant, no
  stagger.
- Callout tone maps to a `.capsule-{tone}` class — never inline hex.

## 4. Minimal JSON

```json
{
  "slideType": "SvgDiagramSlide",
  "content": {
    "eyebrow": "HOW IT WORKS",
    "title": "The shape of the system",
    "image": "/assets/architecture.svg",
    "callouts": [
      { "x": 25, "y": 30, "label": "Client", "tone": "gold" },
      { "x": 75, "y": 60, "label": "API", "tone": "ember" }
    ]
  }
}
```

## 5. Rules

- One idea per slide; keep callouts to a handful.
- No inline hex — text uses semantic classes; markers use `.capsule-{tone}`.
- Inline `svgMarkup` should be small and self-contained (no external refs).
