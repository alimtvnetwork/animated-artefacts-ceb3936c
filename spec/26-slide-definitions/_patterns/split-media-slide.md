# SplitMediaSlide — Authoring Spec

> **Slide pattern.** A two-column "**show + tell**" layout: a piece of media
> (image/GIF) fills one half of the stage while a text column — eyebrow +
> title + a few keywords and/or capsules — sits on the other. `content.mediaSide`
> chooses which half holds the media.
>
> Use it for: feature highlights, before/context beats, "here's the thing +
> here's why it matters" moments. Still **one idea** — the keywords annotate
> the media, they don't form a paragraph.

---

## 1. Mental model

1. **Media and message share the frame equally.** 50/50 split, full height.
2. **Text whispers, media shows.** Keep keywords short; prefer capsules for
   labelled items. No paragraphs (Core: keywords-only).
3. **`mediaSide` controls rhythm.** Alternate `left`/`right` across a sequence
   so consecutive split slides don't feel static.

## 2. Fields (`content`)

| Field       | Type                              | Notes                                          |
| ----------- | --------------------------------- | ---------------------------------------------- |
| `image`     | string (asset/SVG/Base64/data-URI)| The media half. Required for the visual.       |
| `mediaSide` | `'left' \| 'right'`               | Which half holds the media. Default `left`.    |
| `eyebrow`   | string                            | Optional kicker above the title.               |
| `title`     | string                            | Optional headline (gold gradient).             |
| `keywords`  | string[]                          | Optional short annotation lines.               |
| `capsules`  | CapsuleSpec[]                     | Optional labelled chips (`.capsule-{tone}`).   |

## 3. Behavior

- Layout: `grid-cols-2`, full height, `gap-12`, `px-16 py-20`. Media uses
  `object-cover` inside a rounded card; missing media → muted placeholder.
- Entrance: both columns fade + rise (0.6s). Reduced-motion → instant fade.

## 4. Minimal JSON

```json
{
  "slideType": "SplitMediaSlide",
  "content": {
    "image": "/assets/feature.jpg",
    "mediaSide": "left",
    "eyebrow": "SHOW + TELL",
    "title": "Media meets message",
    "keywords": ["Fast", "Legible", "On-brand"]
  }
}
```

## 5. Rules

- One idea per slide (coding-guideline #12). Keywords annotate; never a paragraph.
- Capsules MUST use `CapsuleSpec` (rendered via the `Capsule` primitive →
  `.capsule-{tone}`); never inline brand-token colors.
- No inline hex — text uses semantic classes (`.slide-eyebrow`,
  `.slide-title-display`, `.slide-caption`, `text-gold-gradient`).
