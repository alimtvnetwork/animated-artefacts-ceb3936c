# GifLoopSlide — Authoring Spec

> **Slide pattern.** A single **looping animated GIF** centered on the stage,
> with an optional eyebrow + title + caption. Use it to show motion: a product
> interaction, a micro-animation, a short demo loop. One loop, one idea.
>
> Reduced-motion safety is built in: the browser cannot pause a GIF, so under
> `prefers-reduced-motion` (or `content.freezeOnReducedMotion`) the runtime
> swaps the GIF for a still **poster** frame.

---

## 1. Mental model

1. **The loop is the message.** If the motion does not add meaning, use
   `ImageSlide` or `FullBleedImageSlide` instead.
2. **Always author a poster.** Without `content.poster`, motion-sensitive
   viewers still see the animation — accessibility regression.
3. **Keep text minimal.** Eyebrow + short title + one-line caption. No bullets.

## 2. Fields (`content`)

| Field                  | Type                               | Notes                                                     |
| ---------------------- | ---------------------------------- | --------------------------------------------------------- |
| `image`                | string (gif asset/Base64/data-URI) | The looping GIF. Required.                                 |
| `poster`               | string (static image)              | Still frame shown under reduced-motion. Strongly advised. |
| `eyebrow`              | string                             | Optional kicker above the title.                          |
| `title`                | string                             | Optional headline (gold gradient).                        |
| `caption`              | string                             | Optional one-line context under the loop.                 |
| `freezeOnReducedMotion`| boolean                            | Force the poster + instant fade even without OS setting.  |

## 3. Behavior

- Entrance: 0.7s scale-in (0.96 → 1.0) + fade. Reduced-motion **or**
  `freezeOnReducedMotion` → instant 0.2s opacity fade.
- Source resolution: frozen + `poster` → poster; otherwise → `image` (GIF).
- GIF uses `object-contain` (never cropped) and is capped at 62% height /
  80% width so eyebrow/title/caption stay visible.

## 4. Minimal JSON

```json
{
  "slideType": "GifLoopSlide",
  "content": {
    "image": "/assets/demo-loop.gif",
    "poster": "/assets/demo-still.jpg",
    "eyebrow": "LIVE DEMO",
    "title": "One tap to publish",
    "caption": "The whole flow in under three seconds."
  }
}
```

## 5. Rules

- One idea per slide (coding-guideline #12). No keywords/capsules/steps here.
- No inline hex — text uses semantic classes (`.slide-eyebrow`,
  `.slide-title-display`, `.slide-caption`, `text-gold-gradient`).
- Always pair the GIF with a `poster` so reduced-motion has a real frozen frame.
