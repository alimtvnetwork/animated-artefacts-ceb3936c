# FullBleedImageSlide — Authoring Spec

> **Slide pattern.** An edge-to-edge **hero image or GIF** that fills the entire
> stage. A legibility **scrim** darkens the media so an overlaid eyebrow +
> title + caption stay readable. The photo IS the slide — no body copy.
>
> Use it for: cover frames, chapter/section moments, emotional beats where a
> single image carries the idea. One image. One line. Nothing else.

---

## 1. Mental model

1. **The image is the message.** If you need bullets or capsules, this is the
   wrong type — use `ImageSlide`, `KeywordSlide`, or `SplitMediaSlide`.
2. **Text whispers over the photo.** Eyebrow + title + optional caption sit in
   the lower band. Keep the title to a few words.
3. **Scrim protects legibility, never decorates.** Default `bottom`; use `full`
   for busy/bright photos; `none` only when the photo is already dark.

## 2. Fields (`content`)

| Field                  | Type                              | Notes                                              |
| ---------------------- | --------------------------------- | -------------------------------------------------- |
| `image`                | string (asset/SVG/Base64/data-URI)| The full-bleed media. Required.                    |
| `eyebrow`              | string                            | Optional kicker above the title.                   |
| `title`                | string                            | Optional overlaid headline (gold gradient).        |
| `caption`              | string                            | Optional one-line context under the title.         |
| `scrim`                | `'none' \| 'bottom' \| 'full'`    | Legibility gradient. Default `bottom`.             |
| `freezeOnReducedMotion`| boolean                           | GIF: instant fade entrance under reduced-motion.   |

## 3. Behavior

- Entrance: 0.9s scale-in (1.06 → 1.0) + fade. Reduced-motion **or**
  `freezeOnReducedMotion` → instant 0.2s opacity fade.
- Image uses `object-cover` so it always fills without letterboxing.
- Runtime cannot pause an animated GIF; pair `freezeOnReducedMotion` with a
  still poster in `content.image` when a frozen frame is required.

## 4. Minimal JSON

```json
{
  "slideType": "FullBleedImageSlide",
  "content": {
    "image": "/assets/hero.jpg",
    "eyebrow": "CHAPTER 02",
    "title": "Where we go next",
    "caption": "A single quiet line of context.",
    "scrim": "bottom"
  }
}
```

## 5. Rules

- One idea per slide (coding-guideline #12). No keywords/capsules/steps here.
- No inline hex — text uses semantic classes (`.slide-eyebrow`,
  `.slide-title-display`, `.slide-caption`, `text-gold-gradient`).
- Inline data-URI images stay small; prefer a CDN/asset for large media.
